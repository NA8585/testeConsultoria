

import React from 'react';
import { Tool, ToolSettings } from '../types';
import { TOOLS, COLORS, ICONS_SVG } from '../constants';
import Button from './common/Button';
import { IconComponent } from './IconComponent';

interface ToolboxProps {
  selectedTool: Tool;
  toolSettings: ToolSettings;
  onToolChange: (tool: Tool) => void;
  onSettingChange: <K extends keyof ToolSettings>(key: K, value: ToolSettings[K]) => void;
}

const Toolbox: React.FC<ToolboxProps> = ({
  selectedTool,
  toolSettings,
  onToolChange,
  onSettingChange,
}) => {
  const generalTools = TOOLS.filter(tool => tool.id !== Tool.PAN);
  const panTool = TOOLS.find(tool => tool.id === Tool.PAN);

  return (
    <div className="mb-6">
      <h3 className="section-title">
        <IconComponent svgString={ICONS_SVG.TOOLS_ICON} className="w-5 h-5" /> 
        Ferramentas Ortodônticas
      </h3>
      <div className="grid grid-cols-3 gap-1.5 mb-4">
        {generalTools.map(tool => (
          <Button
            key={tool.id}
            variant={selectedTool === tool.id ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onToolChange(tool.id)}
            title={tool.label}
            className={`flex flex-col items-center justify-center p-1.5 h-16 text-xs transition-all duration-150 group ${selectedTool === tool.id ? 'bg-primary text-primary-foreground scale-105 shadow-md' : 'bg-card text-card-foreground border-sidebar-border hover:border-accent hover:text-accent-foreground hover:bg-accent/10'}`}
            aria-pressed={selectedTool === tool.id}
          >
            <IconComponent svgString={tool.icon} className={`w-5 h-5 mb-0.5 transition-colors ${selectedTool === tool.id ? 'text-primary-foreground' : 'text-primary group-hover:text-accent-foreground' }`} />
            <span className="truncate w-full text-center text-[10px] leading-tight mt-0.5">{tool.label.split(" ")[0]}</span>
          </Button>
        ))}
      </div>
      
      {panTool && (
        <Button
          key={panTool.id}
          variant={selectedTool === panTool.id ? 'primary' : 'outline'}
          size="sm"
          onClick={() => onToolChange(panTool.id)}
          title={panTool.label}
          className={`w-full flex items-center justify-center p-1.5 h-12 text-xs transition-all duration-150 group mb-4 ${selectedTool === panTool.id ? 'bg-primary text-primary-foreground scale-105 shadow-md' : 'bg-card text-card-foreground border-sidebar-border hover:border-accent hover:text-accent-foreground hover:bg-accent/10'}`}
          aria-pressed={selectedTool === panTool.id}
        >
          <IconComponent svgString={panTool.icon} className={`w-5 h-5 mr-2 transition-colors ${selectedTool === panTool.id ? 'text-primary-foreground' : 'text-primary group-hover:text-accent-foreground' }`} />
          <span className="text-xs leading-tight">{panTool.label}</span>
        </Button>
      )}

      <div className="mb-3">
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Cor da Anotação:</label>
        <div className="grid grid-cols-5 gap-2"> {/* Adjusted to grid-cols-5 for smaller items */}
          {COLORS.map(color => (
            <button
              key={color.value}
              title={color.name} // Localized name from constants.ts
              style={{ backgroundColor: color.value, ...(color.style || {}) }}
              className={`w-7 h-7 rounded-full border border-muted-foreground/30 transition-all duration-150 ease-in-out shadow-sm hover:shadow-md hover:scale-105 hover:border-muted-foreground/60 ${
                toolSettings.color === color.value ? 'ring-2 ring-offset-2 ring-offset-card ring-primary scale-110 shadow-lg border-primary/80' : (color.style?.border ? '' : 'border-transparent')
              }`}
              onClick={() => onSettingChange('color', color.value)}
              aria-pressed={toolSettings.color === color.value}
              aria-label={`Selecionar cor ${color.name}`}
            />
          ))}
        </div>
      </div>

      <div className="mb-3">
        <label htmlFor="strokeWidthToolbox" className="block text-xs font-medium text-muted-foreground mb-1.5">
          Espessura: <span className="font-semibold text-foreground">{toolSettings.strokeWidth}</span>px
        </label>
        <input
          type="range"
          id="strokeWidthToolbox"
          min="1"
          max="20"
          value={toolSettings.strokeWidth}
          onChange={(e) => onSettingChange('strokeWidth', parseInt(e.target.value))}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <label htmlFor="opacityToolbox" className="block text-xs font-medium text-muted-foreground mb-1.5">
          Opacidade: <span className="font-semibold text-foreground">{Math.round(toolSettings.opacity * 100)}</span>%
        </label>
        <input
          type="range"
          id="opacityToolbox"
          min="0.1"
          max="1"
          step="0.05"
          value={toolSettings.opacity}
          onChange={(e) => onSettingChange('opacity', parseFloat(e.target.value))}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary focus:ring-2 focus:ring-ring"
        />
      </div>
    </div>
  );
};

export default Toolbox;