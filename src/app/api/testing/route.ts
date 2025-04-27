import { NextResponse } from "next/server";
import { auth } from "~/server/auth";

export async function GET() {
  const session = await auth();
  
  return NextResponse.json({ message: "Hello, world!", session });
}
