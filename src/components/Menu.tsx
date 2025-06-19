import ThemeSwitcher from "./ThemeSwitcher";
import {
  Pencil,
  PaintBucket,
  Sun,
  Moon,
  Pipette,
  Eraser,
  Upload,
  Shuffle,
  Download,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type MenuProps = {
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
  onClear: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  tool: "pencil" | "bucket" | "lighten" | "darken" | "grabber" | "eraser";
  onToolChange: (
    tool: "pencil" | "bucket" | "lighten" | "darken" | "grabber" | "eraser"
  ) => void;
  onUploadImage: () => void;
  onRandomImage: () => void;
  onDownloadImage: () => void;
};

const GRID_SIZES = [8, 16, 25, 32, 50, 64];

export default function Menu({
  gridSize,
  onGridSizeChange,
  selectedColor,
  onColorChange,
  onClear,
  showGrid,
  onToggleGrid,
  tool,
  onToolChange,
  onUploadImage,
  onRandomImage,
  onDownloadImage,
}: MenuProps) {
  // Find the index of the current grid size for the slider
  const gridIndex = useMemo(() => GRID_SIZES.indexOf(gridSize), [gridSize]);
  const [hexInput, setHexInput] = useState(selectedColor);

  useEffect(() => {
    setHexInput(selectedColor);
  }, [selectedColor]);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHexInput(value);
    // Only update if valid hex (3 or 6 digits, with #)
    if (/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(value)) {
      onColorChange(value);
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHexInput(e.target.value);
    onColorChange(e.target.value);
  };

  return (
    <div className="flex w-full sm:w-auto flex-col gap-2 items-start bg-light-panel dark:bg-dark-panel p-8 h-fit bit-border sm:ml-10 mb-4">
      <label htmlFor="grid-size" className="mb-2">
        Tools
      </label>
      <div className="flex flex-wrap w-full mb-8 justify-between">
        <button
          onClick={() => onToolChange("pencil")}
          className={`bit-border input cursor-pointer ${
            tool === "pencil"
              ? "bg-blue-500 text-white active"
              : "bg-gray-200 border-gray-400 dark:bg-gray-800 dark:border-gray-600"
          }`}
          title="Pencil"
        >
          <Pencil size={20} />
        </button>
        <button
          onClick={() => onToolChange("bucket")}
          className={`bit-border input cursor-pointer ${
            tool === "bucket"
              ? "bg-blue-500 text-white active"
              : "bg-gray-200 border-gray-400 dark:bg-gray-800 dark:border-gray-600"
          }`}
          title="Bucket"
        >
          <PaintBucket size={20} />
        </button>
        <button
          onClick={() => onToolChange("lighten")}
          className={`bit-border input cursor-pointer ${
            tool === "lighten"
              ? "bg-blue-500 text-white active"
              : "bg-gray-200 border-gray-400 dark:bg-gray-800 dark:border-gray-600"
          }`}
          title="Lighten"
        >
          <Sun size={20} />
        </button>
        <button
          onClick={() => onToolChange("darken")}
          className={`bit-border input cursor-pointer ${
            tool === "darken"
              ? "bg-blue-500 text-white active"
              : "bg-gray-200 border-gray-400 dark:bg-gray-800 dark:border-gray-600"
          }`}
          title="Darken"
        >
          <Moon size={20} />
        </button>
        <button
          onClick={() => onToolChange("grabber")}
          className={`bit-border input cursor-pointer ${
            tool === "grabber"
              ? "bg-blue-500 text-white active"
              : "bg-gray-200 border-gray-400 dark:bg-gray-800 dark:border-gray-600"
          }`}
          title="Color Grabber"
        >
          <Pipette size={20} />
        </button>
        <button
          onClick={() => onToolChange("eraser")}
          className={`bit-border input cursor-pointer ${
            tool === "eraser"
              ? "bg-blue-500 text-white active"
              : "bg-gray-200 border-gray-400 dark:bg-gray-800 dark:border-gray-600"
          }`}
          title="Eraser"
        >
          <Eraser size={20} />
        </button>
      </div>

      <label htmlFor="grid-size-slider">
        Grid Size: {gridSize}x{gridSize}
      </label>
      <input
        id="grid-size-slider"
        type="range"
        min={0}
        max={GRID_SIZES.length - 1}
        step={1}
        value={gridIndex}
        onChange={(e) => onGridSizeChange(GRID_SIZES[Number(e.target.value)])}
        className="w-full accent-blue-500"
      />
      <div className="flex justify-between w-full mt-1 mb-4 pl-[5px]">
        {GRID_SIZES.map((size, idx) => (
          <span
            key={size}
            className={`text-xs ${
              gridIndex === idx
                ? "text-blue-600 font-bold"
                : "text-gray-500 dark:text-gray-300"
            }`}
            style={{ minWidth: 0 }}
          >
            {size}
          </span>
        ))}
      </div>
      <label htmlFor="color-picker">Color</label>
      <div className="flex gap-2 mb-10 mt-2 bit-border input p-1 bg-gray-200 dark:bg-gray-800 focus-within:outline focus-within:outline-2">
        <input
          type="text"
          value={hexInput}
          onChange={handleHexChange}
          className="w-34 rounded px-2 py-1 border-none bg-gray-200 dark:bg-gray-800 outline-none"
          maxLength={7}
          style={{ textTransform: "uppercase" }}
          aria-label="Hex color"
        />
        <input
          type="color"
          id="color-picker"
          value={selectedColor}
          onChange={handleColorChange}
          className="w-12 h-8 cursor-pointer border-none bg-transparent focus:outline focus:outline-2"
        />
      </div>
      <div className="flex gap-8 mb-4">
        <button
          onClick={onClear}
          className="px-4 py-2 cursor-pointer bit-border red bg-red-500 text-white hover:bg-red-800 transition-all"
        >
          Clear
        </button>
        <button
          onClick={onToggleGrid}
          className="px-4 py-2 cursor-pointer   bit-border blue bg-blue-500 text-white hover:bg-blue-800 transition-all"
        >
          {showGrid ? "Hide Grid" : "Show Grid"}
        </button>
      </div>
      <button
        onClick={onUploadImage}
        className="px-4 py-2 cursor-pointer bit-border green bg-green-500 text-white hover:bg-green-800 transition-all flex items-center mb-4 gap-3"
      >
        <Upload size={24} />
        Upload Image
      </button>
      <button
        onClick={onRandomImage}
        className="px-4 py-2 cursor-pointer bit-border purple bg-purple-500 text-white hover:bg-purple-800 transition-all flex items-center mb-8 gap-3"
      >
        <Shuffle size={24} />
        Random Image
      </button>
      <button
        onClick={onDownloadImage}
        className="px-4 py-2 cursor-pointer bit-border orange bg-orange-500 text-white hover:bg-orange-800 transition-all flex items-center mb-8 gap-3"
      >
        <Download size={24} />
        Download Image
      </button>
      <ThemeSwitcher />
    </div>
  );
}
