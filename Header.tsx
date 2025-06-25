
import React from 'react';
import { CaseInfo, CaseStatus } from '../types';
import Input from './common/Input';
import Select from './common/Select';
import { APP_TITLE, APP_SUBTITLE } from '../constants';

interface HeaderProps {
  caseInfo: CaseInfo;
  onCaseInfoChange: <K extends keyof CaseInfo>(key: K, value: CaseInfo[K]) => void;
  imageCount: number;
}

// Localization for CaseStatus
const caseStatusTranslations: Record<CaseStatus, string> = {
  [CaseStatus.PENDING]: "Pendente",
  [CaseStatus.IN_PROGRESS]: "Em Andamento",
  [CaseStatus.COMPLETED]: "Concluído",
  [CaseStatus.DELIVERED]: "Entregue",
};

const Header: React.FC<HeaderProps> = ({ caseInfo, onCaseInfoChange, imageCount }) => {
  const caseStatusOptions = (Object.keys(CaseStatus) as Array<keyof typeof CaseStatus>).map(key => {
    const enumValue = CaseStatus[key];
    return {
      value: enumValue,
      label: caseStatusTranslations[enumValue] || enumValue.charAt(0).toUpperCase() + enumValue.slice(1).replace('-', ' ')
    };
  });

  // Updated styles
  const inputLabelStyle = "text-accent text-sm"; // Dark blue labels, increased font size
  const inputBaseStyle = "bg-input text-input-foreground placeholder:text-input-placeholder border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 focus:shadow-md text-sm py-2"; // Increased font size, adjusted padding
  const inputHoverFocusStyle = "hover:border-primary hover:shadow-md hover:shadow-primary/20 focus:scale-[1.02]"; // Gold hover/focus effects

  return (
    <header className="bg-gradient-to-br from-[oklch(0.22_0.02_250)] via-[oklch(0.18_0.015_255)] to-[oklch(0.15_0.01_260)] text-foreground p-2 md:p-3 shadow-2xl border-b-2 border-primary/40 transition-all duration-500 ease-in-out">
      <div className="container mx-auto flex flex-col items-center gap-2 md:gap-3">
        {/* Section 1: Title and Subtitle */}
        <div className="text-center w-full">
          <h1 
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] via-[oklch(0.95_0.01_240)] to-white hover:opacity-95 transition-opacity duration-300"
            style={{ textShadow: '0 1px 3px oklch(0 0 0 / 0.3)' }}
          >
            {APP_TITLE}
          </h1>
          <p className="text-sm sm:text-md lg:text-lg font-sans opacity-80 mt-1 text-[oklch(0.75_0.02_245)]">
            {APP_SUBTITLE}
          </p>
        </div>
        
        {/* Section 2: Case Information - Silver/Muted Background */}
        <div className="w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl p-3 md:p-4 rounded-xl shadow-xl hover:shadow-2xl hover:shadow-black/20 transition-all duration-300 ease-in-out border border-border 
                        bg-muted"> {/* Changed background to muted/silver */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-3 gap-y-3"> {/* Adjusted gap-y slightly */}
            {/* Patient Name */}
            <div className="group transition-all duration-200 ease-in-out hover:scale-[1.03] rounded-lg">
              <Input
                label="👤 Paciente *"
                id="patientName"
                type="text"
                placeholder="Nome do paciente"
                value={caseInfo.patientName}
                onChange={(e) => onCaseInfoChange('patientName', e.target.value)}
                labelClassName={inputLabelStyle}
                className={`${inputBaseStyle} ${inputHoverFocusStyle} group-hover:bg-input/80`}
              />
            </div>
            {/* Dentist Name */}
            <div className="group transition-all duration-200 ease-in-out hover:scale-[1.03] rounded-lg">
              <Input
                label="🦷 Dentista *"
                id="dentistName"
                type="text"
                placeholder="Nome do dentista"
                value={caseInfo.dentistName}
                onChange={(e) => onCaseInfoChange('dentistName', e.target.value)}
                labelClassName={inputLabelStyle}
                className={`${inputBaseStyle} ${inputHoverFocusStyle} group-hover:bg-input/80`}
              />
            </div>
            {/* Entry Date */}
            <div className="group transition-all duration-200 ease-in-out hover:scale-[1.03] rounded-lg">
              <Input
                label="📅 Data Entrada"
                id="entryDate"
                type="date"
                value={caseInfo.entryDate}
                onChange={(e) => onCaseInfoChange('entryDate', e.target.value)}
                labelClassName={inputLabelStyle}
                className={`${inputBaseStyle} ${inputHoverFocusStyle} group-hover:bg-input/80`}
              />
            </div>
            {/* Case Status */}
            <div className="group transition-all duration-200 ease-in-out hover:scale-[1.03] rounded-lg">
              <Select
                label="📋 Status"
                id="caseStatus"
                options={caseStatusOptions} // Uses localized options
                value={caseInfo.caseStatus}
                onChange={(e) => onCaseInfoChange('caseStatus', e.target.value as CaseStatus)}
                labelClassName={inputLabelStyle}
                className={`${inputBaseStyle} ${inputHoverFocusStyle} group-hover:bg-input/80`}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Image Count */}
        <div className="text-center mt-1">
          <span 
            id="imageCounter" 
            className="tabular-nums text-base md:text-[17px] font-medium text-primary tracking-tight"
          >
            {imageCount > 0 ? `${imageCount} imagem(s) carregada(s)` : 'Nenhuma imagem carregada'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
