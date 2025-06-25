

export interface CaseInfo {
  patientName: string;
  dentistName: string;
  entryDate: string;
  caseStatus: CaseStatus;
}

export enum CaseStatus {
  PENDING = "pending",
  IN_PROGRESS = "in-progress",
  COMPLETED = "completed",
  DELIVERED = "delivered",
}

export interface ImageFile {
  id: string;
  file: File;
  dataURL: string;
  analysis: ImageAnalysisData;
  annotations: Annotation[]; 
  originalDimensions: { width: number; height: number };
  htmlImageElement?: HTMLImageElement; // Optional: to cache the loaded image element
  calibrationFactor?: number; // pixels per mm for this specific image
}

export interface ImageAnalysisData {
  title: string;
  analysisType: AnalysisType | "";
  clinicalObservations: string;
  diagnosis: string;
  treatmentPlan: string;
  prognosis: Prognosis | "";
  recommendations: string;
}

export enum AnalysisType {
  PANORAMIC = "panoramic",
  LATERAL = "lateral",
  INTRAORAL = "intraoral",
  MODEL = "model",
  CBCT = "cbct",
  OTHER = "other",
}

export enum Prognosis {
  EXCELLENT = "excellent",
  GOOD = "good",
  FAIR = "fair",
  POOR = "poor",
}

export enum Tool {
  PEN = "pen",
  LINE = "line",
  ARROW = "arrow",
  CIRCLE = "circle",
  RECTANGLE = "rectangle",
  CURVE_ADVANCED = "curve_advanced", 
  STICKER_BRACKET = "sticker_bracket",
  RULER = "ruler",
  ANGLE_MEASURER = "angle_measurer",
  PAN = "pan", 
}

export interface ToolSettings {
  color: string;
  strokeWidth: number;
  opacity: number; // 0-1
}

export interface Point {
  x: number;
  y: number;
}

export interface Annotation {
  id: string;
  tool: Tool;
  color: string;
  strokeWidth: number;
  opacity: number;
  points: Point[]; 
  width?: number; 
  height?: number;
  text?: string; // For ruler distance or angle value
  stickerImage?: string; // SVG string from ICONS_SVG
  stickerElement?: HTMLImageElement; // Cached HTMLImageElement for the sticker
  // Specific to Ruler
  distance?: number; // in mm
  // Specific to Angle
  angle?: number; // in degrees
}

export interface CanvasState {
  zoom: number;
  pan: Point;
  isPanning: boolean;
  lastPanPosition: Point | null;
  imageFilters: {
    brightness: number; // 0-200, 100 is normal
    contrast: number; // 0-200, 100 is normal
  };
}

export interface HistoryEntry {
  annotations: Annotation[];
}

export const initialCaseInfo: CaseInfo = {
  patientName: "",
  dentistName: "",
  entryDate: new Date().toISOString().split("T")[0],
  caseStatus: CaseStatus.PENDING,
};

export const initialImageAnalysisData: ImageAnalysisData = {
  title: "",
  analysisType: "",
  clinicalObservations: "",
  diagnosis: "",
  treatmentPlan: "",
  prognosis: "",
  recommendations: "",
};