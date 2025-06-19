import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";

type PixelGridProps = {
  gridSize: number;
  selectedColor: string;
  showGrid: boolean;
  tool: "pencil" | "bucket" | "lighten" | "darken" | "grabber" | "eraser";
  onColorChange: (color: string) => void;
};

export interface PixelGridRef {
  clear: () => void;
  loadPixelData: (pixelData: string[][]) => void;
  downloadImage: () => void;
}

// Utility: Convert rgb string to hsl
function rgbToHsl(rgb: string): [number, number, number] {
  // rgb format: rgb(r, g, b) or rgba(r, g, b, a)
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return [0, 0, 100];
  let r = parseInt(match[1], 10) / 255;
  let g = parseInt(match[2], 10) / 255;
  let b = parseInt(match[3], 10) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

// Utility: Convert hsl to rgb string
function hslToRgb(h: number, s: number, l: number): string {
  h /= 360;
  s /= 100;
  l /= 100;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(
    b * 255
  )})`;
}

// Utility: Adjust lightness
function adjustLightness(rgb: string, delta: number): string {
  const [h, s, l] = rgbToHsl(rgb);
  const newL = Math.max(0, Math.min(100, l + delta));
  if (newL === l) return rgb; // No change
  return hslToRgb(h, s, newL);
}

// Utility: Convert rgb/rgba to hex
function rgbStringToHex(rgb: string): string {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return "#ffffff";
  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  return (
    "#" +
    [r, g, b]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
      .toLowerCase()
  );
}

const PixelGrid = forwardRef<PixelGridRef, PixelGridProps>(
  ({ gridSize, selectedColor, showGrid, tool, onColorChange }, ref) => {
    const [maxGridSize, setMaxGridSize] = useState(() =>
      Math.min(500, window.innerWidth - 40)
    );
    const gridRef = useRef<HTMLDivElement>(null);
    const [mouseDown, setMouseDown] = useState(false);
    const [touchActive, setTouchActive] = useState(false);

    useImperativeHandle(ref, () => ({
      clear: () => {
        if (gridRef.current) {
          const cells = gridRef.current.children;
          for (let i = 0; i < cells.length; i++) {
            const cell = cells[i] as HTMLElement;
            cell.style.backgroundColor = "";
          }
        }
      },
      loadPixelData: (pixelData: string[][]) => {
        if (gridRef.current) {
          const cells = gridRef.current.children;
          for (let i = 0; i < cells.length; i++) {
            const cell = cells[i] as HTMLElement;
            const x = i % gridSize;
            const y = Math.floor(i / gridSize);
            const color = pixelData[y][x];
            cell.style.backgroundColor = color;
          }
        }
      },
      downloadImage: () => {
        if (!gridRef.current) return;

        // Create a canvas to draw the pixel art
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set canvas size - use a higher resolution for better quality
        const pixelSize = 20; // Each pixel will be 20x20 pixels in the final image
        canvas.width = gridSize * pixelSize;
        canvas.height = gridSize * pixelSize;

        // Fill with transparent background
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw each pixel
        const cells = gridRef.current.children;
        for (let i = 0; i < cells.length; i++) {
          const cell = cells[i] as HTMLElement;
          const x = i % gridSize;
          const y = Math.floor(i / gridSize);

          // Get the inline background color (only pixels we've explicitly set)
          const inlineStyle = cell.style.backgroundColor;

          // Only draw if there's an explicitly set background color
          if (inlineStyle && inlineStyle.trim() !== "") {
            ctx.fillStyle = inlineStyle;
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
          }
        }

        // Convert canvas to blob and download
        canvas.toBlob((blob) => {
          if (!blob) return;

          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `pixel-art-${gridSize}x${gridSize}-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, "image/png");
      },
    }));

    useEffect(() => {
      const handleResize = () => {
        setMaxGridSize(Math.min(500, window.innerWidth - 40));
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Centralized cell action handler
    function handleCellAction(cell: HTMLElement, cellIndex: number) {
      if (!cell) return;
      if (tool === "pencil") {
        cell.style.backgroundColor = selectedColor;
      } else if (tool === "bucket") {
        const computedColor = cell.style.backgroundColor || "";
        floodFill(cellIndex, computedColor, selectedColor);
      } else if (tool === "lighten" || tool === "darken") {
        const computed = getComputedStyle(cell).backgroundColor;
        const delta = tool === "lighten" ? 5 : -5;
        const newColor = adjustLightness(computed, delta);
        if (computed !== newColor) {
          cell.style.backgroundColor = newColor;
        }
      } else if (tool === "grabber") {
        const computed = getComputedStyle(cell).backgroundColor;
        const hex =
          computed === "rgba(0, 0, 0, 0)" || computed === "transparent"
            ? "#ffffff"
            : rgbStringToHex(computed);
        onColorChange(hex);
      } else if (tool === "eraser") {
        cell.style.backgroundColor = "";
      }
    }

    useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        if ((!mouseDown && !touchActive) || !gridRef.current) return;
        const rect = gridRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const gapSize = showGrid ? 1 : 0;
        const cellSize = (rect.width - (gridSize - 1) * gapSize) / gridSize;
        const cellX = Math.floor(x / (cellSize + gapSize));
        const cellY = Math.floor(y / (cellSize + gapSize));
        if (cellX >= 0 && cellX < gridSize && cellY >= 0 && cellY < gridSize) {
          const cellIndex = cellY * gridSize + cellX;
          const cell = gridRef.current.children[cellIndex] as HTMLElement;
          handleCellAction(cell, cellIndex);
        }
      };
      const handleMouseUp = () => {
        setMouseDown(false);
      };
      // Touch events
      const handleTouchMove = (e: TouchEvent) => {
        if (!touchActive || !gridRef.current) return;
        const touch = e.touches[0];
        if (!touch) return;
        const rect = gridRef.current.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        const gapSize = showGrid ? 1 : 0;
        const cellSize = (rect.width - (gridSize - 1) * gapSize) / gridSize;
        const cellX = Math.floor(x / (cellSize + gapSize));
        const cellY = Math.floor(y / (cellSize + gapSize));
        if (cellX >= 0 && cellX < gridSize && cellY >= 0 && cellY < gridSize) {
          const cellIndex = cellY * gridSize + cellX;
          const cell = gridRef.current.children[cellIndex] as HTMLElement;
          handleCellAction(cell, cellIndex);
        }
      };
      const handleTouchEnd = () => {
        setTouchActive(false);
      };
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleTouchEnd);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
      };
    }, [
      mouseDown,
      touchActive,
      gridSize,
      selectedColor,
      showGrid,
      tool,
      onColorChange,
    ]);

    const handleMouseDown = (e: React.MouseEvent) => {
      setMouseDown(true);
      if (!gridRef.current) return;
      const rect = gridRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const gapSize = showGrid ? 1 : 0;
      const cellSize = (rect.width - (gridSize - 1) * gapSize) / gridSize;
      const cellX = Math.floor(x / (cellSize + gapSize));
      const cellY = Math.floor(y / (cellSize + gapSize));
      if (cellX >= 0 && cellX < gridSize && cellY >= 0 && cellY < gridSize) {
        const cellIndex = cellY * gridSize + cellX;
        const cell = gridRef.current.children[cellIndex] as HTMLElement;
        handleCellAction(cell, cellIndex);
      }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
      setTouchActive(true);
      if (!gridRef.current) return;
      const touch = e.touches[0];
      if (!touch) return;
      const rect = gridRef.current.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const gapSize = showGrid ? 1 : 0;
      const cellSize = (rect.width - (gridSize - 1) * gapSize) / gridSize;
      const cellX = Math.floor(x / (cellSize + gapSize));
      const cellY = Math.floor(y / (cellSize + gapSize));
      if (cellX >= 0 && cellX < gridSize && cellY >= 0 && cellY < gridSize) {
        const cellIndex = cellY * gridSize + cellX;
        const cell = gridRef.current.children[cellIndex] as HTMLElement;
        handleCellAction(cell, cellIndex);
      }
    };

    // Flood fill for bucket tool
    const floodFill = (
      startIdx: number,
      targetColor: string,
      fillColor: string
    ) => {
      if (!gridRef.current) return;
      if (targetColor === fillColor) return;
      const cells = gridRef.current.children;
      const visited = new Set<number>();
      const stack = [startIdx];
      while (stack.length > 0) {
        const idx = stack.pop()!;
        if (visited.has(idx)) continue;
        visited.add(idx);
        const cell = cells[idx] as HTMLElement;
        if (!cell) continue;
        const cellBg = cell.style.backgroundColor || "";
        if (cellBg && cellBg !== targetColor && cellBg !== fillColor) continue;
        cell.style.backgroundColor = fillColor;
        const x = idx % gridSize;
        const y = Math.floor(idx / gridSize);
        const neighbors = [
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1],
        ];
        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
            const nIdx = ny * gridSize + nx;
            if (!visited.has(nIdx)) stack.push(nIdx);
          }
        }
      }
    };

    const cells = Array.from({ length: gridSize * gridSize });
    const gapSize = showGrid ? 1 : 0;
    const cellSize = (maxGridSize - (gridSize - 1) * gapSize) / gridSize;

    return (
      <div
        ref={gridRef}
        className={`grid transition-colors duration-300 max-w-fit max-h-fit min-w-[340px] bit-border bg-light-border dark:bg-dark-border p-1 ${
          showGrid ? "gap-px" : "gap-0"
        }`}
        style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {cells.map((_, i) => (
          <div
            key={i}
            className="bg-light-bg text-light-text dark:bg-dark-bg dark:text-dark-text transition-colors duration-300"
            style={{
              width: `${cellSize}px`,
              height: `${cellSize}px`,
            }}
          />
        ))}
      </div>
    );
  }
);

PixelGrid.displayName = "PixelGrid";

export default PixelGrid;
