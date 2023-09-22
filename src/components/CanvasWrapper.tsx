import React, { useEffect, useImperativeHandle, useRef, useState } from "react";

interface CanvasWrapperProps extends React.HTMLAttributes<HTMLCanvasElement> {
  width: number;
  height: number;
  onAILassoFinished: () => void;
}

export interface CanvasWrapperRef {
  showCanvas: () => void;
  hideCanvas: () => void;
  cleanCanvas: () => void;
}

interface MousePosition {
  x: number;
  y: number;
}

export const CanvasWrapper = React.forwardRef<
  CanvasWrapperRef,
  CanvasWrapperProps
>(({ width, height, onAILassoFinished, className }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [lastPos, setLastPos] = useState<MousePosition>({ x: 0, y: 0 });

  // Imperative methods
  const showCanvas = () => {
    if (canvasRef.current) {
      canvasRef.current.style.display = "block";
    }
  };

  const hideCanvas = () => {
    if (canvasRef.current) {
      canvasRef.current.style.display = "none";
    }
  };

  const cleanCanvas = () => {
    if (canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (!context) return;
      context.clearRect(0, 0, width, height);
    }
  };

  useImperativeHandle(ref, () => ({
    showCanvas,
    hideCanvas,
    cleanCanvas,
  }));

  // Internal methods
  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const rect = canvasRef.current!.getBoundingClientRect();
    setLastPos({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const drawLine = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDrawing) {
      const canvas = canvasRef.current!;
      const context = canvas.getContext("2d")!;
      const rect = canvasRef.current!.getBoundingClientRect();

      context.beginPath();
      context.moveTo(lastPos.x, lastPos.y);
      // console.log(rect.left, rect.top);
      context.lineTo(event.clientX - rect.left, event.clientY - rect.top);
      context.stroke();
      setLastPos({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    onAILassoFinished();
  };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const context = canvas.getContext("2d")!;
    context.lineWidth = 2;
    context.strokeStyle = "#000000";
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      onMouseDown={startDrawing}
      onMouseMove={drawLine}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
    />
  );
});

CanvasWrapper.displayName = "CanvasWrapper";
