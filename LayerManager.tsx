
import React from 'react';
import { ICONS_SVG } from '../constants';
import { IconComponent } from './IconComponent';

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked?: boolean;
}

interface LayerManagerProps {
  // Props to be added when layer management is implemented
}

const LayerManager: React.FC<LayerManagerProps> = () => {
  const layers: Layer[] = [
    { id: 'original', name: 'Imagem Original', visible: true, locked: true },
  ];

  return (
    <div className="mb-6">
      <h3 className="section-title">
        <IconComponent svgString={ICONS_SVG.LAYERS} className="w-5 h-5" />
        Camadas
      </h3>
      <div className="bg-card border border-border rounded-md p-2.5 space-y-1.5 text-xs shadow-inner">
        {layers.map(layer => (
          <div key={layer.id} className="flex items-center justify-between p-1.5 rounded bg-muted/30 hover:bg-muted/50 transition-colors">
            <span className="text-foreground">{layer.name}</span>
            <input 
              type="checkbox" 
              checked={layer.visible} 
              disabled={layer.locked} 
              className="form-checkbox h-3.5 w-3.5 text-primary rounded-sm border-border focus:ring-ring focus:ring-offset-background bg-input"
              // onChange={() => onLayerToggleVisibility(layer.id)} // Placeholder
              aria-label={`Visibilidade da camada ${layer.name}`}
            />
          </div>
        ))}
        {layers.length === 1 && <p className="text-muted-foreground text-center py-2 text-xs">Anotações aparecerão aqui como camadas.</p>}
      </div>
    </div>
  );
};

export default LayerManager;
