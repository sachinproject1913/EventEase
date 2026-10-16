import React, { useState } from 'react';
import { User, CampusEvent, EventRegistration } from '../types';
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
  Copy,
  Check,
  ShieldCheck,
  Sparkles
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

  // Check missing academic fields
  const missingFields = checkMissingProfileFields(student);
  const hasIncompleteProfile = missingFields.length > 0;

  // Handle downloading the Official Leave Form (uploaded by organizer)
  const handleDownloadOfficialForm = (event: CampusEvent, reg: EventRegistration) => {
    if (reg.attendanceStatus !== 'present') {
      showToast('Attendance verification required: Please scan the event QR code to unlock this form.');
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
    if (reg.attendanceStatus !== 'present') {
      showToast('Attendance verification required: Please scan the event QR code to unlock your leave letter.');
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
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
              const hasOfficialTemplate = template !== undefined && template.isAvailable === true;
              const isPresent = registration.attendanceStatus === 'present';

              return (
                <div 
                  key={registration.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs transition-all space-y-4 ${
                    isPresent ? 'border-emerald-300 ring-1 ring-emerald-100' : 'border-slate-200'
                  }`}
                >
                  {/* Top row: Event Info & Attendance Badge */}
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                          {event.category}
                        </span>

                        {/* Attendance Status Badge */}
                        {isPresent ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Present at Event &bull; Leave Form Unlocked</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Attendance Pending &bull; QR Scan Required</span>
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

                      {!isPresent ? (
                        <button
                          onClick={() => setQrModalItem({ event, registration })}
                          className="ml-auto px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Scan Event QR</span>
                        </button>
                      ) : (
                        <div className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Verified</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lock Warning if Attendance Pending */}
                  {!isPresent && (
                    <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          <strong>Attendance Required:</strong> Scan the event QR code at the venue and submit your unique registration code (<strong className="font-mono">{registration.registrationCode}</strong>) to mark presence and unlock your leave forms.
                        </span>
                      </div>
                      <button
                        onClick={() => setQrModalItem({ event, registration })}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1.5 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Check In via QR Now</span>
                      </button>
                    </div>
                  )}

                  {/* Dual Action Section: Official Form vs Personalized Letter */}
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-100 ${!isPresent ? 'opacity-70' : ''}`}>
                    
                    {/* 1. Official Leave Form (Uploaded by Organizer) */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${isPresent ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
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
                              {template?.fileName}
                            </span>
                            <span className="text-slate-400">
                              {(template?.fileSize ? template.fileSize / 1024 : 150).toFixed(0)} KB
                            </span>
                          </div>
                          <button
                            onClick={() => handleDownloadOfficialForm(event, registration)}
                            disabled={!isPresent}
                            className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors ${
                              isPresent
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            {!isPresent ? <Lock className="w-3.5 h-3.5" /> : <Download className="w-4 h-4" />}
                            <span>{isPresent ? 'Download Official Leave Form (PDF)' : 'Locked (Mark Attendance First)'}</span>
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

                    {/* 2. Personalized Leave Application (Automatically Generated) */}
                    <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${isPresent ? 'bg-blue-600' : 'bg-slate-400'}`}></span>
                            Personalized Leave Application
                          </span>
                          <span className="text-[10px] uppercase tracking-wider text-blue-600 font-bold">
                            {isPresent ? 'Ready' : 'Pending Attendance'}
                          </span>
                        </div>
                        <p className="text-[11px] text-blue-800">
                          {isPresent 
                            ? 'Personalized 1-page formal request to HOD populated from your profile.'
                            : 'Generated after you attend the event and scan the venue QR code.'}
                        </p>
                      </div>

                      {isPresent ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPreviewModalEvent(event)}
                            className="flex-1 py-2 px-3 bg-white hover:bg-blue-100 text-blue-700 border border-blue-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview Letter</span>
                          </button>
                          <button
                            onClick={() => handleDownloadPersonalApplication(event, registration)}
                            className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setQrModalItem({ event, registration })}
                          className="w-full py-2 px-3 bg-slate-200 text-slate-500 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-300 transition-colors"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Scan QR Code to Unlock</span>
                        </button>
                      )}
                    </div>

                  </div>

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
