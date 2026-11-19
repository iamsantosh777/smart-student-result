import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {VVIT_INSTITUTION} from '../data/vvitSeed';
import {Examination, ResultSummary, Semester, Student} from '../types/erp';

export const downloadCsv = (filename: string, headers: string[], rows: (string | number)[][]): void => {
  const escapeCell = (val: string | number): string => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadStudentGradeMemoPdf = (
  result: ResultSummary,
  student: Student,
  semester: Semester | undefined,
  examination: Examination | undefined
): void => {
  const doc = new jsPDF({orientation: 'portrait', unit: 'mm', format: 'a4'});
  const pageWidth = doc.internal.pageSize.getWidth();

  // Deep Navy Header Banner
  doc.setFillColor(15, 23, 42); // #0f172a
  doc.rect(0, 0, pageWidth, 34, 'F');

  doc.setFillColor(30, 58, 138); // #1e3a8a accent strip
  doc.rect(0, 34, pageWidth, 2.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(VVIT_INSTITUTION.fullName.toUpperCase(), pageWidth / 2, 13, {align: 'center'});

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `${VVIT_INSTITUTION.department} · ${VVIT_INSTITUTION.location}`,
    pageWidth / 2,
    20,
    {align: 'center'}
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(147, 197, 253);
  doc.text('OFFICIAL PROVISIONAL GRADE MEMORANDUM', pageWidth / 2, 28, {align: 'center'});

  // Student & Exam Details Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 43, pageWidth - 28, 32, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);

  const leftColX = 19;
  const rightColX = 112;

  doc.setFont('helvetica', 'bold');
  doc.text('Roll Number:', leftColX, 51);
  doc.setFont('helvetica', 'normal');
  doc.text(student.roll_no, leftColX + 30, 51);

  doc.setFont('helvetica', 'bold');
  doc.text('Student Name:', leftColX, 58);
  doc.setFont('helvetica', 'normal');
  doc.text(student.name, leftColX + 30, 58);

  doc.setFont('helvetica', 'bold');
  doc.text('Department:', leftColX, 65);
  doc.setFont('helvetica', 'normal');
  doc.text(student.department, leftColX + 30, 65);

  doc.setFont('helvetica', 'bold');
  doc.text('Batch:', leftColX, 71);
  doc.setFont('helvetica', 'normal');
  doc.text(student.batch, leftColX + 30, 71);

  doc.setFont('helvetica', 'bold');
  doc.text('Semester:', rightColX, 51);
  doc.setFont('helvetica', 'normal');
  doc.text(`${semester?.name || 'Semester III'} (${semester?.academic_year || '2025-26'})`, rightColX + 26, 51);

  doc.setFont('helvetica', 'bold');
  doc.text('Examination:', rightColX, 58);
  doc.setFont('helvetica', 'normal');
  doc.text(examination?.title || 'Semester Examination', rightColX + 26, 58, {maxWidth: 62});

  doc.setFont('helvetica', 'bold');
  doc.text('Exam Code:', rightColX, 65);
  doc.setFont('helvetica', 'normal');
  doc.text(examination?.exam_code || 'EXM-2025', rightColX + 26, 65);

  doc.setFont('helvetica', 'bold');
  doc.text('Published:', rightColX, 71);
  doc.setFont('helvetica', 'normal');
  doc.text(
    result.published_at ? new Date(result.published_at).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
    rightColX + 26,
    71
  );

  // Subject Marks Table
  autoTable(doc, {
    startY: 82,
    margin: {left: 14, right: 14},
    head: [['Code', 'Subject Title', 'Credits', 'Max', 'Pass', 'Scored', 'Grade', 'Status']],
    body: result.subject_lines.map((line) => [
      line.subject_code,
      line.subject_name,
      line.credits.toString(),
      line.max_marks.toString(),
      line.pass_marks.toString(),
      line.marks_obtained.toString(),
      line.grade,
      line.passed ? 'PASS' : 'FAIL',
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: {cellWidth: 21, halign: 'center', fontStyle: 'bold'},
      1: {cellWidth: 'auto', halign: 'left'},
      2: {cellWidth: 15, halign: 'center'},
      3: {cellWidth: 14, halign: 'center'},
      4: {cellWidth: 14, halign: 'center'},
      5: {cellWidth: 16, halign: 'center', fontStyle: 'bold'},
      6: {cellWidth: 15, halign: 'center', fontStyle: 'bold'},
      7: {cellWidth: 18, halign: 'center', fontStyle: 'bold'},
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 7) {
        const val = String(data.cell.raw);
        if (val === 'PASS') {
          data.cell.styles.textColor = [22, 163, 74];
        } else {
          data.cell.styles.textColor = [220, 38, 38];
        }
      }
    },
  });

  const finalY = (doc as unknown as {lastAutoTable?: {finalY: number}}).lastAutoTable?.finalY || 145;

  // Overall Summary Box
  doc.setDrawColor(30, 58, 138);
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, finalY + 8, pageWidth - 28, 24, 2, 2, 'FD');

  const summaryY = finalY + 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('TOTAL MARKS', 22, summaryY);
  doc.text('PERCENTAGE', 68, summaryY);
  doc.text('SGPA', 110, summaryY);
  doc.text('OVERALL GRADE', 138, summaryY);
  doc.text('RESULT', 176, summaryY);

  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${result.total_obtained} / ${result.total_max}`, 22, summaryY + 7);
  doc.text(`${result.percentage.toFixed(2)}%`, 68, summaryY + 7);
  doc.text(result.sgpa.toFixed(2), 110, summaryY + 7);
  doc.text(result.overall_grade, 138, summaryY + 7);

  if (result.result_status === 'PASS') {
    doc.setTextColor(22, 163, 74);
  } else {
    doc.setTextColor(220, 38, 38);
  }
  doc.text(result.result_status, 176, summaryY + 7);

  // Verification & Signature Footer
  const sigY = finalY + 58;
  doc.setDrawColor(148, 163, 184);
  doc.line(18, sigY, 72, sigY);
  doc.line(pageWidth - 72, sigY, pageWidth - 18, sigY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Head of Department · CSE (AI & ML)', 45, sigY + 5, {align: 'center'});
  doc.text('Controller of Examinations', pageWidth - 45, sigY + 5, {align: 'center'});

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Generated via VVIT SMART RESULT ERP · Memo ID: ${result.id.toUpperCase()} · ${new Date().toLocaleString('en-IN')}`,
    pageWidth / 2,
    284,
    {align: 'center'}
  );

  doc.save(`VVIT_GradeMemo_${student.roll_no}_${examination?.exam_code || 'RESULT'}.pdf`);
};

export const downloadReportPdf = (
  title: string,
  subtitle: string,
  headers: string[],
  rows: (string | number)[][],
  filename: string
): void => {
  const doc = new jsPDF({orientation: 'landscape', unit: 'mm', format: 'a4'});
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 26, 'F');
  doc.setFillColor(29, 78, 216);
  doc.rect(0, 26, pageWidth, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`${VVIT_INSTITUTION.fullName} — ${title}`, 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`${VVIT_INSTITUTION.department} · ${subtitle}`, 14, 18.5);

  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - 14, 18.5, {
    align: 'right',
  });

  autoTable(doc, {
    startY: 33,
    margin: {left: 14, right: 14},
    head: [headers],
    body: rows.map((r) => r.map((cell) => String(cell))),
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
    },
  });

  doc.save(filename);
};
