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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      console.log(input);
      try {
        const message = await ctx.db.message.create({
          data: {
            content: input.content,
            channelId: input.channelId,
            userId: ctx.session?.user.id,
          },
        });
        console.log(message);
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
});
