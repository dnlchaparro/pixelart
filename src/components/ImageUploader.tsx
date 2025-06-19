import { useState, useRef, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Upload, X, Crop } from "lucide-react";

type ImageUploaderProps = {
  isOpen: boolean;
  onClose: () => void;
  onImageProcessed: (pixelData: string[][]) => void;
  gridSize: number;
};

type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export default function ImageUploader({
  isOpen,
  onClose,
  onImageProcessed,
  gridSize,
}: ImageUploaderProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onCropComplete = useCallback((_: CropArea, croppedPixels: CropArea) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCroppedImg = useCallback(
    async (imageSrc: string, pixelCrop: CropArea): Promise<string> => {
      const image = new Image();
      image.src = imageSrc;
      image.crossOrigin = "anonymous";

      return new Promise((resolve, reject) => {
        image.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) return reject("Canvas ref not found");

          const ctx = canvas.getContext("2d");
          if (!ctx) return reject("Could not get canvas context");

          canvas.width = pixelCrop.width;
          canvas.height = pixelCrop.height;

          // Transparent base
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "rgba(0, 0, 0, 0)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = image.width;
          tempCanvas.height = image.height;
          const tempCtx = tempCanvas.getContext("2d");
          if (!tempCtx) return reject("Could not get temp context");

          tempCtx.drawImage(image, 0, 0);

          const sourceX = Math.max(0, pixelCrop.x);
          const sourceY = Math.max(0, pixelCrop.y);
          const sourceWidth = Math.min(image.width - sourceX, pixelCrop.width);
          const sourceHeight = Math.min(
            image.height - sourceY,
            pixelCrop.height
          );

          const destX = pixelCrop.x < 0 ? -pixelCrop.x : 0;
          const destY = pixelCrop.y < 0 ? -pixelCrop.y : 0;

          const imageData = tempCtx.getImageData(
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight
          );
          ctx.putImageData(imageData, destX, destY);

          resolve(canvas.toDataURL("image/png"));
        };

        image.onerror = reject;
      });
    },
    []
  );

  const handleCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedImageUrl = await getCroppedImg(imageSrc, croppedAreaPixels);
      const pixelData = await convertImageToPixels(croppedImageUrl, gridSize);
      onImageProcessed(pixelData);
      onClose();
    } catch (err) {
      console.error("Crop error:", err);
    } finally {
      setIsProcessing(false);
      handleReset();
    }
  };

  const convertImageToPixels = async (
    imageUrl: string,
    gridSize: number
  ): Promise<string[][]> => {
    return new Promise((resolve) => {
      const image = new Image();
      image.src = imageUrl;
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        canvas.width = gridSize;
        canvas.height = gridSize;

        ctx.clearRect(0, 0, gridSize, gridSize);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(image, 0, 0, gridSize, gridSize);

        const imageData = ctx.getImageData(0, 0, gridSize, gridSize);
        const pixelData: string[][] = Array(gridSize)
          .fill(0)
          .map(() => Array(gridSize).fill(""));

        for (let y = 0; y < gridSize; y++) {
          for (let x = 0; x < gridSize; x++) {
            const i = (y * gridSize + x) * 4;
            const [r, g, b, a] = imageData.data.slice(i, i + 4);
            pixelData[y][x] =
              a < 128
                ? ""
                : `#${r.toString(16).padStart(2, "0")}${g
                    .toString(16)
                    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
          }
        }

        resolve(pixelData);
      };
    });
  };

  const handleReset = () => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-light-panel dark:bg-dark-panel bit-border max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-light-border dark:border-dark-border">
          <h2 className="text-xl font-bold">Upload & Crop Image</h2>
          <button
            onClick={onClose}
            className="bit-border input p-2 bg-gray-200 dark:bg-gray-500 hover:bg-gray-300 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {!imageSrc ? (
            <div className="text-center">
              <div className="mb-6">
                <Upload size={48} className="mx-auto text-gray-400" />
              </div>
              <label className="bit-border input cursor-pointer blue bg-blue-500 text-white px-6 py-3 hover:bg-blue-600 transition-colors">
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-gray-500 mt-8">
                Upload an image to crop it to a square and convert to pixels
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative h-96 bg-gray-100 dark:bg-gray-800 bit-border">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  showGrid={true}
                  objectFit="horizontal-cover"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Zoom:</label>
                <input
                  type="range"
                  min={0.3}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-blue-500"
                />
                <span className="text-sm">{Math.round(zoom * 100)}%</span>
              </div>

              <div className="flex gap-8">
                <button
                  onClick={handleCrop}
                  disabled={isProcessing}
                  className="bit-border input cursor-pointer bg-blue-500 text-white px-6 py-2 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Crop size={16} />
                  {isProcessing ? "Processing..." : "Crop & Convert"}
                </button>
                <button
                  onClick={handleReset}
                  className="bit-border input cursor-pointer bg-gray-500 text-white px-6 py-2 hover:bg-gray-600 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  );
}
