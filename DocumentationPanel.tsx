
import React from 'react';
import { ImageAnalysisData, AnalysisType, Prognosis, ImageFile } from '../types';
import { ICONS_SVG } from '../constants'; 
import Input from './common/Input';
import Select from './common/Select';
import Textarea from './common/Textarea';
import Button from './common/Button';
import { IconComponent } from './IconComponent';


interface DocumentationPanelProps {
  selectedImage: ImageFile | null;
  analysisData: ImageAnalysisData;
  onAnalysisDataChange: <K extends keyof ImageAnalysisData>(key: K, value: ImageAnalysisData[K]) => void;
  onSaveAnalysis: () => void;
  onExportCase: () => void;
}

// Localizations
const analysisTypeTranslations: Record<AnalysisType, string> = {
  [AnalysisType.PANORAMIC]: "Panorâmica",
  [AnalysisType.LATERAL]: "Lateral",
  [AnalysisType.INTRAORAL]: "Intraoral",
  [AnalysisType.MODEL]: "Modelo de Estudo",
  [AnalysisType.CBCT]: "Tomografia Cone Beam (CBCT)",
  [AnalysisType.OTHER]: "Outro",
};

const prognosisTranslations: Record<Prognosis, string> = {
  [Prognosis.EXCELLENT]: "Excelente",
  [Prognosis.GOOD]: "Bom",
  [Prognosis.FAIR]: "Razoável",
  [Prognosis.POOR]: "Ruim",
};

const analysisTypeOptions = [
  { value: "", label: "Selecione o tipo de análise" },
  ...(Object.keys(AnalysisType) as Array<keyof typeof AnalysisType>).map(key => {
    const enumValue = AnalysisType[key];
    return {
      value: enumValue,
      label: analysisTypeTranslations[enumValue] || enumValue
    };
  })
];

const prognosisOptions = [
  { value: "", label: "Selecione o prognóstico" },
  ...(Object.keys(Prognosis) as Array<keyof typeof Prognosis>).map(key => {
    const enumValue = Prognosis[key];
    return {
      value: enumValue,
      label: prognosisTranslations[enumValue] || enumValue
    };
  })
];

const DocumentationPanel: React.FC<DocumentationPanelProps> = ({
  selectedImage,
  analysisData,
  onAnalysisDataChange,
  onSaveAnalysis,
  onExportCase,
}) => {
  const isDisabled = !selectedImage;

  return (
    <aside className="bg-sidebar text-sidebar-foreground border-l border-sidebar-border p-4 overflow-y-auto w-full md:w-80 lg:w-96 flex-shrink-0 space-y-5 shadow-lg">
      <div>
        <h3 className="section-title">
          <IconComponent svgString={ICONS_SVG.IMAGE_INFO} className="w-5 h-5" />
          Detalhes da Imagem
        </h3>
        <div className="bg-card border border-border rounded-md p-3 text-xs text-muted-foreground space-y-1 shadow-inner">
          {selectedImage ? (
            <>
              <p><strong>Nome:</strong> <span className="text-foreground break-all">{selectedImage.file.name}</span></p>
              <p><strong>Tipo MIME:</strong> <span className="text-foreground">{selectedImage.file.type || "Não disponível"}</span></p>
              <p><strong>Tamanho:</strong> <span className="text-foreground">{(selectedImage.file.size / 1024).toFixed(2)} KB</span></p>
              {selectedImage.originalDimensions && 
                <p><strong>Dimensões:</strong> <span className="text-foreground">{selectedImage.originalDimensions.width} x {selectedImage.originalDimensions.height} px</span></p>
              }
              <p className="mt-1.5 text-primary"><strong>Status:</strong> Selecionada para análise</p>
            </>
          ) : (
            <p>Nenhuma imagem selecionada.</p>
          )}
        </div>
      </div>

      <Input
        label="🏷️ Título da Imagem/Estudo:"
        id="imageTitle"
        placeholder="Ex: Radiografia Panorâmica Inicial"
        value={analysisData.title}
        onChange={(e) => onAnalysisDataChange('title', e.target.value)}
        disabled={isDisabled}
        className="bg-input text-input-foreground placeholder:text-input-placeholder"
      />

      <Select
        label="📊 Tipo de Análise:"
        id="analysisType"
        options={analysisTypeOptions} 
        value={analysisData.analysisType}
        onChange={(e) => onAnalysisDataChange('analysisType', e.target.value as AnalysisType)}
        disabled={isDisabled}
        className="bg-input text-input-foreground"
      />

      <div>
        <h3 className="section-title">
          <IconComponent svgString={ICONS_SVG.REPORT} className="w-5 h-5" />
          Parecer Técnico
        </h3>
        <div className="space-y-3">
          <Textarea
            label="Observações Clínicas:"
            id="clinicalObservations"
            placeholder="Descreva achados relevantes, padrões, anomalias..."
            value={analysisData.clinicalObservations}
            onChange={(e) => onAnalysisDataChange('clinicalObservations', e.target.value)}
            disabled={isDisabled}
            className="bg-input text-input-foreground placeholder:text-input-placeholder min-h-[80px]"
            rows={4}
          />
          <Textarea
            label="Diagnóstico Presuntivo:"
            id="diagnosis"
            placeholder="Com base nas observações e conhecimentos..."
            value={analysisData.diagnosis}
            onChange={(e) => onAnalysisDataChange('diagnosis', e.target.value)}
            disabled={isDisabled}
            className="bg-input text-input-foreground placeholder:text-input-placeholder min-h-[80px]"
            rows={3}
          />
          <Textarea
            label="Plano de Tratamento Sugerido:"
            id="treatmentPlan"
            placeholder="Detalhe o plano de tratamento proposto..."
            value={analysisData.treatmentPlan}
            onChange={(e) => onAnalysisDataChange('treatmentPlan', e.target.value)}
            disabled={isDisabled}
            className="bg-input text-input-foreground placeholder:text-input-placeholder min-h-[80px]"
            rows={4}
          />
          <Select
            label="Prognóstico:"
            id="prognosis"
            options={prognosisOptions} 
            value={analysisData.prognosis}
            onChange={(e) => onAnalysisDataChange('prognosis', e.target.value as Prognosis)}
            disabled={isDisabled}
            className="bg-input text-input-foreground"
          />
          <Textarea
            label="Recomendações Adicionais:"
            id="recommendations"
            placeholder="Considerações adicionais, próximos passos..."
            value={analysisData.recommendations}
            onChange={(e) => onAnalysisDataChange('recommendations', e.target.value)}
            disabled={isDisabled}
            className="bg-input text-input-foreground placeholder:text-input-placeholder min-h-[60px]"
            rows={2}
          />
        </div>
      </div>

      <Button
        onClick={onSaveAnalysis}
        disabled={isDisabled}
        className="w-full"
        size="lg"
        variant="secondary"
      >
        <IconComponent svgString={ICONS_SVG.SAVE} className="w-4 h-4 mr-2" />
        Salvar Análise da Imagem Atual
      </Button>

      <Button
        onClick={onExportCase}
        className="w-full"
        size="md"
        variant="outline"
      >
         <IconComponent svgString={ICONS_SVG.EXPORT} className="w-4 h-4 mr-2" />
        Exportar Relatório do Caso (JSON)
      </Button>

      <div className="bg-accent/10 border border-accent/20 p-3 rounded-md text-xs text-accent-foreground/80 mt-auto">
        <strong>💡 Dicas de Uso:</strong><br />
        • Use Ctrl+Z (Cmd+Z no Mac) para desfazer, Ctrl+Y (Cmd+Shift+Z) para refazer.<br />
        • Roda do mouse (scroll) para zoom rápido na imagem.<br />
        • Clique central do mouse (ou botão do meio) para mover a imagem.<br />
        • Dados do caso e análises são salvos automaticamente no seu navegador.
      </div>
    </aside>
  );
};

export default DocumentationPanel;
