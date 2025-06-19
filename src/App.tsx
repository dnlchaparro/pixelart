import PixelGrid, { PixelGridRef } from "./components/PixelGrid";
import Menu from "./components/Menu";
import { useState, useRef } from "react";

function App() {
  const [gridSize, setGridSize] = useState(16);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [showGrid, setShowGrid] = useState(true);
  const [tool, setTool] = useState<
    "pencil" | "bucket" | "lighten" | "darken" | "grabber" | "eraser"
  >("pencil");
  const pixelGridRef = useRef<PixelGridRef>(null);

  const handleClear = () => {
    pixelGridRef.current?.clear();
  };

  const handleGridSizeChange = (newSize: number) => {
    pixelGridRef.current?.clear();
    setGridSize(newSize);
  };

  const handleToggleGrid = () => {
    setShowGrid(!showGrid);
  };

  return (
    <div className="flex flex-col gap-4 min-h-screen p-4 w-full bg-light-bg text-light-text dark:bg-dark-bg dark:text-dark-text transition-colors duration-300">
      <h1 className="text-4xl font-bold text-center mb-16 mt-6">
        Pixel Art Creator
      </h1>
      <div className="flex gap-2 w-full flex-wrap">
        <Menu
          gridSize={gridSize}
          onGridSizeChange={handleGridSizeChange}
          selectedColor={selectedColor}
          onColorChange={setSelectedColor}
          onClear={handleClear}
          showGrid={showGrid}
          onToggleGrid={handleToggleGrid}
          tool={tool}
          onToolChange={setTool}
        />
        <div className="flex-1 mx-auto grid place-items-center">
          <PixelGrid
            ref={pixelGridRef}
            gridSize={gridSize}
            selectedColor={selectedColor}
            showGrid={showGrid}
            tool={tool}
            onColorChange={setSelectedColor}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
