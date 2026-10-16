import { jsPDF } from 'jspdf';
import { User, CampusEvent, PermissionForm } from '../types';

export interface LeaveApplicationData {
  student: User;
  event: CampusEvent;
  applicationDate?: string;
  hodName?: string;
}

export function formatEventDateRange(startDateStr: string, endDateStr: string): string {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  const startFormatted = start.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Check if same calendar day
  const isSameDay = 
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (isSameDay) {
    const timeStr = `${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    return `${startFormatted} (${timeStr})`;
  } else {
    const endFormatted = end.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    const diffDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    return `${startFormatted} to ${endFormatted} (${diffDays} days)`;
  }
}

export function checkMissingProfileFields(student: User): string[] {
  const missing: string[] = [];
  if (!student.name?.trim()) missing.push('Full Name');
  if (!student.studentId?.trim()) missing.push('Student ID / Roll No');
  if (!student.course?.trim()) missing.push('Course / Program');
  if (!student.department?.trim()) missing.push('Department');
  if (!student.year?.trim()) missing.push('Academic Year / Semester');
  return missing;
}

/**
 * Generates the formal short leave application as a clean, 1-page PDF using jsPDF
 */
export function generatePersonalizedLeavePdf(
  student: User,
  event: CampusEvent,
  applicationDate: string = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
): jsPDF {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4', // 595 x 842 pt
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 54; // 0.75 inch
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Header Banner / Watermark notice
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('CAMPUSGUARD — OFFICIAL STUDENT LEAVE REQUEST DRAFT', margin, y);
  doc.text(`Ref: CG-${event.id.slice(0, 6).toUpperCase()}-${student.studentId || 'DRAFT'}`, pageWidth - margin, y, { align: 'right' });

  y += 10;
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(margin, y, pageWidth - margin, y);
  y += 30;

  // Recipient Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('To,', margin, y);
  y += 18;
  doc.text('The Head of Department', margin, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.text(student.department || '[Department Name]', margin, y);
  y += 16;
  doc.text(student.universityName || 'GLA UNIVERSITY MATHURA', margin, y);
  y += 32;

  // Subject line
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const subjectText = `Subject: Request for Leave to Attend University Event (${event.title})`;
  doc.text(subjectText, margin, y);
  y += 24;

  // Salutation
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Respected Sir/Madam,', margin, y);
  y += 20;

  // Body Paragraph 1
  const dateRangeStr = formatEventDateRange(event.startDate, event.endDate);
  const studentName = student.name || '[Student Name]';
  const studentCourse = student.course || '[Course]';
  const studentYear = student.year || '[Year/Semester]';
  const studentDept = student.department || '[Department Name]';
  const eventName = event.title;
  const eventVenue = event.venue;

  const paragraph1 = `I am ${studentName}, a student of ${studentCourse}, ${studentYear}, in the ${studentDept}. I have successfully registered for the official campus event "${eventName}", scheduled on ${dateRangeStr} at ${eventVenue}, organized by ${event.organizerClub || event.organizerName}.`;
  
  const lines1 = doc.splitTextToSize(paragraph1, contentWidth);
  doc.text(lines1, margin, y);
  y += lines1.length * 16 + 12;

  // Body Paragraph 2
  const paragraph2 = `I kindly request permission to be excused from my regular classes and academic sessions for the required duration to participate in this event and represent our university. I assure you that I will make up for all academic topics and assignments covered during my absence.`;
  const lines2 = doc.splitTextToSize(paragraph2, contentWidth);
  doc.text(lines2, margin, y);
  y += lines2.length * 16 + 14;

  // Event Quick Details Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.roundedRect(margin, y, contentWidth, 75, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('Event Registration & Leave Schedule Details:', margin + 14, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`• Event: ${event.title} (${event.category})`, margin + 14, y + 34);
  doc.text(`• Date & Time: ${dateRangeStr}`, margin + 14, y + 48);
  doc.text(`• Venue: ${eventVenue} | Host: ${event.organizerClub}`, margin + 14, y + 62);
  y += 95;

  // Thank you
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Thank you for your consideration.', margin, y);
  y += 36;

  // Sign-off
  doc.text('Yours sincerely,', margin, y);
  y += 20;
  doc.setFont('helvetica', 'bold');
  doc.text(studentName, margin, y);
  y += 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Student ID / Roll No: ${student.studentId || '[Student ID]'}`, margin, y);
  y += 14;
  doc.text(`${studentCourse} | ${studentDept}`, margin, y);
  y += 14;
  doc.text(`Date of Application: ${applicationDate}`, margin, y);
  y += 40;

  // HOD Endorsement / Remarks Area (For physical signing)
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('FOR HEAD OF DEPARTMENT / FACULTY ADVISOR USE ONLY:', margin, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.text('[  ] Approved with Attendance Exemption     [  ] Forwarded to Dean     [  ] Not Recommended', margin, y);
  y += 30;
  doc.text('HOD Signature: _______________________      Date: ______________      Official Seal: [            ]', margin, y);

  // Disclaimer footer
  const footerY = doc.internal.pageSize.getHeight() - 30;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    'IMPORTANT NOTICE: This is an automatically generated draft application. It must be printed, signed, and approved by the HOD. It does NOT constitute an approved leave certificate on its own.',
    pageWidth / 2,
    footerY,
    { align: 'center', maxWidth: contentWidth }
  );

  return doc;
}

/**
 * Downloads the personalized leave letter as a PDF
 */
export function downloadPersonalizedLeavePdf(student: User, event: CampusEvent): void {
  const doc = generatePersonalizedLeavePdf(student, event);
  const safeTitle = event.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
  const safeStudent = (student.name || 'Student').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Leave_Application_${safeTitle}_${safeStudent}.pdf`);
}

/**
 * Generates an official sample leave form PDF for organizers to test the upload feature
 */
export function generateOfficialTemplateSamplePdf(event: CampusEvent): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Official Seal Box
  doc.setFillColor(30, 58, 138); // blue-900
  doc.rect(margin, y, contentWidth, 60, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('OFFICIAL EVENT LEAVE & EXEMPTION FORM', pageWidth / 2, y + 26, { align: 'center' });
  doc.setFontSize(10);
  doc.text('DEAN OF STUDENT AFFAIRS & CAMPUS SECURITY OFFICE', pageWidth / 2, y + 44, { align: 'center' });
  y += 85;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('SECTION A: EVENT DETAILS (VERIFIED BY ORGANIZER)', margin, y);
  y += 16;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Event Title: ${event.title}`, margin, y);
  y += 14;
  doc.text(`Organizing Club / Body: ${event.organizerClub} (Coordinator: ${event.organizerName})`, margin, y);
  y += 14;
  doc.text(`Scheduled Date: ${formatEventDateRange(event.startDate, event.endDate)}`, margin, y);
  y += 14;
  doc.text(`Venue: ${event.venue}`, margin, y);
  y += 14;
  doc.text(`Category: ${event.category} | Verification Code: CG-AUTH-${event.id.toUpperCase()}`, margin, y);
  y += 26;

  doc.setFont('helvetica', 'bold');
  doc.text('SECTION B: STUDENT SUBMISSION INSTRUCTIONS', margin, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  const instructions = [
    '1. Students must attach their event registration confirmation slip.',
    '2. Submit this form alongside your personalized leave application letter to your Department HOD.',
    '3. Obtain signature from the Faculty Coordinator at the event registration desk.',
    '4. Return the signed form to the Academic Affairs window within 3 working days post-event.'
  ];
  instructions.forEach(inst => {
    doc.text(inst, margin, y);
    y += 14;
  });
  y += 20;

  doc.setFont('helvetica', 'bold');
  doc.text('SECTION C: PARTICIPANT IDENTITY & SIGNATURE', margin, y);
  y += 18;
  doc.rect(margin, y, contentWidth, 80);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Student Full Name: ________________________________ Roll No: ____________________', margin + 12, y + 24);
  doc.text('Department: ______________________________________ Semester / Section: _________', margin + 12, y + 46);
  doc.text('Student Signature: ________________________________ Date: _______________________', margin + 12, y + 66);
  y += 105;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('SECTION D: APPROVAL OF HEAD OF DEPARTMENT', margin, y);
  y += 18;
  doc.rect(margin, y, contentWidth, 70);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Decision:   [   ] Granted   [   ] Rejected   [   ] Exemption With Caution', margin + 12, y + 22);
  doc.text('Reason / Remarks: ________________________________________________________________', margin + 12, y + 42);
  doc.text('HOD Signature & Stamp: ____________________________ Date: _______________________', margin + 12, y + 60);

  return doc;
}

/**
 * Generates an official permission & consent slip PDF
 */
export function generatePermissionSlipPdf(form: PermissionForm, student?: User): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Header Box
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(margin, y, contentWidth, 65, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('GLA UNIVERSITY MATHURA', pageWidth / 2, y + 24, { align: 'center' });
  doc.setFontSize(10);
  doc.text('OFFICIAL STUDENT PERMISSION & CONSENT SLIP', pageWidth / 2, y + 42, { align: 'center' });
  doc.setFontSize(8);
  doc.text(`ISSUED BY: ${(form.department || 'CAMPUS EVENT ADMINISTRATION').toUpperCase()}`, pageWidth / 2, y + 56, { align: 'center' });
  y += 88;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(form.title, margin, y);
  y += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Document Reference: REF-${form.id.toUpperCase()}`, margin, y);
  doc.text(`Effective Date: ${form.lastUpdated || new Date().toISOString().split('T')[0]}`, pageWidth - margin, y, { align: 'right' });
  y += 22;

  // Purpose / Requirement
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 58, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 58, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('PURPOSE & MANDATORY DIRECTIVES:', margin + 12, y + 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const purposeLines = doc.splitTextToSize(form.purpose, contentWidth - 24);
  doc.text(purposeLines, margin + 12, y + 32);
  y += 75;

  if (form.eventTitle) {
    doc.setFillColor(238, 242, 255); // indigo-50
    doc.rect(margin, y, contentWidth, 32, 'F');
    doc.setDrawColor(199, 210, 254);
    doc.rect(margin, y, contentWidth, 32, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(67, 56, 202);
    doc.text(`LINKED EVENT: ${form.eventTitle}`, margin + 12, y + 15);
    if (form.organizerName) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(79, 70, 229);
      doc.text(`Authorized Coordinator: ${form.organizerName}`, margin + 12, y + 26);
    }
    y += 46;
  }

  // Student Information Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('SECTION 1: STUDENT CREDENTIALS', margin, y);
  y += 14;

  doc.rect(margin, y, contentWidth, 80);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Student Name: ${student?.name || '__________________________________'}`, margin + 12, y + 22);
  doc.text(`Roll / University ID: ${student?.studentId || '____________________'}`, margin + 270, y + 22);
  doc.text(`Department: ${student?.department || '__________________________'}`, margin + 12, y + 44);
  doc.text(`Course / Year: ${student?.course || '__________'} (${student?.year || '____'})`, margin + 270, y + 44);
  doc.text(`Student Contact: ____________________________`, margin + 12, y + 66);
  doc.text(`Parent / Guardian Phone: ____________________`, margin + 270, y + 66);
  y += 100;

  // Undertaking & Signatures
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('SECTION 2: DECLARATION & AUTHORIZATION SIGNATURES', margin, y);
  y += 14;

  doc.rect(margin, y, contentWidth, 110);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('I hereby undertake full compliance with campus safety guidelines, event decorum, and academic regulations.', margin + 12, y + 18);
  
  y += 56;
  doc.text('_________________________________', margin + 20, y);
  doc.text('Student Signature & Date', margin + 20, y + 14);

  doc.text('_________________________________', margin + 190, y);
  doc.text('Parent / Guardian Signature', margin + 190, y + 14);

  doc.text('_________________________________', margin + 355, y);
  doc.text('Faculty Coordinator / HOD Seal', margin + 355, y + 14);

  return doc;
}

/**
 * Downloads a permission form file directly (data URL or generated PDF)
 */
export function downloadPermissionForm(form: PermissionForm, student?: User): void {
  if (form.fileDataUrl) {
    const link = document.createElement('a');
    link.href = form.fileDataUrl;
    link.download = form.fileName || `Permission_Slip_${form.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    const doc = generatePermissionSlipPdf(form, student);
    const rawName = form.fileName || `${form.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}.pdf`;
    const safeName = rawName.toLowerCase().endsWith('.pdf') ? rawName : `${rawName}.pdf`;
    doc.save(safeName);
  }
}

