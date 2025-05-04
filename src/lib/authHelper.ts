
import type { PrismaClient } from "@prisma/client";
import { compare, genSalt, hash } from "bcryptjs";
import { TRPCError } from "@trpc/server";
import sodium from "libsodium-wrappers";
import { generateKeyPair } from "./encryption";
await sodium.ready;

export class AuthHelper {
  constructor(private prisma: PrismaClient) {}
  async authorize({
    credentials,
    req,
  }: {
    credentials?: Record<string, any>;
    req: any;
  }) {
    if (!credentials) {
      return null;
    }
    const user = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: credentials.email,
          mode: "insensitive",
        },
      },
    });

    if (!user) {
      throw new Error(`Username or Password doesn't match`);
    }

    const checkPassword = await compare(
      credentials.password,
      user.password ?? "",
    );

    // incorrect password
    if (
      !checkPassword ||
      user.email?.toLowerCase() !== credentials.email.toLowerCase() ||
      !user
    ) {
      throw new Error("Username or Password doesn't match");
    }

    console.log("User has been authorized");
    return user;
  }
  async register(input: {
    email: string;
    password?: string;
    image?: string;
    name: string;
  }) {
    const email = input.email.toLowerCase();

    const salt = await genSalt(10);
    const hashedPassword = input.password
      ? await hash(input.password, salt)
      : null;

    const keyPair = sodium.crypto_box_keypair();

    const newUser = await this.prisma.user.create({
      data: {
        email: email,
        image: input.image,
        password: hashedPassword,
        name: input.name,
        publicKey: sodium.to_base64(keyPair.publicKey),
        privateKey: sodium.to_base64(keyPair.privateKey),
      },
    });
    return newUser;
  }

  async credentialSignUp(input: {
    email: string;
    password: string;
    name: string;
    code?: string;
  }) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: input.email,
          mode: "insensitive",
        },
      },
    });

    if (user) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Could not create account. If an acccount with this email already exists, you will receive a reset password link.",
      });
    }

    const newUser = await this.register({
      email: input.email,
      password: input.password,
      name: input.name,
    });

    return newUser;
  }
}
