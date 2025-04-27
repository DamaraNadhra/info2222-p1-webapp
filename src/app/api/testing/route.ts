import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function GET() {
  const { data, error } = await supabase.from("Message").insert({
    id: "askdjaksdjahskdjhaskjd",
    content: "test",
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: "cm9zbrdk80000ttlz7ee4nkbq",
    channelId: "askdjaksdjahskdjhaskjd",
  });
  if (error) {
    console.error("Error inserting data:", error);
    return NextResponse.json(
      { message: "Error inserting data", error },
      { status: 500 },
    );
  }
  return NextResponse.json({ message: "Data inserted successfully", data });
}
