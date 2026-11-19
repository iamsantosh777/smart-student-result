import {
  Award,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckSquare,
  ClipboardCheck,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import React, {useState} from 'react';
import {VVIT_INSTITUTION} from '../data/vvitSeed';
import {AppRoute, AuthUser, UserRole} from '../types/erp';

interface NavItem {
  id: AppRoute;
  label: string;
  icon: React.FC<{className?: string}>;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'overview',
    label: 'Dashboard Overview',
    icon: LayoutDashboard,
    roles: [UserRole.ADMIN, UserRole.HOD, UserRole.FACULTY],
  },
  {
    id: 'students',
    label: 'Student Management',
    icon: GraduationCap,
    roles: [UserRole.ADMIN],
  },
  {
    id: 'faculty',
    label: 'Faculty Management',
    icon: UserCheck,
    roles: [UserRole.ADMIN],
  },
  {
    id: 'subjects',
    label: 'Subject Management',
    icon: BookOpen,
    roles: [UserRole.ADMIN],
  },
  {
    id: 'semesters',
    label: 'Semester Management',
    icon: CalendarDays,
    roles: [UserRole.ADMIN],
  },
  {
    id: 'examinations',
    label: 'Examination Management',
    icon: ClipboardCheck,
    roles: [UserRole.ADMIN],
  },
  {
    id: 'marks-entry',
    label: 'Marks Entry & Submit',
    icon: FileSpreadsheet,
    roles: [UserRole.FACULTY],
  },
  {
    id: 'hod-review',
    label: 'Review & Approve Marks',
    icon: CheckSquare,
    roles: [UserRole.HOD],
  },
  {
    id: 'result-management',
    label: 'Result Management',
    icon: Award,
    roles: [UserRole.ADMIN],
  },
  {
    id: 'student-results',
    label: 'My Results & Memo',
    icon: Award,
    roles: [UserRole.STUDENT],
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    icon: BarChart3,
    roles: [UserRole.ADMIN, UserRole.HOD, UserRole.FACULTY],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    roles: [UserRole.ADMIN, UserRole.HOD, UserRole.FACULTY, UserRole.STUDENT],
  },
];

interface AppShellProps {
  user: AuthUser;
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onLogout: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  user,
  activeRoute,
  onNavigate,
  onLogout,
  isDark,
  onToggleTheme,
  children,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const permittedItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role));
  const currentItem = permittedItems.find((i) => i.id === activeRoute) || permittedItems[0];

  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

  const handleNavClick = (route: AppRoute) => {
    onNavigate(route);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0f172a] text-slate-100">
      {/* University Brand Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1e3a8a] text-white shadow-inner">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 2L3 6.5L12 11L21 6.5L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M5 10V16.5C5 18.433 8.134 20 12 20C15.866 20 19 18.433 19 16.5V10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-bold tracking-tight text-white">
              {VVIT_INSTITUTION.portalName}
            </div>
            <div className="truncate text-xs text-slate-400">
              {VVIT_INSTITUTION.shortName} · CSE (AI & ML)
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation menu"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Role Context */}
      <div className="border-b border-slate-800/80 px-5 py-3">
        <div className="text-xs font-medium text-slate-400">Active Workspace</div>
        <div className="mt-0.5 text-sm font-semibold text-blue-300">{user.role} Portal</div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Main navigation">
        {permittedItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeRoute === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[#1e3a8a] text-white'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-blue-200' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile Footer & Logout */}
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-900/80 text-xs font-bold text-blue-100">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">{user.name}</div>
            <div className="truncate font-mono text-xs text-slate-400">{user.identifier}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm font-medium text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden w-[264px] shrink-0 border-r border-slate-800 lg:block">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-[272px] max-w-[85vw]">{sidebarContent}</div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 lg:hidden dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden font-medium text-slate-500 sm:inline whitespace-nowrap dark:text-slate-400">
                VVIT · CSE (AI & ML)
              </span>
              <span className="hidden text-slate-300 sm:inline dark:text-slate-600">/</span>
              <h1 className="truncate font-display text-base font-bold text-slate-900 dark:text-white">
                {currentItem?.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden items-center gap-2 text-xs font-medium text-slate-500 md:flex dark:text-slate-400">
              <Users className="h-3.5 w-3.5" />
              <span>{user.department}</span>
            </div>
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 whitespace-nowrap dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
              <span className="hidden sm:inline">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1280px]">{children}</div>
        </main>
      </div>
    </div>
  );
};
