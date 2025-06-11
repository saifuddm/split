import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({ 
  checked, 
  onChange, 
  label, 
  className = '' 
}) => {
  return (
    <label className={`flex items-center gap-3 cursor-pointer ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`w-11 h-6 rounded-full transition-colors ${
            checked ? 'bg-blue' : 'bg-surface1'
          }`}
        >
          <div
            className={`w-5 h-5 bg-base rounded-full shadow-sm transition-transform transform ${
              checked ? 'translate-x-5' : 'translate-x-0.5'
            } mt-0.5`}
          />
        </div>
      </div>
      {label && <span className="text-sm font-medium">{label}</span>}
    </label>
  );
};