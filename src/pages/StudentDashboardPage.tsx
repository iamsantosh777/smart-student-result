import {Award, Calendar, Download, FileText, GraduationCap} from 'lucide-react';
import React, {useMemo, useState} from 'react';
import {BrandLoader} from '../components/BrandLoader';
import {StatusBadge} from '../components/StatusBadge';
import {VVIT_INSTITUTION} from '../data/vvitSeed';
import {AuthUser, ErpDatabase} from '../types/erp';
import {downloadStudentGradeMemoPdf} from '../utils/pdfExport';

interface StudentDashboardPageProps {
  user: AuthUser;
  db: ErpDatabase;
}

export const StudentDashboardPage: React.FC<StudentDashboardPageProps> = ({user, db}) => {
  const studentRecord = useMemo(() => {
    return (
      db.students.find(
        (s) =>
          s.id === user.id ||
          s.roll_no.toLowerCase() === user.identifier.toLowerCase()
      ) || db.students[0]
    );
  }, [db.students, user]);

  const publishedResults = useMemo(() => {
    if (!studentRecord) return [];
    return db.results.filter(
      (r) =>
        r.is_published &&
        (r.student_id === studentRecord.id || r.roll_no === studentRecord.roll_no)
    );
  }, [db.results, studentRecord]);

  const [selectedExamId, setSelectedExamId] = useState<string>(
    publishedResults[0]?.examination_id || ''
  );
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const activeResult = useMemo(() => {
    return (
      publishedResults.find((r) => r.examination_id === selectedExamId) ||
      publishedResults[0] ||
      null
    );
  }, [publishedResults, selectedExamId]);

  const activeExam = db.examinations.find((e) => e.id === activeResult?.examination_id);
  const activeSemester = db.semesters.find(
    (s) => s.id === (activeResult?.semester_id || studentRecord?.semester_id)
  );

  const unpublishedExams = useMemo(() => {
    const publishedIds = new Set(publishedResults.map((r) => r.examination_id));
    return db.examinations.filter(
      (ex) => ex.semester_id === studentRecord?.semester_id && !publishedIds.has(ex.id)
    );
  }, [db.examinations, publishedResults, studentRecord]);

  const handleDownloadPdf = () => {
    if (!activeResult || !studentRecord) return;
    setPdfGenerating(true);
    window.setTimeout(() => {
      downloadStudentGradeMemoPdf(activeResult, studentRecord, activeSemester, activeExam);
      setPdfGenerating(false);
    }, 350);
  };

  if (!studentRecord) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
        Student profile not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pdfGenerating && <BrandLoader overlay label="Generating Official VVIT Grade Memo PDF..." />}

      {/* Student Profile Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#0f172a] text-white dark:bg-[#1e3a8a]">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="font-mono font-semibold text-blue-800 dark:text-blue-400">
                  {studentRecord.roll_no}
                </span>
                <span aria-hidden="true">·</span>
                <span>{studentRecord.department}</span>
                <span aria-hidden="true">·</span>
                <span>{studentRecord.batch}</span>
              </div>
              <h2 className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-white">
                {studentRecord.name}
              </h2>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {activeSemester?.name || 'Semester III'} ({activeSemester?.academic_year || '2025-26'}) · {VVIT_INSTITUTION.shortName}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {publishedResults.length > 0 && (
              <select
                value={activeResult?.examination_id || ''}
                onChange={(e) => setSelectedExamId(e.target.value)}
                aria-label="Select Published Examination"
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium dark:border-slate-700 dark:bg-slate-950"
              >
                {publishedResults.map((r) => {
                  const ex = db.examinations.find((e) => e.id === r.examination_id);
                  return (
                    <option key={r.id} value={r.examination_id}>
                      {ex?.exam_code || r.examination_id} — {ex?.title || 'Examination'}
                    </option>
                  );
                })}
              </select>
            )}

            <button
              type="button"
              disabled={!activeResult}
              onClick={handleDownloadPdf}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#1e3a8a] px-4 text-xs font-semibold text-white transition-colors hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF Marksheet</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPIs for Selected Published Exam */}
      {activeResult ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Total Marks
              </div>
              <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                {activeResult.total_obtained}{' '}
                <span className="text-sm font-normal text-slate-400">/ {activeResult.total_max}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Percentage
              </div>
              <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                {activeResult.percentage.toFixed(2)}%
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                SGPA & Grade
              </div>
              <div className="mt-2 flex items-baseline gap-2 font-mono text-2xl font-bold tabular-nums text-blue-800 dark:text-blue-400">
                <span>{activeResult.sgpa.toFixed(2)}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  ({activeResult.overall_grade})
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Final Result
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <StatusBadge status={activeResult.result_status} />
                {activeResult.failed_subjects > 0 && (
                  <span className="text-xs font-medium text-red-600 dark:text-red-400">
                    ({activeResult.failed_subjects} backlog)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Subject-wise Marks Table */}
          <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileText className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                <div>
                  <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                    {activeExam?.title || 'Official Grade Statement'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Exam Code: {activeExam?.exam_code} · Published{' '}
                    {activeResult.published_at
                      ? new Date(activeResult.published_at).toLocaleDateString('en-IN')
                      : 'Verified'}
                  </p>
                </div>
              </div>
              <StatusBadge status="Published" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3">Subject Code</th>
                    <th className="px-5 py-3">Subject Name</th>
                    <th className="px-5 py-3 text-right">Credits</th>
                    <th className="px-5 py-3 text-right">Max Marks</th>
                    <th className="px-5 py-3 text-right">Pass Marks</th>
                    <th className="px-5 py-3 text-right">Marks Obtained</th>
                    <th className="px-5 py-3 text-center">Grade</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activeResult.subject_lines.map((line) => (
                    <tr key={line.subject_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-blue-800 dark:text-blue-400">
                        {line.subject_code}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">
                        {line.subject_name}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono tabular-nums">
                        {line.credits}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono tabular-nums text-slate-500">
                        {line.max_marks}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono tabular-nums text-slate-500">
                        {line.pass_marks}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                        {line.marks_obtained}
                      </td>
                      <td className="px-5 py-3.5 text-center font-mono font-bold text-slate-900 dark:text-white">
                        {line.grade}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={line.passed ? 'PASS' : 'FAIL'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
          <Award className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-3 font-display text-base font-bold text-slate-900 dark:text-white">
            No Published Results Available Yet
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Results appear here as soon as the Controller of Examinations publishes verified grades.
          </p>
        </div>
      )}

      {/* Pending / Upcoming Examinations Notice */}
      {unpublishedExams.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Examinations Under Evaluation / Awaiting Publication
          </div>
          <div className="mt-2 flex flex-wrap gap-3">
            {unpublishedExams.map((ex) => (
              <div
                key={ex.id}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950/60"
              >
                <span className="font-mono font-bold text-blue-800 dark:text-blue-400">
                  {ex.exam_code}
                </span>
                <span className="text-slate-600 dark:text-slate-300">{ex.title}</span>
                <StatusBadge status={ex.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
