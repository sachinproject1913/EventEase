import React from 'react';
import { User, CampusEvent } from '../types';
import { formatEventDateRange, downloadPersonalizedLeavePdf } from '../utils/pdfGenerator';
import { FileText, Download, Printer, X, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: User;
  event: CampusEvent;
  onDownloaded?: () => void;
}

export const LeaveLetterPreviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  student,
  event,
  onDownloaded,
}) => {
  if (!isOpen) return null;

  const applicationDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const dateRangeStr = formatEventDateRange(event.startDate, event.endDate);

  const handleDownload = () => {
    downloadPersonalizedLeavePdf(student, event);
    if (onDownloaded) onDownloaded();
  };

  const handlePrint = () => {
    window.print();
    if (onDownloaded) onDownloaded();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Personalized Leave Application</h3>
              <p className="text-xs text-slate-400">Deterministic 1-Page Draft Letter for Department HOD</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notice Banner */}
        <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-xs text-amber-800 shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Draft Document:</strong> This application is pre-filled from your profile and event record. Print and submit to your HOD for official faculty approval.
          </span>
        </div>

        {/* The Printable Letter Body */}
        <div className="p-6 md:p-10 overflow-y-auto bg-slate-100 flex-1 flex justify-center">
          <div 
            id="printable-leave-letter"
            className="bg-white border border-slate-300 shadow-md p-8 md:p-12 w-full max-w-2xl text-slate-800 font-serif leading-relaxed text-sm select-text"
            style={{ minHeight: '800px' }}
          >
            {/* Header / Department Reference */}
            <div className="flex justify-between items-start border-b border-slate-300 pb-4 mb-6 font-sans">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-blue-900 block">CampusGuard Academic Exemption System</span>
                <span className="text-xs text-slate-500">Document Ref: CG-LEAVE-{event.id.toUpperCase()}-{student.studentId || 'DRAFT'}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Event Registration</span>
              </div>
            </div>

            {/* Recipient */}
            <div className="mb-6 font-sans">
              <p className="font-bold text-slate-900 text-base">To,</p>
              <p className="font-bold text-slate-900">The Head of Department</p>
              <p className="text-slate-700">{student.department || '[Department Name]'}</p>
              <p className="text-slate-700">{student.universityName || 'GLA UNIVERSITY MATHURA'}</p>
            </div>

            {/* Subject */}
            <div className="mb-6 font-sans">
              <p className="font-bold text-slate-900 text-sm">
                Subject: Request for Leave to Attend a University Event
              </p>
            </div>

            {/* Salutation */}
            <p className="mb-4">Respected Sir/Madam,</p>

            {/* Body */}
            <p className="mb-4 text-justify">
              I am <strong className="font-semibold text-slate-900">{student.name || '[Student Name]'}</strong>, a student of{' '}
              <strong className="font-semibold text-slate-900">{student.course || '[Course]'}</strong>,{' '}
              <strong className="font-semibold text-slate-900">{student.year || '[Year/Semester]'}</strong>, in the Department of{' '}
              <strong className="font-semibold text-slate-900">{student.department || '[Department Name]'}</strong>. I have successfully registered for{' '}
              <strong className="font-semibold text-slate-900">{event.title}</strong>, scheduled on{' '}
              <strong className="font-semibold text-slate-900">{dateRangeStr}</strong> at{' '}
              <strong className="font-semibold text-slate-900">{event.venue}</strong>.
            </p>

            <p className="mb-6 text-justify">
              I kindly request permission to be excused from my regular classes for the required duration to participate in this event.
            </p>

            <p className="mb-8">Thank you for your consideration.</p>

            {/* Sign off */}
            <div className="mb-10 font-sans">
              <p className="text-slate-700 mb-4">Yours sincerely,</p>
              <p className="font-bold text-slate-900 text-base">{student.name || '[Student Name]'}</p>
              <p className="text-xs text-slate-600 font-mono">ID: {student.studentId || '[Student ID]'}</p>
              <p className="text-xs text-slate-600">{student.course || '[Course]'} &bull; {student.department || '[Department Name]'}</p>
              <p className="text-xs text-slate-500 mt-1">Date: {applicationDate}</p>
            </div>

            {/* Official HOD Review Block for Physical Signature */}
            <div className="border border-slate-300 rounded-lg p-4 bg-slate-50 font-sans text-xs mt-8">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-slate-800 uppercase tracking-wide">For HOD / Faculty Advisor Use Only:</span>
                <span className="text-[10px] text-slate-500">Official Seal & Signature Required</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4 text-[11px] text-slate-700">
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" disabled className="rounded-sm" /> <span>[ ] Recommended</span>
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" disabled className="rounded-sm" /> <span>[ ] Leave Granted</span>
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" disabled className="rounded-sm" /> <span>[ ] Not Granted</span>
                </label>
              </div>
              <div className="flex justify-between items-end pt-4 border-t border-slate-200">
                <div>
                  <div className="w-44 border-b border-dashed border-slate-400 mb-1"></div>
                  <span className="text-[11px] text-slate-500">HOD Signature & Stamp</span>
                </div>
                <div>
                  <div className="w-28 border-b border-dashed border-slate-400 mb-1"></div>
                  <span className="text-[11px] text-slate-500">Date</span>
                </div>
              </div>
            </div>

            {/* Footer watermark */}
            <div className="mt-8 pt-4 border-t border-slate-200 text-center font-sans text-[10px] text-slate-400">
              Generated by CampusGuard Academic Portal &bull; Draft Document &bull; Requires Physical Signature
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
          <p className="text-xs text-slate-500">
            One-page format ready for physical submission or digital departmental upload.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
