export enum UserRole {
  ADMIN = 'Admin',
  HOD = 'HOD',
  FACULTY = 'Faculty',
  STUDENT = 'Student',
}

export type MarkWorkflowStatus = 'Draft' | 'Submitted' | 'HOD_Approved';

export interface AuthUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  identifier: string; // Roll No for Student, Faculty ID for Faculty/HOD, Admin ID for Admin
  department: string;
  designation?: string;
  batch?: string;
  semesterId?: string;
  assignedSubjectCodes?: string[];
  password?: string;
}

export interface Semester {
  id: string;
  code: string;
  name: string;
  academic_year: string;
  is_active: boolean;
}

export interface Student {
  id: string;
  roll_no: string;
  name: string;
  email: string;
  department: string;
  batch: string;
  semester_id: string;
  phone: string;
  status: 'Active' | 'Inactive';
}

export interface Faculty {
  id: string;
  faculty_id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  phone: string;
  assigned_subjects: string[];
  is_hod: boolean;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  semester_id: string;
  credits: number;
  max_marks: number;
  pass_marks: number;
  faculty_id: string;
}

export interface Examination {
  id: string;
  exam_code: string;
  title: string;
  semester_id: string;
  exam_type: 'Regular' | 'Mid-Term' | 'Supplementary';
  exam_date: string;
  status: 'Scheduled' | 'Ongoing' | 'Completed';
}

export interface MarkRecord {
  id: string;
  student_id: string;
  subject_id: string;
  examination_id: string;
  semester_id: string;
  marks_obtained: number;
  status: MarkWorkflowStatus;
  hod_remark?: string;
  updated_at: string;
  updated_by: string;
}

export interface GradeRule {
  id: string;
  grade: string;
  min_percentage: number;
  max_percentage: number;
  grade_points: number;
  description: string;
}

export interface SubjectResultLine {
  subject_id: string;
  subject_code: string;
  subject_name: string;
  credits: number;
  max_marks: number;
  pass_marks: number;
  marks_obtained: number;
  grade: string;
  grade_points: number;
  passed: boolean;
}

export interface ResultSummary {
  id: string;
  student_id: string;
  roll_no: string;
  student_name: string;
  examination_id: string;
  semester_id: string;
  total_obtained: number;
  total_max: number;
  percentage: number;
  sgpa: number;
  overall_grade: string;
  result_status: 'PASS' | 'FAIL';
  failed_subjects: number;
  is_published: boolean;
  calculated_at: string;
  published_at?: string;
  subject_lines: SubjectResultLine[];
}

export interface ErpDatabase {
  semesters: Semester[];
  students: Student[];
  faculty: Faculty[];
  subjects: Subject[];
  examinations: Examination[];
  marks: MarkRecord[];
  results: ResultSummary[];
  grade_rules: GradeRule[];
  passwords: Record<string, string>;
}

export type AppRoute =
  | 'overview'
  | 'students'
  | 'faculty'
  | 'subjects'
  | 'semesters'
  | 'examinations'
  | 'marks-entry'
  | 'hod-review'
  | 'result-management'
  | 'student-results'
  | 'reports'
  | 'settings';
