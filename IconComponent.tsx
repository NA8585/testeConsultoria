import React from 'react';

interface IconComponentProps {
  svgString?: string;
  className?: string;
  title?: string;
}

export const IconComponent: React.FC<IconComponentProps> = ({ svgString, className = "w-4 h-4", title }) => {
  if (!svgString) return null;
  return React.createElement('span', {
    dangerouslySetInnerHTML: { __html: svgString },
    className: `inline-block ${className}`,
    title: title
  });
};
