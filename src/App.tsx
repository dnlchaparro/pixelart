import PixelGrid, { PixelGridRef } from "./components/PixelGrid";
import Menu from "./components/Menu";
import ImageUploader from "./components/ImageUploader";
import { getRandomDrawing } from "./data/predefinedDrawings";
import { useState, useRef } from "react";

function App() {
  const [gridSize, setGridSize] = useState(25);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [showGrid, setShowGrid] = useState(true);
  const [tool, setTool] = useState<
    "pencil" | "bucket" | "lighten" | "darken" | "grabber" | "eraser"
  >("pencil");
  const [isImageUploaderOpen, setIsImageUploaderOpen] = useState(false);
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

  const handleUploadImage = () => {
    setIsImageUploaderOpen(true);
  };

  const handleImageProcessed = (pixelData: string[][]) => {
    pixelGridRef.current?.loadPixelData(pixelData);
  };

  const handleRandomImage = () => {
    const randomDrawing = getRandomDrawing(gridSize);
    if (randomDrawing) {
      pixelGridRef.current?.loadPixelData(randomDrawing.data);
    }
  };

  const handleDownloadImage = () => {
    pixelGridRef.current?.downloadImage();
  };

  return (
    <div className="flex flex-col gap-4 min-h-screen p-4 w-full bg-light-bg text-light-text dark:bg-dark-bg dark:text-dark-text transition-colors duration-300">
      <h1 className="text-4xl font-bold text-center mb-8 mt-6">
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
          onUploadImage={handleUploadImage}
          onRandomImage={handleRandomImage}
          onDownloadImage={handleDownloadImage}
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
      <ImageUploader
        isOpen={isImageUploaderOpen}
        onClose={() => setIsImageUploaderOpen(false)}
        onImageProcessed={handleImageProcessed}
        gridSize={gridSize}
      />
    </div>
  );
}

export default App;
