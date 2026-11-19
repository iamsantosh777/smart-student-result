import {CheckCircle2, KeyRound, Moon, RotateCcw, Save, Sun, User} from 'lucide-react';
import React, {useState} from 'react';
import {AuthUser, ErpDatabase, GradeRule, UserRole} from '../types/erp';

interface SettingsPageProps {
  user: AuthUser;
  db: ErpDatabase;
  isDark: boolean;
  onToggleTheme: () => void;
  onChangePassword: (currentPass: string, newPass: string) => {ok: boolean; message: string};
  onSaveGradeRules: (rules: GradeRule[]) => void;
  onResetDemoData: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  db,
  isDark,
  onToggleTheme,
  onChangePassword,
  onSaveGradeRules,
  onResetDemoData,
}) => {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMsg, setPassMsg] = useState<{type: 'success' | 'error'; text: string} | null>(null);

  const [rulesDraft, setRulesDraft] = useState<GradeRule[]>(db.grade_rules);
  const [rulesMsg, setRulesMsg] = useState<string>('');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const canEditRules = user.role === UserRole.ADMIN || user.role === UserRole.HOD;

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);
    if (newPass.length < 6) {
      setPassMsg({type: 'error', text: 'New password must be at least 6 characters.'});
      return;
    }
    if (newPass !== confirmPass) {
      setPassMsg({type: 'error', text: 'New password and confirmation do not match.'});
      return;
    }
    const res = onChangePassword(currentPass, newPass);
    setPassMsg({type: res.ok ? 'success' : 'error', text: res.message});
    if (res.ok) {
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    }
  };

  const handleRuleChange = (id: string, field: keyof GradeRule, value: string | number) => {
    setRulesDraft((prev) =>
      prev.map((r) => (r.id === id ? {...r, [field]: value} : r))
    );
    setRulesMsg('');
  };

  const handleSaveRules = () => {
    onSaveGradeRules(rulesDraft);
    setRulesMsg('Grade boundary rules saved and applied to Result Calculation Engine.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
          System & Account Settings
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your VVIT profile credentials, theme preference, and university grading scales.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Profile Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-4 dark:border-slate-800">
            <User className="h-4 w-4 text-blue-700 dark:text-blue-400" />
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Academic Profile
            </h3>
          </div>

          <dl className="mt-4 grid grid-cols-1 gap-3.5 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Full Name</dt>
              <dd className="mt-0.5 font-semibold text-slate-900 dark:text-white">{user.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Role</dt>
              <dd className="mt-0.5 font-semibold text-blue-800 dark:text-blue-400">{user.role}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Identifier / Roll No</dt>
              <dd className="mt-0.5 font-mono text-xs font-semibold text-slate-900 dark:text-white">
                {user.identifier}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Institutional Email</dt>
              <dd className="mt-0.5 text-slate-700 dark:text-slate-300">{user.email}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-slate-500 dark:text-slate-400">Department</dt>
              <dd className="mt-0.5 font-medium text-slate-800 dark:text-slate-200">
                {user.department}
              </dd>
            </div>
          </dl>

          {/* Theme Switch */}
          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-5 dark:border-slate-800">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                Interface Appearance
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Toggle between crisp White and Deep Navy Dark theme
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleTheme}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
              <span>{isDark ? 'Dark Theme Active' : 'Light Theme Active'}</span>
            </button>
          </div>
        </div>

        {/* Password Change Form */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-4 dark:border-slate-800">
            <KeyRound className="h-4 w-4 text-blue-700 dark:text-blue-400" />
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Change Account Password
            </h3>
          </div>

          <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-3.5">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Current Password
              </label>
              <input
                type="password"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="Default demo password: vvit@2025"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
            </div>

            {passMsg && (
              <div
                className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                  passMsg.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300'
                }`}
              >
                {passMsg.text}
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#1e3a8a] px-4 text-xs font-semibold text-white hover:bg-blue-900"
              >
                <Save className="h-4 w-4" />
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Grade Rules Configuration Table */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              University Grade Rules Configuration (O, A+, A, B+, B, C, F)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {canEditRules
                ? 'Configure percentage boundaries and grade points used during Result Calculation.'
                : 'Official VVIT CSE (AI & ML) grading policy reference.'}
            </p>
          </div>
          {canEditRules && (
            <button
              type="button"
              onClick={handleSaveRules}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#1e3a8a] px-4 text-xs font-semibold text-white hover:bg-blue-900"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Grade Rules</span>
            </button>
          )}
        </div>

        {rulesMsg && (
          <div className="flex items-center gap-2 border-b border-emerald-200 bg-emerald-50 px-5 py-2.5 text-xs font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            <span>{rulesMsg}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3">Grade</th>
                <th className="px-5 py-3">Min %</th>
                <th className="px-5 py-3">Max %</th>
                <th className="px-5 py-3">Grade Points</th>
                <th className="px-5 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rulesDraft.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-mono font-bold text-blue-800 dark:text-blue-400">
                    {rule.grade}
                  </td>
                  <td className="px-5 py-3">
                    {canEditRules ? (
                      <input
                        type="number"
                        step="0.01"
                        value={rule.min_percentage}
                        onChange={(e) =>
                          handleRuleChange(rule.id, 'min_percentage', Number(e.target.value))
                        }
                        className="h-8 w-24 rounded-md border border-slate-200 bg-white px-2.5 font-mono text-xs tabular-nums dark:border-slate-700 dark:bg-slate-950"
                      />
                    ) : (
                      <span className="font-mono tabular-nums">{rule.min_percentage}</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {canEditRules ? (
                      <input
                        type="number"
                        step="0.01"
                        value={rule.max_percentage}
                        onChange={(e) =>
                          handleRuleChange(rule.id, 'max_percentage', Number(e.target.value))
                        }
                        className="h-8 w-24 rounded-md border border-slate-200 bg-white px-2.5 font-mono text-xs tabular-nums dark:border-slate-700 dark:bg-slate-950"
                      />
                    ) : (
                      <span className="font-mono tabular-nums">{rule.max_percentage}</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {canEditRules ? (
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={rule.grade_points}
                        onChange={(e) =>
                          handleRuleChange(rule.id, 'grade_points', Number(e.target.value))
                        }
                        className="h-8 w-20 rounded-md border border-slate-200 bg-white px-2.5 font-mono text-xs tabular-nums dark:border-slate-700 dark:bg-slate-950"
                      />
                    ) : (
                      <span className="font-mono tabular-nums">{rule.grade_points}</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {canEditRules ? (
                      <input
                        type="text"
                        value={rule.description}
                        onChange={(e) =>
                          handleRuleChange(rule.id, 'description', e.target.value)
                        }
                        className="h-8 w-44 rounded-md border border-slate-200 bg-white px-2.5 text-xs dark:border-slate-700 dark:bg-slate-950"
                      />
                    ) : (
                      <span className="text-slate-700 dark:text-slate-300">{rule.description}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Demo Dataset Restore */}
      {user.role === UserRole.ADMIN && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Reset VVIT Demo Dataset
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Restore Batch-9 students (2025DAMBT11747–11751), Semester III subjects (23AM301–305),
              and initial marks workflow.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setResetConfirmOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Restore Initial Data</span>
          </button>
        </div>
      )}

      {resetConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Restore VVIT Demo Dataset?
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              This resets local demo records to the original Batch-9 Semester III configuration.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetDemoData();
                  setResetConfirmOpen(false);
                }}
                className="h-10 rounded-lg bg-[#1e3a8a] px-4 text-xs font-semibold text-white hover:bg-blue-900"
              >
                Restore Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
