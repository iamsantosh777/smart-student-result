import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileEdit,
  Globe,
  XCircle,
} from 'lucide-react';
import React from 'react';

type StatusVariant =
  | 'Draft'
  | 'Submitted'
  | 'HOD_Approved'
  | 'Published'
  | 'Unpublished'
  | 'PASS'
  | 'FAIL'
  | 'Active'
  | 'Inactive'
  | 'Scheduled'
  | 'Ongoing'
  | 'Completed';

interface StatusBadgeProps {
  status: StatusVariant;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({status}) => {
  switch (status) {
    case 'HOD_Approved':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-800 whitespace-nowrap dark:border-blue-800/70 dark:bg-blue-950/60 dark:text-blue-300">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          HOD Approved
        </span>
      );
    case 'Published':
    case 'PASS':
    case 'Active':
    case 'Completed':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 whitespace-nowrap dark:border-emerald-800/70 dark:bg-emerald-950/60 dark:text-emerald-300">
          {status === 'Published' ? (
            <Globe className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          )}
          {status}
        </span>
      );
    case 'Submitted':
    case 'Ongoing':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 whitespace-nowrap dark:border-amber-800/70 dark:bg-amber-950/60 dark:text-amber-300">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          {status === 'Submitted' ? 'Submitted to HOD' : status}
        </span>
      );
    case 'FAIL':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 whitespace-nowrap dark:border-red-800/70 dark:bg-red-950/60 dark:text-red-300">
          <XCircle className="h-3.5 w-3.5 shrink-0" />
          FAIL
        </span>
      );
    case 'Draft':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 whitespace-nowrap dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <FileEdit className="h-3.5 w-3.5 shrink-0" />
          Draft
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 whitespace-nowrap dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {status}
        </span>
      );
  }
};
