import React from 'react';

interface BrandLoaderProps {
  label?: string;
  overlay?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const BrandLoader: React.FC<BrandLoaderProps> = ({
  label = 'Processing academic data...',
  overlay = false,
  size = 'md',
}) => {
  const dimensions = size === 'sm' ? 40 : size === 'lg' ? 76 : 56;

  const svgElement = (
    <div className="flex flex-col items-center justify-center gap-3" role="status" aria-live="polite">
      <svg
        width={dimensions}
        height={dimensions}
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Ring 1: Outer Deep Navy (#0f172a / light contrast ring in dark mode) */}
        <circle
          cx="40"
          cy="40"
          r="35"
          stroke="#0f172a"
          className="brand-ring-1 dark:stroke-slate-300"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="155 65"
        />
        {/* Ring 2: Royal Blue (#1d4ed8) */}
        <circle
          cx="40"
          cy="40"
          r="27"
          stroke="#1d4ed8"
          className="brand-ring-2"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="115 55"
        />
        {/* Ring 3: Bright Cobalt (#3b82f6) */}
        <circle
          cx="40"
          cy="40"
          r="19"
          stroke="#3b82f6"
          className="brand-ring-3"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="78 42"
        />
        {/* Ring 4: Sky Blue (#0284c7) */}
        <circle
          cx="40"
          cy="40"
          r="11"
          stroke="#0284c7"
          className="brand-ring-4"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="44 26"
        />
        <circle cx="40" cy="40" r="3.5" fill="#1e3a8a" className="dark:fill-blue-400" />
      </svg>
      {label && (
        <span className="text-sm font-medium tracking-tight text-slate-700 dark:text-slate-200">
          {label}
        </span>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 backdrop-blur-xs">
        <div className="rounded-xl border border-slate-200 bg-white px-8 py-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          {svgElement}
        </div>
      </div>
    );
  }

  return svgElement;
};
