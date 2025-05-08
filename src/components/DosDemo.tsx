import { useState, useRef } from "react";
import { Button } from "./ui/button";

export function DosDemo() {
  const [requestCount, setRequestCount] = useState(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [serverProcessingTimes, setServerProcessingTimes] = useState<number[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [attackType, setAttackType] = useState<"aggressive" | "batched" | null>(
    null,
  );
  const activeRequests = useRef<Set<Promise<void>>>(new Set());

  const launchAttack = async (type: "aggressive" | "batched") => {
    setIsLoading(true);
    setAttackType(type);
    setRequestCount(0);
    setResponseTimes([]);
    setServerProcessingTimes([]);
    activeRequests.current.clear();

    if (type === "aggressive") {
      // Aggressive attack - 100 concurrent requests
      const numberOfRequests = 100;

      // Create and start all requests immediately
      for (let i = 0; i < numberOfRequests; i++) {
        const makeRequest = async () => {
          const startTime = performance.now();
          try {
            const response = await fetch("/api/dos-demo", {
              headers: {
                "x-attack-type": "aggressive",
              },
            });
            const data = await response.json();
            const endTime = performance.now();
            const responseTime = endTime - startTime;

            setRequestCount((prev) => prev + 1);
            setResponseTimes((prev) => [...prev, responseTime]);
            setServerProcessingTimes((prev) => [...prev, data.processingTime]);
          } catch (error) {
            console.error("Request failed:", error);
          }
        };

        const requestPromise = makeRequest();
        activeRequests.current.add(requestPromise);

        await requestPromise;
        activeRequests.current.delete(requestPromise);
        if (activeRequests.current.size === 0) {
          setIsLoading(false);
          setAttackType(null);
        }
      }
    } else {
      // Single request at a time
      const numberOfRequests = 20;

      // Send requests one at a time
      for (let i = 0; i < numberOfRequests; i++) {
        const makeRequest = async () => {
          const startTime = performance.now();
          try {
            const response = await fetch("/api/dos-demo", {
              headers: {
                "x-attack-type": "normal",
              },
            });
            const data = await response.json();
            const endTime = performance.now();
            const responseTime = endTime - startTime;

            setRequestCount((prev) => prev + 1);
            setResponseTimes((prev) => [...prev, responseTime]);
            setServerProcessingTimes((prev) => [...prev, data.processingTime]);
          } catch (error) {
            console.error("Request failed:", error);
          }
        };

        const requestPromise = makeRequest();
        activeRequests.current.add(requestPromise);

        await requestPromise;
        activeRequests.current.delete(requestPromise);
        if (activeRequests.current.size === 0) {
          setIsLoading(false);
          setAttackType(null);
        }

        // Wait for each request to complete before starting the next one
        await requestPromise;
        // Add a small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  };

  const averageResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

  const averageServerProcessingTime =
    serverProcessingTimes.length > 0
      ? serverProcessingTimes.reduce((a, b) => a + b, 0) /
        serverProcessingTimes.length
      : 0;

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">DoS Attack Demonstration</h2>
      <div className="space-y-2">
        <p>Requests made: {requestCount}</p>
        <p>Average response time: {averageResponseTime.toFixed(2)}ms</p>
        <p>
          Average server processing time:{" "}
          {averageServerProcessingTime.toFixed(2)}ms
        </p>
        <p className="text-sm text-gray-500">
          {attackType === "aggressive"
            ? "Sending 100 concurrent requests to demonstrate server degradation"
            : attackType === "batched"
              ? "Sending 20 requests in batches of 2 to show normal processing"
              : "Choose an attack type to demonstrate the difference"}
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => launchAttack("aggressive")}
            disabled={isLoading}
            variant="destructive"
          >
            {isLoading && attackType === "aggressive"
              ? "Degrading..."
              : "Degrade Server"}
          </Button>
          <Button
            onClick={() => launchAttack("batched")}
            disabled={isLoading}
            variant="secondary"
          >
            {isLoading && attackType === "batched"
              ? "Processing..."
              : "Normal Processing"}
          </Button>
        </div>
      </div>
    </div>
  );
}
