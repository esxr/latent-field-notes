"use client";

import { useEffect, useRef } from "react";

type PixelBlastProps = {
  className?: string;
  density?: number;
};

// Lightweight background inspired by ReactBits "Pixel Blast" (non-interactive, subtle).
export function PixelBlast({ className = "", density = 0.1 }: PixelBlastProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const bgVar =
      getComputedStyle(document.documentElement).getPropertyValue("--bg") ||
      "#f9f7f3";
    // Blend a slightly darker accent to make pixels faint.
    const parseColor = (c: string) => {
      const s = c.trim().replace("#", "");
      const bigint = parseInt(s.length === 3 ? s.repeat(2) : s, 16);
      return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255,
      };
    };
    const base = parseColor(bgVar);
    const accent = parseColor("#0f8b8d");

    const tick = () => {
      const { width, height } = canvas;
      ctx.fillStyle = bgVar;
      ctx.fillRect(0, 0, width, height);
      const pixels = Math.floor((width * height * density) / 800);
      for (let i = 0; i < pixels; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 3 + 1;
        const mix = 0.04 + Math.random() * 0.05;
        const r = Math.round(base.r * (1 - mix) + accent.r * mix);
        const g = Math.round(base.g * (1 - mix) + accent.g * mix);
        const b = Math.round(base.b * (1 - mix) + accent.b * mix);
        ctx.fillStyle = `rgba(${r},${g},${b},0.28)`;
        ctx.fillRect(x, y, size, size);
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
