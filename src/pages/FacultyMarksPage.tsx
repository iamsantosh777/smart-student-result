import {AlertTriangle, CheckCircle2, Save, Send} from 'lucide-react';
import React, {useEffect, useMemo, useState} from 'react';
import {StatusBadge} from '../components/StatusBadge';
import {TableSearchBar} from '../components/TableSearchBar';
import {AuthUser, ErpDatabase, MarkWorkflowStatus} from '../types/erp';

interface FacultyMarksPageProps {
  user: AuthUser;
  db: ErpDatabase;
  onSaveMarks: (
    entries: {student_id: string; marks_obtained: number}[],
    subjectId: string,
    examinationId: string,
    semesterId: string,
    status: MarkWorkflowStatus
  ) => void;
}

export const FacultyMarksPage: React.FC<FacultyMarksPageProps> = ({
  user,
  db,
  onSaveMarks,
}) => {
  const batches = useMemo(() => {
    const set = new Set(db.students.map((s) => s.batch));
    return Array.from(set);
  }, [db.students]);

  const [selectedBatch, setSelectedBatch] = useState<string>(batches[0] || 'Batch-9');
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>(
    db.semesters.find((s) => s.is_active)?.id || db.semesters[0]?.id || ''
  );
  const [selectedExamId, setSelectedExamId] = useState<string>(
    db.examinations.find((e) => e.id === 'exm-s3-end')?.id || db.examinations[0]?.id || ''
  );

  // Filter subjects assigned to the logged-in faculty (fallback to all semester subjects if none matched)
  const semesterSubjects = useMemo(() => {
    const semSubs = db.subjects.filter((s) => s.semester_id === selectedSemesterId);
    const assigned = semSubs.filter(
      (s) =>
        s.faculty_id === user.id ||
        (user.assignedSubjectCodes && user.assignedSubjectCodes.includes(s.code))
    );
    return assigned.length > 0 ? assigned : semSubs;
  }, [db.subjects, selectedSemesterId, user]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    semesterSubjects[0]?.id || ''
  );
  const [search, setSearch] = useState('');
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{type: 'success' | 'error'; text: string} | null>(null);

  useEffect(() => {
    if (!semesterSubjects.some((s) => s.id === selectedSubjectId)) {
      setSelectedSubjectId(semesterSubjects[0]?.id || '');
    }
  }, [semesterSubjects, selectedSubjectId]);

  const semesterExams = useMemo(
    () => db.examinations.filter((e) => e.semester_id === selectedSemesterId),
    [db.examinations, selectedSemesterId]
  );

  useEffect(() => {
    if (!semesterExams.some((e) => e.id === selectedExamId)) {
      setSelectedExamId(semesterExams[0]?.id || '');
    }
  }, [semesterExams, selectedExamId]);

  const activeSubject = semesterSubjects.find((s) => s.id === selectedSubjectId);

  const cohortStudents = useMemo(
    () =>
      db.students.filter(
        (st) =>
          st.semester_id === selectedSemesterId &&
          st.batch === selectedBatch &&
          st.status === 'Active'
      ),
    [db.students, selectedSemesterId, selectedBatch]
  );

  // Sync draft values when exam / subject / cohort changes
  useEffect(() => {
    const next: Record<string, string> = {};
    for (const stu of cohortStudents) {
      const existing = db.marks.find(
        (m) =>
          m.student_id === stu.id &&
          m.subject_id === selectedSubjectId &&
          m.examination_id === selectedExamId
      );
      next[stu.id] = existing !== undefined ? String(existing.marks_obtained) : '';
    }
    setDraftValues(next);
    setFeedback(null);
  }, [cohortStudents, db.marks, selectedSubjectId, selectedExamId]);

  const existingRecords = useMemo(
    () =>
      db.marks.filter(
        (m) =>
          m.subject_id === selectedSubjectId &&
          m.examination_id === selectedExamId &&
          cohortStudents.some((s) => s.id === m.student_id)
      ),
    [db.marks, selectedSubjectId, selectedExamId, cohortStudents]
  );

  const currentStatus: MarkWorkflowStatus = useMemo(() => {
    if (existingRecords.length === 0) return 'Draft';
    if (existingRecords.every((m) => m.status === 'HOD_Approved')) return 'HOD_Approved';
    if (existingRecords.some((m) => m.status === 'Submitted')) return 'Submitted';
    return 'Draft';
  }, [existingRecords]);

  const latestHodRemark = useMemo(() => {
    return existingRecords.find((m) => m.hod_remark)?.hod_remark;
  }, [existingRecords]);

  const isLocked = currentStatus === 'HOD_Approved';

  const maxMarks = activeSubject?.max_marks ?? 100;
  const passMarks = activeSubject?.pass_marks ?? 40;

  const validationErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    for (const stu of cohortStudents) {
      const raw = (draftValues[stu.id] ?? '').trim();
      if (raw === '') {
        errs[stu.id] = 'Required';
        continue;
      }
      const num = Number(raw);
      if (Number.isNaN(num) || !Number.isFinite(num)) {
        errs[stu.id] = 'Numeric only';
      } else if (num < 0 || num > maxMarks) {
        errs[stu.id] = `Must be 0–${maxMarks}`;
      }
    }
    return errs;
  }, [cohortStudents, draftValues, maxMarks]);

  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cohortStudents;
    return cohortStudents.filter(
      (s) => s.roll_no.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    );
  }, [cohortStudents, search]);

  const handleAction = (targetStatus: MarkWorkflowStatus) => {
    setFeedback(null);
    if (!activeSubject || !selectedExamId) return;
    if (hasValidationErrors) {
      setFeedback({
        type: 'error',
        text: `Cannot proceed: please enter valid marks between 0 and ${maxMarks} for all ${cohortStudents.length} students.`,
      });
      return;
    }

    const entries = cohortStudents.map((stu) => ({
      student_id: stu.id,
      marks_obtained: Number(draftValues[stu.id]),
    }));

    onSaveMarks(entries, activeSubject.id, selectedExamId, selectedSemesterId, targetStatus);
    setFeedback({
      type: 'success',
      text:
        targetStatus === 'Submitted'
          ? `Marks for ${activeSubject.code} (${activeSubject.name}) submitted to HOD for review.`
          : `Draft marks for ${activeSubject.code} saved successfully.`,
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
          Faculty Marks Entry & Submission
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Select Class, Semester, Examination, and Subject to record marks (0 to Max Marks) and
          submit to HOD.
        </p>
      </div>

      {/* Selector Bar */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
            Class / Batch
          </label>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium dark:border-slate-700 dark:bg-slate-950"
          >
            {batches.map((b) => (
              <option key={b} value={b}>
                {b} · CSE (AI & ML)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
            Semester
          </label>
          <select
            value={selectedSemesterId}
            onChange={(e) => setSelectedSemesterId(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium dark:border-slate-700 dark:bg-slate-950"
          >
            {db.semesters.map((sem) => (
              <option key={sem.id} value={sem.id}>
                {sem.name} ({sem.academic_year})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
            Examination
          </label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium dark:border-slate-700 dark:bg-slate-950"
          >
            {semesterExams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.exam_code} — {ex.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
            Assigned Subject
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium dark:border-slate-700 dark:bg-slate-950"
          >
            {semesterSubjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.code} — {sub.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Returned Remark or Lock Banner */}
      {latestHodRemark && currentStatus === 'Draft' && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <span className="font-bold">Returned by HOD for Revision: </span>
            {latestHodRemark}
          </div>
        </div>
      )}

      {isLocked && (
        <div className="flex items-center gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-medium text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-700 dark:text-blue-400" />
          <span>
            This marksheet has been verified and approved by HOD (HOD_Approved). Marks are locked
            for result compilation.
          </span>
        </div>
      )}

      {/* Marks Sheet Table */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-4 dark:border-slate-800">
          <TableSearchBar
            value={search}
            onChange={setSearch}
            resultCount={filteredStudents.length}
            totalCount={cohortStudents.length}
          />
          <div className="flex items-center gap-3 text-xs">
            <span className="font-mono text-slate-600 dark:text-slate-400">
              Max: <strong className="text-slate-900 dark:text-white">{maxMarks}</strong> · Pass:{' '}
              <strong className="text-slate-900 dark:text-white">{passMarks}</strong>
            </span>
            <StatusBadge status={currentStatus} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Roll Number</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3 text-right">Max Marks</th>
                <th className="px-4 py-3">Marks Obtained (0–{maxMarks})</th>
                <th className="px-4 py-3">Preview Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.map((stu) => {
                const raw = draftValues[stu.id] ?? '';
                const err = validationErrors[stu.id];
                const numericVal = Number(raw);
                const validNum = raw !== '' && !err;

                return (
                  <tr key={stu.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-800 dark:text-blue-400">
                      {stu.roll_no}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {stu.name}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-500">
                      {maxMarks}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={maxMarks}
                          step={1}
                          disabled={isLocked}
                          value={raw}
                          aria-label={`Marks for ${stu.roll_no}`}
                          onChange={(e) => {
                            setDraftValues((prev) => ({...prev, [stu.id]: e.target.value}));
                            setFeedback(null);
                          }}
                          className={`h-9 w-28 rounded-lg border px-3 font-mono text-sm tabular-nums focus:outline-none focus:ring-2 ${
                            err
                              ? 'border-red-400 bg-red-50 text-red-900 focus:ring-red-500/20 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200'
                              : 'border-slate-200 bg-white text-slate-900 focus:border-blue-700 focus:ring-blue-700/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white'
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                        />
                        {err && (
                          <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                            {err}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {validNum ? (
                        <StatusBadge status={numericVal >= passMarks ? 'PASS' : 'FAIL'} />
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                    No students match your current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 bg-slate-50/70 px-4 py-3.5 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="min-w-0 flex-1">
            {feedback && (
              <div
                className={`text-xs font-semibold ${
                  feedback.type === 'success'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {feedback.text}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isLocked || cohortStudents.length === 0}
              onClick={() => handleAction('Draft')}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              <Save className="h-4 w-4" />
              <span>Save Draft</span>
            </button>
            <button
              type="button"
              disabled={isLocked || cohortStudents.length === 0}
              onClick={() => handleAction('Submitted')}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#1e3a8a] px-4 text-xs font-semibold text-white transition-colors hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>Submit Marks to HOD</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
