

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import CanvasArea from './components/CanvasArea';
import DocumentationPanel from './components/DocumentationPanel';
import {
  CaseInfo, ImageFile, ImageAnalysisData, Tool, ToolSettings, CanvasState, Annotation, Point, HistoryEntry,
  initialCaseInfo, initialImageAnalysisData
} from './types';
import { 
    LOCAL_STORAGE_CASE_KEY, 
    LOCAL_STORAGE_IMAGES_KEY, 
    TOOLS, 
    initialToolSettings as appInitialToolSettings, 
    initialCanvasState as appInitialCanvasState,   
    DEFAULT_CALIBRATION_PIXELS_PER_MM
} from './constants';

const stickerImageElementCache: Record<string, HTMLImageElement> = {};

const loadStickerImageElement = (svgString: string, idForCaching: string): Promise<HTMLImageElement> => {
    const cacheKey = idForCaching || svgString; 
    if (stickerImageElementCache[cacheKey]?.complete && stickerImageElementCache[cacheKey]?.naturalWidth > 0) {
        return Promise.resolve(stickerImageElementCache[cacheKey]);
    }

    const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            stickerImageElementCache[cacheKey] = img;
            resolve(img);
        };
        img.onerror = (errEvt) => {
            const errorMsg = errEvt instanceof Event ? `Tipo de evento: ${errEvt.type}` : String(errEvt);
            console.error("Falha ao carregar elemento SVG do sticker em App.tsx:", errorMsg, { svgString, src });
            reject(new Error(`Falha ao carregar elemento SVG do sticker: ${errorMsg}`));
        };
        img.src = src;
    });
};


const App: React.FC = () => {
  const [caseInfo, setCaseInfo] = useState<CaseInfo>(initialCaseInfo);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(-1);
  
  const [selectedTool, setSelectedTool] = useState<Tool>(TOOLS[0].id);
  const [toolSettings, setToolSettings] = useState<ToolSettings>(appInitialToolSettings);
  const [canvasState, setCanvasState] = useState<CanvasState>(appInitialCanvasState);
  const [toolStatus, setToolStatus] = useState<string>("Pronto. Selecione uma ferramenta ou carregue uma imagem.");

  const [history, setHistory] = useState<Record<string, HistoryEntry[]>>({});
  const [historyStep, setHistoryStep] = useState<Record<string, number>>({});
  const autoSaveTimeoutRef = useRef<number | null>(null);

  useEffect(() => { 
    try { 
      const savedCaseInfo = localStorage.getItem(LOCAL_STORAGE_CASE_KEY); 
      if (savedCaseInfo) setCaseInfo(JSON.parse(savedCaseInfo)); 
      
      const savedImagesData = localStorage.getItem(LOCAL_STORAGE_IMAGES_KEY); 
      if (savedImagesData) { 
        const parsedImagesData: Array<Omit<ImageFile, 'file' | 'htmlImageElement'> & { fileInfo: {name: string, type: string, size: number}, calibrationFactor?: number }> = JSON.parse(savedImagesData);
        
        const imageLoadPromises = parsedImagesData
          .filter(imgData => 
              imgData.dataURL && 
              typeof imgData.dataURL === 'string' && 
              imgData.dataURL.startsWith('data:image') && 
              imgData.originalDimensions && 
              imgData.originalDimensions.width > 0 && 
              imgData.originalDimensions.height > 0
          )
          .map(async imgData => {
            const htmlImageElement = new Image();
            htmlImageElement.src = imgData.dataURL;
            await new Promise(resolve => { htmlImageElement.onload = resolve; htmlImageElement.onerror = resolve; }); 

            const annotationPromises = (imgData.annotations || []).map(async (ann) => {
              if (ann.tool === Tool.STICKER_BRACKET && ann.stickerImage) {
                try {
                  const stickerEl = await loadStickerImageElement(ann.stickerImage, ann.id);
                  return { ...ann, stickerElement: stickerEl };
                } catch (e) { console.error(`Falha ao pré-carregar sticker para anotação ${ann.id}:`, e); return ann; } 
              }
              return ann;
            });
            const resolvedAnnotations = await Promise.all(annotationPromises);

            return {
              id: imgData.id, 
              file: new File([], imgData.fileInfo.name, {type: imgData.fileInfo.type}), 
              dataURL: imgData.dataURL, 
              analysis: imgData.analysis || initialImageAnalysisData, 
              annotations: resolvedAnnotations, 
              originalDimensions: imgData.originalDimensions,
              htmlImageElement: (htmlImageElement.complete && htmlImageElement.naturalWidth > 0) ? htmlImageElement : undefined,
              calibrationFactor: imgData.calibrationFactor || DEFAULT_CALIBRATION_PIXELS_PER_MM
            };
          });

        Promise.all(imageLoadPromises).then(reconstructedImages => {
            const validReconstructedImages = reconstructedImages.filter(img => img !== undefined && img.htmlImageElement !== undefined) as ImageFile[];
            setImages(validReconstructedImages);
            const initialHistoryRecord: Record<string, HistoryEntry[]> = {};
            const initialHistoryStepRecord: Record<string, number> = {};
            validReconstructedImages.forEach(img => {
                initialHistoryRecord[img.id] = [{ annotations: img.annotations || [] }];
                initialHistoryStepRecord[img.id] = 0; 
            });
            setHistory(initialHistoryRecord);
            setHistoryStep(initialHistoryStepRecord);
            if (validReconstructedImages.length > 0 && currentImageIndex === -1) {
              setCurrentImageIndex(0);
            }
        });
      }
    } catch (error) { console.error("Erro ao carregar dados do localStorage:", error); }
  }, []); 

  useEffect(() => { 
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = window.setTimeout(() => {
      try { 
        localStorage.setItem(LOCAL_STORAGE_CASE_KEY, JSON.stringify(caseInfo)); 
        const imagesToSave = images.map(img => {
            const storableAnnotations = (img.annotations || []).map(ann => {
                const { stickerElement, ...restOfAnnotation } = ann;
                return restOfAnnotation;
            });
            const { htmlImageElement, ...restOfImage } = img;
            return {
                 ...restOfImage,
                 annotations: storableAnnotations,
                 fileInfo: { name: img.file.name, type: img.file.type, size: img.file.size },
                 calibrationFactor: img.calibrationFactor
            };
        });
        localStorage.setItem(LOCAL_STORAGE_IMAGES_KEY, JSON.stringify(imagesToSave)); 
      } catch (e) { console.error("Erro ao salvar no localStorage:", e); }
    }, 2500); 
    
    return () => { if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current); };
  }, [caseInfo, images]);
  
  const handleCaseInfoChange = useCallback(<K extends keyof CaseInfo>(key: K, value: CaseInfo[K]) => {
    setCaseInfo(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleImageUpload = useCallback((files: FileList) => {
    const validImageTypes = ['image/jpeg', 'image/png', 'image/tiff', 'image/dicom']; 
    const newImageFilePromises = Array.from(files)
      .filter(file => validImageTypes.includes(file.type.toLowerCase()) || file.name.toLowerCase().endsWith('.tif') || file.name.toLowerCase().endsWith('.tiff') || file.name.toLowerCase().endsWith('.dcm'))
      .map(file => new Promise<ImageFile | null>((resolve) => { 
        const reader = new FileReader(); 
        reader.onload = (e) => { 
          const dataURL = e.target?.result as string; 
          const htmlImg = new window.Image(); 
          htmlImg.onload = () => {
            resolve({ 
              id: `img-${Date.now()}-${Math.random().toString(16).slice(2)}`, 
              file, dataURL, 
              analysis: { ...initialImageAnalysisData, title: file.name.split('.')[0] || "Nova Imagem" }, 
              annotations: [], 
              originalDimensions: { width: htmlImg.naturalWidth, height: htmlImg.naturalHeight },
              htmlImageElement: htmlImg,
              calibrationFactor: DEFAULT_CALIBRATION_PIXELS_PER_MM 
            }); 
          };
          htmlImg.onerror = (err) => { console.error("Erro ao carregar elemento de imagem:", file.name, err); setToolStatus(`Erro ao carregar ${file.name}`); resolve(null); };
          htmlImg.src = dataURL; 
        }; 
        reader.onerror = (err) => { console.error("Erro no FileReader:", file.name, err); setToolStatus(`Erro ao ler ${file.name}`); resolve(null); }; 
        reader.readAsDataURL(file); 
      })); 
    
    Promise.all(newImageFilePromises).then(loadedImages => {
      const successfullyLoadedImages = loadedImages.filter(img => img !== null) as ImageFile[];
      if (successfullyLoadedImages.length === 0 && files.length > 0) { setToolStatus("Nenhuma imagem válida foi carregada."); return; }
      
      setImages(prevImages => {
        const updatedImages = [...prevImages, ...successfullyLoadedImages];
        if (currentImageIndex === -1 && successfullyLoadedImages.length > 0) setCurrentImageIndex(prevImages.length); 
        return updatedImages;
      });
      successfullyLoadedImages.forEach(ni => { 
        setHistory(ph => ({...ph, [ni.id]: [{annotations: []}]})); 
        setHistoryStep(phs => ({...phs, [ni.id]: 0})); 
      }); 
      setToolStatus(`${successfullyLoadedImages.length} imagem(s) carregada(s) com sucesso.`); 
    }).catch(err => { console.error("Erro no upload de imagens:", err); setToolStatus("Erro no upload. Verifique o console."); }); 
  }, [currentImageIndex]); 

  const handleImageSelect = useCallback((index: number) => { 
    if (index >= 0 && index < images.length) { 
      setCurrentImageIndex(index); 
      // Reset filters when image changes. CanvasArea will auto-fit.
      setCanvasState(prev => ({ ...prev, imageFilters: { ...(appInitialCanvasState.imageFilters || {brightness: 100, contrast: 100}) } })); 
      setToolStatus(`Imagem "${images[index]?.file.name}" selecionada.`); 
    } else { setCurrentImageIndex(-1); setToolStatus("Nenhuma imagem selecionada.");}
  }, [images]);

  const currentSelectedImage = images[currentImageIndex] || null;
  const currentAnalysisData = currentSelectedImage?.analysis || initialImageAnalysisData;
  const currentAnnotations = currentSelectedImage?.annotations || [];
  
  const handleAnalysisDataChange = useCallback(<K extends keyof ImageAnalysisData>(key: K, value: ImageAnalysisData[K]) => {
    if (!currentSelectedImage) return;
    setImages(prevImages => prevImages.map(img =>
      img.id === currentSelectedImage.id ? { ...img, analysis: { ...img.analysis, [key]: value } } : img
    ));
  }, [currentSelectedImage]);

  const handleSaveAnalysis = useCallback(() => {
    if (!currentSelectedImage) return;
    setToolStatus(`Análise da imagem "${currentSelectedImage.file.name}" salva (automaticamente).`);
  }, [currentSelectedImage]);
  
  const handleToolChange = useCallback((tool: Tool) => {
    setSelectedTool(tool);
    const toolLabel = TOOLS.find(t => t.id === tool)?.label || tool;
    setToolStatus(`Ferramenta selecionada: ${toolLabel}`);
  }, []);

  const handleToolSettingChange = useCallback(<K extends keyof ToolSettings>(key: K, value: ToolSettings[K]) => {
    setToolSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleCanvasStateChange = useCallback((newState: Partial<CanvasState>) => {
    setCanvasState(prev => ({ ...prev, ...newState }));
  }, []);

  const handleCanvasFilterChange = useCallback((filterName: keyof CanvasState['imageFilters'], value: number) => {
    setCanvasState(prev => ({ ...prev, imageFilters: { ...prev.imageFilters, [filterName]: value } }));
  }, []);

  const addAnnotationToHistory = useCallback((imageId: string, newAnnotations: Annotation[]) => {
    setHistory(prevHistory => {
        const currentImageHistory = prevHistory[imageId] || [];
        const currentStepForImage = historyStep[imageId] ?? 0;
        const newHistoryForImage = currentImageHistory.slice(0, currentStepForImage + 1);
        newHistoryForImage.push({ annotations: newAnnotations });
        setHistoryStep(prevStep => ({ ...prevStep, [imageId]: newHistoryForImage.length - 1 }));
        return { ...prevHistory, [imageId]: newHistoryForImage };
    });
  }, [historyStep]);

  const handleNewAnnotation = useCallback(async (annotation: Annotation) => {
    if (!currentSelectedImage) return;
    let finalAnnotation = { ...annotation }; 

    if (annotation.tool === Tool.STICKER_BRACKET && annotation.stickerImage) {
        try {
            const stickerEl = await loadStickerImageElement(annotation.stickerImage, annotation.id);
            finalAnnotation.stickerElement = stickerEl;
        } catch (error) { 
            console.error("Erro ao pré-carregar sticker para nova anotação:", error); 
            setToolStatus("Erro ao carregar sticker. Verifique o console."); 
            // Sticker will be added without element, CanvasArea will handle not drawing it.
        }
    }
    const updatedAnnotations = [...currentSelectedImage.annotations, finalAnnotation];
    setImages(prev => prev.map(img => img.id === currentSelectedImage.id ? { ...img, annotations: updatedAnnotations } : img));
    addAnnotationToHistory(currentSelectedImage.id, updatedAnnotations);
  }, [currentSelectedImage, addAnnotationToHistory]);

  const handleUndo = useCallback(() => {
    if (!currentSelectedImage) return; const imageId = currentSelectedImage.id;
    const currentStep = historyStep[imageId] ?? 0;
    if (currentStep > 0) {
        const newStep = currentStep - 1; 
        const pastAnnotations = history[imageId]?.[newStep]?.annotations || [];
        
        Promise.all(pastAnnotations.map(async (ann) => {
          if (ann.tool === Tool.STICKER_BRACKET && ann.stickerImage && !ann.stickerElement) {
            try { return { ...ann, stickerElement: await loadStickerImageElement(ann.stickerImage, ann.id) }; }
            catch (e) { console.error(`Falha ao carregar sticker (desfazer) ${ann.id}:`, e); return ann; }
          }
          return ann;
        })).then(resolvedAnnotations => {
            setImages(prevImgs => prevImgs.map(img => img.id === imageId ? { ...img, annotations: resolvedAnnotations } : img));
            setHistoryStep(prev => ({ ...prev, [imageId]: newStep })); setToolStatus("Ação desfeita.");
        });
    }
  }, [currentSelectedImage, history, historyStep]);

  const handleRedo = useCallback(() => { 
    if (!currentSelectedImage) return; const imageId = currentSelectedImage.id;
    const currentStep = historyStep[imageId] ?? 0;
    if (history[imageId] && currentStep < history[imageId].length - 1) {
        const newStep = currentStep + 1; 
        const futureAnnotations = history[imageId]?.[newStep]?.annotations || [];
        
        Promise.all(futureAnnotations.map(async (ann) => {
          if (ann.tool === Tool.STICKER_BRACKET && ann.stickerImage && !ann.stickerElement) {
            try { return { ...ann, stickerElement: await loadStickerImageElement(ann.stickerImage, ann.id) }; }
            catch (e) { console.error(`Falha ao carregar sticker (refazer) ${ann.id}:`, e); return ann; }
          }
          return ann;
        })).then(resolvedAnnotations => {
            setImages(prevImgs => prevImgs.map(img => img.id === imageId ? { ...img, annotations: resolvedAnnotations } : img));
            setHistoryStep(prev => ({ ...prev, [imageId]: newStep })); setToolStatus("Ação refeita.");
        });
    }
  }, [currentSelectedImage, history, historyStep]);

  const handleClearAnnotations = useCallback(() => { 
    if (!currentSelectedImage) return;
    if (window.confirm("Limpar todas as anotações desta imagem? Esta ação não pode ser desfeita.")) {
        setImages(prev => prev.map(img => img.id === currentSelectedImage.id ? { ...img, annotations: [] } : img));
        addAnnotationToHistory(currentSelectedImage.id, []); setToolStatus("Anotações limpas.");
    }
  }, [currentSelectedImage, addAnnotationToHistory]);
  
  const handleDuplicateImage = useCallback(async () => { 
    if (!currentSelectedImage) return;
    const annotationsWithLoadedStickers = await Promise.all(
        currentSelectedImage.annotations.map(async ann => {
            const newAnnId = `${ann.tool}-${Date.now()}-${Math.random().toString(16).slice(3)}`;
            if (ann.tool === Tool.STICKER_BRACKET && ann.stickerImage) {
                try { return { ...ann, id: newAnnId, stickerElement: await loadStickerImageElement(ann.stickerImage, newAnnId) }; }
                catch (e) { return { ...ann, id: newAnnId }; } 
            }
            return { ...ann, id: newAnnId }; 
        })
    );
    const newImage: ImageFile = {
        ...currentSelectedImage, 
        id: `img-${Date.now()}-${Math.random().toString(16).slice(2)}`, 
        analysis: { ...currentSelectedImage.analysis, title: `${currentSelectedImage.analysis.title || 'Imagem'} (Cópia)`}, 
        annotations: annotationsWithLoadedStickers,
        htmlImageElement: currentSelectedImage.htmlImageElement, 
        calibrationFactor: currentSelectedImage.calibrationFactor || DEFAULT_CALIBRATION_PIXELS_PER_MM
    };
    setImages(prevImages => { const newImagesArray = [...prevImages, newImage]; setCurrentImageIndex(newImagesArray.length - 1); return newImagesArray; });
    setHistory(prevH => ({...prevH, [newImage.id]: [{annotations: [...newImage.annotations]}]})); 
    setHistoryStep(prevHs => ({...prevHs, [newImage.id]: 0}));
    setToolStatus(`Imagem "${newImage.analysis.title}" duplicada e selecionada.`);
  }, [currentSelectedImage]);

  const handleExportCase = () => { 
    if (!caseInfo.patientName && images.length === 0) { alert("Preencha o nome do paciente e carregue ao menos uma imagem para exportar."); return; }
    if (!caseInfo.patientName) { alert("Preencha o nome do paciente para exportar."); return; }
    if (images.length === 0) { alert("Carregue ao menos uma imagem para exportar."); return; }
    const exportData = { 
        caseInfo, 
        images: images.map(img => {
            return { 
                fileName: img.file.name, 
                title: img.analysis.title, 
                analysisType: img.analysis.analysisType, 
                clinicalObservations: img.analysis.clinicalObservations, 
                diagnosis: img.analysis.diagnosis, 
                treatmentPlan: img.analysis.treatmentPlan, 
                prognosis: img.analysis.prognosis, 
                recommendations: img.analysis.recommendations, 
                originalDimensions: img.originalDimensions, 
                annotations: img.annotations.map(({stickerElement: se, ...rest}) => rest), 
                calibrationFactor: img.calibrationFactor 
            };
        }) 
    };
    const jsonExport = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonExport], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url;
    const safePatientName = caseInfo.patientName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.download = `relatorio_ortodontico_${safePatientName || 'caso'}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    setToolStatus("Relatório do caso exportado como JSON.");
  }

  const handleImageCalibrationFactorChange = useCallback((imageId: string, factor: number) => {
    setImages(prevImages => prevImages.map(img => 
      img.id === imageId ? { ...img, calibrationFactor: factor } : img
    ));
  }, []);

  const canUndo = currentSelectedImage ? (historyStep[currentSelectedImage.id] ?? 0) > 0 : false;
  const canRedo = currentSelectedImage ? ((historyStep[currentSelectedImage.id] ?? 0) < (((history[currentSelectedImage.id] || []).length) -1 )) : false;

  useEffect(() => {
    const canvasToolStatusEl = document.getElementById('toolStatusDisplayCanvas');
    if (canvasToolStatusEl) canvasToolStatusEl.textContent = toolStatus;
  }, [toolStatus]);

  return (
    <div className="flex flex-col h-screen max-h-screen bg-background text-foreground antialiased">
      <Header caseInfo={caseInfo} onCaseInfoChange={handleCaseInfoChange} imageCount={images.length} />
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
  {images.length === 0 ? (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/70 z-50 p-6">
      <h1 className="text-2xl font-bold text-orange-400 mb-2">Bem-vindo à Reda Consultoria</h1>
      <p className="text-base text-center">Clique no botão <strong>"Carregar Imagens"</strong> no menu lateral para iniciar uma nova análise ortodôntica.</p>
      <p className="mt-2 text-sm text-gray-300 text-center">Ou abra um caso salvo no navegador (localStorage).</p>
    </div>
  ) : (
    <>
      <Sidebar 
        images={images} currentImageIndex={currentImageIndex} onImageSelect={handleImageSelect} onImageUpload={handleImageUpload} 
        analyzedCount={images.filter(img => img.analysis?.diagnosis?.trim() !== "").length} 
        selectedTool={selectedTool} toolSettings={toolSettings} onToolChange={handleToolChange} onToolSettingChange={handleToolSettingChange} 
        canvasState={canvasState} onCanvasFilterChange={handleCanvasFilterChange} 
        onUndo={handleUndo} onRedo={handleRedo} onClearAnnotations={handleClearAnnotations} onDuplicateImage={handleDuplicateImage} 
        canUndo={canUndo} canRedo={canRedo} 
      />
      <CanvasArea 
        selectedImage={currentSelectedImage} selectedTool={selectedTool} toolSettings={toolSettings} 
        canvasState={canvasState} annotations={currentAnnotations} 
        onCanvasStateChange={handleCanvasStateChange} 
        onNewAnnotation={handleNewAnnotation} 
        onToolStatusChange={setToolStatus} 
        onImageCalibrationFactorChange={handleImageCalibrationFactorChange}
      />
      <DocumentationPanel 
        selectedImage={currentSelectedImage} analysisData={currentAnalysisData} 
        onAnalysisDataChange={handleAnalysisDataChange} onSaveAnalysis={handleSaveAnalysis} 
        onExportCase={handleExportCase} 
      />
    </>
  )}
</main>

    </div>
  );
};

export default App;