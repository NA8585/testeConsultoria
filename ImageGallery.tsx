
import React, { useCallback, useState, useRef } from 'react';
import { ImageFile } from '../types';
import { ICONS_SVG } from '../constants';
import { IconComponent } from './IconComponent'; 

interface ImageGalleryProps {
  images: ImageFile[];
  currentImageIndex: number;
  onImageSelect: (index: number) => void;
  onImageUpload: (files: FileList) => void;
  analyzedCount: number;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  currentImageIndex,
  onImageSelect,
  onImageUpload,
  analyzedCount
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onImageUpload(event.target.files);
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      onImageUpload(event.dataTransfer.files);
    }
  }, [onImageUpload]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDragging) setIsDragging(true);
  }, [isDragging]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    // Check if the mouse is leaving to an element outside the drop zone
    const relatedTarget = event.relatedTarget as Node;
    if (!event.currentTarget.contains(relatedTarget)) {
        setIsDragging(false);
    }
  }, []);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const totalImages = images.length;
  const analysisProgressPercent = totalImages > 0 ? (analyzedCount / totalImages) * 100 : 0;

  return (
    <div className="mb-6">
      <h3 className="section-title">
        <IconComponent svgString={ICONS_SVG.GALLERY} className="w-5 h-5" />
        Galeria de Imagens
      </h3>
      <div className="grid grid-cols-3 gap-2 mb-3 max-h-52 overflow-y-auto p-1.5 bg-muted/20 rounded-md border border-sidebar-border shadow-inner">
        {images.length === 0 && (
          <p className="col-span-3 text-center text-muted-foreground py-4 text-sm">Nenhuma imagem carregada.</p>
        )}
        {images.map((img, index) => (
          <div
            key={img.id}
            className={`aspect-square border-2 rounded-lg cursor-pointer overflow-hidden relative transition-all duration-200 ease-in-out group hover:shadow-lg ${
              index === currentImageIndex ? 'border-primary ring-2 ring-primary shadow-md' : 'border-border hover:border-accent'
            }`}
            onClick={() => onImageSelect(index)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onImageSelect(index); }}
            aria-label={`Selecionar imagem ${img.file.name}`}
            aria-current={index === currentImageIndex}
          >
            <img src={img.dataURL} alt={img.file.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <span className="text-xs text-white p-1 bg-black/50 rounded line-clamp-2">{img.file.name}</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mb-4">
        <div className="bg-muted rounded-full h-1.5 mb-1 overflow-hidden border border-border">
          <div 
            className="bg-gradient-to-r from-primary/70 to-primary h-full transition-all duration-300 ease-linear" 
            style={{ width: `${analysisProgressPercent}%` }}
            role="progressbar"
            aria-valuenow={analysisProgressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progresso da análise de imagens"
          ></div>
        </div>
        <small className="text-muted-foreground text-xs">{analyzedCount} de {totalImages} imagens analisadas</small>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-200 ease-in-out ${
          isDragging ? 'border-primary bg-accent/20 scale-105' : 'border-input hover:border-accent hover:bg-accent/10'
        }`}
        onClick={triggerFileInput}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        role="button"
        tabIndex={0}
        aria-label="Área para carregar imagens"
      >
        <IconComponent svgString={ICONS_SVG.UPLOAD} className="w-8 h-8 mx-auto text-primary mb-1" />
        <p className="font-semibold text-sm text-foreground">Clique para carregar imagens</p>
        <p className="text-xs text-muted-foreground">ou arraste-as aqui</p>
        <small className="text-xs text-muted-foreground/70">JPEG, PNG, TIFF, DCM suportados</small>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".jpg,.jpeg,.png,.tiff,.tif,.dicom,.dcm" 
        multiple
        onChange={handleFileChange}
        aria-hidden="true"
      />
    </div>
  );
};

export default ImageGallery;