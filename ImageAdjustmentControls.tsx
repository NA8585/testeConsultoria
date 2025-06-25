
import React from 'react';
import { CanvasState } from '../types';
import { ICONS_SVG } from '../constants';
import { IconComponent } from './IconComponent';

interface ImageAdjustmentControlsProps {
  filters: CanvasState['imageFilters'];
  onFilterChange: (filterName: keyof CanvasState['imageFilters'], value: number) => void;
}

const ImageAdjustmentControls: React.FC<ImageAdjustmentControlsProps> = ({ filters, onFilterChange }) => {
  return (
    <div className="mb-6">
      <h3 className="section-title">
        <IconComponent svgString={ICONS_SVG.ADJUSTMENTS} className="w-5 h-5" />
        Ajustes da Imagem
      </h3>
      <div className="mb-3">
        <label htmlFor="brightnessControl" className="block text-xs font-medium text-muted-foreground mb-1.5">
          Brilho: <span className="font-semibold text-foreground">{filters.brightness - 100}</span>%
        </label>
        <input
          type="range"
          id="brightnessControl"
          min="0" 
          max="200" 
          value={filters.brightness}
          onChange={(e) => onFilterChange('brightness', parseInt(e.target.value))}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary focus:ring-2 focus:ring-ring"
        />
      </div>
      <div>
        <label htmlFor="contrastControl" className="block text-xs font-medium text-muted-foreground mb-1.5">
          Contraste: <span className="font-semibold text-foreground">{filters.contrast - 100}</span>%
        </label>
        <input
          type="range"
          id="contrastControl"
          min="0"
          max="200"
          value={filters.contrast}
          onChange={(e) => onFilterChange('contrast', parseInt(e.target.value))}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary focus:ring-2 focus:ring-ring"
        />
      </div>
    </div>
  );
};

export default ImageAdjustmentControls;
