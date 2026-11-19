import {Edit2, Plus, Trash2, X} from 'lucide-react';
import React, {useMemo, useState} from 'react';
import {StatusBadge} from '../components/StatusBadge';
import {TableSearchBar} from '../components/TableSearchBar';
import {
  ErpDatabase,
  Examination,
  Faculty,
  Semester,
  Student,
  Subject,
} from '../types/erp';

type CrudSection = 'students' | 'faculty' | 'subjects' | 'semesters' | 'examinations';

interface AdminCrudPagesProps {
  section: CrudSection;
  db: ErpDatabase;
  onSaveStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onSaveFaculty: (faculty: Faculty) => void;
  onDeleteFaculty: (id: string) => void;
  onSaveSubject: (subject: Subject) => void;
  onDeleteSubject: (id: string) => void;
  onSaveSemester: (semester: Semester) => void;
  onDeleteSemester: (id: string) => void;
  onSaveExamination: (exam: Examination) => void;
  onDeleteExamination: (id: string) => void;
}

export const AdminCrudPages: React.FC<AdminCrudPagesProps> = ({
  section,
  db,
  onSaveStudent,
  onDeleteStudent,
  onSaveFaculty,
  onDeleteFaculty,
  onSaveSubject,
  onDeleteSubject,
  onSaveSemester,
  onDeleteSemester,
  onSaveExamination,
  onDeleteExamination,
}) => {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{id: string; label: string} | null>(null);
  const [formError, setFormError] = useState('');

  // Form states per entity
  const [studentForm, setStudentForm] = useState<Student>({
    id: '',
    roll_no: '',
    name: '',
    email: '',
    department: 'CSE (AI & ML)',
    batch: 'Batch-9',
    semester_id: db.semesters.find((s) => s.is_active)?.id || 'sem-3',
    phone: '',
    status: 'Active',
  });

  const [facultyForm, setFacultyForm] = useState<Faculty>({
    id: '',
    faculty_id: '',
    name: '',
    email: '',
    department: 'CSE (AI & ML)',
    designation: 'Assistant Professor',
    phone: '',
    assigned_subjects: [],
    is_hod: false,
  });

  const [subjectForm, setSubjectForm] = useState<Subject>({
    id: '',
    code: '',
    name: '',
    semester_id: db.semesters.find((s) => s.is_active)?.id || 'sem-3',
    credits: 3,
    max_marks: 100,
    pass_marks: 40,
    faculty_id: db.faculty[0]?.id || '',
  });

  const [semesterForm, setSemesterForm] = useState<Semester>({
    id: '',
    code: '',
    name: '',
    academic_year: '2025-26',
    is_active: false,
  });

  const [examForm, setExamForm] = useState<Examination>({
    id: '',
    exam_code: '',
    title: '',
    semester_id: db.semesters.find((s) => s.is_active)?.id || 'sem-3',
    exam_type: 'Regular',
    exam_date: new Date().toISOString().slice(0, 10),
    status: 'Scheduled',
  });

  const openCreateModal = () => {
    setFormError('');
    if (section === 'students') {
      setStudentForm({
        id: '',
        roll_no: '',
        name: '',
        email: '',
        department: 'CSE (AI & ML)',
        batch: 'Batch-9',
        semester_id: db.semesters.find((s) => s.is_active)?.id || 'sem-3',
        phone: '+91 ',
        status: 'Active',
      });
    } else if (section === 'faculty') {
      setFacultyForm({
        id: '',
        faculty_id: '',
        name: '',
        email: '',
        department: 'CSE (AI & ML)',
        designation: 'Assistant Professor',
        phone: '+91 ',
        assigned_subjects: [],
        is_hod: false,
      });
    } else if (section === 'subjects') {
      setSubjectForm({
        id: '',
        code: '',
        name: '',
        semester_id: db.semesters.find((s) => s.is_active)?.id || 'sem-3',
        credits: 3,
        max_marks: 100,
        pass_marks: 40,
        faculty_id: db.faculty[0]?.id || '',
      });
    } else if (section === 'semesters') {
      setSemesterForm({
        id: '',
        code: '',
        name: '',
        academic_year: '2025-26',
        is_active: false,
      });
    } else {
      setExamForm({
        id: '',
        exam_code: '',
        title: '',
        semester_id: db.semesters.find((s) => s.is_active)?.id || 'sem-3',
        exam_type: 'Regular',
        exam_date: new Date().toISOString().slice(0, 10),
        status: 'Scheduled',
      });
    }
    setModalOpen(true);
  };

  const q = search.trim().toLowerCase();

  const filteredStudents = useMemo(
    () =>
      db.students.filter(
        (s) =>
          s.roll_no.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.batch.toLowerCase().includes(q)
      ),
    [db.students, q]
  );

  const filteredFaculty = useMemo(
    () =>
      db.faculty.filter(
        (f) =>
          f.faculty_id.toLowerCase().includes(q) ||
          f.name.toLowerCase().includes(q) ||
          f.designation.toLowerCase().includes(q)
      ),
    [db.faculty, q]
  );

  const filteredSubjects = useMemo(
    () =>
      db.subjects.filter(
        (sub) =>
          sub.code.toLowerCase().includes(q) || sub.name.toLowerCase().includes(q)
      ),
    [db.subjects, q]
  );

  const filteredSemesters = useMemo(
    () =>
      db.semesters.filter(
        (sem) =>
          sem.code.toLowerCase().includes(q) ||
          sem.name.toLowerCase().includes(q) ||
          sem.academic_year.toLowerCase().includes(q)
      ),
    [db.semesters, q]
  );

  const filteredExams = useMemo(
    () =>
      db.examinations.filter(
        (ex) =>
          ex.exam_code.toLowerCase().includes(q) || ex.title.toLowerCase().includes(q)
      ),
    [db.examinations, q]
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (section === 'students') {
      if (!studentForm.roll_no.trim() || !studentForm.name.trim() || !studentForm.email.trim()) {
        setFormError('Roll Number, Name, and Email are required.');
        return;
      }
      onSaveStudent({
        ...studentForm,
        id: studentForm.id || `stu-${Date.now()}`,
        roll_no: studentForm.roll_no.trim().toUpperCase(),
      });
    } else if (section === 'faculty') {
      if (!facultyForm.faculty_id.trim() || !facultyForm.name.trim() || !facultyForm.email.trim()) {
        setFormError('Faculty ID, Name, and Email are required.');
        return;
      }
      onSaveFaculty({
        ...facultyForm,
        id: facultyForm.id || `fac-${Date.now()}`,
        faculty_id: facultyForm.faculty_id.trim().toUpperCase(),
      });
    } else if (section === 'subjects') {
      if (!subjectForm.code.trim() || !subjectForm.name.trim()) {
        setFormError('Subject Code and Title are required.');
        return;
      }
      if (subjectForm.pass_marks > subjectForm.max_marks || subjectForm.max_marks <= 0) {
        setFormError('Pass marks cannot exceed Max marks.');
        return;
      }
      onSaveSubject({
        ...subjectForm,
        id: subjectForm.id || `sub-${Date.now()}`,
        code: subjectForm.code.trim().toUpperCase(),
      });
    } else if (section === 'semesters') {
      if (!semesterForm.code.trim() || !semesterForm.name.trim()) {
        setFormError('Semester Code and Name are required.');
        return;
      }
      onSaveSemester({
        ...semesterForm,
        id: semesterForm.id || `sem-${Date.now()}`,
        code: semesterForm.code.trim().toUpperCase(),
      });
    } else {
      if (!examForm.exam_code.trim() || !examForm.title.trim()) {
        setFormError('Exam Code and Title are required.');
        return;
      }
      onSaveExamination({
        ...examForm,
        id: examForm.id || `exm-${Date.now()}`,
        exam_code: examForm.exam_code.trim().toUpperCase(),
      });
    }

    setModalOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (section === 'students') onDeleteStudent(deleteTarget.id);
    else if (section === 'faculty') onDeleteFaculty(deleteTarget.id);
    else if (section === 'subjects') onDeleteSubject(deleteTarget.id);
    else if (section === 'semesters') onDeleteSemester(deleteTarget.id);
    else onDeleteExamination(deleteTarget.id);
    setDeleteTarget(null);
  };

  const sectionMeta: Record<CrudSection, {title: string; subtitle: string; addLabel: string}> = {
    students: {
      title: 'Student Directory',
      subtitle: 'Manage enrolled VVIT CSE (AI & ML) students across batches and semesters.',
      addLabel: 'Add Student',
    },
    faculty: {
      title: 'Faculty Directory',
      subtitle: 'Manage department teaching staff, designations, and subject allocations.',
      addLabel: 'Add Faculty',
    },
    subjects: {
      title: 'Subject Curriculum',
      subtitle: 'Configure course codes, credit weights, maximum marks, and passing thresholds.',
      addLabel: 'Add Subject',
    },
    semesters: {
      title: 'Semester Registry',
      subtitle: 'Control academic semesters and set the active term for examinations.',
      addLabel: 'Add Semester',
    },
    examinations: {
      title: 'Examination Schedule',
      subtitle: 'Create and track Regular, Mid-Term, and Supplementary examinations.',
      addLabel: 'Create Examination',
    },
  };

  const meta = sectionMeta[section];

  return (
    <div className="space-y-5">
      {/* Header & Action */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            {meta.title}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{meta.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#1e3a8a] px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-900 whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>{meta.addLabel}</span>
        </button>
      </div>

      {/* Table Card */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 p-4 dark:border-slate-800">
          <TableSearchBar
            value={search}
            onChange={setSearch}
            placeholder={
              section === 'students'
                ? 'Search by Roll Number, Name, or Batch...'
                : 'Search records by code or name...'
            }
            resultCount={
              section === 'students'
                ? filteredStudents.length
                : section === 'faculty'
                ? filteredFaculty.length
                : section === 'subjects'
                ? filteredSubjects.length
                : section === 'semesters'
                ? filteredSemesters.length
                : filteredExams.length
            }
            totalCount={
              section === 'students'
                ? db.students.length
                : section === 'faculty'
                ? db.faculty.length
                : section === 'subjects'
                ? db.subjects.length
                : section === 'semesters'
                ? db.semesters.length
                : db.examinations.length
            }
          />
        </div>

        <div className="overflow-x-auto">
          {section === 'students' && (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Roll Number</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Batch</th>
                  <th className="px-4 py-3">Semester</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map((stu) => {
                  const sem = db.semesters.find((s) => s.id === stu.semester_id);
                  return (
                    <tr key={stu.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-800 dark:text-blue-400">
                        {stu.roll_no}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                        {stu.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{stu.batch}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {sem?.name || stu.semester_id}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                        {stu.email}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={stu.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setStudentForm(stu);
                              setFormError('');
                              setModalOpen(true);
                            }}
                            aria-label={`Edit ${stu.name}`}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({id: stu.id, label: `${stu.roll_no} (${stu.name})`})}
                            aria-label={`Delete ${stu.name}`}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                      No matching students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {section === 'faculty' && (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Faculty ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Assigned Subjects</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredFaculty.map((fac) => (
                  <tr key={fac.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-800 dark:text-blue-400">
                      {fac.faculty_id}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {fac.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {fac.designation}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                      {fac.assigned_subjects.length > 0 ? fac.assigned_subjects.join(', ') : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {fac.email}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setFacultyForm(fac);
                            setFormError('');
                            setModalOpen(true);
                          }}
                          aria-label={`Edit ${fac.name}`}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-700 dark:hover:bg-slate-800"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({id: fac.id, label: fac.name})}
                          aria-label={`Delete ${fac.name}`}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {section === 'subjects' && (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Subject Title</th>
                  <th className="px-4 py-3">Semester</th>
                  <th className="px-4 py-3 text-right">Credits</th>
                  <th className="px-4 py-3 text-right">Max / Pass</th>
                  <th className="px-4 py-3">Faculty</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSubjects.map((sub) => {
                  const sem = db.semesters.find((s) => s.id === sub.semester_id);
                  const fac = db.faculty.find((f) => f.id === sub.faculty_id);
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-800 dark:text-blue-400">
                        {sub.code}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                        {sub.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {sem?.name || sub.semester_id}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        {sub.credits}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        {sub.max_marks} / {sub.pass_marks}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {fac?.name || 'Unassigned'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSubjectForm(sub);
                              setFormError('');
                              setModalOpen(true);
                            }}
                            aria-label={`Edit ${sub.code}`}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-700 dark:hover:bg-slate-800"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({id: sub.id, label: `${sub.code} — ${sub.name}`})}
                            aria-label={`Delete ${sub.code}`}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {section === 'semesters' && (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Semester Name</th>
                  <th className="px-4 py-3">Academic Year</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSemesters.map((sem) => (
                  <tr key={sem.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-800 dark:text-blue-400">
                      {sem.code}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {sem.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                      {sem.academic_year}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={sem.is_active ? 'Active' : 'Inactive'} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSemesterForm(sem);
                            setFormError('');
                            setModalOpen(true);
                          }}
                          aria-label={`Edit ${sem.name}`}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-700 dark:hover:bg-slate-800"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({id: sem.id, label: sem.name})}
                          aria-label={`Delete ${sem.name}`}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {section === 'examinations' && (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Exam Code</th>
                  <th className="px-4 py-3">Examination Title</th>
                  <th className="px-4 py-3">Semester</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredExams.map((ex) => {
                  const sem = db.semesters.find((s) => s.id === ex.semester_id);
                  return (
                    <tr key={ex.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-800 dark:text-blue-400">
                        {ex.exam_code}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                        {ex.title}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {sem?.name || ex.semester_id}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {ex.exam_type}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {ex.exam_date}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={ex.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setExamForm(ex);
                              setFormError('');
                              setModalOpen(true);
                            }}
                            aria-label={`Edit ${ex.exam_code}`}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-700 dark:hover:bg-slate-800"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({id: ex.id, label: ex.title})}
                            aria-label={`Delete ${ex.exam_code}`}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                {meta.addLabel}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5">
              {section === 'students' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Roll Number
                      </label>
                      <input
                        type="text"
                        value={studentForm.roll_no}
                        onChange={(e) => setStudentForm({...studentForm, roll_no: e.target.value})}
                        placeholder="2025DAMBT11752"
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Batch
                      </label>
                      <input
                        type="text"
                        value={studentForm.batch}
                        onChange={(e) => setStudentForm({...studentForm, batch: e.target.value})}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={studentForm.name}
                      onChange={(e) => setStudentForm({...studentForm, name: e.target.value})}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Email
                      </label>
                      <input
                        type="email"
                        value={studentForm.email}
                        onChange={(e) => setStudentForm({...studentForm, email: e.target.value})}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Semester
                      </label>
                      <select
                        value={studentForm.semester_id}
                        onChange={(e) => setStudentForm({...studentForm, semester_id: e.target.value})}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                      >
                        {db.semesters.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Phone
                      </label>
                      <input
                        type="text"
                        value={studentForm.phone}
                        onChange={(e) => setStudentForm({...studentForm, phone: e.target.value})}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Status
                      </label>
                      <select
                        value={studentForm.status}
                        onChange={(e) =>
                          setStudentForm({...studentForm, status: e.target.value as 'Active' | 'Inactive'})
                        }
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {section === 'faculty' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Faculty ID
                      </label>
                      <input
                        type="text"
                        value={facultyForm.faculty_id}
                        onChange={(e) => setFacultyForm({...facultyForm, faculty_id: e.target.value})}
                        placeholder="FAC-AM06"
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Designation
                      </label>
                      <input
                        type="text"
                        value={facultyForm.designation}
                        onChange={(e) => setFacultyForm({...facultyForm, designation: e.target.value})}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={facultyForm.name}
                      onChange={(e) => setFacultyForm({...facultyForm, name: e.target.value})}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Email
                      </label>
                      <input
                        type="email"
                        value={facultyForm.email}
                        onChange={(e) => setFacultyForm({...facultyForm, email: e.target.value})}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Assigned Subject Codes (comma separated)
                      </label>
                      <input
                        type="text"
                        value={facultyForm.assigned_subjects.join(', ')}
                        onChange={(e) =>
                          setFacultyForm({
                            ...facultyForm,
                            assigned_subjects: e.target.value
                              .split(',')
                              .map((x) => x.trim().toUpperCase())
                              .filter(Boolean),
                          })
                        }
                        placeholder="23AM301, 23AM305"
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={facultyForm.is_hod}
                      onChange={(e) => setFacultyForm({...facultyForm, is_hod: e.target.checked})}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Designate as Head of Department (HOD)
                  </label>
                </>
              )}

              {section === 'subjects' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Subject Code
                      </label>
                      <input
                        type="text"
                        value={subjectForm.code}
                        onChange={(e) => setSubjectForm({...subjectForm, code: e.target.value})}
                        placeholder="23AM306"
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Semester
                      </label>
                      <select
                        value={subjectForm.semester_id}
                        onChange={(e) => setSubjectForm({...subjectForm, semester_id: e.target.value})}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                      >
                        {db.semesters.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Subject Title
                    </label>
                    <input
                      type="text"
                      value={subjectForm.name}
                      onChange={(e) => setSubjectForm({...subjectForm, name: e.target.value})}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Credits
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={6}
                        value={subjectForm.credits}
                        onChange={(e) =>
                          setSubjectForm({...subjectForm, credits: Number(e.target.value)})
                        }
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Max Marks
                      </label>
                      <input
                        type="number"
                        min={10}
                        max={200}
                        value={subjectForm.max_marks}
                        onChange={(e) =>
                          setSubjectForm({...subjectForm, max_marks: Number(e.target.value)})
                        }
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Pass Marks
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={200}
                        value={subjectForm.pass_marks}
                        onChange={(e) =>
                          setSubjectForm({...subjectForm, pass_marks: Number(e.target.value)})
                        }
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Assigned Faculty
                    </label>
                    <select
                      value={subjectForm.faculty_id}
                      onChange={(e) => setSubjectForm({...subjectForm, faculty_id: e.target.value})}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                    >
                      {db.faculty.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.faculty_id})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {section === 'semesters' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Semester Code
                      </label>
                      <input
                        type="text"
                        value={semesterForm.code}
                        onChange={(e) => setSemesterForm({...semesterForm, code: e.target.value})}
                        placeholder="SEM-V"
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Academic Year
                      </label>
                      <input
                        type="text"
                        value={semesterForm.academic_year}
                        onChange={(e) =>
                          setSemesterForm({...semesterForm, academic_year: e.target.value})
                        }
                        placeholder="2025-26"
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Semester Name
                    </label>
                    <input
                      type="text"
                      value={semesterForm.name}
                      onChange={(e) => setSemesterForm({...semesterForm, name: e.target.value})}
                      placeholder="Semester V"
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={semesterForm.is_active}
                      onChange={(e) =>
                        setSemesterForm({...semesterForm, is_active: e.target.checked})
                      }
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Mark as Active Semester
                  </label>
                </>
              )}

              {section === 'examinations' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Exam Code
                      </label>
                      <input
                        type="text"
                        value={examForm.exam_code}
                        onChange={(e) => setExamForm({...examForm, exam_code: e.target.value})}
                        placeholder="EXM-2025-S3-SUP"
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Semester
                      </label>
                      <select
                        value={examForm.semester_id}
                        onChange={(e) => setExamForm({...examForm, semester_id: e.target.value})}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                      >
                        {db.semesters.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Examination Title
                    </label>
                    <input
                      type="text"
                      value={examForm.title}
                      onChange={(e) => setExamForm({...examForm, title: e.target.value})}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Type
                      </label>
                      <select
                        value={examForm.exam_type}
                        onChange={(e) =>
                          setExamForm({
                            ...examForm,
                            exam_type: e.target.value as Examination['exam_type'],
                          })
                        }
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                      >
                        <option value="Regular">Regular</option>
                        <option value="Mid-Term">Mid-Term</option>
                        <option value="Supplementary">Supplementary</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Date
                      </label>
                      <input
                        type="date"
                        value={examForm.exam_date}
                        onChange={(e) => setExamForm({...examForm, exam_date: e.target.value})}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Status
                      </label>
                      <select
                        value={examForm.status}
                        onChange={(e) =>
                          setExamForm({
                            ...examForm,
                            status: e.target.value as Examination['status'],
                          })
                        }
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 rounded-lg bg-[#1e3a8a] px-4 text-xs font-semibold text-white hover:bg-blue-900"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Confirm Record Deletion
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Remove <span className="font-semibold text-slate-900 dark:text-white">{deleteTarget.label}</span> from VVIT records? This action updates the active roster immediately.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="h-10 rounded-lg bg-red-600 px-4 text-xs font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
