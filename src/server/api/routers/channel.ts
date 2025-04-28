import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { publicProcedure } from "../trpc";

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
      const channel = await ctx.db.channel.create({
        data: {
          name: input.slug,
          slug: input.slug,
          createdById: ctx.session?.user.id,
        },
      });
      return channel;
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
        nonce: z.string(),
        publicKey: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const message = await ctx.db.message.create({
          data: {
            content: input.content,
            nonce: input.nonce,
            publicKey: input.publicKey,
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
      await ctx.db.message.deleteMany({ where: { channelId: input.channelId } });
      return { success: true };
    }),
});
