import {useCallback, useEffect, useState} from 'react';
import {AppShell} from './components/AppShell';
import {BrandLoader} from './components/BrandLoader';
import {AdminCrudPages} from './pages/AdminCrudPages';
import {DashboardOverview} from './pages/DashboardOverview';
import {FacultyMarksPage} from './pages/FacultyMarksPage';
import {HodReviewPage} from './pages/HodReviewPage';
import {LoginPage} from './pages/LoginPage';
import {ReportsAnalyticsPage} from './pages/ReportsAnalyticsPage';
import {ResultManagementPage} from './pages/ResultManagementPage';
import {SettingsPage} from './pages/SettingsPage';
import {StudentDashboardPage} from './pages/StudentDashboardPage';
import {
  loadDatabase,
  loadLocalDatabase,
  resetDemoDatabase,
  saveLocalDatabase,
  syncTableDelete,
  syncTableUpsert,
  upsertMarkBatch,
} from './services/dataService';
import {
  AppRoute,
  AuthUser,
  ErpDatabase,
  Examination,
  Faculty,
  GradeRule,
  MarkWorkflowStatus,
  ResultSummary,
  Semester,
  Student,
  Subject,
  UserRole,
} from './types/erp';

const SESSION_KEY = 'vvit_smart_result_session_v1';
const THEME_KEY = 'vvit_smart_result_theme_v1';

const getDefaultRouteForRole = (role: UserRole): AppRoute => {
  if (role === UserRole.STUDENT) return 'student-results';
  return 'overview';
};

const getAllowedRoutes = (role: UserRole): AppRoute[] => {
  switch (role) {
    case UserRole.ADMIN:
      return [
        'overview',
        'students',
        'faculty',
        'subjects',
        'semesters',
        'examinations',
        'result-management',
        'reports',
        'settings',
      ];
    case UserRole.HOD:
      return ['overview', 'hod-review', 'reports', 'settings'];
    case UserRole.FACULTY:
      return ['overview', 'marks-entry', 'reports', 'settings'];
    case UserRole.STUDENT:
      return ['student-results', 'settings'];
  }
};

export default function App() {
  const [db, setDb] = useState<ErpDatabase>(() => loadLocalDatabase());
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      return saved ? (JSON.parse(saved) as AuthUser) : null;
    } catch {
      return null;
    }
  });
  const [activeRoute, setActiveRoute] = useState<AppRoute>(() =>
    user ? getDefaultRouteForRole(user.role) : 'overview'
  );
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'dark';
    } catch {
      return false;
    }
  });
  const [initializing, setInitializing] = useState<boolean>(true);
  const [sessionTransitioning, setSessionTransitioning] = useState<boolean>(false);

  // Sync dark class to documentElement
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    } catch {
      // Ignore
    }
  }, [isDark]);

  // Initial hybrid load (Supabase if configured + localStorage)
  useEffect(() => {
    let active = true;
    loadDatabase()
      .then((loaded) => {
        if (active) {
          setDb(loaded);
          setInitializing(false);
        }
      })
      .catch(() => {
        if (active) setInitializing(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const updateDb = useCallback((updater: (prev: ErpDatabase) => ErpDatabase) => {
    setDb((prev) => {
      const next = updater(prev);
      saveLocalDatabase(next);
      return next;
    });
  }, []);

  const handleLoginSuccess = (authenticatedUser: AuthUser) => {
    setSessionTransitioning(true);
    window.setTimeout(() => {
      setUser(authenticatedUser);
      setActiveRoute(getDefaultRouteForRole(authenticatedUser.role));
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(authenticatedUser));
      } catch {
        // Ignore
      }
      setSessionTransitioning(false);
    }, 320);
  };

  const handleLogout = () => {
    setUser(null);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // Ignore
    }
  };

  const handleNavigate = (route: AppRoute) => {
    if (!user) return;
    const allowed = getAllowedRoutes(user.role);
    if (allowed.includes(route)) {
      setActiveRoute(route);
    }
  };

  const handleResetPasswordFromLogin = (identifierOrEmail: string, newPass: string): boolean => {
    const target = identifierOrEmail.trim().toLowerCase();
    const stu = db.students.find(
      (s) => s.email.toLowerCase() === target || s.roll_no.toLowerCase() === target
    );
    const fac = db.faculty.find(
      (f) => f.email.toLowerCase() === target || f.faculty_id.toLowerCase() === target
    );
    const isAdmin =
      target === 'coe.admin@vvit.edu.in' || target === 'vvit-coe-01';

    if (!stu && !fac && !isAdmin) {
      return false;
    }

    updateDb((prev) => {
      const nextPasswords = {...prev.passwords};
      if (stu) {
        nextPasswords[stu.email] = newPass;
        nextPasswords[stu.roll_no] = newPass;
      } else if (fac) {
        nextPasswords[fac.email] = newPass;
        nextPasswords[fac.faculty_id] = newPass;
      } else {
        nextPasswords['coe.admin@vvit.edu.in'] = newPass;
        nextPasswords['VVIT-COE-01'] = newPass;
      }
      return {...prev, passwords: nextPasswords};
    });
    return true;
  };

  // --- CRUD Handlers ---
  const handleSaveStudent = (student: Student) => {
    updateDb((prev) => {
      const exists = prev.students.some((s) => s.id === student.id);
      const students = exists
        ? prev.students.map((s) => (s.id === student.id ? student : s))
        : [...prev.students, student];
      const passwords = {...prev.passwords};
      if (!passwords[student.roll_no]) passwords[student.roll_no] = 'vvit@2025';
      if (!passwords[student.email]) passwords[student.email] = 'vvit@2025';
      return {...prev, students, passwords};
    });
    void syncTableUpsert('students', student);
  };

  const handleDeleteStudent = (id: string) => {
    updateDb((prev) => ({
      ...prev,
      students: prev.students.filter((s) => s.id !== id),
      marks: prev.marks.filter((m) => m.student_id !== id),
      results: prev.results.filter((r) => r.student_id !== id),
    }));
    void syncTableDelete('students', id);
  };

  const handleSaveFaculty = (fac: Faculty) => {
    updateDb((prev) => {
      const exists = prev.faculty.some((f) => f.id === fac.id);
      const faculty = exists
        ? prev.faculty.map((f) => (f.id === fac.id ? fac : f))
        : [...prev.faculty, fac];
      const passwords = {...prev.passwords};
      if (!passwords[fac.faculty_id]) passwords[fac.faculty_id] = 'vvit@2025';
      if (!passwords[fac.email]) passwords[fac.email] = 'vvit@2025';
      return {...prev, faculty, passwords};
    });
    void syncTableUpsert('faculty', fac);
  };

  const handleDeleteFaculty = (id: string) => {
    updateDb((prev) => ({
      ...prev,
      faculty: prev.faculty.filter((f) => f.id !== id),
    }));
    void syncTableDelete('faculty', id);
  };

  const handleSaveSubject = (subject: Subject) => {
    updateDb((prev) => {
      const exists = prev.subjects.some((s) => s.id === subject.id);
      const subjects = exists
        ? prev.subjects.map((s) => (s.id === subject.id ? subject : s))
        : [...prev.subjects, subject];
      return {...prev, subjects};
    });
    void syncTableUpsert('subjects', subject);
  };

  const handleDeleteSubject = (id: string) => {
    updateDb((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s.id !== id),
      marks: prev.marks.filter((m) => m.subject_id !== id),
    }));
    void syncTableDelete('subjects', id);
  };

  const handleSaveSemester = (semester: Semester) => {
    updateDb((prev) => {
      const exists = prev.semesters.some((s) => s.id === semester.id);
      const base = semester.is_active
        ? prev.semesters.map((s) => ({...s, is_active: false}))
        : prev.semesters;
      const semesters = exists
        ? base.map((s) => (s.id === semester.id ? semester : s))
        : [...base, semester];
      return {...prev, semesters};
    });
    void syncTableUpsert('semesters', semester);
  };

  const handleDeleteSemester = (id: string) => {
    updateDb((prev) => ({
      ...prev,
      semesters: prev.semesters.filter((s) => s.id !== id),
    }));
    void syncTableDelete('semesters', id);
  };

  const handleSaveExamination = (exam: Examination) => {
    updateDb((prev) => {
      const exists = prev.examinations.some((e) => e.id === exam.id);
      const examinations = exists
        ? prev.examinations.map((e) => (e.id === exam.id ? exam : e))
        : [...prev.examinations, exam];
      return {...prev, examinations};
    });
    void syncTableUpsert('examinations', exam);
  };

  const handleDeleteExamination = (id: string) => {
    updateDb((prev) => ({
      ...prev,
      examinations: prev.examinations.filter((e) => e.id !== id),
      marks: prev.marks.filter((m) => m.examination_id !== id),
      results: prev.results.filter((r) => r.examination_id !== id),
    }));
    void syncTableDelete('examinations', id);
  };

  // --- Faculty Marks Save / Submit ---
  const handleSaveMarksBatch = (
    entries: {student_id: string; marks_obtained: number}[],
    subjectId: string,
    examinationId: string,
    semesterId: string,
    status: MarkWorkflowStatus
  ) => {
    updateDb((prev) => {
      const next = upsertMarkBatch(
        prev,
        entries,
        subjectId,
        examinationId,
        semesterId,
        status,
        user?.name || 'Faculty',
        status === 'Submitted' ? '' : undefined
      );
      const changed = next.marks.filter(
        (m) => m.subject_id === subjectId && m.examination_id === examinationId
      );
      void syncTableUpsert('marks', changed);
      return next;
    });
  };

  // --- HOD Approve / Return ---
  const handleUpdateSubjectStatus = (
    examinationId: string,
    subjectId: string,
    nextStatus: MarkWorkflowStatus,
    remark?: string
  ) => {
    const nowIso = new Date().toISOString();
    updateDb((prev) => {
      const marks = prev.marks.map((m) =>
        m.examination_id === examinationId && m.subject_id === subjectId
          ? {
              ...m,
              status: nextStatus,
              hod_remark: nextStatus === 'Draft' ? remark : '',
              updated_at: nowIso,
              updated_by: user?.name || 'HOD',
            }
          : m
      );
      const updated = marks.filter(
        (m) => m.examination_id === examinationId && m.subject_id === subjectId
      );
      void syncTableUpsert('marks', updated);
      return {...prev, marks};
    });
  };

  // --- Admin Result Calculation & Publish ---
  const handleSaveCalculatedResults = (examinationId: string, calculated: ResultSummary[]) => {
    updateDb((prev) => {
      const others = prev.results.filter((r) => r.examination_id !== examinationId);
      return {...prev, results: [...others, ...calculated]};
    });
    void syncTableUpsert('results', calculated);
  };

  const handleTogglePublishResults = (examinationId: string, publish: boolean) => {
    const nowIso = new Date().toISOString();
    updateDb((prev) => {
      const results = prev.results.map((r) =>
        r.examination_id === examinationId
          ? {
              ...r,
              is_published: publish,
              published_at: publish ? nowIso : undefined,
            }
          : r
      );
      const updated = results.filter((r) => r.examination_id === examinationId);
      void syncTableUpsert('results', updated);
      return {...prev, results};
    });
  };

  // --- Settings Handlers ---
  const handleChangePassword = (
    currentPass: string,
    newPass: string
  ): {ok: boolean; message: string} => {
    if (!user) return {ok: false, message: 'No active session.'};
    const expected =
      db.passwords[user.email] || db.passwords[user.identifier] || 'vvit@2025';
    if (currentPass !== expected) {
      return {ok: false, message: 'Current password is incorrect.'};
    }
    updateDb((prev) => ({
      ...prev,
      passwords: {
        ...prev.passwords,
        [user.email]: newPass,
        [user.identifier]: newPass,
      },
    }));
    return {ok: true, message: 'Password updated successfully.'};
  };

  const handleSaveGradeRules = (rules: GradeRule[]) => {
    updateDb((prev) => ({...prev, grade_rules: rules}));
    void syncTableUpsert('grade_rules', rules);
  };

  const handleResetDemoData = () => {
    const fresh = resetDemoDatabase();
    setDb(fresh);
  };

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <BrandLoader size="lg" label="Loading VVIT SMART RESULT Portal..." />
      </div>
    );
  }

  if (sessionTransitioning) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <BrandLoader size="lg" label="Establishing Academic Role Session..." />
      </div>
    );
  }

  if (!user) {
    return (
      <LoginPage
        db={db}
        isDark={isDark}
        onToggleTheme={() => setIsDark((d) => !d)}
        onLoginSuccess={handleLoginSuccess}
        onResetPassword={handleResetPasswordFromLogin}
      />
    );
  }

  const allowedRoutes = getAllowedRoutes(user.role);
  const effectiveRoute = allowedRoutes.includes(activeRoute)
    ? activeRoute
    : getDefaultRouteForRole(user.role);

  return (
    <AppShell
      user={user}
      activeRoute={effectiveRoute}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      isDark={isDark}
      onToggleTheme={() => setIsDark((d) => !d)}
    >
      {effectiveRoute === 'overview' && (
        <DashboardOverview user={user} db={db} isDark={isDark} onNavigate={handleNavigate} />
      )}

      {(effectiveRoute === 'students' ||
        effectiveRoute === 'faculty' ||
        effectiveRoute === 'subjects' ||
        effectiveRoute === 'semesters' ||
        effectiveRoute === 'examinations') && (
        <AdminCrudPages
          section={effectiveRoute}
          db={db}
          onSaveStudent={handleSaveStudent}
          onDeleteStudent={handleDeleteStudent}
          onSaveFaculty={handleSaveFaculty}
          onDeleteFaculty={handleDeleteFaculty}
          onSaveSubject={handleSaveSubject}
          onDeleteSubject={handleDeleteSubject}
          onSaveSemester={handleSaveSemester}
          onDeleteSemester={handleDeleteSemester}
          onSaveExamination={handleSaveExamination}
          onDeleteExamination={handleDeleteExamination}
        />
      )}

      {effectiveRoute === 'marks-entry' && (
        <FacultyMarksPage user={user} db={db} onSaveMarks={handleSaveMarksBatch} />
      )}

      {effectiveRoute === 'hod-review' && (
        <HodReviewPage db={db} onUpdateSubjectStatus={handleUpdateSubjectStatus} />
      )}

      {effectiveRoute === 'result-management' && (
        <ResultManagementPage
          db={db}
          onSaveCalculatedResults={handleSaveCalculatedResults}
          onTogglePublishResults={handleTogglePublishResults}
        />
      )}

      {effectiveRoute === 'student-results' && (
        <StudentDashboardPage user={user} db={db} />
      )}

      {effectiveRoute === 'reports' && (
        <ReportsAnalyticsPage db={db} isDark={isDark} />
      )}

      {effectiveRoute === 'settings' && (
        <SettingsPage
          user={user}
          db={db}
          isDark={isDark}
          onToggleTheme={() => setIsDark((d) => !d)}
          onChangePassword={handleChangePassword}
          onSaveGradeRules={handleSaveGradeRules}
          onResetDemoData={handleResetDemoData}
        />
      )}
    </AppShell>
  );
}
