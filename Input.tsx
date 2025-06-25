
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelClassName?: string;
}

const Input: React.FC<InputProps> = ({ label, id, className, labelClassName, ...props }) => {
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className={`block text-xs font-medium mb-1 ${labelClassName || 'text-muted-foreground'}`}>{label}</label>}
      <input
        id={id}
        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
        {...props}
      />
    </div>
  );
};

export default Input;