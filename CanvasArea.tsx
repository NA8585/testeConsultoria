

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ImageFile, Tool, ToolSettings, CanvasState, Point, Annotation } from '../types';
import { MAX_ZOOM, MIN_ZOOM, ZOOM_STEP, DEFAULT_STICKER_WIDTH, DEFAULT_STICKER_HEIGHT, ICONS_SVG, TOOLS, DEFAULT_CALIBRATION_PIXELS_PER_MM, DEFAULT_COLOR } from '../constants';
import Button from './common/Button';
import { IconComponent } from './IconComponent'; // Import IconComponent

interface CanvasAreaProps {
  selectedImage: ImageFile | null;
  selectedTool: Tool;
  toolSettings: ToolSettings;
  canvasState: CanvasState;
  annotations: Annotation[];
  onCanvasStateChange: (newState: Partial<CanvasState>) => void; // Used for pan & zoom from buttons/wheel
  onNewAnnotation: (annotation: Annotation) => void;
  // onPanChange and onZoomChange are simplified by onCanvasStateChange
  onToolStatusChange: (status: string) => void;
  onImageCalibrationFactorChange: (imageId: string, factor: number) => void;
}


const CanvasArea: React.FC<CanvasAreaProps> = ({
  selectedImage,
  selectedTool,
  toolSettings,
  canvasState,
  annotations,
  onCanvasStateChange,
  onNewAnnotation,
  onToolStatusChange,
  onImageCalibrationFactorChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]); // For PEN, or [start, currentMouse] for others
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 }); // Init with 0
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState('oklch(0.12 0.03 250)');

  type CurveDrawingStage = 'idle' | 'awaiting_end_point' | 'awaiting_control_point';
  const [curveDrawingStage, setCurveDrawingStage] = useState<CurveDrawingStage>('idle');
  const [tempCurvePoints, setTempCurvePoints] = useState<Point[]>([]); // [start, end] for curve before control point
  
  type RulerDrawingStage = 'idle' | 'awaiting_end_point';
  const [rulerDrawingStage, setRulerDrawingStage] = useState<RulerDrawingStage>('idle');
  const [rulerPoints, setRulerPoints] = useState<Point[]>([]); // [start] for ruler

  type AngleDrawingStage = 'idle' | 'awaiting_arm1_end' | 'awaiting_arm2_end';
  const [angleDrawingStage, setAngleDrawingStage] = useState<AngleDrawingStage>('idle');
  const [anglePoints, setAnglePoints] = useState<Point[]>([]); // [vertex], then [vertex, arm1End]

  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationPoints, setCalibrationPoints] = useState<Point[]>([]); // [start] for calibration line
  const currentCalibrationFactor = selectedImage?.calibrationFactor || DEFAULT_CALIBRATION_PIXELS_PER_MM;

  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (canvasRef.current?.parentElement) {
      const computedStyle = window.getComputedStyle(canvasRef.current.parentElement);
      const bgColor = computedStyle.getPropertyValue('--background').trim() || 'oklch(0.12 0.03 250)';
      setCanvasBackgroundColor(bgColor);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const observer = new ResizeObserver(entries => {
        if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = requestAnimationFrame(() => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                const newWidth = Math.max(0, Math.round(width)); // Ensure non-negative
                const newHeight = Math.max(0, Math.round(height)); // Ensure non-negative
                if (canvas.width !== newWidth || canvas.height !== newHeight) {
                    canvas.width = newWidth;
                    canvas.height = newHeight;
                    setCanvasDimensions({ width: newWidth, height: newHeight });
                }
            }
        });
    });
    observer.observe(parent);
    const initialWidth = Math.max(0, Math.round(parent.clientWidth));
    const initialHeight = Math.max(0, Math.round(parent.clientHeight));
    if (canvas.width !== initialWidth) canvas.width = initialWidth;
    if (canvas.height !== initialHeight) canvas.height = initialHeight;
    setCanvasDimensions(prev => (prev.width !== initialWidth || prev.height !== initialHeight) ? { width: initialWidth, height: initialHeight } : prev);
    
    return () => {
        if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
        observer.disconnect();
    };
  }, []); 

  // Effect to reset zoom/pan when selectedImage changes or canvas resizes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasDimensions.width === 0 || canvasDimensions.height === 0) {
        if (selectedImage === null) { // Only reset if no image is selected and canvas is zeroed
            onCanvasStateChange({ zoom: 1, pan: { x: 0, y: 0 }});
        }
        return;
    }

    if (selectedImage && selectedImage.originalDimensions && selectedImage.originalDimensions.width > 0) {
        const imgWidth = selectedImage.originalDimensions.width;
        const imgHeight = selectedImage.originalDimensions.height;
        const cvsWidth = canvasDimensions.width;
        const cvsHeight = canvasDimensions.height;
        const imageAspectRatio = imgWidth / imgHeight;
        const canvasAspectRatio = cvsWidth / cvsHeight;
        
        let newInitialZoom = (imageAspectRatio > canvasAspectRatio) ? (cvsWidth / imgWidth) : (cvsHeight / imgHeight);
        newInitialZoom = Math.min(newInitialZoom * 0.95, MAX_ZOOM, 1); 
        newInitialZoom = Math.max(MIN_ZOOM, newInitialZoom);
        
        const newPanX = (cvsWidth - imgWidth * newInitialZoom) / 2;
        const newPanY = (cvsHeight - imgHeight * newInitialZoom) / 2;

        // Only update if significantly different to avoid feedback loops with manual zoom/pan
        if (Math.abs(canvasState.zoom - newInitialZoom) > 0.01 || Math.abs(canvasState.pan.x - newPanX) > 1 || Math.abs(canvasState.pan.y - newPanY) > 1) {
            onCanvasStateChange({ zoom: newInitialZoom, pan: {x: newPanX, y: newPanY }});
        }
    } else if (!selectedImage) { 
        onCanvasStateChange({ zoom: 1, pan: { x: 0, y: 0 }});
    }
  }, [selectedImage, canvasDimensions, onCanvasStateChange]); // Removed canvasState from deps to avoid loop


  const getCanvasCoordinates = useCallback((event: React.MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    const worldX = (screenX - canvasState.pan.x) / canvasState.zoom;
    const worldY = (screenY - canvasState.pan.y) / canvasState.zoom;
    return { x: worldX, y: worldY };
  }, [canvasState.pan, canvasState.zoom]);

  const drawArrowhead = useCallback((ctx: CanvasRenderingContext2D, from: Point, to: Point, strokeWidth: number) => {
    const headLength = Math.max(10, strokeWidth * 3) / canvasState.zoom; 
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headLength * Math.cos(angle - Math.PI / 6), to.y - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headLength * Math.cos(angle + Math.PI / 6), to.y - headLength * Math.sin(angle + Math.PI / 6));
  }, [canvasState.zoom]);
  
  const drawAnnotation = useCallback((ctx: CanvasRenderingContext2D, annotation: Annotation, isPreview = false) => {
    ctx.save();
    // Sticker tool generally uses its own appearance, ignore general toolSettings for it.
    if (annotation.tool !== Tool.STICKER_BRACKET) {
        ctx.strokeStyle = annotation.color;
        ctx.lineWidth = annotation.strokeWidth / canvasState.zoom;
        ctx.globalAlpha = annotation.opacity;
    } else { // For stickers, ensure full opacity unless annotation itself specifies otherwise (not typical)
        ctx.globalAlpha = annotation.opacity ?? 1;
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const { points } = annotation;
    
    switch (annotation.tool) {
      case Tool.PEN:
        if (points.length > 0) { 
          ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
          ctx.stroke();
        }
        break;
      case Tool.LINE: case Tool.ARROW:
        if (points.length >= 2) {
            ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y); ctx.lineTo(points[1].x, points[1].y);
            if (annotation.tool === Tool.ARROW) drawArrowhead(ctx, points[0], points[1], annotation.strokeWidth);
            ctx.stroke();
        }
        break;
      case Tool.RECTANGLE:
        if (points.length >= 2) {
            ctx.beginPath(); ctx.rect(points[0].x, points[0].y, points[1].x - points[0].x, points[1].y - points[0].y);
            ctx.stroke();
        }
        break;
      case Tool.CIRCLE:
        if (points.length >= 2) {
            const radius = Math.sqrt(Math.pow(points[1].x - points[0].x, 2) + Math.pow(points[1].y - points[0].y, 2));
            ctx.beginPath(); ctx.arc(points[0].x, points[0].y, radius, 0, 2 * Math.PI); ctx.stroke();
        }
        break;
      case Tool.CURVE_ADVANCED:
        if (points.length === 3) { // start, control, end
            ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
            ctx.quadraticCurveTo(points[1].x, points[1].y, points[2].x, points[2].y); ctx.stroke();
        } else if (isPreview && points.length === 2 && curveDrawingStage === 'awaiting_end_point') { // Previewing line from start to current mouse (potential end)
            ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y); ctx.lineTo(points[1].x, points[1].y); ctx.stroke();
        } else if (isPreview && points.length === 2 && curveDrawingStage === 'awaiting_control_point' && tempCurvePoints.length === 2) { // Previewing curve with temp start/end and current mouse as control
            ctx.beginPath(); ctx.moveTo(tempCurvePoints[0].x, tempCurvePoints[0].y);
            ctx.quadraticCurveTo(points[1].x, points[1].y, tempCurvePoints[1].x, tempCurvePoints[1].y); // points[1] is mouse (control)
            ctx.stroke();
        }
        break;
      case Tool.STICKER_BRACKET:
        if (points.length > 0 && annotation.stickerElement?.complete && annotation.stickerElement.naturalWidth > 0) {
          try {
            const stickerWidth = (annotation.width || DEFAULT_STICKER_WIDTH) / canvasState.zoom;
            const stickerHeight = (annotation.height || DEFAULT_STICKER_HEIGHT) / canvasState.zoom;
            ctx.drawImage(annotation.stickerElement, points[0].x - stickerWidth / 2, points[0].y - stickerHeight / 2, stickerWidth, stickerHeight);
          } catch (error) {
            // console.error(`Error drawing sticker element (already loaded): ${annotation.id}`, error);
            // Fallback: draw a placeholder if drawing fails for some reason
            ctx.fillStyle = 'rgba(255,0,0,0.3)'; const errorSize = 20 / canvasState.zoom;
            ctx.fillRect(points[0].x - errorSize / 2, points[0].y - errorSize / 2, errorSize, errorSize);
          }
        } else if (points.length > 0 && annotation.stickerImage && !isPreview && !annotation.stickerElement) {
           // console.warn("Sticker image not loaded for drawing:", annotation.id);
            ctx.fillStyle = 'rgba(200,200,0,0.3)'; const placeholderSize = 20 / canvasState.zoom;
            ctx.fillRect(points[0].x - placeholderSize / 2, points[0].y - placeholderSize / 2, placeholderSize, placeholderSize);
        }
        break;
      case Tool.RULER:
        if (points.length >= 2) {
            ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y); ctx.lineTo(points[1].x, points[1].y); ctx.stroke();
            if (annotation.text) {
                ctx.fillStyle = annotation.color;
                ctx.font = `${12 / canvasState.zoom}px var(--font-sans)`;
                ctx.textAlign = 'center';
                const midX = (points[0].x + points[1].x) / 2;
                const midY = (points[0].y + points[1].y) / 2 - (8 / canvasState.zoom); // Adjusted offset
                ctx.fillText(annotation.text, midX, midY);
            }
        }
        break;
    case Tool.ANGLE_MEASURER:
        if (points.length === 3) { // Vertex, arm1End, arm2End
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y); ctx.lineTo(points[1].x, points[1].y); // Vertex to Arm1End
            ctx.moveTo(points[0].x, points[0].y); ctx.lineTo(points[2].x, points[2].y); // Vertex to Arm2End
            ctx.stroke();

            if (annotation.text) { // Display angle value
                ctx.fillStyle = annotation.color;
                ctx.font = `${12 / canvasState.zoom}px var(--font-sans)`;
                ctx.textAlign = 'center'; // Default center
                
                const v = points[0]; const p1 = points[1]; const p2 = points[2];
                // Calculate bisector
                const d1x = p1.x - v.x; const d1y = p1.y - v.y;
                const d2x = p2.x - v.x; const d2y = p2.y - v.y;
                const len1 = Math.sqrt(d1x*d1x + d1y*d1y);
                const len2 = Math.sqrt(d2x*d2x + d2y*d2y);

                const bisectorX = (len2 * d1x + len1 * d2x) / (len1 + len2);
                const bisectorY = (len2 * d1y + len1 * d2y) / (len1 + len2);
                const bisectorLen = Math.sqrt(bisectorX*bisectorX + bisectorY*bisectorY);
                
                const textOffset = 20 / canvasState.zoom;
                let textX = v.x; let textY = v.y;

                if (bisectorLen > 0.1) { // Avoid division by zero if points are coincident
                    textX = v.x + (bisectorX / bisectorLen) * textOffset;
                    textY = v.y + (bisectorY / bisectorLen) * textOffset;
                } else { // Fallback if bisector is very short (e.g. 0 or 180 deg angle with short arms)
                    textX = v.x + textOffset * 0.707; // Arbitrary offset
                    textY = v.y - textOffset * 0.707;
                }
                ctx.fillText(annotation.text, textX, textY);
            }
        } else if (isPreview && points.length === 2 && angleDrawingStage === 'awaiting_arm1_end') { 
            ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y); ctx.lineTo(points[1].x, points[1].y); ctx.stroke();
        } else if (isPreview && points.length === 2 && angleDrawingStage === 'awaiting_arm2_end' && anglePoints.length === 2) {
            ctx.beginPath(); ctx.moveTo(anglePoints[0].x, anglePoints[0].y); ctx.lineTo(anglePoints[1].x, anglePoints[1].y); ctx.stroke(); // Fixed first arm
            ctx.beginPath(); ctx.moveTo(anglePoints[0].x, anglePoints[0].y); ctx.lineTo(points[1].x, points[1].y); ctx.stroke(); // Dynamic second arm (points[0] is vertex, points[1] is mouse for second arm)
        }
        break;
      default: break;
    }
    ctx.restore();
  }, [canvasState.zoom, drawArrowhead, curveDrawingStage, tempCurvePoints, angleDrawingStage, anglePoints]);
  
  const drawCanvasContent = useCallback(() => {
    const canvas = canvasRef.current; const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas || !canvasDimensions.width || !canvasDimensions.height) return;
    
    ctx.fillStyle = canvasBackgroundColor; ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (selectedImage?.htmlImageElement?.complete && selectedImage.htmlImageElement.naturalWidth > 0) {
        ctx.save();
        ctx.translate(canvasState.pan.x, canvasState.pan.y); ctx.scale(canvasState.zoom, canvasState.zoom);
        const { brightness, contrast } = canvasState.imageFilters;
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
        ctx.drawImage(selectedImage.htmlImageElement, 0, 0, selectedImage.originalDimensions.width, selectedImage.originalDimensions.height);
        ctx.filter = 'none';

        for (const annotation of annotations) drawAnnotation(ctx, annotation, false);
        
        if (isDrawing && currentPoints.length > 0 && selectedTool !== Tool.PAN && selectedTool !== Tool.STICKER_BRACKET) {
            let previewPoints: Point[] = [];
            let previewTool = selectedTool;
            let previewText: string | undefined = undefined;
            const previewColor = toolSettings.color || DEFAULT_COLOR;
            const currentStrokeWidth = toolSettings.strokeWidth;
            const currentOpacity = toolSettings.opacity;

            if (isCalibrating && calibrationPoints.length === 1 && currentPoints.length === 1){
                previewPoints = [calibrationPoints[0], currentPoints[0]]; // currentPoints[0] is mouse
                previewTool = Tool.LINE;
            } else if (selectedTool === Tool.PEN) {
                previewPoints = [...currentPoints];
            } else if (selectedTool === Tool.CURVE_ADVANCED && tempCurvePoints.length > 0 && currentPoints.length === 1){
                if(curveDrawingStage === 'awaiting_end_point') { // tempCurvePoints has start, currentPoints[0] is mouse (potential end)
                    previewPoints = [tempCurvePoints[0], currentPoints[0]];
                } else if (curveDrawingStage === 'awaiting_control_point' && tempCurvePoints.length === 2) { // tempCurvePoints has start & end, currentPoints[0] is mouse (control)
                     previewPoints = [tempCurvePoints[0], currentPoints[0], tempCurvePoints[1]]; // Passed as [start, control, end] to drawAnnotation
                }
            } else if (selectedTool === Tool.RULER && rulerDrawingStage === 'awaiting_end_point' && rulerPoints.length === 1 && currentPoints.length === 1) {
                previewPoints = [rulerPoints[0], currentPoints[0]]; // currentPoints[0] is mouse
                const pixelDist = Math.sqrt(Math.pow(previewPoints[1].x - previewPoints[0].x, 2) + Math.pow(previewPoints[1].y - previewPoints[0].y, 2));
                const mmDist = pixelDist / currentCalibrationFactor;
                previewText = `${mmDist.toFixed(1)} mm`;
            } else if (selectedTool === Tool.ANGLE_MEASURER && anglePoints.length > 0 && currentPoints.length === 1) {
                if (angleDrawingStage === 'awaiting_arm1_end') { // anglePoints has vertex, currentPoints[0] is mouse
                    previewPoints = [anglePoints[0], currentPoints[0]]; 
                } else if (angleDrawingStage === 'awaiting_arm2_end' && anglePoints.length === 2) { // anglePoints has vertex & arm1End, currentPoints[0] is mouse
                    previewPoints = [anglePoints[0], currentPoints[0]]; // Pass vertex and current mouse for dynamic second arm to drawAnnotation
                }
            } else if (startPoint && currentPoints.length > 0) { // For LINE, RECT, CIRCLE
                previewPoints = [startPoint, currentPoints[currentPoints.length - 1]]; // currentPoints[0] is usually mouse for these
            }

            if (previewPoints.length > 0) {
                 const previewAnnotation: Annotation = {
                    id: 'preview', tool: previewTool, color: previewColor, strokeWidth: currentStrokeWidth, opacity: currentOpacity,
                    points: previewPoints, text: previewText
                };
                if((selectedTool === Tool.RECTANGLE || selectedTool === Tool.CIRCLE) && previewPoints.length >=2) {
                    previewAnnotation.width = Math.abs(previewPoints[1].x - previewPoints[0].x);
                    previewAnnotation.height = Math.abs(previewPoints[1].y - previewPoints[0].y);
                }
                drawAnnotation(ctx, previewAnnotation, true);
            }
        }
        ctx.restore();
    } else if (selectedImage && !selectedImage.htmlImageElement?.complete) {
        ctx.fillStyle = 'rgba(100,100,100,0.5)'; ctx.fillRect(0,0, canvas.width, canvas.height);
        ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.font = '16px var(--font-sans)';
        ctx.fillText("Carregando imagem...", canvas.width/2, canvas.height/2);
    }
  }, [
    selectedImage, canvasState, annotations, isDrawing, currentPoints, startPoint, selectedTool, toolSettings, drawAnnotation, 
    curveDrawingStage, tempCurvePoints, rulerDrawingStage, rulerPoints, angleDrawingStage, anglePoints,
    isCalibrating, calibrationPoints, currentCalibrationFactor,
    canvasDimensions, canvasBackgroundColor
  ]);

  useEffect(() => {
    if (canvasDimensions.width > 0 && canvasDimensions.height > 0) {
        const rafId = requestAnimationFrame(() => { drawCanvasContent(); });
        return () => cancelAnimationFrame(rafId);
    }
  }, [drawCanvasContent, canvasDimensions]); // drawCanvasContent already has all relevant dependencies


  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedImage) return;
    const pos = getCanvasCoordinates(e);
    
    if (selectedTool === Tool.PAN || e.button === 1) { 
      onCanvasStateChange({ isPanning: true, lastPanPosition: {x: e.clientX, y: e.clientY} });
      onToolStatusChange("Movendo imagem...");
      return;
    }

    if (isCalibrating) {
        if (calibrationPoints.length === 0) { // First click for calibration
            setCalibrationPoints([pos]); setIsDrawing(true); 
            setCurrentPoints([pos]); setStartPoint(pos); // For preview line
            onToolStatusChange("Calibrando: Clique no ponto final da medida conhecida.");
        } else {  // Second click for calibration
            const p1 = calibrationPoints[0]; const p2 = pos;
            const pixelDistance = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
            const knownLengthMm = prompt(`Qual o comprimento real desta linha em milímetros (mm)?\nDistância em pixels: ${pixelDistance.toFixed(2)}px`, `${(pixelDistance / currentCalibrationFactor).toFixed(1)}`);
            if (knownLengthMm !== null && !isNaN(parseFloat(knownLengthMm)) && parseFloat(knownLengthMm) > 0) {
                const newFactor = pixelDistance / parseFloat(knownLengthMm);
                onImageCalibrationFactorChange(selectedImage.id, newFactor);
                onToolStatusChange(`Calibração atualizada: ${newFactor.toFixed(2)} px/mm.`);
            } else { onToolStatusChange("Calibração cancelada ou valor inválido."); }
            setIsCalibrating(false); setCalibrationPoints([]); setIsDrawing(false); setCurrentPoints([]); setStartPoint(null);
        } return;
    }

    if (selectedTool === Tool.CURVE_ADVANCED) { 
        if (curveDrawingStage === 'idle') { // First click (start point)
            setTempCurvePoints([pos]); setCurveDrawingStage('awaiting_end_point');
            setIsDrawing(true); setCurrentPoints([pos]); setStartPoint(pos);
            onToolStatusChange("Curva: Clique para o ponto final.");
        } else if (curveDrawingStage === 'awaiting_end_point') { // Second click (end point)
            setTempCurvePoints(prev => [...prev, pos]); // Now tempCurvePoints = [start, end]
            setCurrentPoints([pos]); // currentPoints[0] will be mouse for control point preview
            setCurveDrawingStage('awaiting_control_point');
            onToolStatusChange("Curva: Clique para o ponto de controle.");
        } else if (curveDrawingStage === 'awaiting_control_point') { // Third click (control point)
            const [startPt, endPt] = tempCurvePoints; const controlPt = pos;
            onNewAnnotation({ id: `${Tool.CURVE_ADVANCED}-${Date.now()}`, tool: Tool.CURVE_ADVANCED, ...toolSettings, points: [startPt, controlPt, endPt]});
            setCurveDrawingStage('idle'); setTempCurvePoints([]); setCurrentPoints([]); setIsDrawing(false); setStartPoint(null);
            onToolStatusChange("Curva adicionada.");
        } return; 
    }
    
    if (selectedTool === Tool.RULER) {
        if (rulerDrawingStage === 'idle') { // First click
            setRulerPoints([pos]); setStartPoint(pos); setCurrentPoints([pos]); setIsDrawing(true);
            setRulerDrawingStage('awaiting_end_point'); onToolStatusChange("Régua: Clique para o ponto final.");
        } else { // Second click (awaiting_end_point)
            const startPt = rulerPoints[0]; const endPt = pos;
            const pixelDist = Math.sqrt(Math.pow(endPt.x - startPt.x, 2) + Math.pow(endPt.y - startPt.y, 2));
            const mmDist = pixelDist / currentCalibrationFactor;
            onNewAnnotation({ id: `${Tool.RULER}-${Date.now()}`, tool: Tool.RULER, ...toolSettings, points: [startPt, endPt], distance: mmDist, text: `${mmDist.toFixed(1)} mm` });
            setRulerDrawingStage('idle'); setRulerPoints([]); setIsDrawing(false); setStartPoint(null); setCurrentPoints([]);
            onToolStatusChange(`Régua: ${mmDist.toFixed(1)} mm.`);
        } return;
    }

    if (selectedTool === Tool.ANGLE_MEASURER) {
        if (angleDrawingStage === 'idle') { // Click for vertex
            setAnglePoints([pos]); setStartPoint(pos); setCurrentPoints([pos]); setIsDrawing(true); 
            setAngleDrawingStage('awaiting_arm1_end'); onToolStatusChange("Ângulo: Clique no final do primeiro lado.");
        } else if (angleDrawingStage === 'awaiting_arm1_end') { // Click for end of first arm
            setAnglePoints(prev => [...prev, pos]); // anglePoints = [vertex, arm1End]
            setCurrentPoints([pos]); // For preview of second arm, currentPoints[0] is mouse
            setAngleDrawingStage('awaiting_arm2_end'); onToolStatusChange("Ângulo: Clique no final do segundo lado.");
        } else { // awaiting_arm2_end, click for end of second arm
            const [vertex, arm1End] = anglePoints; const arm2End = pos;
            const angleRad1 = Math.atan2(arm1End.y - vertex.y, arm1End.x - vertex.x);
            const angleRad2 = Math.atan2(arm2End.y - vertex.y, arm2End.x - vertex.x);
            let angleDegrees = (angleRad2 - angleRad1) * (180 / Math.PI);
            angleDegrees = angleDegrees % 360; // Normalize
            if (angleDegrees < 0) angleDegrees += 360;
            if (angleDegrees > 180) angleDegrees = 360 - angleDegrees; 

            onNewAnnotation({ id: `${Tool.ANGLE_MEASURER}-${Date.now()}`, tool: Tool.ANGLE_MEASURER, ...toolSettings, points: [vertex, arm1End, arm2End], angle: angleDegrees, text: `${angleDegrees.toFixed(1)}°`});
            setAngleDrawingStage('idle'); setAnglePoints([]); setIsDrawing(false); setStartPoint(null); setCurrentPoints([]);
            onToolStatusChange(`Ângulo: ${angleDegrees.toFixed(1)}°.`);
        } return;
    }

    if (selectedTool === Tool.STICKER_BRACKET) {
        onNewAnnotation({
            id: `${Tool.STICKER_BRACKET}-${Date.now()}`, tool: Tool.STICKER_BRACKET, 
            color: toolSettings.color, // Stickers don't use general color/stroke, but pass for consistency if needed
            strokeWidth: 0, opacity: 1, // Stickers are opaque, no stroke
            points: [pos], stickerImage: ICONS_SVG.STICKER_BRACKET, 
            width: DEFAULT_STICKER_WIDTH, height: DEFAULT_STICKER_HEIGHT, 
        });
        onToolStatusChange("Bracket adicionado."); return; 
    }

    // For PEN, LINE, RECT, CIRCLE
    setIsDrawing(true); setStartPoint(pos); setCurrentPoints([pos]);
    const toolLabel = TOOLS.find(t => t.id === selectedTool)?.label || selectedTool;
    onToolStatusChange(`Desenhando com ${toolLabel}...`);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (canvasState.isPanning && canvasState.lastPanPosition) {
        const dx = e.clientX - canvasState.lastPanPosition.x;
        const dy = e.clientY - canvasState.lastPanPosition.y;
        onCanvasStateChange({ pan: { x: canvasState.pan.x + dx, y: canvasState.pan.y + dy }, lastPanPosition: {x: e.clientX, y: e.clientY} }); 
        return;
    }

    if (!isDrawing || !selectedImage ) return;
    
    const pos = getCanvasCoordinates(e);

    if (isCalibrating && calibrationPoints.length === 1) { setCurrentPoints([pos]); return; }
    if (selectedTool === Tool.CURVE_ADVANCED && (curveDrawingStage === 'awaiting_end_point' || curveDrawingStage === 'awaiting_control_point')) { setCurrentPoints([pos]); return; }
    if (selectedTool === Tool.RULER && rulerDrawingStage === 'awaiting_end_point' && rulerPoints.length === 1) { setCurrentPoints([pos]); return; }
    if (selectedTool === Tool.ANGLE_MEASURER && (angleDrawingStage === 'awaiting_arm1_end' || angleDrawingStage === 'awaiting_arm2_end')) { setCurrentPoints([pos]); return; }
    
    if (selectedTool === Tool.PEN) {
        setCurrentPoints(prev => [...prev, pos]);
    } else if (startPoint) { 
        setCurrentPoints([startPoint, pos]); 
    }
  };

  const handleMouseUp = () => {
    if (canvasState.isPanning) {
        onCanvasStateChange({ isPanning: false, lastPanPosition: null });
        onToolStatusChange("Movimentação finalizada.");
        return;
    }
    
    if (isCalibrating && calibrationPoints.length === 1) return; // Don't finalize on mouseUp, second click in mousedown finalizes
    if (selectedTool === Tool.CURVE_ADVANCED && (curveDrawingStage === 'awaiting_end_point' || curveDrawingStage === 'awaiting_control_point')) return;
    if (selectedTool === Tool.RULER && rulerDrawingStage === 'awaiting_end_point') return;
    if (selectedTool === Tool.ANGLE_MEASURER && (angleDrawingStage === 'awaiting_arm1_end' || angleDrawingStage === 'awaiting_arm2_end')) return;
    
    if (selectedTool === Tool.STICKER_BRACKET) { setIsDrawing(false); return; } // Sticker placed on mousedown

    if (!isDrawing || !selectedImage || !startPoint || currentPoints.length === 0) {
      setIsDrawing(false); setStartPoint(null); setCurrentPoints([]); return;
    }

    const endPoint = (selectedTool === Tool.PEN) ? currentPoints[currentPoints.length-1] : currentPoints[1] || startPoint;
    let pointsForAnnotation: Point[] = (selectedTool === Tool.PEN) ? [...currentPoints] : [startPoint, endPoint];
    
    const isMeaningfulDrawing = selectedTool === Tool.PEN ? pointsForAnnotation.length > 1 :
        (Math.abs(startPoint.x - endPoint.x) > 2 || Math.abs(startPoint.y - endPoint.y) > 2);

    if (isMeaningfulDrawing) {
        const newAnnotation: Annotation = {
          id: `${selectedTool}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          tool: selectedTool, ...toolSettings, points: pointsForAnnotation,
        };
        if((selectedTool === Tool.RECTANGLE || selectedTool === Tool.CIRCLE) && pointsForAnnotation.length >= 2) {
            newAnnotation.width = Math.abs(pointsForAnnotation[1].x - pointsForAnnotation[0].x);
            newAnnotation.height = Math.abs(pointsForAnnotation[1].y - pointsForAnnotation[0].y);
        }
        onNewAnnotation(newAnnotation); onToolStatusChange("Anotação adicionada.");
    } else { onToolStatusChange("Desenho muito pequeno, não adicionado."); }

    setIsDrawing(false); setStartPoint(null); setCurrentPoints([]);
  };

  const handleMouseLeave = () => {
    if (canvasState.isPanning) { 
        onCanvasStateChange({ isPanning: false, lastPanPosition: null });
        onToolStatusChange("Movimentação interrompida (mouse saiu).");
    }
    if (isDrawing && 
        selectedTool !== Tool.CURVE_ADVANCED && 
        selectedTool !== Tool.STICKER_BRACKET && 
        selectedTool !== Tool.PAN &&
        selectedTool !== Tool.RULER && 
        selectedTool !== Tool.ANGLE_MEASURER && 
        !isCalibrating 
        ) { 
        handleMouseUp(); 
        onToolStatusChange("Desenho finalizado (mouse saiu).");
    } 
  };
  
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => { 
    e.preventDefault(); if (!selectedImage || !canvasRef.current) return;
    const scaleAmount = e.deltaY > 0 ? 1 - ZOOM_STEP : 1 + ZOOM_STEP;
    const newZoomUnclamped = canvasState.zoom * scaleAmount;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoomUnclamped));
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left; const mouseY = e.clientY - rect.top;
    const worldXBeforeZoom = (mouseX - canvasState.pan.x) / canvasState.zoom;
    const worldYBeforeZoom = (mouseY - canvasState.pan.y) / canvasState.zoom;
    const newPanX = mouseX - worldXBeforeZoom * newZoom;
    const newPanY = mouseY - worldYBeforeZoom * newZoom;
    onCanvasStateChange({ zoom: newZoom, pan: { x: newPanX, y: newPanY }});
    onToolStatusChange(`Zoom: ${Math.round(newZoom * 100)}%`);
  };

  const resetZoomPan = useCallback(() => { 
    const canvas = canvasRef.current;
    if (!canvas || !selectedImage?.originalDimensions || selectedImage.originalDimensions.width === 0 || canvasDimensions.width === 0 || canvasDimensions.height === 0) return;
    const imgWidth = selectedImage.originalDimensions.width; const imgHeight = selectedImage.originalDimensions.height;
    const cvsWidth = canvasDimensions.width; const cvsHeight = canvasDimensions.height; 
    const imageAspectRatio = imgWidth / imgHeight; const canvasAspectRatio = cvsWidth / cvsHeight;
    let initialZoom = (imageAspectRatio > canvasAspectRatio) ? (cvsWidth / imgWidth) : (cvsHeight / imgHeight);
    initialZoom = Math.min(initialZoom * 0.95, MAX_ZOOM, 1); initialZoom = Math.max(MIN_ZOOM, initialZoom); 
    const panX = (cvsWidth - imgWidth * initialZoom) / 2; const panY = (cvsHeight - imgHeight * initialZoom) / 2;
    onCanvasStateChange({ zoom: initialZoom, pan: {x: panX, y: panY }}); 
    onToolStatusChange("Zoom/Pan redefinido.");
  }, [selectedImage, onCanvasStateChange, onToolStatusChange, canvasDimensions]);

  const fitToScreen = useCallback(() => { resetZoomPan(); }, [resetZoomPan]);

  const handleCalibrationButtonClick = () => {
    if (!selectedImage) { onToolStatusChange("Selecione uma imagem para calibrar."); return; }
    setIsCalibrating(true); setCalibrationPoints([]); setIsDrawing(false); 
    setCurrentPoints([]); setStartPoint(null);
    onToolStatusChange("Calibrando: Clique no ponto inicial da medida conhecida.");
  };

  const handleZoomButtonInteraction = useCallback((direction: 'in' | 'out') => {
    if (!selectedImage || !canvasRef.current || canvasDimensions.width === 0 || canvasDimensions.height === 0) return;

    const scaleAmount = direction === 'out' ? 1 - ZOOM_STEP : 1 + ZOOM_STEP;
    const newZoomUnclamped = canvasState.zoom * scaleAmount;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoomUnclamped));

    if (Math.abs(newZoom - canvasState.zoom) < 0.001) { // If zoom didn't change (already at limit)
        onToolStatusChange(`Zoom: ${Math.round(newZoom * 100)}% (limite atingido)`);
        return;
    }

    const canvas = canvasRef.current;
    const canvasCenterX = canvas.width / 2;
    const canvasCenterY = canvas.height / 2;

    const worldCenterXBeforeZoom = (canvasCenterX - canvasState.pan.x) / canvasState.zoom;
    const worldCenterYBeforeZoom = (canvasCenterY - canvasState.pan.y) / canvasState.zoom;

    const newPanX = canvasCenterX - worldCenterXBeforeZoom * newZoom;
    const newPanY = canvasCenterY - worldCenterYBeforeZoom * newZoom;

    onCanvasStateChange({ zoom: newZoom, pan: {x: newPanX, y: newPanY }});
    onToolStatusChange(`Zoom: ${Math.round(newZoom * 100)}%`);
  }, [selectedImage, canvasState.zoom, canvasState.pan, onCanvasStateChange, onToolStatusChange, canvasDimensions]);


  useEffect(() => { 
    const canvas = canvasRef.current;
    if (canvas) {
        let cursorStyle = 'crosshair';
        if (isCalibrating) cursorStyle = 'copy';
        else if (selectedTool === Tool.PAN) cursorStyle = canvasState.isPanning ? 'grabbing' : 'grab';
        else if (selectedTool === Tool.CURVE_ADVANCED || selectedTool === Tool.STICKER_BRACKET || selectedTool === Tool.RULER || selectedTool === Tool.ANGLE_MEASURER) cursorStyle = 'copy'; 
        canvas.style.cursor = cursorStyle;
    }
  }, [selectedTool, canvasState.isPanning, isCalibrating]); // Removed multi-stage tool states as they use 'copy'

  useEffect(() => { 
    if (selectedTool !== Tool.CURVE_ADVANCED) { setCurveDrawingStage('idle'); setTempCurvePoints([]); }
    if (selectedTool !== Tool.RULER) { setRulerDrawingStage('idle'); setRulerPoints([]); }
    if (selectedTool !== Tool.ANGLE_MEASURER) { setAngleDrawingStage('idle'); setAnglePoints([]); }
    if (isCalibrating && selectedTool !== Tool.RULER && selectedTool !== Tool.LINE && selectedTool !== Tool.PEN ) { 
        setIsCalibrating(false); setCalibrationPoints([]);
    }
     // Reset drawing state if tool changes and not actively in a multi-stage process
    if (!isDrawing && !isCalibrating && 
         selectedTool !== Tool.RULER && 
         selectedTool !== Tool.ANGLE_MEASURER && 
         selectedTool !== Tool.CURVE_ADVANCED
        ) { 
        setStartPoint(null); setCurrentPoints([]);
    }
  }, [selectedTool, isDrawing, isCalibrating]);


  return (
    <div className="flex-1 bg-background flex flex-col relative overflow-hidden shadow-inner canvas-area-wrapper">
      <div className="flex-1 relative flex items-center justify-center p-1 bg-muted/10" style={{ touchAction: 'none' }}>
        {!selectedImage && (
          <div className="text-center text-muted-foreground select-none flex flex-col items-center">
            <IconComponent svgString={ICONS_SVG.GALLERY} className="w-16 h-16 text-primary/50 mb-4" />
            <p className="text-xl font-medium">Carregue uma imagem para iniciar a análise</p>
            <p className="text-sm">Utilize a galeria ao lado.</p>
          </div>
        )}
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          className={`max-w-full max-h-full transition-opacity duration-300 rounded-md shadow-lg border border-border ${selectedImage ? 'opacity-100' : 'opacity-0'}`}
          style={{ display: selectedImage ? 'block' : 'none' }} // Hide canvas if no image
        />
      </div>
      <div className="bg-card text-card-foreground p-1.5 border-t border-border flex justify-between items-center text-xs shadow-sm">
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" onClick={() => handleZoomButtonInteraction('out')} disabled={!selectedImage || canvasState.zoom <= MIN_ZOOM} title="Diminuir Zoom">
            <IconComponent svgString={ICONS_SVG.ZOOM_OUT} />
          </Button>
          <span id="zoomLevelDisplay" className="text-muted-foreground w-12 text-center tabular-nums">{`${Math.round(canvasState.zoom * 100)}%`}</span>
          <Button variant="ghost" size="icon" onClick={() => handleZoomButtonInteraction('in')} disabled={!selectedImage || canvasState.zoom >= MAX_ZOOM} title="Aumentar Zoom">
            <IconComponent svgString={ICONS_SVG.ZOOM_IN} />
          </Button>
          <Button variant="ghost" size="icon" onClick={fitToScreen} disabled={!selectedImage} title="Ajustar à Tela">
            <IconComponent svgString={ICONS_SVG.FIT_SCREEN} />
          </Button>
          <Button variant="ghost" size="icon" onClick={resetZoomPan} disabled={!selectedImage} title="Redefinir Zoom/Pan">
            <IconComponent svgString={ICONS_SVG.RESET_ZOOM} />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCalibrationButtonClick} disabled={!selectedImage} title="Calibrar Régua (px/mm)" className="px-1.5">
            <IconComponent svgString={ICONS_SVG.CALIBRATE} className="w-4 h-4 mr-1"/> <span className="text-[10px] leading-tight">Calibrar</span>
          </Button>
        </div>
        <div className="text-muted-foreground flex-1 text-center truncate px-2" id="toolStatusDisplayCanvas">
          {/* Status will be updated via onToolStatusChange prop from App.tsx */}
        </div>
        <Button variant="ghost" size="icon" onClick={() => { 
            const el = canvasRef.current?.closest('.canvas-area-wrapper'); 
            if (el) { 
                if (!document.fullscreenElement) el.requestFullscreen().catch(err => alert(`Erro ao entrar em tela cheia: ${err.message}`)); 
                else document.exitFullscreen(); 
            }
         }} title="Tela Cheia">
           <IconComponent svgString={ICONS_SVG.FULLSCREEN} />
        </Button>
      </div>
    </div>
  );
};

export default CanvasArea;