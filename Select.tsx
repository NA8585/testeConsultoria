
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  labelClassName?: string;
}

const Select: React.FC<SelectProps> = ({ label, id, options, className, labelClassName, ...props }) => {
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className={`block text-xs font-medium mb-1 ${labelClassName || 'text-muted-foreground'}`}>{label}</label>}
      <select
        id={id}
        className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
        {...props}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
};

export default Select;