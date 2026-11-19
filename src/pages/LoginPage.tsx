import {
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Lock,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import React, {useState} from 'react';
import {DEMO_USERS, VVIT_INSTITUTION} from '../data/vvitSeed';
import {authenticateUser} from '../services/dataService';
import {AuthUser, ErpDatabase, UserRole} from '../types/erp';

interface LoginPageProps {
  db: ErpDatabase;
  isDark: boolean;
  onToggleTheme: () => void;
  onLoginSuccess: (user: AuthUser) => void;
  onResetPassword: (identifier: string, newPass: string) => boolean;
}

const ROLE_OPTIONS: {
  role: UserRole;
  label: string;
  hintId: string;
  icon: React.FC<{className?: string}>;
}[] = [
  {role: UserRole.ADMIN, label: 'Admin', hintId: 'coe.admin@vvit.edu.in', icon: ShieldCheck},
  {role: UserRole.HOD, label: 'HOD', hintId: 'hod.aiml@vvit.edu.in', icon: Users},
  {role: UserRole.FACULTY, label: 'Faculty', hintId: 'kiran.aiml@vvit.edu.in', icon: UserCheck},
  {role: UserRole.STUDENT, label: 'Student', hintId: '2025DAMBT11747', icon: GraduationCap},
];

export const LoginPage: React.FC<LoginPageProps> = ({
  db,
  isDark,
  onToggleTheme,
  onLoginSuccess,
  onResetPassword,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.ADMIN);
  const [identifier, setIdentifier] = useState<string>(DEMO_USERS[UserRole.ADMIN].email);
  const [password, setPassword] = useState<string>('vvit@2025');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [imgFailed, setImgFailed] = useState<boolean>(false);

  // Forgot Password Modal State
  const [forgotOpen, setForgotOpen] = useState<boolean>(false);
  const [resetIdentifier, setResetIdentifier] = useState<string>('');
  const [resetNewPass, setResetNewPass] = useState<string>('');
  const [resetConfirmPass, setResetConfirmPass] = useState<string>('');
  const [resetStatus, setResetStatus] = useState<{type: 'error' | 'success'; text: string} | null>(
    null
  );

  const handleRoleSwitch = (role: UserRole) => {
    setSelectedRole(role);
    setIdentifier(role === UserRole.STUDENT ? DEMO_USERS[role].identifier : DEMO_USERS[role].email);
    setPassword('vvit@2025');
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const result = authenticateUser(db, selectedRole, identifier, password);
    if (!result.user) {
      setErrorMsg(result.error || 'Authentication failed.');
      return;
    }
    onLoginSuccess(result.user);
  };

  const handleDemoLogin = (role: UserRole) => {
    setErrorMsg('');
    onLoginSuccess(DEMO_USERS[role]);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus(null);
    if (!resetIdentifier.trim()) {
      setResetStatus({type: 'error', text: 'Enter your institutional email, Faculty ID, or Roll Number.'});
      return;
    }
    if (resetNewPass.length < 6) {
      setResetStatus({type: 'error', text: 'New password must be at least 6 characters.'});
      return;
    }
    if (resetNewPass !== resetConfirmPass) {
      setResetStatus({type: 'error', text: 'Passwords do not match.'});
      return;
    }
    const ok = onResetPassword(resetIdentifier.trim(), resetNewPass);
    if (!ok) {
      setResetStatus({
        type: 'error',
        text: 'No matching VVIT account found for that email or identifier.',
      });
      return;
    }
    setResetStatus({
      type: 'success',
      text: 'Password updated successfully. You may now sign in with your new password.',
    });
    setIdentifier(resetIdentifier.trim());
    setPassword(resetNewPass);
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-white text-slate-900 lg:grid-cols-12 dark:bg-slate-950 dark:text-slate-100">
      {/* Left Split: VVIT Architectural Institutional Panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0f172a] p-10 text-white lg:col-span-6 lg:flex xl:col-span-7">
        {!imgFailed ? (
          <img
            src="/src/assets/images/vvit_campus_hero_1795097785553.jpg"
            alt="Vasireddy Venkatadri International Technological University Campus"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="absolute inset-0 h-full w-full object-cover opacity-55"
          />
        ) : null}
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/75 to-[#1e3a8a]/65"
          aria-hidden="true"
        />

        {/* Top Institution Identity */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-400/30 bg-[#1e3a8a]/90 text-white">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
          <div>
            <div className="font-display text-lg font-bold tracking-tight text-white">
              {VVIT_INSTITUTION.shortName} Examination Portal
            </div>
            <div className="text-xs font-medium text-blue-200">{VVIT_INSTITUTION.location}</div>
          </div>
        </div>

        {/* Center Hero Typography */}
        <div className="relative z-10 max-w-xl space-y-5">
          <div className="text-xs font-semibold tracking-wider text-blue-300">
            {VVIT_INSTITUTION.fullName} · {VVIT_INSTITUTION.department}
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-white [text-wrap:balance] xl:text-5xl">
            SMART RESULT
          </h1>
          <p className="text-base leading-relaxed text-slate-200">
            End-to-end academic result processing for Batch-9 and CSE (AI & ML) cohorts—covering
            subject marks entry, Head of Department verification, automated SGPA & grade
            calculation, and official provisional grade memos.
          </p>
        </div>

        {/* Bottom Academic Cohort Strip */}
        <div className="relative z-10 grid grid-cols-3 gap-6 border-t border-white/15 pt-6">
          <div>
            <div className="text-xs text-blue-200">Active Semester</div>
            <div className="mt-1 font-mono text-base font-semibold text-white">Semester III</div>
          </div>
          <div>
            <div className="text-xs text-blue-200">Primary Cohort</div>
            <div className="mt-1 font-mono text-base font-semibold text-white">Batch-9 (AI & ML)</div>
          </div>
          <div>
            <div className="text-xs text-blue-200">Verification Flow</div>
            <div className="mt-1 font-mono text-base font-semibold text-white">Faculty → HOD → COE</div>
          </div>
        </div>
      </div>

      {/* Right Split: Login Form & One-Click Role Access */}
      <div className="flex flex-col justify-between px-6 py-8 sm:px-12 lg:col-span-6 xl:col-span-5">
        <div className="flex items-center justify-between">
          <div className="lg:hidden">
            <div className="font-display text-base font-bold text-[#0f172a] dark:text-white">
              VVIT · SMART RESULT
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {VVIT_INSTITUTION.department}
            </div>
          </div>
          <div className="ml-auto">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </div>

        <div className="mx-auto my-8 w-full max-w-md space-y-6">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Sign in to SMART RESULT
            </h2>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              Select your academic role and authenticate with your VVIT credentials.
            </p>
          </div>

          {/* Role Selector */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Select Role
            </label>
            <div className="grid grid-cols-4 gap-1.5 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
              {ROLE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = selectedRole === opt.role;
                return (
                  <button
                    key={opt.role}
                    type="button"
                    onClick={() => handleRoleSwitch(opt.role)}
                    className={`flex h-10 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[#1e3a8a] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-identifier"
                className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                {selectedRole === UserRole.STUDENT
                  ? 'Roll Number or Student Email'
                  : 'Institutional Email or Staff ID'}
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={
                    ROLE_OPTIONS.find((r) => r.role === selectedRole)?.hintId || 'Enter ID'
                  }
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetIdentifier(identifier);
                    setResetNewPass('');
                    setResetConfirmPass('');
                    setResetStatus(null);
                    setForgotOpen(true);
                  }}
                  className="text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-10 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300"
              >
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center rounded-lg bg-[#1e3a8a] px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              Sign In as {selectedRole}
            </button>
          </form>

          {/* 4 One-Click Demo Role Login Buttons */}
          <div className="border-t border-slate-200 pt-5 dark:border-slate-800">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                One-Click Demo Access
              </span>
              <span className="font-mono text-xs text-slate-400">Pass: vvit@2025</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {ROLE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const demoUser = DEMO_USERS[opt.role];
                return (
                  <button
                    key={opt.role}
                    type="button"
                    onClick={() => handleDemoLogin(opt.role)}
                    className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition-colors hover:border-blue-600 hover:bg-blue-50/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500 dark:hover:bg-slate-800"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#0f172a] text-white dark:bg-blue-900">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Demo {opt.label}
                      </div>
                      <div className="truncate font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {demoUser.identifier}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 dark:text-slate-500">
          {VVIT_INSTITUTION.fullName} · Examination Cell ERP
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-title"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <KeyRound className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                <h3 id="forgot-title" className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Reset Account Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleForgotSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Institutional Email / Faculty ID / Roll Number
                </label>
                <input
                  type="text"
                  value={resetIdentifier}
                  onChange={(e) => setResetIdentifier(e.target.value)}
                  placeholder="e.g., 2025DAMBT11747 or coe.admin@vvit.edu.in"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-blue-700 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  New Password
                </label>
                <input
                  type="password"
                  value={resetNewPass}
                  onChange={(e) => setResetNewPass(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-blue-700 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={resetConfirmPass}
                  onChange={(e) => setResetConfirmPass(e.target.value)}
                  placeholder="Re-enter new password"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-blue-700 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {resetStatus && (
                <div
                  className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium ${
                    resetStatus.type === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300'
                      : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300'
                  }`}
                >
                  {resetStatus.type === 'success' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
                  <span>{resetStatus.text}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setForgotOpen(false)}
                  className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="h-10 rounded-lg bg-[#1e3a8a] px-4 text-xs font-semibold text-white hover:bg-blue-900"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
