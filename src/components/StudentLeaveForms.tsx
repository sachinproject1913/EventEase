import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { User, CampusEvent, EventRegistration, LeaveFolderFile } from '../types';
import { apiService } from '../services/apiService';
import { 
  formatEventDateRange, 
  checkMissingProfileFields, 
  downloadPersonalizedLeavePdf, 
  generateOfficialTemplateSamplePdf 
} from '../utils/pdfGenerator';
import { LeaveLetterPreviewModal } from './LeaveLetterPreviewModal';
import { AttendanceQrScannerModal } from './AttendanceQrScannerModal';
import { 
  FileText, 
  Download, 
  Calendar, 
  MapPin, 
  UserCheck, 
  AlertTriangle, 
  Clock, 
  Eye, 
  Info, 
  Building, 
  CheckCircle2, 
  CalendarCheck2, 
  QrCode, 
  Lock, 
  Unlock,
  Key,
  Copy, 
  Check, 
  ShieldCheck, 
  ShieldAlert,
  Sparkles,
  Folder
} from 'lucide-react';

interface Props {
  student: User;
  onOpenProfileEdit: () => void;
  onBrowseEvents: () => void;
}

export const StudentLeaveForms: React.FC<Props> = ({
  student,
  onOpenProfileEdit,
  onBrowseEvents
}) => {
  const [registrations, setRegistrations] = useState<{ registration: EventRegistration; event: CampusEvent }[]>(() => {
    return apiService.getStudentRegistrations(student.id);
  });
  
  const [previewModalEvent, setPreviewModalEvent] = useState<CampusEvent | null>(null);
  const [qrModalItem, setQrModalItem] = useState<{ event: CampusEvent; registration: EventRegistration } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [unlockErrors, setUnlockErrors] = useState<Record<string, string>>({});

  const refreshData = () => {
    setRegistrations(apiService.getStudentRegistrations(student.id));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleKeyInputChange = (regId: string, val: string) => {
    setKeyInputs(prev => ({ ...prev, [regId]: val }));
    if (unlockErrors[regId]) {
      setUnlockErrors(prev => ({ ...prev, [regId]: '' }));
    }
  };

  const handleQuickPasteKey = (regId: string, key: string) => {
    setKeyInputs(prev => ({ ...prev, [regId]: key }));
    setUnlockErrors(prev => ({ ...prev, [regId]: '' }));
    showToast(`Pasted unique key "${key}" into the form.`);
  };

  const handleUnlockWithKey = (eventId: string, reg: EventRegistration) => {
    const inputVal = keyInputs[reg.id] || '';
    if (!inputVal.trim()) {
      setUnlockErrors(prev => ({ ...prev, [reg.id]: 'Please enter or paste your unique clearance key.' }));
      return;
    }

    const res = apiService.unlockStudentLeaveWithKey(student.id, eventId, inputVal);
    if (!res.success) {
      setUnlockErrors(prev => ({ ...prev, [reg.id]: res.message }));
      showToast(res.message);
      return;
    }

    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }

    showToast(res.message);
    setUnlockErrors(prev => ({ ...prev, [reg.id]: '' }));
    refreshData();
  };

  // Check missing academic fields
  const missingFields = checkMissingProfileFields(student);
  const hasIncompleteProfile = missingFields.length > 0;

  // Handle downloading the Official Leave Form (uploaded by organizer)
  const handleDownloadOfficialForm = (event: CampusEvent, reg: EventRegistration) => {
    if (!reg.leaveFormUnlocked) {
      if (!reg.organizerAllowedLeave) {
        showToast('Leave form locked: Organizer has not allowed leave generation yet.');
      } else {
        showToast('Unique key required: Paste and verify your unique key below to unlock the form.');
      }
      return;
    }

    if (!event.leaveFormTemplate || !event.leaveFormTemplate.isAvailable) {
      showToast('Official leave form is not available yet for this event.');
      return;
    }

    // Record download count on backend
    apiService.recordOfficialFormDownload(student.id, event.id);
    refreshData();

    // If template has real data or is sample, generate/stream PDF
    const templateDoc = generateOfficialTemplateSamplePdf(event);
    templateDoc.save(event.leaveFormTemplate.fileName || `Official_Leave_Form_${event.id}.pdf`);
    showToast(`Official leave form "${event.leaveFormTemplate.fileName}" downloaded successfully.`);
  };

  // Handle downloading the Personalized Leave Application
  const handleDownloadPersonalApplication = (event: CampusEvent, reg: EventRegistration) => {
    if (!reg.leaveFormUnlocked) {
      if (!reg.organizerAllowedLeave) {
        showToast('Leave form locked: Organizer has not allowed leave generation yet.');
      } else {
        showToast('Unique key required: Paste and verify your unique key below to unlock your leave letter.');
      }
      return;
    }

    if (hasIncompleteProfile) {
      showToast('Please complete your academic profile before generating the leave application.');
      return;
    }

    apiService.recordPersonalApplicationDownload(student.id, event.id);
    refreshData();

    downloadPersonalizedLeavePdf(student, event);
    showToast('Personalized leave application letter downloaded successfully.');
  };

  const handleDownloadFolderDoc = (file: { id: string; fileName: string; title: string; fileDataUrl?: string }, event: CampusEvent, reg: EventRegistration) => {
    if (!reg.leaveFormUnlocked) {
      showToast('Exemption document locked: Organizer clearance & unique key required.');
      return;
    }
    apiService.recordFolderFileDownload(file.id);
    if (file.fileDataUrl && file.fileDataUrl.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = file.fileDataUrl;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Downloading "${file.fileName}"...`);
    } else {
      const doc = generateOfficialTemplateSamplePdf(event);
      doc.save(file.fileName || `Official_Leave_Form_${event.id}.pdf`);
      showToast(`Downloaded official PDF for "${file.title}".`);
    }
    refreshData();
  };

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
            <CalendarCheck2 className="w-4 h-4" />
            <span>Academic Attendance & Exemption Portal</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Leave Forms
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Leave forms are automatically generated after event attendance is verified via Event QR Code check-in.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenProfileEdit}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-xs transition-colors"
          >
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>Edit Academic Profile</span>
          </button>
          <button
            onClick={onBrowseEvents}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            Browse More Events
          </button>
        </div>
      </div>

      {/* Policy Banner: QR Attendance Check-In Requirement */}
      <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-2 border-purple-200/80 rounded-2xl p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-purple-950">
                Attendance-Gated Leave Generation
              </h4>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-purple-200 text-purple-800">
                QR Verification
              </span>
            </div>
            <p className="text-xs text-purple-900/90 mt-0.5 leading-relaxed">
              When present at an event, scan the official <strong>Event QR Code</strong> and input your unique registration number. Once marked <strong>PRESENT</strong>, your official leave form and personalized HOD application letter unlock immediately.
            </p>
          </div>
        </div>
      </div>

      {/* Profile Warning Banner if incomplete */}
      {hasIncompleteProfile && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Incomplete Academic Profile Detected
              </h4>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Missing required fields: <span className="font-semibold">{missingFields.join(', ')}</span>.
                Update your profile so the generated leave letter contains complete academic credentials.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenProfileEdit}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs shrink-0 transition-colors"
          >
            Complete Profile Now
          </button>
        </div>
      )}

      {/* Empty State */}
      {registrations.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">No Event Registrations Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              When you register for university hackathons, workshops, or seminars, your registration pass and attendance check-in will appear here.
            </p>
          </div>
          <button
            onClick={onBrowseEvents}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            Browse Available Events
          </button>
        </div>
      ) : (
        /* Event Leave Forms List */
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              My Registered Events ({registrations.length})
            </span>
            <span className="text-xs text-slate-500">
              Student: <strong className="text-slate-800">{student.name}</strong> ({student.studentId || 'ID Pending'})
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {registrations.map(({ registration, event }) => {
              const dateRangeStr = formatEventDateRange(event.startDate, event.endDate);
              const template = event.leaveFormTemplate;
              const eventFolders = apiService.getEventFolders(event.id);
              const liveFolderFiles = eventFolders.flatMap(f => 
                f.files.filter(file => file.isAvailable).map(file => ({ ...file, folderName: f.name }))
              );
              const effectiveUploadedPdf = liveFolderFiles[0] || (template && template.isAvailable ? {
                id: template.id || `tmpl-${event.id}`,
                title: template.fileName ? template.fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') : `${event.title} Official Leave Form`,
                fileName: template.fileName || `Official_Leave_Form_${event.id}.pdf`,
                fileSize: template.fileSize || 245000,
                fileDataUrl: template.fileUrl,
                organizerName: template.organizerName || event.organizerName,
                folderName: 'Official Exemption',
                description: 'Official leave form uploaded by event organizer'
              } : null);
              const hasOfficialTemplate = (template !== undefined && template.isAvailable === true) || Boolean(effectiveUploadedPdf);
              const isPresent = registration.attendanceStatus === 'present';
              const isAllowed = Boolean(registration.organizerAllowedLeave);
              const isUnlocked = Boolean(registration.leaveFormUnlocked);

              return (
                <div 
                  key={registration.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs transition-all space-y-4 ${
                    isUnlocked 
                      ? 'border-emerald-300 ring-1 ring-emerald-100' 
                      : isAllowed 
                      ? 'border-indigo-300 ring-1 ring-indigo-100' 
                      : 'border-slate-200'
                  }`}
                >
                  {/* Top row: Event Info & Status Badges */}
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                          {event.category}
                        </span>

                        {/* Leave Generation Status Badge */}
                        {isUnlocked ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Leave Form Generated & Unlocked</span>
                          </span>
                        ) : isAllowed ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
                            <Key className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Organizer Allowed &bull; Key Required</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Awaiting Organizer Allowance</span>
                          </span>
                        )}

                        {/* Event Attendance Badge */}
                        {isPresent ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Present at Venue</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Attendance Pending</span>
                          </span>
                        )}

                        {event.requiresHODApproval && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                            HOD Exemption
                          </span>
                        )}
                      </div>

                      <h3 className="text-base md:text-lg font-bold text-slate-900">
                        {event.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-0.5">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          {dateRangeStr}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-600" />
                          {event.venue}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-purple-600" />
                          {event.organizerClub} ({event.organizerName})
                        </span>
                      </div>
                    </div>

                    {/* Unique Registration Pass Pill & QR Scan Button */}
                    <div className="flex flex-wrap items-center gap-2 self-start bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          Unique Registration ID
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {registration.registrationCode}
                          </span>
                          <button
                            onClick={() => handleCopyCode(registration.registrationCode, registration.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                            title="Copy Unique Registration Code"
                          >
                            {copiedCodeId === registration.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {!isPresent && (
                        <button
                          onClick={() => setQrModalItem({ event, registration })}
                          className="ml-auto px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Scan Event QR</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* WORKFLOW SECTION: Organizer Allowance & Unique Key Verification */}
                  {!isUnlocked ? (
                    isAllowed ? (
                      /* STATE 2: Organizer has allowed leave generation -> Student pastes unique key to unlock */
                      <div className="p-4.5 bg-gradient-to-r from-indigo-50/90 via-purple-50/80 to-blue-50/90 border-2 border-indigo-300 rounded-2xl space-y-3.5 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                              <Key className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wide">
                                  Organizer Allowed! Enter Unique Key to Unlock Leave Form
                                </h4>
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-200 text-indigo-900 uppercase">
                                  Authorized
                                </span>
                              </div>
                              <p className="text-xs text-indigo-900/90 mt-0.5 leading-relaxed">
                                Organizer <strong>{event.organizerName}</strong> has approved leave generation for your registration. Paste your unique clearance key inside the form below to generate and unlock your leave documents.
                              </p>
                            </div>
                          </div>

                          {registration.leaveUniqueKey && (
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-indigo-200/90 shadow-2xs self-start sm:self-auto shrink-0">
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Your Key:</span>
                              <code className="font-mono font-black text-indigo-700 text-xs">{registration.leaveUniqueKey}</code>
                              <button
                                type="button"
                                onClick={() => handleQuickPasteKey(registration.id, registration.leaveUniqueKey!)}
                                className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md transition-colors cursor-pointer"
                                title="Click to auto-paste into input field"
                              >
                                Auto-Paste
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Input Box & Unlock Button */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                          <div className="relative flex-1">
                            <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              value={keyInputs[registration.id] ?? ''}
                              onChange={(e) => handleKeyInputChange(registration.id, e.target.value)}
                              placeholder={`Paste Unique Key (e.g. ${registration.leaveUniqueKey || 'KEY-GLA-8921-X'})`}
                              className="w-full pl-10 pr-3.5 py-2.5 text-xs font-mono font-bold bg-white border-2 border-indigo-300 rounded-xl focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-slate-900 placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 transition-colors"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleUnlockWithKey(event.id, registration);
                                }
                              }}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleUnlockWithKey(event.id, registration)}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all shrink-0 cursor-pointer"
                          >
                            <Unlock className="w-4 h-4" />
                            <span>Unlock & Generate Leave Form</span>
                          </button>
                        </div>

                        {unlockErrors[registration.id] && (
                          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>{unlockErrors[registration.id]}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* STATE 1: Organizer has NOT allowed yet */
                      <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
                        <div className="flex items-start sm:items-center gap-2.5">
                          <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                          <span>
                            <strong>Leave Form Generation Awaiting Organizer Allowance:</strong> The event organizer (<strong>{event.organizerName}</strong>) must authorize leave generation for your registration before a unique unlock key is issued.
                          </span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900 px-2.5 py-1 rounded-full shrink-0 self-start sm:self-auto">
                          Allowance Pending
                        </span>
                      </div>
                    )
                  ) : (
                    /* STATE 3: Unlocked and Generated! */
                    <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-950">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          <strong>Leave Form Generated & Unlocked:</strong> Authorization verified with key <code className="font-mono font-bold text-emerald-800 bg-white px-1.5 py-0.5 rounded border border-emerald-200">{registration.leaveUniqueKey}</code>. Ready for download and HOD submission.
                        </span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200 text-emerald-900 px-2.5 py-0.5 rounded-full shrink-0">
                        Verified & Ready
                      </span>
                    </div>
                  )}

                  {/* Dual Action Section: Official Form vs Personalized Letter */}
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-100 ${!isUnlocked ? 'opacity-70' : ''}`}>
                    
                    {/* 1. Official Leave Form (Uploaded by Organizer) */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${isUnlocked ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                            Official Leave Form
                          </span>
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                            Organizer PDF
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Official template provided by {event.organizerClub}.
                        </p>
                      </div>

                      {hasOfficialTemplate ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-600 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                            <span className="truncate max-w-[200px] font-mono text-[10px]">
                              {effectiveUploadedPdf?.fileName || template?.fileName}
                            </span>
                            <span className="text-slate-400">
                              {((effectiveUploadedPdf?.fileSize || template?.fileSize || 150000) / 1024).toFixed(0)} KB
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              if (effectiveUploadedPdf) {
                                handleDownloadFolderDoc(effectiveUploadedPdf, event, registration);
                              } else {
                                handleDownloadOfficialForm(event, registration);
                              }
                            }}
                            disabled={!isUnlocked}
                            className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors ${
                              isUnlocked
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            {!isUnlocked ? <Lock className="w-3.5 h-3.5" /> : <Download className="w-4 h-4" />}
                            <span>{isUnlocked ? 'Download Official Leave Form (PDF)' : isAllowed ? 'Locked (Paste Unique Key to Unlock)' : 'Locked (Awaiting Organizer Allowance)'}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="bg-slate-100/90 border border-slate-200/80 rounded-lg p-2.5 text-center">
                          <span className="text-xs font-semibold text-slate-500 flex items-center justify-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Leave form not available yet
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Organizer has not published the official template yet.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 2. Personalized Leave Application (Automatically Generated) & Organizer Uploaded PDF */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/90 via-indigo-50/60 to-purple-50/40 border-2 border-indigo-200/90 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-3.5">
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${isUnlocked ? 'bg-blue-600' : 'bg-slate-400'}`}></span>
                              Personalized Leave Application
                            </span>
                            <span className="text-[10px] uppercase tracking-wider text-blue-700 bg-blue-100/90 px-2 py-0.5 rounded-full font-bold">
                              {isUnlocked ? 'Ready' : isAllowed ? 'Key Required' : 'Allowance Pending'}
                            </span>
                          </div>
                          <p className="text-[11px] text-blue-900/80 leading-relaxed">
                            {isUnlocked 
                              ? 'Personalized formal request letter to HOD generated from your verified academic profile.'
                              : isAllowed 
                              ? 'Organizer has authorized this leave form. Paste the unique key above to unlock and generate.'
                              : 'Generated once authorized by the organizer and verified with your unique clearance key.'}
                          </p>
                        </div>

                        {/* PDF Uploaded by Organiser (Shown directly in this element) */}
                        {effectiveUploadedPdf ? (
                          <div className="p-3 bg-white/95 rounded-xl border border-indigo-200/80 shadow-2xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-purple-600" />
                                <span>PDF Uploaded by Organiser</span>
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-800">
                                {effectiveUploadedPdf.folderName || 'Official Slip'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 text-xs">
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 truncate text-[11px]" title={effectiveUploadedPdf.title}>
                                  {effectiveUploadedPdf.title}
                                </p>
                                <p className="text-[10px] text-slate-500 font-mono truncate">
                                  {effectiveUploadedPdf.fileName} &bull; {(effectiveUploadedPdf.fileSize / 1024).toFixed(0)} KB
                                </p>
                                {effectiveUploadedPdf.organizerName && (
                                  <p className="text-[10px] text-purple-700 mt-0.5 flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-purple-600 inline" />
                                    <span>Uploaded by {effectiveUploadedPdf.organizerName}</span>
                                  </p>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDownloadFolderDoc(effectiveUploadedPdf, event, registration)}
                                disabled={!isUnlocked}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                                  isUnlocked
                                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-2xs'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                                title={isUnlocked ? 'Download PDF uploaded by organiser' : 'Locked until unique key verification'}
                              >
                                {isUnlocked ? <Download className="w-3 h-3 text-white" /> : <Lock className="w-3 h-3 text-slate-400" />}
                                <span>Download PDF</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2.5 bg-white/70 rounded-xl border border-dashed border-indigo-200 text-[11px] text-slate-500 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Organiser leave form PDF will appear here once uploaded.</span>
                          </div>
                        )}
                      </div>

                      {/* Letter Action Buttons */}
                      {isUnlocked ? (
                        <div className="flex items-center gap-2 pt-1 border-t border-indigo-200/50">
                          <button
                            onClick={() => setPreviewModalEvent(event)}
                            className="flex-1 py-2 px-3 bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview Letter</span>
                          </button>
                          <button
                            onClick={() => handleDownloadPersonalApplication(event, registration)}
                            className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Letter (PDF)</span>
                          </button>
                        </div>
                      ) : (
                        <div className="w-full py-2 px-3 bg-slate-200 text-slate-500 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" />
                          <span>{isAllowed ? 'Paste Unique Key Above to Unlock' : 'Locked (Awaiting Organizer Allowance)'}</span>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* 3. Event Leave Form Folders & Slips Uploaded by Organizer */}
                  {isUnlocked && (() => {
                    const folders = apiService.getEventFolders(event.id);
                    const liveFiles = folders.flatMap(f => f.files.filter(file => file.isAvailable).map(file => ({ ...file, folderName: f.name })));
                    if (liveFiles.length === 0) return null;

                    return (
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                          <span className="flex items-center gap-1.5">
                            <Folder className="w-3.5 h-3.5 text-amber-600" />
                            <span>Additional Exemption Forms from Organizer Folders ({liveFiles.length})</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">Uploaded by Event Convenor</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {liveFiles.map(file => (
                            <div key={file.id} className="p-3 bg-slate-50 hover:bg-purple-50/30 border border-slate-200 hover:border-purple-200 rounded-xl flex items-center justify-between gap-2.5 transition-all">
                              <div className="min-w-0">
                                <span className="text-[9px] uppercase font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                                  {file.folderName}
                                </span>
                                <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{file.title}</p>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  {file.fileName} &bull; {(file.fileSize / 1024).toFixed(0)} KB
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDownloadFolderDoc(file, event, registration)}
                                className="px-2.5 py-1.5 bg-white hover:bg-purple-600 text-purple-700 hover:text-white border border-purple-200 hover:border-purple-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shadow-2xs shrink-0 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Submission note */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 px-3 py-2 rounded-xl">
                    <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {isPresent ? (
                        <span>
                          Attendance verified! Print both documents and submit to your department HOD prior to <strong>{dateRangeStr.split(' ')[0]}</strong> for academic attendance credit.
                        </span>
                      ) : (
                        <span>
                          Event attendance must be marked as <strong>PRESENT</strong> via the event QR code check-in before the HOD leave letter can be issued.
                        </span>
                      )}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Preview Modal for Letter */}
      {previewModalEvent && (
        <LeaveLetterPreviewModal
          isOpen={true}
          onClose={() => setPreviewModalEvent(null)}
          student={student}
          event={previewModalEvent}
          onDownloaded={() => {
            apiService.recordPersonalApplicationDownload(student.id, previewModalEvent.id);
            refreshData();
          }}
        />
      )}

      {/* Attendance QR Code Scanner & Check-in Modal */}
      {qrModalItem && (
        <AttendanceQrScannerModal
          isOpen={true}
          onClose={() => setQrModalItem(null)}
          event={qrModalItem.event}
          registration={qrModalItem.registration}
          onAttendanceVerified={() => {
            refreshData();
            showToast('Attendance marked PRESENT! Your leave form is now generated and unlocked.');
          }}
        />
      )}

    </div>
  );
};
