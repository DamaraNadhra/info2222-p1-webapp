import { z } from "zod";
import { authHelper } from "~/lib/buildHelper";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  registerUser: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await authHelper.credentialSignUp({
        email: input.email,
        password: input.password,
        name: input.name,
      });
    }),
  getUserData: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.user.findUnique({
      where: {
        id: ctx.session?.user.id,
        },
        select: {
          id: true,
          email: true,
          name: true,
          publicKey: true,
          privateKey: true,
          role: true,
          channels: {
            select: {
              id: true,
              channel: true,
              encryptedKey: true,
              nonce: true,
            },
          },
        },
      });
    }),
});
