import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  GraduationCap,
  UserCheck,
} from 'lucide-react';
import React, {useMemo, useState} from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {StatusBadge} from '../components/StatusBadge';
import {AppRoute, AuthUser, ErpDatabase, MarkWorkflowStatus, UserRole} from '../types/erp';

interface DashboardOverviewProps {
  user: AuthUser;
  db: ErpDatabase;
  isDark: boolean;
  onNavigate: (route: AppRoute) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  user,
  db,
  isDark,
  onNavigate,
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(
    db.examinations[db.examinations.length - 1]?.id || ''
  );

  const activeExam = db.examinations.find((e) => e.id === selectedExamId) || db.examinations[0];
  const examSubjects = useMemo(
    () => db.subjects.filter((s) => s.semester_id === activeExam?.semester_id),
    [db.subjects, activeExam]
  );
  const examStudents = useMemo(
    () => db.students.filter((st) => st.semester_id === activeExam?.semester_id && st.status === 'Active'),
    [db.students, activeExam]
  );

  const subjectWorkflowRows = useMemo(() => {
    return examSubjects.map((sub) => {
      const subMarks = db.marks.filter(
        (m) => m.examination_id === activeExam?.id && m.subject_id === sub.id
      );
      const faculty = db.faculty.find((f) => f.id === sub.faculty_id);
      const status: MarkWorkflowStatus =
        subMarks.length === 0
          ? 'Draft'
          : subMarks.every((m) => m.status === 'HOD_Approved')
          ? 'HOD_Approved'
          : subMarks.some((m) => m.status === 'Submitted')
          ? 'Submitted'
          : 'Draft';

      const avg =
        subMarks.length > 0
          ? Number(
              (subMarks.reduce((acc, m) => acc + m.marks_obtained, 0) / subMarks.length).toFixed(1)
            )
          : 0;
      const passCount = subMarks.filter((m) => m.marks_obtained >= sub.pass_marks).length;
      const passRate =
        subMarks.length > 0 ? Math.round((passCount / subMarks.length) * 100) : 0;

      return {
        subject: sub,
        facultyName: faculty?.name || 'Unassigned',
        enteredCount: subMarks.length,
        totalStudents: examStudents.length,
        status,
        avg,
        passCount,
        passRate,
      };
    });
  }, [examSubjects, db.marks, db.faculty, activeExam, examStudents.length]);

  const passFailStats = useMemo(() => {
    const examResults = db.results.filter((r) => r.examination_id === activeExam?.id);
    if (examResults.length > 0) {
      const pass = examResults.filter((r) => r.result_status === 'PASS').length;
      const fail = examResults.filter((r) => r.result_status === 'FAIL').length;
      return [
        {name: 'Pass', value: pass, color: '#16a34a'},
        {name: 'Fail', value: fail, color: '#dc2626'},
      ];
    }
    // Derive from marks when exam isn't calculated yet
    let passCount = 0;
    let failCount = 0;
    for (const stu of examStudents) {
      const stuMarks = db.marks.filter(
        (m) => m.examination_id === activeExam?.id && m.student_id === stu.id
      );
      if (stuMarks.length === 0) continue;
      const hasFail = stuMarks.some((m) => {
        const sub = examSubjects.find((s) => s.id === m.subject_id);
        return sub ? m.marks_obtained < sub.pass_marks : false;
      });
      if (hasFail) failCount++;
      else passCount++;
    }
    return [
      {name: 'Pass', value: passCount, color: '#16a34a'},
      {name: 'Fail', value: failCount, color: '#dc2626'},
    ];
  }, [db.results, db.marks, activeExam, examStudents, examSubjects]);

  const publishedCount = db.results.filter((r) => r.is_published).length;
  const pendingHodCount = subjectWorkflowRows.filter((r) => r.status === 'Submitted').length;
  const approvedCount = subjectWorkflowRows.filter((r) => r.status === 'HOD_Approved').length;

  const facultyAssignedRows = useMemo(() => {
    if (user.role !== UserRole.FACULTY) return subjectWorkflowRows;
    const codes = user.assignedSubjectCodes || [];
    const filtered = subjectWorkflowRows.filter(
      (r) => codes.includes(r.subject.code) || r.subject.faculty_id === user.id
    );
    return filtered.length > 0 ? filtered : subjectWorkflowRows;
  }, [user, subjectWorkflowRows]);

  const chartAxisColor = isDark ? '#94a3b8' : '#475569';
  const chartGridColor = isDark ? '#1e293b' : '#e2e8f0';

  const totalCohortPassPct = useMemo(() => {
    const total = passFailStats[0].value + passFailStats[1].value;
    return total > 0 ? Math.round((passFailStats[0].value / total) * 100) : 0;
  }, [passFailStats]);

  return (
    <div className="space-y-6">
      {/* Header Row with Exam Selector */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center dark:border-slate-800">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            {user.role === UserRole.ADMIN
              ? 'Examination Control Center'
              : user.role === UserRole.HOD
              ? 'Department of CSE (AI & ML) · HOD Console'
              : `Welcome, ${user.name}`}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Academic Cycle 2025-26 · Batch-9 Cohort Monitoring & Marks Workflow
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label
            htmlFor="overview-exam-select"
            className="text-xs font-semibold text-slate-600 whitespace-nowrap dark:text-slate-400"
          >
            Examination:
          </label>
          <select
            id="overview-exam-select"
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 focus:border-blue-700 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            {db.examinations.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.exam_code} — {ex.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Role-Specific 4 KPI Strip */}
      {user.role === UserRole.ADMIN && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Total Students</span>
              <GraduationCap className="h-4 w-4 text-blue-700 dark:text-blue-400" />
            </div>
            <div className="mt-3 font-mono text-3xl font-bold text-slate-900 tabular-nums dark:text-white">
              {db.students.length}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Batch-9 · CSE (AI & ML)
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Department Faculty</span>
              <UserCheck className="h-4 w-4 text-blue-700 dark:text-blue-400" />
            </div>
            <div className="mt-3 font-mono text-3xl font-bold text-slate-900 tabular-nums dark:text-white">
              {db.faculty.length}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {db.subjects.length} Subjects Assigned
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Active Examinations</span>
              <ClipboardCheck className="h-4 w-4 text-blue-700 dark:text-blue-400" />
            </div>
            <div className="mt-3 font-mono text-3xl font-bold text-slate-900 tabular-nums dark:text-white">
              {db.examinations.length}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {approvedCount} / {examSubjects.length} Approved for Selected Exam
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Published Results</span>
              <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-3 font-mono text-3xl font-bold text-slate-900 tabular-nums dark:text-white">
              {publishedCount}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Student Grade Memos Live
            </div>
          </div>
        </div>
      )}

      {user.role === UserRole.HOD && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Pending HOD Approvals</span>
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="mt-3 font-mono text-3xl font-bold text-amber-700 tabular-nums dark:text-amber-400">
              {pendingHodCount}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Submitted marksheets awaiting sign-off
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Approved Subjects</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-3 font-mono text-3xl font-bold text-slate-900 tabular-nums dark:text-white">
              {approvedCount} / {examSubjects.length}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Ready for Admin verification
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Department Pass Rate</span>
              <Award className="h-4 w-4 text-blue-700 dark:text-blue-400" />
            </div>
            <div className="mt-3 font-mono text-3xl font-bold text-slate-900 tabular-nums dark:text-white">
              {totalCohortPassPct}%
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Across Batch-9 Semester III
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Cohort Strength</span>
              <GraduationCap className="h-4 w-4 text-blue-700 dark:text-blue-400" />
            </div>
            <div className="mt-3 font-mono text-3xl font-bold text-slate-900 tabular-nums dark:text-white">
              {examStudents.length}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Active Batch-9 Students
            </div>
          </div>
        </div>
      )}

      {user.role === UserRole.FACULTY && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Assigned Subjects</span>
              <BookOpen className="h-4 w-4 text-blue-700 dark:text-blue-400" />
            </div>
            <div className="mt-3 font-mono text-3xl font-bold text-slate-900 tabular-nums dark:text-white">
              {facultyAssignedRows.length}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Semester III · Batch-9
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Draft Marksheets</span>
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="mt-3 font-mono text-3xl font-bold text-slate-900 tabular-nums dark:text-white">
              {facultyAssignedRows.filter((r) => r.status === 'Draft').length}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Pending submission to HOD
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>HOD Approved</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-3 font-mono text-3xl font-bold text-slate-900 tabular-nums dark:text-white">
              {facultyAssignedRows.filter((r) => r.status === 'HOD_Approved').length}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Verified & locked
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Students Per Batch</span>
              <GraduationCap className="h-4 w-4 text-blue-700 dark:text-blue-400" />
            </div>
            <div className="mt-3 font-mono text-3xl font-bold text-slate-900 tabular-nums dark:text-white">
              {examStudents.length}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              2025DAMBT11747 – 11751
            </div>
          </div>
        </div>
      )}

      {/* Recharts Analytics Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                Subject-wise Average Score & Pass Percentage
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeExam?.title} ({activeExam?.exam_code})
              </p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={subjectWorkflowRows.map((r) => ({
                  code: r.subject.code,
                  Average: r.avg,
                  'Pass %': r.passRate,
                }))}
                margin={{top: 10, right: 16, left: -10, bottom: 5}}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                <XAxis dataKey="code" tick={{fill: chartAxisColor, fontSize: 12}} />
                <YAxis domain={[0, 100]} tick={{fill: chartAxisColor, fontSize: 12}} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{fontSize: '12px'}} />
                <Bar dataKey="Average" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pass %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Cohort Pass / Fail Split
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Batch-9 ({examStudents.length} Students)
            </p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={passFailStats}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {passFailStats.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{fontSize: '12px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Overall Pass Percentage</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {totalCohortPassPct}%
            </span>
          </div>
        </div>
      </div>

      {/* Subject Submission Status Tracker */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              {user.role === UserRole.FACULTY
                ? 'My Assigned Subjects & Submission Status'
                : 'Subject-wise Marks Submission Tracker'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live status across Faculty Entry → HOD Review → Result Engine
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              onNavigate(
                user.role === UserRole.ADMIN
                  ? 'result-management'
                  : user.role === UserRole.HOD
                  ? 'hod-review'
                  : 'marks-entry'
              )
            }
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#1e3a8a] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-blue-900"
          >
            <span>
              {user.role === UserRole.ADMIN
                ? 'Open Result Engine'
                : user.role === UserRole.HOD
                ? 'Review Submitted Marks'
                : 'Enter / Submit Marks'}
            </span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Subject Title</th>
                <th className="px-5 py-3">Assigned Faculty</th>
                <th className="px-5 py-3 text-right">Records</th>
                <th className="px-5 py-3 text-right">Class Avg</th>
                <th className="px-5 py-3 text-right">Pass %</th>
                <th className="px-5 py-3">Workflow Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(user.role === UserRole.FACULTY ? facultyAssignedRows : subjectWorkflowRows).map(
                (row) => (
                  <tr
                    key={row.subject.id}
                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-blue-800 dark:text-blue-400">
                      {row.subject.code}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                      {row.subject.name}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                      {row.facultyName}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                      {row.enteredCount} / {row.totalStudents}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                      {row.avg.toFixed(1)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {row.passRate}%
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={row.status} />
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
