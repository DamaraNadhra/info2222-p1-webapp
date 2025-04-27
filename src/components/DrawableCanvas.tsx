"use client"

// DrawableCanvas.tsx
import React, { useRef, useEffect, useState } from "react";
import rough from "roughjs";
import { Button } from "~/components/ui/button";

import { PiRectangle } from "react-icons/pi";
import { FaPenFancy, FaSave, FaTrash } from "react-icons/fa";
import { Trash2, Save } from "lucide-react";
import { HiPencil } from "react-icons/hi";
import { FaFont } from "react-icons/fa";
import { Textarea } from "./ui/textarea";

type Mode = "freehand" | "rectangle" | "text";
type Shape = {
  type: "rectangle" | "freehand" | "text";
  points: { x: number; y: number }[];
  startPoint?: { x: number; y: number };
  text?: string;
};

export const DrawableCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<Mode>("freehand");
  const [drawing, setDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [textInput, setTextInput] = useState("");
  const [isTextInputVisible, setIsTextInputVisible] = useState(false);
  const [textPosition, setTextPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Initialize offscreen canvas
  useEffect(() => {
    if (!offscreenCanvasRef.current && canvasRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = canvasRef.current.width;
      canvas.height = canvasRef.current.height;
      offscreenCanvasRef.current = canvas;
    }
  }, []);

  const drawShapesToOffscreen = (newShape?: Shape) => {
    const offscreenCanvas = offscreenCanvasRef.current;
    if (!offscreenCanvas) return;

    const rc = rough.canvas(offscreenCanvas);
    const ctx = offscreenCanvas.getContext("2d");
    if (!ctx) return;

    // Only clear and redraw all if we're adding a new shape
    if (newShape) {
      ctx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
      shapes.forEach((shape) => {
        if (shape.type === "rectangle" && shape.startPoint) {
          const endPoint = shape.points[shape.points.length - 1];
          if (endPoint) {
            rc.rectangle(
              shape.startPoint.x,
              shape.startPoint.y,
              endPoint.x - shape.startPoint.x,
              endPoint.y - shape.startPoint.y,
            );
          }
        } else if (shape.type === "freehand") {
          rc.curve(shape.points.map((p) => [p.x, p.y] as [number, number]));
        } else if (shape.type === "text" && shape.text && shape.points[0]) {
          ctx.font = "16px Arial";
          ctx.fillText(shape.text, shape.points[0].x, shape.points[0].y);
        }
      });

      // Draw the new shape
      if (newShape.type === "rectangle" && newShape.startPoint) {
        const endPoint = newShape.points[newShape.points.length - 1];
        if (endPoint) {
          rc.rectangle(
            newShape.startPoint.x,
            newShape.startPoint.y,
            endPoint.x - newShape.startPoint.x,
            endPoint.y - newShape.startPoint.y,
          );
        }
      } else if (newShape.type === "freehand") {
        rc.curve(newShape.points.map((p) => [p.x, p.y] as [number, number]));
      } else if (
        newShape.type === "text" &&
        newShape.text &&
        newShape.points[0]
      ) {
        ctx.font = "16px Arial";
        ctx.fillText(newShape.text, newShape.points[0].x, newShape.points[0].y);
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rc = rough.canvas(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (mode === "text") {
        setTextPosition({ x, y });
        setIsTextInputVisible(true);
        return;
      }

      setDrawing(true);
      setStartPoint({ x, y });
      setPoints([{ x, y }]);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!drawing || !startPoint) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Clear main canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw completed shapes from offscreen canvas
      if (offscreenCanvasRef.current) {
        ctx.drawImage(offscreenCanvasRef.current, 0, 0);
      }

      // Draw the current shape being drawn
      if (mode === "freehand") {
        setPoints((prev) => [...prev, { x, y }]);
        const currentPoints = points.concat({ x, y });
        rc.curve(currentPoints.map((p) => [p.x, p.y] as [number, number]));
      } else if (mode === "rectangle") {
        rc.rectangle(
          startPoint.x,
          startPoint.y,
          x - startPoint.x,
          y - startPoint.y,
        );
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!drawing || !startPoint) return;
      const rect = canvas.getBoundingClientRect();
      const endX = e.clientX - rect.left;
      const endY = e.clientY - rect.top;

      const newShape: Shape = {
        type: mode,
        points:
          mode === "freehand"
            ? [...points, { x: endX, y: endY }]
            : [{ x: endX, y: endY }],
        startPoint: mode === "rectangle" ? startPoint : undefined,
      };

      // Draw the new shape to the offscreen canvas
      drawShapesToOffscreen(newShape);

      // Update shapes state
      setShapes((prev) => [...prev, newShape]);
      setDrawing(false);
      setStartPoint(null);
      setPoints([]);

      // Update main canvas with offscreen canvas content
      if (offscreenCanvasRef.current) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(offscreenCanvasRef.current, 0, 0);
      }
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
    };
  }, [drawing, mode, points, startPoint, shapes]);

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (offscreenCanvasRef.current) {
        const offscreenCtx = offscreenCanvasRef.current.getContext("2d");
        offscreenCtx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      setShapes([]);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement("a");
      link.download = "drawing.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  const handleTextSubmit = () => {
    if (textInput.trim() && textPosition) {
      const newShape: Shape = {
        type: "text",
        points: [textPosition],
        text: textInput,
      };

      drawShapesToOffscreen(newShape);
      setShapes((prev) => [...prev, newShape]);
      setTextInput("");
      setIsTextInputVisible(false);
      setTextPosition(null);

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx && offscreenCanvasRef.current) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(offscreenCanvasRef.current, 0, 0);
      }
    }
  };

  return (
    <div>
      <div className="flex gap-2" style={{ marginBottom: "1rem" }}>
        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={() => setMode("freehand")}
        >
          <HiPencil className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={() => setMode("rectangle")}
        >
          <PiRectangle className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={() => setMode("text")}
        >
          <FaFont className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={handleClear}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={handleSave}
        >
          <Save className="h-4 w-4" />
        </Button>
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          style={{
            border: "1px solid #ccc",
            cursor: mode === "text" ? "text" : "crosshair",
          }}
        />
        {isTextInputVisible && textPosition && (
          <div
            className="absolute"
            style={{
              left: textPosition.x,
              top: textPosition.y,
              transform: "translateY(-50%)",
            }}
          >
            <Textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleTextSubmit();
                }
              }}
              className="rounded border border-gray-300 px-2 py-1"
              autoFocus
            />
          </div>
        )}
      </div>
    </div>
  );
};
