import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Globe,
  Lock,
} from 'lucide-react';
import React, {useMemo, useState} from 'react';
import {StatusBadge} from '../components/StatusBadge';
import {TableSearchBar} from '../components/TableSearchBar';
import {calculateResultsForExamination} from '../services/dataService';
import {ErpDatabase, MarkWorkflowStatus, ResultSummary} from '../types/erp';

interface ResultManagementPageProps {
  db: ErpDatabase;
  onSaveCalculatedResults: (examinationId: string, results: ResultSummary[]) => void;
  onTogglePublishResults: (examinationId: string, publish: boolean) => void;
}

export const ResultManagementPage: React.FC<ResultManagementPageProps> = ({
  db,
  onSaveCalculatedResults,
  onTogglePublishResults,
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(
    db.examinations.find((e) => e.id === 'exm-s3-end')?.id || db.examinations[0]?.id || ''
  );
  const [search, setSearch] = useState('');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{type: 'success' | 'warning'; text: string} | null>(null);

  const activeExam = db.examinations.find((e) => e.id === selectedExamId) || db.examinations[0];
  const examSubjects = useMemo(
    () => db.subjects.filter((s) => s.semester_id === activeExam?.semester_id),
    [db.subjects, activeExam]
  );

  const subjectApprovalCheck = useMemo(() => {
    return examSubjects.map((sub) => {
      const subMarks = db.marks.filter(
        (m) => m.examination_id === activeExam?.id && m.subject_id === sub.id
      );
      const status: MarkWorkflowStatus =
        subMarks.length === 0
          ? 'Draft'
          : subMarks.every((m) => m.status === 'HOD_Approved')
          ? 'HOD_Approved'
          : subMarks.some((m) => m.status === 'Submitted')
          ? 'Submitted'
          : 'Draft';
      return {subject: sub, status};
    });
  }, [examSubjects, db.marks, activeExam]);

  const unapprovedList = subjectApprovalCheck.filter((s) => s.status !== 'HOD_Approved');
  const examResults = useMemo(
    () => db.results.filter((r) => r.examination_id === activeExam?.id),
    [db.results, activeExam]
  );

  const isPublished = examResults.length > 0 && examResults.every((r) => r.is_published);

  const filteredResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return examResults;
    return examResults.filter(
      (r) =>
        r.roll_no.toLowerCase().includes(q) || r.student_name.toLowerCase().includes(q)
    );
  }, [examResults, search]);

  const handleCalculate = () => {
    if (!activeExam) return;
    const {results, missingOrUnapprovedSubjects} = calculateResultsForExamination(
      db,
      activeExam.id
    );
    onSaveCalculatedResults(activeExam.id, results);

    if (missingOrUnapprovedSubjects.length > 0) {
      setNotice({
        type: 'warning',
        text: `Calculated provisional results for ${results.length} students. Note: ${missingOrUnapprovedSubjects
          .map((s) => s.code)
          .join(', ')} not yet HOD_Approved — finalize HOD approval before publishing.`,
      });
    } else {
      setNotice({
        type: 'success',
        text: `All ${examSubjects.length} subjects verified (HOD_Approved). Computed totals, SGPA, grades, and PASS/FAIL status for ${results.length} students.`,
      });
    }
  };

  const handlePublish = (publish: boolean) => {
    if (!activeExam) return;
    if (publish && examResults.length === 0) {
      setNotice({
        type: 'warning',
        text: 'Please run "Calculate & Verify Results" before publishing.',
      });
      return;
    }
    onTogglePublishResults(activeExam.id, publish);
    setNotice({
      type: 'success',
      text: publish
        ? `Results for ${activeExam.exam_code} are now Published and visible on Student Dashboards.`
        : `Results for ${activeExam.exam_code} have been unpublished from Student view.`,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            Result Calculation & Publishing Engine
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Verify HOD-approved marks, compute percentages/SGPA/grades, enforce subject-level pass
            rules, and publish student memos.
          </p>
        </div>

        <select
          value={selectedExamId}
          onChange={(e) => {
            setSelectedExamId(e.target.value);
            setNotice(null);
          }}
          aria-label="Select Examination"
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium dark:border-slate-700 dark:bg-slate-900"
        >
          {db.examinations.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.exam_code} — {ex.title}
            </option>
          ))}
        </select>
      </div>

      {/* Verification Readiness Strip */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Subject Verification Readiness ({examSubjects.length - unapprovedList.length} /{' '}
              {examSubjects.length} HOD Approved)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Any student scoring below subject pass marks automatically receives FAIL overall.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleCalculate}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#1e3a8a] px-4 text-xs font-semibold text-white transition-colors hover:bg-blue-900"
            >
              <Calculator className="h-4 w-4" />
              <span>Calculate & Verify Results</span>
            </button>
            <button
              type="button"
              disabled={examResults.length === 0}
              onClick={() => handlePublish(!isPublished)}
              className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                isPublished
                  ? 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {isPublished ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
              <span>{isPublished ? 'Unpublish Results' : 'Publish Results'}</span>
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          {subjectApprovalCheck.map((item) => (
            <div
              key={item.subject.id}
              className="flex flex-col justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40"
            >
              <div>
                <div className="font-mono text-xs font-bold text-blue-800 dark:text-blue-400">
                  {item.subject.code}
                </div>
                <div className="mt-0.5 truncate text-xs font-medium text-slate-800 dark:text-slate-200">
                  {item.subject.name}
                </div>
              </div>
              <StatusBadge status={item.status} />
            </div>
          ))}
        </div>
      </div>

      {notice && (
        <div
          className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-xs font-semibold ${
            notice.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300'
              : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-200'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Results Verification Table */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
          <TableSearchBar
            value={search}
            onChange={setSearch}
            resultCount={filteredResults.length}
            totalCount={examResults.length}
          />
          {examResults.length > 0 && (
            <StatusBadge status={isPublished ? 'Published' : 'Unpublished'} />
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Roll Number</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Percentage</th>
                <th className="px-4 py-3 text-right">SGPA</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3 text-right">Breakdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredResults.map((res) => {
                const isExpanded = expandedStudentId === res.student_id;
                return (
                  <React.Fragment key={res.id}>
                    <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-800 dark:text-blue-400">
                        {res.roll_no}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                        {res.student_name}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        {res.total_obtained} / {res.total_max}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                        {res.percentage.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                        {res.sgpa.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                        {res.overall_grade}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={res.result_status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedStudentId(isExpanded ? null : res.student_id)
                          }
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400"
                        >
                          <span>{isExpanded ? 'Hide' : 'Subjects'}</span>
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50/90 dark:bg-slate-950/60">
                        <td colSpan={8} className="px-6 py-3">
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                            {res.subject_lines.map((line) => (
                              <div
                                key={line.subject_id}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900"
                              >
                                <div className="flex items-center justify-between font-mono font-bold text-slate-700 dark:text-slate-300">
                                  <span>{line.subject_code}</span>
                                  <span
                                    className={
                                      line.passed ? 'text-emerald-600' : 'text-red-600'
                                    }
                                  >
                                    {line.grade}
                                  </span>
                                </div>
                                <div className="mt-1 font-mono tabular-nums text-slate-900 dark:text-white">
                                  {line.marks_obtained} / {line.max_marks}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredResults.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-500">
                    Results have not been calculated yet for this examination. Click{' '}
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Calculate & Verify Results
                    </span>{' '}
                    above to generate the verification sheet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
