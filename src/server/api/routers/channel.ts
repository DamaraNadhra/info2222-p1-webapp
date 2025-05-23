import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { publicProcedure } from "../trpc";
import sodium from "libsodium-wrappers";
await sodium.ready;

export const channelRouter = createTRPCRouter({
  getMessages: publicProcedure.query(async ({ ctx }) => {
    const messages = await ctx.db.message.findMany();
    return messages;
  }),

  getAllChannels: publicProcedure.query(async ({ ctx }) => {
    const channels = await ctx.db.channel.findMany();
    return channels;
  }),

  createChannel: protectedProcedure
    .input(
      z.object({
        slug: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const creator = ctx.session.user;
      const users = await ctx.db.user.findMany({
        where: {
          publicKey: {
            not: null,
          },
          privateKey: {
            not: null,
          },
        },
      });
      const channel = await ctx.db.channel.create({
        data: {
          name: input.slug,
          slug: input.slug,
          createdById: ctx.session?.user.id,
        },
      });

      const groupKey = sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES);
      const encryptedGroupKeys = users.map((user) => {
        const creatorAsUser = users.find((u) => u.id === creator.id);
        const nonce = sodium.randombytes_buf(
          sodium.crypto_secretbox_NONCEBYTES,
        );
        const encryptedKey = sodium.crypto_box_easy(
          groupKey,
          nonce,
          sodium.from_base64(user.publicKey as string),
          sodium.from_base64(creatorAsUser?.privateKey as string),
        );
        return {
          channelId: channel.id,
          userId: user.id,
          encryptedKey: sodium.to_base64(encryptedKey),
          nonce: sodium.to_base64(nonce),
        };
      });
      await ctx.db.channelKey.createMany({
        data: encryptedGroupKeys,
      });
      return channel;
    }),

  joinChannel: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const channel = await ctx.db.channel.findUnique({
        where: { id: input.channelId },
      });
      if (!channel) {
        throw new Error("Channel not found");
      }
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session?.user.id },
      });
      if (!user) {
        throw new Error("User not found");
      }
      const channelKey = await ctx.db.channelKey.findFirst({
        where: {
          channelId: input.channelId,
          userId: channel.createdById,
        },
        include: {
          user: true,
        },
      });
      if (!channelKey) {
        throw new Error("Channel key not found");
      }
      const decryptedKey = sodium.crypto_box_open_easy(
        sodium.from_base64(channelKey.encryptedKey),
        sodium.from_base64(channelKey.nonce),
        sodium.from_base64(channelKey.user.publicKey as string),
        sodium.from_base64(channelKey.user.privateKey as string),
      );
      const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
      const encryptedKey = sodium.crypto_box_easy(
        decryptedKey,
        nonce,
        sodium.from_base64(user.publicKey as string),
        sodium.from_base64(channelKey.user.privateKey as string), // encrypt using creator's private key
      );
      await ctx.db.channelKey.create({
        data: {
          channelId: input.channelId,
          userId: user.id,
          encryptedKey: sodium.to_base64(encryptedKey),
          nonce: sodium.to_base64(nonce),
        },
      });
      return { success: true };
    }),

  deleteChannel: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const channel = await ctx.db.channel.delete({
        where: { id: input.id },
      });
      return channel;
    }),

  addMessage: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        content: z.string(),
        nonce: z.string().optional(),
        publicKey: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const message = await ctx.db.message.create({
          data: {
            content: input.content,
            nonce: input.nonce ?? null,
            publicKey: input.publicKey ?? null,
            channelId: input.channelId,
            userId: ctx.session?.user.id,
          },
        });
        return message;
      } catch (error) {
        console.error(error);
        throw new Error("Failed to add message");
      }
    }),

  deleteMessage: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const message = await ctx.db.message.delete({
        where: { id: input.id },
      });
      return message;
    }),

  clearMessages: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.message.deleteMany({
        where: { channelId: input.channelId },
      });
      return { success: true };
    }),
});
