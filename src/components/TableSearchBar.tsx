import {Search, X} from 'lucide-react';
import React from 'react';

interface TableSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  resultCount?: number;
  totalCount?: number;
}

export const TableSearchBar: React.FC<TableSearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search by Roll Number or Name...',
  resultCount,
  totalCount,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[240px] max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          aria-hidden="true"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500"
        />
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {typeof resultCount === 'number' && typeof totalCount === 'number' && (
        <span className="text-xs font-medium text-slate-500 tabular-nums dark:text-slate-400">
          Showing {resultCount} of {totalCount} records
        </span>
      )}
    </div>
  );
};
