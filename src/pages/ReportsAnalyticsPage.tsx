import {Download, FileSpreadsheet, Trophy} from 'lucide-react';
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
import {BrandLoader} from '../components/BrandLoader';
import {StatusBadge} from '../components/StatusBadge';
import {TableSearchBar} from '../components/TableSearchBar';
import {calculateResultsForExamination} from '../services/dataService';
import {ErpDatabase} from '../types/erp';
import {downloadCsv, downloadReportPdf} from '../utils/pdfExport';

type ReportTab = 'class' | 'semester' | 'subject' | 'topper';

interface ReportsAnalyticsPageProps {
  db: ErpDatabase;
  isDark: boolean;
}

const GRADE_COLORS: Record<string, string> = {
  O: '#1e3a8a',
  'A+': '#1d4ed8',
  A: '#3b82f6',
  'B+': '#0284c7',
  B: '#0ea5e9',
  C: '#64748b',
  F: '#dc2626',
};

export const ReportsAnalyticsPage: React.FC<ReportsAnalyticsPageProps> = ({db, isDark}) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('class');
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>(
    db.semesters.find((s) => s.is_active)?.id || db.semesters[0]?.id || ''
  );
  const [selectedExamId, setSelectedExamId] = useState<string>(
    db.examinations.find((e) => e.id === 'exm-s3-end')?.id || db.examinations[0]?.id || ''
  );
  const [search, setSearch] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  const semesterExams = useMemo(
    () => db.examinations.filter((e) => e.semester_id === selectedSemesterId),
    [db.examinations, selectedSemesterId]
  );

  const activeExam =
    semesterExams.find((e) => e.id === selectedExamId) || semesterExams[0] || db.examinations[0];

  // Use stored results if calculated, or compute live snapshot for departmental analytics
  const examReportRows = useMemo(() => {
    if (!activeExam) return [];
    const stored = db.results.filter((r) => r.examination_id === activeExam.id);
    if (stored.length > 0) return stored;
    return calculateResultsForExamination(db, activeExam.id).results;
  }, [db, activeExam]);

  const filteredStudentRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return examReportRows;
    return examReportRows.filter(
      (r) =>
        r.roll_no.toLowerCase().includes(q) || r.student_name.toLowerCase().includes(q)
    );
  }, [examReportRows, search]);

  const subjectReportRows = useMemo(() => {
    if (!activeExam) return [];
    const subs = db.subjects.filter((s) => s.semester_id === activeExam.semester_id);
    return subs.map((sub) => {
      const marks = db.marks.filter(
        (m) => m.examination_id === activeExam.id && m.subject_id === sub.id
      );
      const scores = marks.map((m) => m.marks_obtained);
      const min = scores.length ? Math.min(...scores) : 0;
      const max = scores.length ? Math.max(...scores) : 0;
      const avg = scores.length
        ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
        : 0;
      const passCount = scores.filter((sc) => sc >= sub.pass_marks).length;
      const failCount = scores.length - passCount;
      const passPct = scores.length ? Number(((passCount / scores.length) * 100).toFixed(1)) : 0;
      return {
        code: sub.code,
        name: sub.name,
        credits: sub.credits,
        appeared: scores.length,
        min,
        max,
        avg,
        passCount,
        failCount,
        passPct,
      };
    });
  }, [db.subjects, db.marks, activeExam]);

  const semesterComparisonRows = useMemo(() => {
    return db.examinations.map((ex) => {
      const sem = db.semesters.find((s) => s.id === ex.semester_id);
      const computed =
        db.results.filter((r) => r.examination_id === ex.id).length > 0
          ? db.results.filter((r) => r.examination_id === ex.id)
          : calculateResultsForExamination(db, ex.id).results;
      const appeared = computed.length;
      const passed = computed.filter((r) => r.result_status === 'PASS').length;
      const avgPct = appeared
        ? Number((computed.reduce((a, b) => a + b.percentage, 0) / appeared).toFixed(2))
        : 0;
      const passPct = appeared ? Number(((passed / appeared) * 100).toFixed(1)) : 0;
      return {
        examCode: ex.exam_code,
        examTitle: ex.title,
        semesterName: sem?.name || ex.semester_id,
        appeared,
        passed,
        failed: appeared - passed,
        avgPct,
        passPct,
      };
    });
  }, [db]);

  const topperRows = useMemo(() => {
    return [...examReportRows]
      .filter((r) => r.result_status === 'PASS')
      .sort((a, b) => b.percentage - a.percentage || b.total_obtained - a.total_obtained);
  }, [examReportRows]);

  const gradeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of examReportRows) {
      counts[r.overall_grade] = (counts[r.overall_grade] || 0) + 1;
    }
    return Object.entries(counts).map(([grade, count]) => ({
      name: `Grade ${grade}`,
      value: count,
      color: GRADE_COLORS[grade] || '#3b82f6',
    }));
  }, [examReportRows]);

  const exportActiveReport = (format: 'csv' | 'pdf') => {
    const examLabel = activeExam ? `${activeExam.exam_code} — ${activeExam.title}` : 'VVIT Report';
    let title = '';
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filenameBase = '';

    if (activeTab === 'class') {
      title = 'Class-wise Result Report (Batch-9)';
      headers = ['Roll No', 'Student Name', 'Total', 'Max', 'Percentage %', 'SGPA', 'Grade', 'Status'];
      rows = filteredStudentRows.map((r) => [
        r.roll_no,
        r.student_name,
        r.total_obtained,
        r.total_max,
        r.percentage.toFixed(2),
        r.sgpa.toFixed(2),
        r.overall_grade,
        r.result_status,
      ]);
      filenameBase = `VVIT_Class_Report_${activeExam?.exam_code || 'BATCH9'}`;
    } else if (activeTab === 'semester') {
      title = 'Semester-wise Examination Summary';
      headers = ['Exam Code', 'Title', 'Semester', 'Appeared', 'Passed', 'Failed', 'Avg %', 'Pass %'];
      rows = semesterComparisonRows.map((s) => [
        s.examCode,
        s.examTitle,
        s.semesterName,
        s.appeared,
        s.passed,
        s.failed,
        s.avgPct.toFixed(2),
        s.passPct.toFixed(1),
      ]);
      filenameBase = 'VVIT_Semester_Summary_Report';
    } else if (activeTab === 'subject') {
      title = 'Subject-wise Performance Report';
      headers = ['Code', 'Subject Name', 'Appeared', 'Min', 'Max', 'Average', 'Pass', 'Fail', 'Pass %'];
      rows = subjectReportRows.map((s) => [
        s.code,
        s.name,
        s.appeared,
        s.min,
        s.max,
        s.avg.toFixed(2),
        s.passCount,
        s.failCount,
        s.passPct.toFixed(1),
      ]);
      filenameBase = `VVIT_Subject_Report_${activeExam?.exam_code || 'SEM3'}`;
    } else {
      title = 'Batch-9 Merit Topper List';
      headers = ['Rank', 'Roll No', 'Student Name', 'Total Marks', 'Percentage %', 'SGPA', 'Grade'];
      rows = topperRows.map((t, idx) => [
        idx + 1,
        t.roll_no,
        t.student_name,
        `${t.total_obtained}/${t.total_max}`,
        t.percentage.toFixed(2),
        t.sgpa.toFixed(2),
        t.overall_grade,
      ]);
      filenameBase = `VVIT_Toppers_${activeExam?.exam_code || 'BATCH9'}`;
    }

    if (format === 'csv') {
      downloadCsv(`${filenameBase}.csv`, headers, rows);
    } else {
      setPdfLoading(true);
      window.setTimeout(() => {
        downloadReportPdf(title, examLabel, headers, rows, `${filenameBase}.pdf`);
        setPdfLoading(false);
      }, 300);
    }
  };

  const chartAxisColor = isDark ? '#94a3b8' : '#475569';
  const chartGridColor = isDark ? '#1e293b' : '#e2e8f0';

  return (
    <div className="space-y-6">
      {pdfLoading && <BrandLoader overlay label="Exporting VVIT Department Report PDF..." />}

      {/* Header & Exports */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            Academic Reports & Analytics
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Generate class-wise, semester-wise, subject-wise, and topper merit reports in CSV or
            PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => exportActiveReport('csv')}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => exportActiveReport('pdf')}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#1e3a8a] px-4 text-xs font-semibold text-white hover:bg-blue-900"
          >
            <Download className="h-4 w-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Filters & Report Tabs */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-950">
          {(
            [
              {id: 'class', label: 'Class-wise'},
              {id: 'semester', label: 'Semester-wise'},
              {id: 'subject', label: 'Subject-wise'},
              {id: 'topper', label: 'Topper List'},
            ] as {id: ReportTab; label: string}[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`h-9 rounded-md px-3.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#1e3a8a] text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedSemesterId}
            onChange={(e) => setSelectedSemesterId(e.target.value)}
            aria-label="Filter by Semester"
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold dark:border-slate-700 dark:bg-slate-950"
          >
            {db.semesters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.academic_year})
              </option>
            ))}
          </select>

          <select
            value={activeExam?.id || ''}
            onChange={(e) => setSelectedExamId(e.target.value)}
            aria-label="Filter by Examination"
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold dark:border-slate-700 dark:bg-slate-950"
          >
            {(semesterExams.length > 0 ? semesterExams : db.examinations).map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.exam_code} — {ex.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-3 font-display text-sm font-bold text-slate-900 dark:text-white">
            Subject Average & Max Score Comparison
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectReportRows} margin={{top: 8, right: 12, left: -12, bottom: 4}}>
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
                <Bar dataKey="avg" name="Average" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="max" name="Highest" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-3 font-display text-sm font-bold text-slate-900 dark:text-white">
            Grade Distribution ({activeExam?.exam_code})
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gradeDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={78}
                  paddingAngle={3}
                >
                  {gradeDistribution.map((g) => (
                    <Cell key={g.name} fill={g.color} />
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
        </div>
      </div>

      {/* Report Data Table */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {(activeTab === 'class' || activeTab === 'topper') && (
          <div className="border-b border-slate-200 p-4 dark:border-slate-800">
            <TableSearchBar
              value={search}
              onChange={setSearch}
              resultCount={
                activeTab === 'class'
                  ? filteredStudentRows.length
                  : topperRows.filter(
                      (r) =>
                        r.roll_no.toLowerCase().includes(search.toLowerCase()) ||
                        r.student_name.toLowerCase().includes(search.toLowerCase())
                    ).length
              }
              totalCount={activeTab === 'class' ? examReportRows.length : topperRows.length}
            />
          </div>
        )}

        <div className="overflow-x-auto">
          {activeTab === 'class' && (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Roll Number</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3 text-right">Total Marks</th>
                  <th className="px-4 py-3 text-right">Percentage</th>
                  <th className="px-4 py-3 text-right">SGPA</th>
                  <th className="px-4 py-3 text-center">Grade</th>
                  <th className="px-4 py-3">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudentRows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-800 dark:text-blue-400">
                      {r.roll_no}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {r.student_name}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {r.total_obtained} / {r.total_max}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                      {r.percentage.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {r.sgpa.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold">
                      {r.overall_grade}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.result_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'semester' && (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Exam Code</th>
                  <th className="px-4 py-3">Examination Title</th>
                  <th className="px-4 py-3">Semester</th>
                  <th className="px-4 py-3 text-right">Appeared</th>
                  <th className="px-4 py-3 text-right">Passed</th>
                  <th className="px-4 py-3 text-right">Failed</th>
                  <th className="px-4 py-3 text-right">Class Avg %</th>
                  <th className="px-4 py-3 text-right">Pass %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {semesterComparisonRows.map((row) => (
                  <tr key={row.examCode} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-800 dark:text-blue-400">
                      {row.examCode}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {row.examTitle}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {row.semesterName}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{row.appeared}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                      {row.passed}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-red-600 dark:text-red-400">
                      {row.failed}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                      {row.avgPct.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                      {row.passPct.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'subject' && (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Subject Title</th>
                  <th className="px-4 py-3 text-right">Min</th>
                  <th className="px-4 py-3 text-right">Max</th>
                  <th className="px-4 py-3 text-right">Average</th>
                  <th className="px-4 py-3 text-right">Pass</th>
                  <th className="px-4 py-3 text-right">Fail</th>
                  <th className="px-4 py-3 text-right">Pass %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {subjectReportRows.map((sub) => (
                  <tr key={sub.code} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-800 dark:text-blue-400">
                      {sub.code}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {sub.name}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{sub.min}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{sub.max}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                      {sub.avg.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                      {sub.passCount}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-red-600 dark:text-red-400">
                      {sub.failCount}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                      {sub.passPct.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'topper' && (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Roll Number</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3 text-right">Total Marks</th>
                  <th className="px-4 py-3 text-right">Percentage</th>
                  <th className="px-4 py-3 text-right">SGPA</th>
                  <th className="px-4 py-3 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {topperRows
                  .filter(
                    (r) =>
                      r.roll_no.toLowerCase().includes(search.toLowerCase()) ||
                      r.student_name.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((r, idx) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                        <span className="inline-flex items-center gap-1.5">
                          {idx === 0 && <Trophy className="h-4 w-4 text-amber-500" />}#{idx + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-800 dark:text-blue-400">
                        {r.roll_no}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {r.student_name}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        {r.total_obtained} / {r.total_max}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-blue-800 dark:text-blue-400">
                        {r.percentage.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                        {r.sgpa.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold">
                        {r.overall_grade}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
