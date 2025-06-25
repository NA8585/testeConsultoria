

import { Tool, ToolSettings, CanvasState } from './types';

export const APP_TITLE = "Consultoria Ortodôntica Avançada";
export const APP_SUBTITLE = "Sistema de Análise e Planejamento Digital";

export const DEFAULT_STROKE_WIDTH = 2;
export const DEFAULT_OPACITY = 1;
export const DEFAULT_COLOR = "oklch(0.80 0.10 85)"; // Gold
export const DEFAULT_CALIBRATION_PIXELS_PER_MM = 10; // Placeholder: 10 pixels = 1 mm

export const ICONS_SVG: Record<string, string> = {
  PEN: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.06 9.02l.92.92L5.92 19H5v-.92l9.06-9.06M17.66 3c-.26 0-.51.1-.7.29l-1.83 1.83 3.75 3.75 1.83-1.83c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29zm-3.6 3.19L3 17.25V21h3.75L17.81 9.94l-3.75-3.75z"></path></svg>',
  LINE: '<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3.293 20.707L20.707 3.293"></path></svg>',
  ARROW: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"></path></svg>',
  CIRCLE: '<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill="none"><circle cx="12" cy="12" r="9"></circle></svg>',
  RECTANGLE: '<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill="none"><rect x="4" y="4" width="16" height="16" rx="1"></rect></svg>',
  CURVE_ADVANCED: '<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill="none"  stroke-linecap="round" stroke-linejoin="round"><path d="M4 19C4 19 8 7 12 7C16 7 20 19 20 19"></path></svg>',
  STICKER_BRACKET: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M7 9H17V10H7V9ZM7 11H17V12H7V11ZM7 13H17V14H7V13ZM5 7C5 5.89543 5.89543 5 7 5H17C18.1046 5 19 5.89543 19 7V16C19 17.1046 18.1046 18 17 18H7C5.89543 18 5 17.1046 5 16V7Z"/></svg>',
  RULER: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 6H3c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1h1v10H3c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1h18c.55 0 1-.45 1-1v-2c0-.55-.45-1-1-1h-1V10h1c.55 0 1-.45 1-1V7c0-.55-.45-1-1-1zm-4 13h-2V8h2v11zm-4 0h-2V8h2v11zm-4 0H7V8h2v11zM7 5h10v2H7V5z"/></svg>',
  ANGLE_MEASURER: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21L21 3L21 21H3Z"></path><path d="M21 15c-3.132-2.016-5.118-4.314-7-7"></path></svg>',
  CALIBRATE: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9v-2h2v2zm0-4H9v-2h2v2zm0-4H9V7h2v2zm8.03-3.03c1.23 1.23 1.8 2.92 1.48 4.71L17 12.5V11h-1.5v2H14v1.5h2v1.5h-2.21c-.48 1.71-1.7 3.13-3.29 3.72L10 19.5V21h-.5c-1.48 0-2.79-.81-3.47-2H4.5v-1.5H6V16H4.5v-2H6v-1.5H4.5V10h1.53c.64-1.15 1.76-2 3.09-2H10V4.5h.5c1.79 0 3.37.77 4.53 2.03z"/></svg>',
  PAN: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L9.5 5H14.5L12 2ZM5 9.5L2 12L5 14.5V9.5ZM19 9.5V14.5L22 12L19 9.5ZM12 22L14.5 19H9.5L12 22ZM12 6C10.9 6 10 6.9 10 8V10H8C6.9 10 6 10.9 6 12C6 13.1 6.9 14 8 14H10V16C10 17.1 10.9 18 12 18C13.1 18 14 17.1 14 16V14H16C17.1 14 18 13.1 18 12C18 10.9 17.1 10 16 10H14V8C14 6.9 13.1 6 12 6Z"></path></svg>',
  UPLOAD: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"></path></svg>',
  GALLERY: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z"></path></svg>',
  TOOLS_ICON: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0-10c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8 8-3.59-8-8-8zm5 10c0 2.76-2.24 5-5 5s-5-2.24-5-5 2.24-5 5-5 5 2.24 5 5z M7 10h10v2H7v-2z" opacity=".3"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-8h10v2H7v-2z"/></svg>',
  ADJUSTMENTS: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 .99-1.16 2.21-2.56.32-3.44.32-3.44S16.13 7.65 17.5 6.5C16.07 4.9 14.12 4 12 4zm0-2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm-3.5-5c0 1.93 1.57 3.5 3.5 3.5s3.5-1.57 3.5-3.5-1.57-3.5-3.5-3.5-3.5 1.57-3.5 3.5z M19.41 7.41l-1.72-1.72c-.78-.78-2.05-.78-2.83 0l-1.41 1.41c.53.64.94 1.37 1.19 2.18l1.41-1.41c.78-.78.78-2.05 0-2.83zM4.59 16.59l1.72 1.72c.78.78 2.05.78 2.83 0l1.41-1.41c-.53-.64-.94-1.37-1.19-2.18l-1.41 1.41c-.79.79-.79 2.05 0 2.83z" opacity=".3"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm6.78-8.22L17.36 3.36c-.75-.75-1.97-.75-2.72 0l-1.14 1.14c1.38 1.08 2.28 2.73 2.46 4.56l1.08-1.08c.75-.75.75-1.97 0-2.72zm-11.56 0c.75-.75 1.97-.75 2.72 0l1.08 1.08c.18-1.83 1.08-3.48 2.46-4.56l-1.14-1.14c-.75-.75-1.97-.75-2.72 0L4.59 6.64c-.75.75-.75 1.97 0 2.72l1.08 1.08C5.55 9.63 4.65 7.98 4.22 6.64z"></path></svg>',
  LAYERS: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z"></path></svg>',
  IMAGE_INFO: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path></svg>',
  REPORT: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"></path></svg>',
  UNDO: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"></path></svg>',
  REDO: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22l2.37.78C5.45 12.31 8.46 10 11.5 10c1.96 0 3.73.72 5.12 1.88L13 15h9V6l-3.6 3.6z"></path></svg>',
  CLEAR: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>',
  DUPLICATE: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg>',
  SAVE: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"></path></svg>',
  EXPORT: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg>',
  ZOOM_IN: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5A6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zm.5-7H9v2H7v1h2v2h1v-2h2V9h-2z"></path></svg>',
  ZOOM_OUT: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5A6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zm-3-5h7v1H6.5z"></path></svg>',
  FIT_SCREEN: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm0-8h3V4H5v5h2V6zm10 12h-3v2h5v-5h-2v3zm0-12V4h-5v2h3v3h2z"></path></svg>',
  RESET_ZOOM: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V2L8 6l4 4V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8zm-1.55 10.51l.71-.71c.73.73 1.71 1.2 2.79 1.2.14 0 .28-.01.42-.04.09-.01.19-.04.28-.07.2-.06.39-.15.58-.27.18-.11.35-.25.5-.41.13-.14.24-.3.33-.46.08-.15.15-.3.19-.46.06-.21.09-.42.09-.64 0-.39-.09-.73-.26-1.01s-.4-.51-.68-.68c-.28-.18-.61-.3-.97-.36s-.74-.09-1.13-.09c-.62 0-1.18.11-1.66.32l-.7-.73c.64-.31 1.37-.47 2.18-.47.53 0 1.03.07 1.49.2.46.13.88.32 1.25.57.37.25.68.55.92.91.24.36.36.76.36 1.21 0 .33-.06.65-.17.96s-.26.59-.46.85c-.2.26-.44.48-.72.66s-.6.32-.95.41c-.35.09-.72.14-1.1.14-.99 0-1.93-.37-2.67-1.07z"></path></svg>',
  FULLSCREEN: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 10H5V5h5v2H7v3zm0 9h3v-2H5v5h5v-3zm12-9v3h-2V5h5v5h-3zm0 7h-2v3h5v-5h-3v2z"></path></svg>',
};


export const TOOLS: { id: Tool; label: string; icon: string }[] = [
  { id: Tool.PEN, label: "Caneta", icon: ICONS_SVG.PEN },
  { id: Tool.LINE, label: "Linha", icon: ICONS_SVG.LINE },
  { id: Tool.ARROW, label: "Seta", icon: ICONS_SVG.ARROW },
  { id: Tool.CIRCLE, label: "Círculo", icon: ICONS_SVG.CIRCLE },
  { id: Tool.RECTANGLE, label: "Retângulo", icon: ICONS_SVG.RECTANGLE },
  { id: Tool.CURVE_ADVANCED, label: "Curva", icon: ICONS_SVG.CURVE_ADVANCED },
  { id: Tool.STICKER_BRACKET, label: "Bracket", icon: ICONS_SVG.STICKER_BRACKET }, 
  { id: Tool.RULER, label: "Régua", icon: ICONS_SVG.RULER },
  { id: Tool.ANGLE_MEASURER, label: "Ângulo", icon: ICONS_SVG.ANGLE_MEASURER },
  { id: Tool.PAN, label: "Mover Imagem", icon: ICONS_SVG.PAN },
];

export const COLORS: { value: string; name: string, style?: React.CSSProperties }[] = [
  { value: "oklch(0.80 0.10 85)", name: "Dourado" }, 
  { value: "oklch(0.70 0.22 25)", name: "Vermelho Forte" },
  { value: "oklch(0.70 0.20 130)", name: "Verde Brilhante" },
  { value: "oklch(0.70 0.18 260)", name: "Azul Brilhante" },
  { value: "oklch(0.92 0.01 240)", name: "Cinza Claro (Branco)" , style: { border: '1px solid oklch(0.4 0.01 250)'} }, 
  { value: "oklch(0.75 0.15 300)", name: "Magenta" },
  { value: "oklch(0.80 0.15 200)", name: "Ciano" },
  { value: "oklch(0.4 0.01 250)", name: "Cinza Escuro" },
];

export const LOCAL_STORAGE_CASE_KEY = "orthoConsultCaseData_v4"; // Incremented version
export const LOCAL_STORAGE_IMAGES_KEY = "orthoConsultImagesData_v4"; // Incremented version

export const ZOOM_STEP = 0.1;
export const MIN_ZOOM = 0.05; 
export const MAX_ZOOM = 10;  

export const DEFAULT_STICKER_WIDTH = 24; // Adjusted to match typical icon size
export const DEFAULT_STICKER_HEIGHT = 24; // Adjusted to match typical icon size

export const initialToolSettings: ToolSettings = {
  color: DEFAULT_COLOR,
  strokeWidth: DEFAULT_STROKE_WIDTH,
  opacity: DEFAULT_OPACITY,
};

export const initialCanvasState: CanvasState = {
  zoom: 1,
  pan: { x: 0, y: 0 },
  isPanning: false,
  lastPanPosition: null,
  imageFilters: {
    brightness: 100,
    contrast: 100,
  }
};
