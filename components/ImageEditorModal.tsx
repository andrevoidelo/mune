
import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, ZoomIn, RotateCw } from 'lucide-react';
import getCroppedImg from '../utils/canvasUtils';
import { useGameSound } from '../hooks/useGameSound';

interface ImageEditorModalProps {
  imageSrc: string;
  onCancel: () => void;
  onSave: (croppedImage: string) => void;
  aspectRatio?: number; // Optional, e.g. 1 for circle/square, 16/9 for covers
  circularCrop?: boolean;
}

const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ 
  imageSrc, 
  onCancel, 
  onSave, 
  aspectRatio, 
  circularCrop = false 
}) => {
  const { play } = useGameSound();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    play('CLICK');
    try {
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      );
      if (croppedImage) {
        onSave(croppedImage);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col animate-in fade-in duration-200 h-full pt-safe">
      
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/50 backdrop-blur-sm z-10">
        <button 
          onClick={() => { play('CLICK'); onCancel(); }}
          className="p-2 bg-black/40 text-white rounded-full hover:bg-white/20 transition-colors"
        >
          <X size={24} />
        </button>
        <h3 className="text-white font-bold text-sm uppercase tracking-wider shadow-black drop-shadow-md">
          Editar Imagem
        </h3>
        <button 
          onClick={handleSave}
          className="p-2 bg-primary text-on-primary rounded-full hover:bg-primary-hover shadow-lg transition-colors"
        >
          <Check size={24} />
        </button>
      </div>

      {/* Cropper Container */}
      <div className="flex-1 relative bg-black w-full overflow-hidden">
        <Cropper
          image={imageSrc}
          crop={crop}
          rotation={rotation}
          zoom={zoom}
          aspect={aspectRatio}
          onCropChange={setCrop}
          onRotationChange={setRotation}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          cropShape={circularCrop ? 'round' : 'rect'}
          showGrid={true}
          restrictPosition={false} // Allow moving image freely
        />
      </div>

      {/* Controls Footer */}
      <div className="bg-card border-t border-border p-4 pb-12 space-y-4 z-10">
        
        {/* Zoom Control */}
        <div className="flex items-center gap-4">
           <ZoomIn size={20} className="text-txt-muted flex-none" />
           <input
             type="range"
             value={zoom}
             min={1}
             max={3}
             step={0.1}
             aria-labelledby="Zoom"
             onChange={(e) => setZoom(Number(e.target.value))}
             className="w-full h-2 bg-app rounded-lg appearance-none cursor-pointer accent-primary"
           />
        </div>

        {/* Rotation Control */}
        <div className="flex items-center gap-4">
           <RotateCw size={20} className="text-txt-muted flex-none" />
           <input
             type="range"
             value={rotation}
             min={0}
             max={360}
             step={1}
             aria-labelledby="Rotation"
             onChange={(e) => setRotation(Number(e.target.value))}
             className="w-full h-2 bg-app rounded-lg appearance-none cursor-pointer accent-primary"
           />
        </div>

      </div>
    </div>
  );
};

export default ImageEditorModal;
