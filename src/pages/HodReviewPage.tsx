import {CheckCircle2, RotateCcw} from 'lucide-react';
import React, {useMemo, useState} from 'react';
import {StatusBadge} from '../components/StatusBadge';
import {TableSearchBar} from '../components/TableSearchBar';
import {ErpDatabase, MarkWorkflowStatus} from '../types/erp';

interface HodReviewPageProps {
  db: ErpDatabase;
  onUpdateSubjectStatus: (
    examinationId: string,
    subjectId: string,
    nextStatus: MarkWorkflowStatus,
    remark?: string
  ) => void;
}

export const HodReviewPage: React.FC<HodReviewPageProps> = ({
  db,
  onUpdateSubjectStatus,
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(
    db.examinations.find((e) => e.id === 'exm-s3-end')?.id || db.examinations[0]?.id || ''
  );

  const activeExam = db.examinations.find((e) => e.id === selectedExamId) || db.examinations[0];
  const examSubjects = useMemo(
    () => db.subjects.filter((s) => s.semester_id === activeExam?.semester_id),
    [db.subjects, activeExam]
  );

  const subjectQueue = useMemo(() => {
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

      const fac = db.faculty.find((f) => f.id === sub.faculty_id);
      return {
        subject: sub,
        facultyName: fac?.name || 'Unassigned',
        marksCount: subMarks.length,
        status,
      };
    });
  }, [examSubjects, db.marks, db.faculty, activeExam]);

  const defaultSelected =
    subjectQueue.find((q) => q.status === 'Submitted')?.subject.id ||
    subjectQueue[0]?.subject.id ||
    '';

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(defaultSelected);
  const [search, setSearch] = useState('');
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [remark, setRemark] = useState('Please re-verify internal and end-semester entries.');
  const [bannerMsg, setBannerMsg] = useState<string>('');

  const selectedQueueItem =
    subjectQueue.find((q) => q.subject.id === selectedSubjectId) || subjectQueue[0];

  const rows = useMemo(() => {
    if (!selectedQueueItem || !activeExam) return [];
    const students = db.students.filter(
      (st) => st.semester_id === activeExam.semester_id && st.status === 'Active'
    );
    return students.map((stu) => {
      const mk = db.marks.find(
        (m) =>
          m.examination_id === activeExam.id &&
          m.subject_id === selectedQueueItem.subject.id &&
          m.student_id === stu.id
      );
      const score = mk?.marks_obtained ?? null;
      const passed = score !== null ? score >= selectedQueueItem.subject.pass_marks : false;
      return {
        student: stu,
        score,
        passed,
        status: mk?.status || 'Draft',
        updatedBy: mk?.updated_by || '—',
      };
    });
  }, [db.students, db.marks, selectedQueueItem, activeExam]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.student.roll_no.toLowerCase().includes(q) ||
        r.student.name.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const passCount = rows.filter((r) => r.score !== null && r.passed).length;
  const failCount = rows.filter((r) => r.score !== null && !r.passed).length;
  const avgScore = useMemo(() => {
    const valid = rows.filter((r) => r.score !== null);
    if (valid.length === 0) return 0;
    return Number(
      (valid.reduce((acc, r) => acc + (r.score || 0), 0) / valid.length).toFixed(2)
    );
  }, [rows]);

  const handleApprove = () => {
    if (!activeExam || !selectedQueueItem) return;
    onUpdateSubjectStatus(activeExam.id, selectedQueueItem.subject.id, 'HOD_Approved');
    setBannerMsg(
      `${selectedQueueItem.subject.code} (${selectedQueueItem.subject.name}) approved and forwarded to Result Engine.`
    );
  };

  const handleReturnConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeExam || !selectedQueueItem) return;
    onUpdateSubjectStatus(
      activeExam.id,
      selectedQueueItem.subject.id,
      'Draft',
      remark.trim() || 'Returned by HOD for verification.'
    );
    setReturnModalOpen(false);
    setBannerMsg(
      `${selectedQueueItem.subject.code} returned to Faculty (${selectedQueueItem.facultyName}) as Draft.`
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            Review & Approve Subject Marksheets
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Inspect faculty-submitted marksheets, verify class pass ratios, and approve or return to
            Draft.
          </p>
        </div>

        <select
          value={selectedExamId}
          onChange={(e) => {
            setSelectedExamId(e.target.value);
            setBannerMsg('');
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

      {bannerMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{bannerMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Subject Queue */}
        <div className="rounded-xl border border-slate-200 bg-white lg:col-span-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-4 py-3.5 dark:border-slate-800">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Department Subjects Queue
            </h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {subjectQueue.map((item) => {
              const active = selectedQueueItem?.subject.id === item.subject.id;
              return (
                <button
                  key={item.subject.id}
                  type="button"
                  onClick={() => {
                    setSelectedSubjectId(item.subject.id);
                    setBannerMsg('');
                  }}
                  className={`flex w-full flex-col gap-1.5 px-4 py-3.5 text-left transition-colors ${
                    active
                      ? 'bg-blue-50/80 dark:bg-blue-950/40'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-blue-800 dark:text-blue-400">
                      {item.subject.code}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {item.subject.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {item.facultyName} · {item.marksCount} entries
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Inspection Sheet */}
        <div className="rounded-xl border border-slate-200 bg-white lg:col-span-8 dark:border-slate-800 dark:bg-slate-900">
          {selectedQueueItem ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-4 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-blue-800 dark:text-blue-400">
                      {selectedQueueItem.subject.code}
                    </span>
                    <StatusBadge status={selectedQueueItem.status} />
                  </div>
                  <h3 className="mt-1 font-display text-base font-bold text-slate-900 dark:text-white">
                    {selectedQueueItem.subject.name}
                  </h3>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    disabled={selectedQueueItem.marksCount === 0}
                    onClick={() => setReturnModalOpen(true)}
                    className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Return to Faculty</span>
                  </button>
                  <button
                    type="button"
                    disabled={
                      selectedQueueItem.marksCount === 0 ||
                      selectedQueueItem.status === 'HOD_Approved'
                    }
                    onClick={handleApprove}
                    className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#1e3a8a] px-4 text-xs font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                      {selectedQueueItem.status === 'HOD_Approved'
                        ? 'Approved'
                        : 'Approve Marksheet'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Metrics Strip */}
              <div className="grid grid-cols-3 divide-x divide-slate-200 border-b border-slate-200 bg-slate-50/70 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950/40">
                <div className="px-4 py-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Class Average</div>
                  <div className="mt-0.5 font-mono text-base font-bold tabular-nums text-slate-900 dark:text-white">
                    {avgScore.toFixed(1)} / {selectedQueueItem.subject.max_marks}
                  </div>
                </div>
                <div className="px-4 py-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Pass Count</div>
                  <div className="mt-0.5 font-mono text-base font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                    {passCount}
                  </div>
                </div>
                <div className="px-4 py-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Fail Count</div>
                  <div className="mt-0.5 font-mono text-base font-bold tabular-nums text-red-600 dark:text-red-400">
                    {failCount}
                  </div>
                </div>
              </div>

              <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                <TableSearchBar
                  value={search}
                  onChange={setSearch}
                  resultCount={filteredRows.length}
                  totalCount={rows.length}
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Roll Number</th>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3 text-right">Marks Scored</th>
                      <th className="px-4 py-3 text-right">Pass Mark</th>
                      <th className="px-4 py-3">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredRows.map((r) => (
                      <tr key={r.student.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-800 dark:text-blue-400">
                          {r.student.roll_no}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                          {r.student.name}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                          {r.score !== null ? r.score : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-500">
                          {selectedQueueItem.subject.pass_marks}
                        </td>
                        <td className="px-4 py-3">
                          {r.score !== null ? (
                            <StatusBadge status={r.passed ? 'PASS' : 'FAIL'} />
                          ) : (
                            <span className="text-xs text-slate-400">Not Entered</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="p-10 text-center text-sm text-slate-500">
              No subjects configured for this examination.
            </div>
          )}
        </div>
      </div>

      {/* Return to Faculty Modal */}
      {returnModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Return Marksheet to Faculty
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Reverts {selectedQueueItem?.subject.code} status to Draft so{' '}
              {selectedQueueItem?.facultyName} can revise marks.
            </p>
            <form onSubmit={handleReturnConfirm} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  HOD Remark
                </label>
                <textarea
                  rows={3}
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReturnModalOpen(false)}
                  className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 rounded-lg bg-amber-600 px-4 text-xs font-semibold text-white hover:bg-amber-700"
                >
                  Confirm Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
