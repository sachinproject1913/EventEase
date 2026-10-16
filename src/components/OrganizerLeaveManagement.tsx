import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { User, CampusEvent } from '../types';
import { apiService } from '../services/apiService';
import { formatEventDateRange, generateOfficialTemplateSamplePdf } from '../utils/pdfGenerator';
import { 
  FileCheck, 
  Upload, 
  Trash2, 
  Eye, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  ToggleLeft, 
  ToggleRight, 
  RefreshCw,
  Calendar,
  MapPin,
  Users,
  ShieldCheck,
  Building,
  Plus,
  QrCode,
  UserCheck,
  Printer,
  X
} from 'lucide-react';

interface Props {
  organizer: User;
  onRefreshEvents: () => void;
}

export const OrganizerLeaveManagement: React.FC<Props> = ({ organizer, onRefreshEvents }) => {
  const [organizerEvents, setOrganizerEvents] = useState<CampusEvent[]>(() => {
    return apiService.getOrganizerEvents(organizer.id);
  });

  const [selectedEventId, setSelectedEventId] = useState<string>(
    organizerEvents[0]?.id || ''
  );

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [customInstructions, setCustomInstructions] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isQrRosterOpen, setIsQrRosterOpen] = useState(false);

  const selectedEvent = organizerEvents.find(e => e.id === selectedEventId);

  const refreshLocalState = () => {
    const refreshed = apiService.getOrganizerEvents(organizer.id);
    setOrganizerEvents(refreshed);
    onRefreshEvents();
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Handle real PDF file selection from file input
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedEvent) return;

    setUploadError(null);

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setUploadError('Invalid file format. Only official PDF documents (.pdf) are permitted.');
      return;
    }

    // Validate file size (10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError('File size exceeds the 10MB limit.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const fileDataUrl = reader.result as string;
        apiService.uploadLeaveFormTemplate(organizer.id, selectedEvent.id, {
          fileName: file.name,
          fileSize: file.size,
          fileDataUrl,
          isAvailable: true,
          instructions: customInstructions || 'Official department leave application template.'
        });
        setIsUploading(false);
        refreshLocalState();
        showSuccess(`Leave form template "${file.name}" uploaded and published for students!`);
      } catch (err: unknown) {
        setIsUploading(false);
        setUploadError(err instanceof Error ? err.message : 'Upload failed');
      }
    };
    reader.onerror = () => {
      setIsUploading(false);
      setUploadError('Failed to read file from disk');
    };
    reader.readAsDataURL(file);
  };

  // Quick 1-click generator to attach an official template for instant testing
  const handleAttachSampleTemplate = () => {
    if (!selectedEvent) return;
    setUploadError(null);
    setIsUploading(true);

    try {
      const sampleDoc = generateOfficialTemplateSamplePdf(selectedEvent);
      const dataUri = sampleDoc.output('datauristring');
      
      apiService.uploadLeaveFormTemplate(organizer.id, selectedEvent.id, {
        fileName: `Official_${selectedEvent.id}_Dean_Leave_Form.pdf`,
        fileSize: 195000,
        fileDataUrl: dataUri,
        isAvailable: true,
        instructions: customInstructions || 'Dean of Student Affairs approved attendance exemption form.'
      });

      setIsUploading(false);
      refreshLocalState();
      showSuccess(`Official template successfully generated and linked to ${selectedEvent.title}!`);
    } catch (err: unknown) {
      setIsUploading(false);
      setUploadError(err instanceof Error ? err.message : 'Error attaching sample template');
    }
  };

  // Toggle availability
  const handleToggleAvailability = (currentStatus: boolean) => {
    if (!selectedEvent) return;
    try {
      apiService.updateTemplateAvailability(organizer.id, selectedEvent.id, !currentStatus);
      refreshLocalState();
      showSuccess(
        !currentStatus 
          ? 'Template marked as AVAILABLE. Students can now download it after checking in.' 
          : 'Template marked as UNAVAILABLE (Draft). Students will see "Leave form not available yet".'
      );
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Failed to toggle availability');
    }
  };

  // Remove template
  const handleDeleteTemplate = () => {
    if (!selectedEvent) return;
    if (window.confirm(`Are you sure you want to remove the leave form template for "${selectedEvent.title}"? Students will no longer be able to download it.`)) {
      try {
        apiService.deleteLeaveFormTemplate(organizer.id, selectedEvent.id);
        refreshLocalState();
        showSuccess('Leave form template removed successfully.');
      } catch (err: unknown) {
        setUploadError(err instanceof Error ? err.message : 'Failed to delete template');
      }
    }
  };

  // Download template for organizer preview
  const handleDownloadActiveTemplate = () => {
    if (!selectedEvent?.leaveFormTemplate) return;
    const doc = generateOfficialTemplateSamplePdf(selectedEvent);
    doc.save(selectedEvent.leaveFormTemplate.fileName);
  };

  // Attendance management helpers
  const registrationsForEvent = selectedEvent ? apiService.getEventRegistrations(selectedEvent.id) : [];
  const presentCount = registrationsForEvent.filter(r => r.registration.attendanceStatus === 'present').length;

  const handleToggleStudentAttendance = (registrationId: string, currentStatus: string) => {
    if (!selectedEvent) return;
    const nextStatus = currentStatus === 'present' ? 'pending' : 'present';
    apiService.updateRegistrationAttendance(organizer.id, selectedEvent.id, registrationId, nextStatus);
    refreshLocalState();
    showSuccess(`Attendance status updated to ${nextStatus.toUpperCase()}.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Toast Notification */}
      {successMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-600 mb-1">
            <Building className="w-4 h-4" />
            <span>Event Organizer Console</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Leave Form Management
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Upload official PDF templates, display venue attendance check-in QR codes, and monitor verified student attendance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 font-semibold flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>{organizer.name} ({organizerEvents.length} Events Managed)</span>
          </span>
        </div>
      </div>

      {/* Error alert */}
      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between text-xs text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button onClick={() => setUploadError(null)} className="text-red-500 hover:text-red-800 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Event Selector & Form Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Select Event & Organizer's Events Overview */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Select One of Your Events
            </label>
            <div className="space-y-2">
              {organizerEvents.map(evt => {
                const isSelected = evt.id === selectedEventId;
                const hasTemplate = evt.leaveFormTemplate !== undefined;
                const isAvailable = evt.leaveFormTemplate?.isAvailable;

                return (
                  <button
                    key={evt.id}
                    onClick={() => setSelectedEventId(evt.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 ${
                      isSelected 
                        ? 'bg-purple-50/70 border-purple-400 ring-2 ring-purple-200' 
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 line-clamp-1">
                        {evt.title}
                      </span>
                      {hasTemplate ? (
                        isAvailable ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                            Available
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 shrink-0">
                            Draft
                          </span>
                        )
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-500 shrink-0">
                          No Template
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span>{evt.category}</span>
                      <span>&bull;</span>
                      <span>{evt.registeredCount} Registered</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Download & Check-in Analytics
            </h4>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-xs text-slate-400 block">Total Downloads</span>
                <span className="text-2xl font-extrabold text-purple-400">
                  {organizerEvents.reduce((acc, e) => acc + (e.leaveFormTemplate?.downloadCount || 0), 0)}
                </span>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-xs text-slate-400 block">Templates Live</span>
                <span className="text-2xl font-extrabold text-emerald-400">
                  {organizerEvents.filter(e => e.leaveFormTemplate?.isAvailable).length} / {organizerEvents.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Manage Template & QR for Selected Event */}
        <div className="lg:col-span-2 space-y-5">
          {selectedEvent ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              
              {/* Event Metadata Banner */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">
                      {selectedEvent.category}
                    </span>
                    <span className="text-xs text-slate-500">
                      Event ID: <span className="font-mono">{selectedEvent.id}</span>
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedEvent.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      {formatEventDateRange(selectedEvent.startDate, selectedEvent.endDate)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-600" />
                      {selectedEvent.venue}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      {selectedEvent.registeredCount} / {selectedEvent.maxSeats} Registered
                    </span>
                  </div>
                </div>

                {/* QR Code & Live Attendance Button */}
                <button
                  onClick={() => setIsQrRosterOpen(true)}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors shrink-0"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Venue QR Code & Attendance Roster</span>
                </button>
              </div>

              {/* Template Status & Management */}
              {selectedEvent.leaveFormTemplate ? (
                /* Already Uploaded State */
                <div className="space-y-5">
                  <div className="border-2 border-emerald-200 bg-emerald-50/50 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <FileCheck className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs uppercase font-bold text-emerald-800 tracking-wider">
                              Official PDF Template Uploaded
                            </span>
                            {selectedEvent.leaveFormTemplate.isAvailable ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900">
                                Live & Downloadable
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                                Hidden (Draft)
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                            {selectedEvent.leaveFormTemplate.fileName}
                          </h4>
                          <span className="text-xs text-slate-500">
                            Size: {(selectedEvent.leaveFormTemplate.fileSize / 1024).toFixed(0)} KB &bull; Uploaded on {new Date(selectedEvent.leaveFormTemplate.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Download Count Metric */}
                      <div className="bg-white px-4 py-2.5 rounded-xl border border-emerald-200 shadow-2xs text-center shrink-0">
                        <span className="text-xs text-slate-500 block font-medium">Student Downloads</span>
                        <span className="text-xl font-extrabold text-emerald-700">
                          {selectedEvent.leaveFormTemplate.downloadCount}{' '}
                          <span className="text-xs font-normal text-slate-500">/ {selectedEvent.registeredCount} students</span>
                        </span>
                      </div>
                    </div>

                    {/* Availability Switch */}
                    <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-emerald-200">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Form Availability Status</span>
                        <p className="text-[11px] text-slate-500">
                          {selectedEvent.leaveFormTemplate.isAvailable 
                            ? 'Students can view and download this official template in their dashboard once marked Present.' 
                            : 'Students will see "Leave form not available yet" until published.'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggleAvailability(selectedEvent.leaveFormTemplate!.isAvailable)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          selectedEvent.leaveFormTemplate.isAvailable
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        {selectedEvent.leaveFormTemplate.isAvailable ? (
                          <>
                            <ToggleRight className="w-5 h-5 text-white" />
                            <span>Available</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-5 h-5 text-slate-500" />
                            <span>Draft</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Action buttons: Preview, Replace, Remove */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        onClick={() => setIsPreviewOpen(true)}
                        className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-4 h-4 text-slate-500" />
                        <span>Preview Document</span>
                      </button>
                      <button
                        onClick={handleDownloadActiveTemplate}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Current File</span>
                      </button>

                      {/* Replace file input */}
                      <label className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors">
                        <RefreshCw className="w-4 h-4 text-slate-500" />
                        <span>Replace Template</span>
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>

                      {/* Remove */}
                      <button
                        onClick={handleDeleteTemplate}
                        className="px-3.5 py-2 bg-white hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-1.5 ml-auto transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-rose-500" />
                        <span>Remove Template</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* No Template Uploaded Yet State */
                <div className="space-y-5">
                  <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-4 bg-slate-50/50">
                    <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto shadow-xs">
                      <Upload className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Upload Official Leave Form Template
                      </h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                        Upload the verified university leave or exemption application for <strong>{selectedEvent.title}</strong>. Students registered and verified present for this event will be able to download and submit it to their HOD.
                      </p>
                    </div>

                    {/* Metadata inputs */}
                    <div className="max-w-md mx-auto text-left space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Submission Instructions for Registered Students
                        </label>
                        <input
                          type="text"
                          value={customInstructions}
                          onChange={(e) => setCustomInstructions(e.target.value)}
                          placeholder="e.g. Submit signed copy to CS Department office by 5 PM"
                          className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <label className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-colors">
                        <Upload className="w-4 h-4" />
                        <span>{isUploading ? 'Validating...' : 'Select PDF from Computer'}</span>
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={handleFileSelect}
                          className="hidden"
                          disabled={isUploading}
                        />
                      </label>

                      <button
                        onClick={handleAttachSampleTemplate}
                        disabled={isUploading}
                        className="px-4 py-2.5 bg-white hover:bg-purple-50 border border-purple-300 text-purple-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Generate & Attach Official Sample PDF</span>
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-400 pt-1">
                      PDF format only &bull; Max 10 MB &bull; Strict mime-type & filename sanitization enforced
                    </div>
                  </div>
                </div>
              )}

              {/* Template Guidelines Info */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  Leave Form & QR Attendance Workflow:
                </span>
                <p>
                  1. The official leave template is unlocked only for students who have registered AND checked in at the event venue via QR code.
                </p>
                <p>
                  2. Registered students scan the Event QR code and enter their unique registration ID to mark attendance.
                </p>
                <p>
                  3. Organizers can view the live roster and manually mark students present in case of scanning issues.
                </p>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              No events found for this organizer account.
            </div>
          )}
        </div>

      </div>

      {/* PDF Document Preview Modal */}
      {isPreviewOpen && selectedEvent?.leaveFormTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Official Form Template Preview
                </h3>
              </div>
              <button onClick={() => setIsPreviewOpen(false)} className="text-slate-400 hover:text-slate-600">
                Close
              </button>
            </div>
            
            <div className="bg-slate-100 rounded-xl p-6 border border-slate-200 text-center space-y-3">
              <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                Document Details
              </span>
              <h4 className="text-base font-bold text-slate-800 font-mono">
                {selectedEvent.leaveFormTemplate.fileName}
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Official Exemption Form for {selectedEvent.title} ({selectedEvent.category}), scheduled at {selectedEvent.venue}.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleDownloadActiveTemplate}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Preview PDF</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Venue QR Code & Live Attendance Roster Modal */}
      {isQrRosterOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-400">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Event Venue QR & Attendance Roster</h3>
                  <p className="text-xs text-slate-400">{selectedEvent.title}</p>
                </div>
              </div>
              <button onClick={() => setIsQrRosterOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* QR Code Presentation Box */}
              <div className="bg-gradient-to-br from-slate-50 to-purple-50/50 border border-purple-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 shrink-0">
                  <QRCodeSVG
                    value={JSON.stringify({
                      campusGuardEventId: selectedEvent.id,
                      eventTitle: selectedEvent.title,
                      venue: selectedEvent.venue,
                      secret: selectedEvent.eventSecretCode || `CG-QR-${selectedEvent.id}`,
                      timestamp: Date.now()
                    })}
                    size={160}
                    level="H"
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                    Venue Check-in Display
                  </span>
                  <h4 className="text-base font-bold text-slate-900">
                    Official Attendance QR Code
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Display this QR code at the event entrance or project it on stage at {selectedEvent.venue}. Students scan this code with their phones and enter their unique registration numbers to be marked <strong>PRESENT</strong>.
                  </p>
                  <div className="pt-2 flex items-center gap-2 justify-center sm:justify-start">
                    <button
                      onClick={() => window.print()}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print QR Poster</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Attendance Roster Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Registered Student Attendance Roster
                    </h4>
                    <p className="text-xs text-slate-500">
                      {presentCount} of {registrationsForEvent.length} registered students confirmed Present
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800">
                    {presentCount} Present
                  </span>
                </div>

                {registrationsForEvent.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                    No students have registered for this event yet.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="px-4 py-2.5">Student Name & ID</th>
                          <th className="px-4 py-2.5">Unique Registration Code</th>
                          <th className="px-4 py-2.5">Attendance Status</th>
                          <th className="px-4 py-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {registrationsForEvent.map(({ registration, student }) => {
                          const isPresent = registration.attendanceStatus === 'present';

                          return (
                            <tr key={registration.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-4 py-3">
                                <div className="font-bold text-slate-900">{student.name}</div>
                                <div className="text-[11px] text-slate-500 font-mono">{student.studentId} &bull; {student.course || 'CSE'}</div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-mono font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-[11px]">
                                  {registration.registrationCode}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {isPresent ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Present</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                    <span>Pending Check-in</span>
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => handleToggleStudentAttendance(registration.id, registration.attendanceStatus)}
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                                    isPresent
                                      ? 'text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200'
                                      : 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200 font-bold'
                                  }`}
                                >
                                  {isPresent ? 'Mark Pending' : 'Mark Present'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setIsQrRosterOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
