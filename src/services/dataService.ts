import {createInitialVvitSeed, DEMO_USERS} from '../data/vvitSeed';
import {isSupabaseConfigured, supabase} from '../lib/supabase';
import {
  AuthUser,
  ErpDatabase,
  Examination,
  Faculty,
  GradeRule,
  MarkRecord,
  MarkWorkflowStatus,
  ResultSummary,
  Semester,
  Student,
  Subject,
  SubjectResultLine,
  UserRole,
} from '../types/erp';

const STORAGE_KEY = 'vvit_smart_result_db_v1';

export const matchGradeRule = (percentage: number, rules: GradeRule[]): GradeRule => {
  const sorted = [...rules].sort((a, b) => b.min_percentage - a.min_percentage);
  for (const rule of sorted) {
    if (percentage >= rule.min_percentage && percentage <= rule.max_percentage + 0.01) {
      return rule;
    }
  }
  return (
    sorted[sorted.length - 1] || {
      id: 'gr-f',
      grade: 'F',
      min_percentage: 0,
      max_percentage: 39.99,
      grade_points: 0,
      description: 'Fail',
    }
  );
};

export const calculateResultsForExamination = (
  db: ErpDatabase,
  examinationId: string,
  publishStatus?: boolean
): {results: ResultSummary[]; missingOrUnapprovedSubjects: Subject[]} => {
  const exam = db.examinations.find((e) => e.id === examinationId);
  if (!exam) {
    return {results: [], missingOrUnapprovedSubjects: []};
  }

  const semSubjects = db.subjects.filter((s) => s.semester_id === exam.semester_id);
  const semStudents = db.students.filter(
    (st) => st.semester_id === exam.semester_id && st.status === 'Active'
  );

  const missingOrUnapprovedSubjects: Subject[] = [];
  for (const sub of semSubjects) {
    const subMarks = db.marks.filter(
      (m) => m.examination_id === examinationId && m.subject_id === sub.id
    );
    const allApproved =
      subMarks.length >= semStudents.length &&
      semStudents.every((st) =>
        subMarks.some((m) => m.student_id === st.id && m.status === 'HOD_Approved')
      );
    if (!allApproved) {
      missingOrUnapprovedSubjects.push(sub);
    }
  }

  const existingByStudent = new Map(
    db.results
      .filter((r) => r.examination_id === examinationId)
      .map((r) => [r.student_id, r])
  );

  const nowIso = new Date().toISOString();

  const computed: ResultSummary[] = semStudents.map((student) => {
    const subjectLines: SubjectResultLine[] = semSubjects.map((sub) => {
      const mark = db.marks.find(
        (m) =>
          m.examination_id === examinationId &&
          m.subject_id === sub.id &&
          m.student_id === student.id
      );
      const obtained = mark ? mark.marks_obtained : 0;
      const pct = sub.max_marks > 0 ? (obtained / sub.max_marks) * 100 : 0;
      const passed = Boolean(mark) && obtained >= sub.pass_marks;
      const matched = passed
        ? matchGradeRule(pct, db.grade_rules)
        : db.grade_rules.find((g) => g.grade === 'F') || matchGradeRule(0, db.grade_rules);

      return {
        subject_id: sub.id,
        subject_code: sub.code,
        subject_name: sub.name,
        credits: sub.credits,
        max_marks: sub.max_marks,
        pass_marks: sub.pass_marks,
        marks_obtained: obtained,
        grade: matched.grade,
        grade_points: matched.grade_points,
        passed,
      };
    });

    const totalObtained = subjectLines.reduce((acc, l) => acc + l.marks_obtained, 0);
    const totalMax = subjectLines.reduce((acc, l) => acc + l.max_marks, 0);
    const percentage = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
    const failedSubjects = subjectLines.filter((l) => !l.passed).length;
    const resultStatus: 'PASS' | 'FAIL' = failedSubjects > 0 ? 'FAIL' : 'PASS';

    const totalCredits = subjectLines.reduce((acc, l) => acc + l.credits, 0);
    const earnedWeighted = subjectLines.reduce((acc, l) => acc + l.credits * l.grade_points, 0);
    const sgpa = totalCredits > 0 ? Number((earnedWeighted / totalCredits).toFixed(2)) : 0;

    const overallRule =
      resultStatus === 'FAIL'
        ? db.grade_rules.find((g) => g.grade === 'F') || matchGradeRule(0, db.grade_rules)
        : matchGradeRule(percentage, db.grade_rules);

    const prev = existingByStudent.get(student.id);
    const isPublished = publishStatus !== undefined ? publishStatus : prev?.is_published ?? false;

    return {
      id: prev?.id || `res-${examinationId}-${student.roll_no.toLowerCase()}`,
      student_id: student.id,
      roll_no: student.roll_no,
      student_name: student.name,
      examination_id: examinationId,
      semester_id: exam.semester_id,
      total_obtained: totalObtained,
      total_max: totalMax,
      percentage,
      sgpa,
      overall_grade: overallRule.grade,
      result_status: resultStatus,
      failed_subjects: failedSubjects,
      is_published: isPublished,
      calculated_at: nowIso,
      published_at: isPublished ? prev?.published_at || nowIso : undefined,
      subject_lines: subjectLines,
    };
  });

  return {results: computed, missingOrUnapprovedSubjects};
};

const createSeededWithInitialResults = (): ErpDatabase => {
  const seed = createInitialVvitSeed();
  const {results} = calculateResultsForExamination(seed, 'exm-s3-mid1', true);
  seed.results = results;
  return seed;
};

export const loadLocalDatabase = (): ErpDatabase => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ErpDatabase;
      if (parsed && Array.isArray(parsed.students) && Array.isArray(parsed.subjects)) {
        return parsed;
      }
    }
  } catch {
    // Fallback to initial seed
  }
  const initial = createSeededWithInitialResults();
  saveLocalDatabase(initial);
  return initial;
};

export const saveLocalDatabase = (db: ErpDatabase): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Ignore storage quota errors
  }
};

export const loadDatabase = async (): Promise<ErpDatabase> => {
  const localDb = loadLocalDatabase();

  if (!isSupabaseConfigured() || !supabase) {
    return localDb;
  }

  try {
    const [
      semRes,
      stuRes,
      facRes,
      subRes,
      exmRes,
      mkRes,
      resRes,
      grRes,
    ] = await Promise.all([
      supabase.from('semesters').select('*'),
      supabase.from('students').select('*'),
      supabase.from('faculty').select('*'),
      supabase.from('subjects').select('*'),
      supabase.from('examinations').select('*'),
      supabase.from('marks').select('*'),
      supabase.from('results').select('*'),
      supabase.from('grade_rules').select('*'),
    ]);

    const merged: ErpDatabase = {
      semesters: semRes.data && semRes.data.length > 0 ? (semRes.data as Semester[]) : localDb.semesters,
      students: stuRes.data && stuRes.data.length > 0 ? (stuRes.data as Student[]) : localDb.students,
      faculty: facRes.data && facRes.data.length > 0 ? (facRes.data as Faculty[]) : localDb.faculty,
      subjects: subRes.data && subRes.data.length > 0 ? (subRes.data as Subject[]) : localDb.subjects,
      examinations:
        exmRes.data && exmRes.data.length > 0 ? (exmRes.data as Examination[]) : localDb.examinations,
      marks: mkRes.data && mkRes.data.length > 0 ? (mkRes.data as MarkRecord[]) : localDb.marks,
      results: resRes.data && resRes.data.length > 0 ? (resRes.data as ResultSummary[]) : localDb.results,
      grade_rules:
        grRes.data && grRes.data.length > 0 ? (grRes.data as GradeRule[]) : localDb.grade_rules,
      passwords: localDb.passwords,
    };
    saveLocalDatabase(merged);
    return merged;
  } catch {
    return localDb;
  }
};

export const syncTableUpsert = async <T extends {id: string}>(
  table: string,
  records: T | T[]
): Promise<void> => {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    await supabase.from(table).upsert(records);
  } catch {
    // Keep local persistence active even if remote schema isn't migrated yet
  }
};

export const syncTableDelete = async (table: string, id: string): Promise<void> => {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    await supabase.from(table).delete().eq('id', id);
  } catch {
    // Graceful fallback
  }
};

export const resetDemoDatabase = (): ErpDatabase => {
  const fresh = createSeededWithInitialResults();
  saveLocalDatabase(fresh);
  return fresh;
};

export const authenticateUser = (
  db: ErpDatabase,
  role: UserRole,
  identifierOrEmail: string,
  password: string
): {user: AuthUser | null; error?: string} => {
  const input = identifierOrEmail.trim().toLowerCase();
  if (!input) {
    return {user: null, error: 'Please enter your institutional email or ID / Roll Number.'};
  }
  if (!password) {
    return {user: null, error: 'Please enter your password.'};
  }

  if (role === UserRole.ADMIN) {
    const admin = DEMO_USERS[UserRole.ADMIN];
    const validId =
      input === admin.email.toLowerCase() || input === admin.identifier.toLowerCase();
    const expected = db.passwords[admin.email] || db.passwords[admin.identifier] || 'vvit@2025';
    if (!validId || password !== expected) {
      return {user: null, error: 'Invalid Admin credentials. Demo password is vvit@2025.'};
    }
    return {user: admin};
  }

  if (role === UserRole.HOD) {
    const hodFaculty = db.faculty.find(
      (f) =>
        f.is_hod &&
        (f.email.toLowerCase() === input || f.faculty_id.toLowerCase() === input)
    );
    if (!hodFaculty) {
      return {user: null, error: 'No HOD account found matching that email or Faculty ID.'};
    }
    const expected =
      db.passwords[hodFaculty.email] || db.passwords[hodFaculty.faculty_id] || 'vvit@2025';
    if (password !== expected) {
      return {user: null, error: 'Incorrect password for HOD account.'};
    }
    return {
      user: {
        id: hodFaculty.id,
        role: UserRole.HOD,
        name: hodFaculty.name,
        email: hodFaculty.email,
        identifier: hodFaculty.faculty_id,
        department: hodFaculty.department,
        designation: hodFaculty.designation,
        assignedSubjectCodes: hodFaculty.assigned_subjects,
      },
    };
  }

  if (role === UserRole.FACULTY) {
    const faculty = db.faculty.find(
      (f) => f.email.toLowerCase() === input || f.faculty_id.toLowerCase() === input
    );
    if (!faculty) {
      return {user: null, error: 'No Faculty record found matching that email or Faculty ID.'};
    }
    const expected =
      db.passwords[faculty.email] || db.passwords[faculty.faculty_id] || 'vvit@2025';
    if (password !== expected) {
      return {user: null, error: 'Incorrect password for Faculty account.'};
    }
    return {
      user: {
        id: faculty.id,
        role: UserRole.FACULTY,
        name: faculty.name,
        email: faculty.email,
        identifier: faculty.faculty_id,
        department: faculty.department,
        designation: faculty.designation,
        assignedSubjectCodes: faculty.assigned_subjects,
      },
    };
  }

  // Student
  const student = db.students.find(
    (s) => s.email.toLowerCase() === input || s.roll_no.toLowerCase() === input
  );
  if (!student) {
    return {user: null, error: 'No Student record found with that Roll Number or Email.'};
  }
  const expected =
    db.passwords[student.email] || db.passwords[student.roll_no] || 'vvit@2025';
  if (password !== expected) {
    return {user: null, error: 'Incorrect password for Student account.'};
  }
  return {
    user: {
      id: student.id,
      role: UserRole.STUDENT,
      name: student.name,
      email: student.email,
      identifier: student.roll_no,
      department: student.department,
      batch: student.batch,
      semesterId: student.semester_id,
    },
  };
};

export const upsertMarkBatch = (
  db: ErpDatabase,
  entries: {student_id: string; marks_obtained: number}[],
  subjectId: string,
  examinationId: string,
  semesterId: string,
  status: MarkWorkflowStatus,
  updatedBy: string,
  hodRemark?: string
): ErpDatabase => {
  const nowIso = new Date().toISOString();
  const nextMarks = [...db.marks];

  for (const entry of entries) {
    const idx = nextMarks.findIndex(
      (m) =>
        m.student_id === entry.student_id &&
        m.subject_id === subjectId &&
        m.examination_id === examinationId
    );
    if (idx >= 0) {
      nextMarks[idx] = {
        ...nextMarks[idx],
        marks_obtained: entry.marks_obtained,
        status,
        hod_remark: hodRemark ?? nextMarks[idx].hod_remark,
        updated_at: nowIso,
        updated_by: updatedBy,
      };
    } else {
      nextMarks.push({
        id: `mk-${examinationId}-${subjectId}-${entry.student_id}`,
        student_id: entry.student_id,
        subject_id: subjectId,
        examination_id: examinationId,
        semester_id: semesterId,
        marks_obtained: entry.marks_obtained,
        status,
        hod_remark: hodRemark,
        updated_at: nowIso,
        updated_by: updatedBy,
      });
    }
  }

  return {...db, marks: nextMarks};
};
