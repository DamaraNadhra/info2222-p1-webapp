import { type NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

// CPU-intensive function for aggressive attack
function simulateHeavyProcessing() {
  let result = 0;
  // Reduced iterations for normal processing
  for (let i = 0; i < 10000000; i++) {
    result += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
  }
  return result;
}

// Light processing function for normal requests
function simulateLightProcessing() {
  let result = 0;
  // Very light processing
  for (let i = 0; i < 1000; i++) {
    result += Math.sqrt(i);
  }
  return result;
}

export async function GET(request: NextRequest) {
  const user = await auth();
  if (!user) {
    return NextResponse.json(
      {
        message: "Unauthorized",
      },
      { status: 401 },
    );
  }

  const userData = await db.user.findUnique({
    where: {
      id: user.user.id,
    },
    select: {
      role: true,
    },
  });

  if (userData?.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const startTime = process.hrtime();

  // Check if this is an aggressive attack request
  const isAggressive = request.headers.get("x-attack-type") === "aggressive";

  // Process the request with appropriate intensity
  const result = isAggressive
    ? simulateHeavyProcessing()
    : simulateLightProcessing();

  const [seconds, nanoseconds] = process.hrtime(startTime);
  const processingTime = seconds * 1000 + nanoseconds / 1000000;

  console.log(
    `Request processed in ${processingTime.toFixed(2)}ms (${isAggressive ? "aggressive" : "normal"})`,
  );

  return NextResponse.json({
    message: "Processing completed",
    result: result,
    processingTime: processingTime,
    timestamp: new Date().toISOString(),
  });
}
