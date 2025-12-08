"use client";

import {
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type RefObject,
} from "react";

type Falloff = "linear" | "exponential" | "gaussian";

type VariableProximityTextProps = {
  label: string;
  className?: string;
  style?: CSSProperties;
  containerRef?: RefObject<HTMLElement>;
  fromFontVariationSettings?: string;
  toFontVariationSettings?: string;
  radius?: number;
  falloff?: Falloff;
};

type AxisSettings = {
  axis: string;
  fromValue: number;
  toValue: number;
};

function useMousePositionRef(containerRef?: RefObject<HTMLElement>) {
  const positionRef = useRef<{ x: number; y: number }>({
    x: Number.POSITIVE_INFINITY,
    y: Number.POSITIVE_INFINITY,
  });

  useEffect(() => {
    const updatePosition = (clientX: number, clientY: number) => {
      if (containerRef?.current) {
        const rect = containerRef.current.getBoundingClientRect();
        positionRef.current = {
          x: clientX - rect.left,
          y: clientY - rect.top,
        };
        return;
      }
      positionRef.current = { x: clientX, y: clientY };
    };

    const handleMouseMove = (event: MouseEvent) =>
      updatePosition(event.clientX, event.clientY);
    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) {
        updatePosition(touch.clientX, touch.clientY);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [containerRef]);

  return positionRef;
}

function parseSettings(
  fromSettings: string,
  toSettings: string,
): AxisSettings[] {
  const parse = (settings: string) =>
    new Map(
      settings
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((setting) => {
          const [name, value] = setting.split(/\s+/);
          return [name.replace(/['"]/g, ""), Number(value)] as const;
        }),
    );

  const from = parse(fromSettings);
  const to = parse(toSettings);

  return Array.from(from.entries()).map(([axis, fromValue]) => ({
    axis,
    fromValue,
    toValue: to.get(axis) ?? fromValue,
  }));
}

function calculateFalloff(distance: number, radius: number, falloff: Falloff) {
  const normalized = Math.min(Math.max(1 - distance / radius, 0), 1);

  switch (falloff) {
    case "exponential":
      return normalized ** 2;
    case "gaussian":
      return Math.exp(-((distance / (radius / 2)) ** 2) / 2);
    case "linear":
    default:
      return normalized;
  }
}

export function VariableProximityText({
  label,
  className = "",
  style,
  containerRef,
  fromFontVariationSettings = "'wght' 520, 'opsz' 18",
  toFontVariationSettings = "'wght' 780, 'opsz' 32",
  radius = 110,
  falloff = "linear",
}: VariableProximityTextProps) {
  const letterRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const interpolatedSettingsRef = useRef<string[]>([]);
  const internalContainerRef = useRef<HTMLSpanElement>(null);
  const targetContainerRef = containerRef ?? internalContainerRef;
  const mousePositionRef = useMousePositionRef(targetContainerRef);
  const lastPositionRef = useRef<{ x: number; y: number }>({
    x: Number.POSITIVE_INFINITY,
    y: Number.POSITIVE_INFINITY,
  });

  const parsedSettings = useMemo(
    () => parseSettings(fromFontVariationSettings, toFontVariationSettings),
    [fromFontVariationSettings, toFontVariationSettings],
  );

  useEffect(() => {
    // Reset refs when the label changes to avoid leftover nodes.
    letterRefs.current = [];
    interpolatedSettingsRef.current = [];
  }, [label]);

  useEffect(() => {
    let frameId: number;

    const update = () => {
      const containerRect = targetContainerRef.current?.getBoundingClientRect();
      const offsetX = containerRect?.left ?? 0;
      const offsetY = containerRect?.top ?? 0;
      const mouseX = mousePositionRef.current.x;
      const mouseY = mousePositionRef.current.y;

      if (
        lastPositionRef.current.x === mouseX &&
        lastPositionRef.current.y === mouseY
      ) {
        frameId = requestAnimationFrame(update);
        return;
      }

      lastPositionRef.current = { x: mouseX, y: mouseY };

      letterRefs.current.forEach((letterRef, index) => {
        if (!letterRef) return;

        const rect = letterRef.getBoundingClientRect();
        const letterCenterX = rect.left + rect.width / 2 - offsetX;
        const letterCenterY = rect.top + rect.height / 2 - offsetY;
        const distance = Math.hypot(mouseX - letterCenterX, mouseY - letterCenterY);

        if (!Number.isFinite(distance) || distance >= radius) {
          letterRef.style.fontVariationSettings = fromFontVariationSettings;
          return;
        }

        const falloffValue = calculateFalloff(distance, radius, falloff);
        const newSettings = parsedSettings
          .map(({ axis, fromValue, toValue }) => {
            const interpolatedValue = fromValue + (toValue - fromValue) * falloffValue;
            return `'${axis}' ${interpolatedValue}`;
          })
          .join(", ");

        interpolatedSettingsRef.current[index] = newSettings;
        letterRef.style.fontVariationSettings = newSettings;
      });

      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [
    falloff,
    fromFontVariationSettings,
    parsedSettings,
    radius,
    targetContainerRef,
    mousePositionRef,
  ]);

  const words = useMemo(() => label.split(" "), [label]);
  let letterIndex = 0;

  return (
    <span
      ref={internalContainerRef}
      aria-label={label}
      role="text"
      className={`variable-proximity-text ${className}`.trim()}
      style={{ display: "inline", ...style }}
    >
      {words.map((word, wordIndex) => (
        <span
          key={`${word}-${wordIndex}`}
          className="inline-block whitespace-nowrap"
        >
          {word.split("").map((letter) => {
            const currentIndex = letterIndex++;
            return (
              <span
                key={currentIndex}
                ref={(node) => {
                  letterRefs.current[currentIndex] = node;
                }}
                className="inline-block"
                aria-hidden="true"
                style={{
                  fontVariationSettings:
                    interpolatedSettingsRef.current[currentIndex] ??
                    fromFontVariationSettings,
                }}
              >
                {letter}
              </span>
            );
          })}
          {wordIndex < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </span>
  );
}
