"use client";

import * as React from "react";

export interface DotMatrixTextProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string | string[];
  transition?: "fade" | "scramble" | "none";
  cycleInterval?: number;
  scrambleDuration?: number;
  dotSize?: number;
  gap?: number;
  activeColor?: string;
  inactiveColor?: string;
  showInactive?: boolean;
  showGrid?: boolean;
  fontFamily?: string;
}

interface DotState {
  x: number;
  y: number;
  active: boolean;
  targetScale: number;
  currentScale: number;
  delay: number;
}

export const DotMatrixText = React.forwardRef<HTMLDivElement, DotMatrixTextProps>(
  (
    {
      text,
      transition = "fade",
      cycleInterval = 3500,
      scrambleDuration = 600,
      dotSize = 3,
      gap = 2,
      activeColor = "currentColor",
      inactiveColor = "rgba(120, 120, 120, 0.15)",
      showInactive = false,
      showGrid = false,
      fontFamily = "Inter, system-ui, sans-serif",
      className,
      style,
      ...props
    },
    ref
  ) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const offscreenCanvasRef = React.useRef<HTMLCanvasElement | null>(null);

    const textKey = Array.isArray(text) ? text.join("___") : text;

    React.useEffect(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (!offscreenCanvasRef.current) {
        offscreenCanvasRef.current = document.createElement("canvas");
      }
      const offscreen = offscreenCanvasRef.current;
      const offscreenCtx = offscreen.getContext("2d", { willReadFrequently: true });
      if (!offscreenCtx) return;

      const texts = Array.isArray(text) ? text : [text];
      let currentIndex = 0;
      let dots: DotState[] = [];
      let animationFrameId: number;
      let cycleTimer: ReturnType<typeof setInterval>;

      let isScrambling = false;
      let scrambleEndTime = 0;
      let engineStartTime = performance.now();

      const createDotMap = (str: string, cols: number, rows: number): boolean[] => {
        if (cols <= 0 || rows <= 0) return [];
        offscreen.width = cols;
        offscreen.height = rows;
        offscreenCtx.clearRect(0, 0, cols, rows);
        offscreenCtx.textBaseline = "middle";
        offscreenCtx.textAlign = "center";
        let fontSize = rows * 0.8;
        offscreenCtx.font = `900 ${fontSize}px ${fontFamily}`;
        let metrics = offscreenCtx.measureText(str);
        if (metrics.width > cols * 0.9) {
          fontSize = fontSize * ((cols * 0.9) / (metrics.width || 1));
          offscreenCtx.font = `900 ${fontSize}px ${fontFamily}`;
        }
        offscreenCtx.fillStyle = "white";
        offscreenCtx.fillText(str, cols / 2, rows / 2);
        const imageData = offscreenCtx.getImageData(0, 0, cols, rows).data;
        const map: boolean[] = new Array(cols * rows).fill(false);
        for (let i = 0; i < imageData.length; i += 4) {
          map[i / 4] = imageData[i + 3] > 128;
        }
        return map;
      };

      const init = () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        if (width === 0 || height === 0) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        const step = dotSize + gap;
        const cols = Math.floor(width / step);
        const rows = Math.floor(height / step);
        const offsetX = (width - cols * step) / 2;
        const offsetY = (height - rows * step) / 2;
        const currentText = texts[currentIndex];
        const dotMap = createDotMap(currentText, cols, rows);
        dots = [];
        engineStartTime = performance.now();
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const i = y * cols + x;
            const isActive = dotMap[i] || false;
            const delay = engineStartTime + Math.random() * 350;
            dots.push({
              x: offsetX + x * step,
              y: offsetY + y * step,
              active: isActive,
              targetScale: isActive ? 1 : showInactive ? 0.3 : 0,
              currentScale: showInactive ? 0.3 : 0,
              delay,
            });
          }
        }
      };

      const updateTextMap = () => {
        const step = dotSize + gap;
        const cols = Math.floor(container.clientWidth / step);
        const rows = Math.floor(container.clientHeight / step);
        const newMap = createDotMap(texts[currentIndex], cols, rows);
        engineStartTime = performance.now();
        if (transition === "scramble") {
          isScrambling = true;
          scrambleEndTime = performance.now() + scrambleDuration;
        }
        dots.forEach((dot, i) => {
          dot.active = newMap[i] || false;
          dot.targetScale = dot.active ? 1 : showInactive ? 0.3 : 0;
          dot.delay = engineStartTime + Math.random() * 350;
        });
      };

      const animate = () => {
        const time = performance.now();
        const width = container.clientWidth;
        const height = container.clientHeight;
        ctx.clearRect(0, 0, width, height);
        if (isScrambling && time > scrambleEndTime) isScrambling = false;
        const radius = dotSize / 2;
        for (let i = 0; i < dots.length; i++) {
          const dot = dots[i];
          if (isScrambling) {
            dot.currentScale = Math.random() > 0.5 ? 1 : showInactive ? 0.3 : 0;
          } else if (transition === "fade") {
            if (time > dot.delay) {
              const diff = dot.targetScale - dot.currentScale;
              dot.currentScale += diff * 0.18;
            }
          } else {
            dot.currentScale = dot.targetScale;
          }
        }
        ctx.fillStyle =
          activeColor === "currentColor"
            ? getComputedStyle(canvas).color || "#ffffff"
            : activeColor;
        ctx.beginPath();
        for (let i = 0; i < dots.length; i++) {
          const dot = dots[i];
          if (dot.currentScale > 0.5) {
            const r = radius * dot.currentScale;
            const cx = dot.x + radius;
            const cy = dot.y + radius;
            ctx.moveTo(cx + r, cy);
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
          }
        }
        ctx.fill();
        if (showInactive) {
          ctx.fillStyle = inactiveColor;
          ctx.beginPath();
          for (let i = 0; i < dots.length; i++) {
            const dot = dots[i];
            if (dot.currentScale <= 0.5 && dot.currentScale > 0.01) {
              const r = radius * dot.currentScale;
              const cx = dot.x + radius;
              const cy = dot.y + radius;
              ctx.moveTo(cx + r, cy);
              ctx.arc(cx, cy, r, 0, Math.PI * 2);
            }
          }
          ctx.fill();
        }
        animationFrameId = requestAnimationFrame(animate);
      };

      const resizeObserver = new ResizeObserver(() => init());
      resizeObserver.observe(container);
      if (texts.length > 1) {
        cycleTimer = setInterval(() => {
          currentIndex = (currentIndex + 1) % texts.length;
          updateTextMap();
        }, cycleInterval);
      }
      init();
      animate();

      return () => {
        resizeObserver.disconnect();
        if (cycleTimer) clearInterval(cycleTimer);
        cancelAnimationFrame(animationFrameId);
      };
    }, [
      textKey,
      transition,
      cycleInterval,
      scrambleDuration,
      dotSize,
      gap,
      activeColor,
      inactiveColor,
      showInactive,
      fontFamily,
    ]);

    const baseClass = [
      "relative flex items-center justify-center w-full min-h-[120px] select-none overflow-hidden",
      showGrid ? "rounded-2xl p-6 shadow-xl backdrop-blur-sm" : "",
      className || "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div ref={ref} className={baseClass} style={style} {...props}>
        <div
          ref={containerRef}
          className="w-full h-full min-h-[120px] relative flex items-center justify-center"
        >
          <canvas ref={canvasRef} className="block w-full h-full pointer-events-none" />
        </div>
      </div>
    );
  }
);

DotMatrixText.displayName = "DotMatrixText";

export default DotMatrixText;
