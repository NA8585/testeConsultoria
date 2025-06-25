
import React from 'react';
import { ImageFile, Tool, ToolSettings, CanvasState } from '../types';
import ImageGallery from './ImageGallery';
import Toolbox from './Toolbox';
import ImageAdjustmentControls from './ImageAdjustmentControls';
import LayerManager from './LayerManager';
import Button from './common/Button';
import { ICONS_SVG } from '../constants'; 
import { IconComponent } from './IconComponent';


interface SidebarProps {
  images: ImageFile[];
  currentImageIndex: number;
  onImageSelect: (index: number) => void;
  onImageUpload: (files: FileList) => void;
  analyzedCount: number;

  selectedTool: Tool;
  toolSettings: ToolSettings;
  onToolChange: (tool: Tool) => void;
  onToolSettingChange: <K extends keyof ToolSettings>(key: K, value: ToolSettings[K]) => void;
  
  canvasState: CanvasState;
  onCanvasFilterChange: (filterName: keyof CanvasState['imageFilters'], value: number) => void;

  onUndo: () => void;
  onRedo: () => void;
  onClearAnnotations: () => void;
  onDuplicateImage: () => void; 
  canUndo: boolean;
  canRedo: boolean;
}


const Sidebar: React.FC<SidebarProps> = (props) => {
  return (
    <aside className="bg-sidebar text-sidebar-foreground border-r border-sidebar-border p-4 overflow-y-auto w-full md:w-72 lg:w-80 flex-shrink-0 shadow-lg flex flex-col">
      <ImageGallery
        images={props.images}
        currentImageIndex={props.currentImageIndex}
        onImageSelect={props.onImageSelect}
        onImageUpload={props.onImageUpload}
        analyzedCount={props.analyzedCount}
      />
      <Toolbox
        selectedTool={props.selectedTool}
        toolSettings={props.toolSettings}
        onToolChange={props.onToolChange}
        onSettingChange={props.onToolSettingChange}
      />
      <ImageAdjustmentControls
        filters={props.canvasState.imageFilters}
        onFilterChange={props.onCanvasFilterChange}
      />
      <LayerManager /> 
      
      <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-sidebar-border">
        <Button onClick={props.onUndo} disabled={!props.canUndo || props.currentImageIndex < 0} variant="outline" size="sm" className="text-xs">
          <IconComponent svgString={ICONS_SVG.UNDO} className="w-3.5 h-3.5 mr-1.5"/>Desfazer
        </Button>
        <Button onClick={props.onRedo} disabled={!props.canRedo || props.currentImageIndex < 0} variant="outline" size="sm" className="text-xs">
          <IconComponent svgString={ICONS_SVG.REDO} className="w-3.5 h-3.5 mr-1.5"/>Refazer
        </Button>
        <Button onClick={props.onClearAnnotations} disabled={props.currentImageIndex < 0 || (props.images[props.currentImageIndex]?.annotations.length === 0)} variant="destructive" size="sm" className="text-xs col-span-2 sm:col-span-1">
          <IconComponent svgString={ICONS_SVG.CLEAR} className="w-3.5 h-3.5 mr-1.5"/>Limpar Tudo
        </Button>
        <Button onClick={props.onDuplicateImage} disabled={props.currentImageIndex < 0} variant="outline" size="sm" className="text-xs col-span-2 sm:col-span-1">
          <IconComponent svgString={ICONS_SVG.DUPLICATE} className="w-3.5 h-3.5 mr-1.5"/>Duplicar Img.
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;