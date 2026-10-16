import React, { useState } from 'react';
import { User, CampusEvent, EventRegistration } from '../types';
import { apiService } from '../services/apiService';
import { BrowseEvents } from './BrowseEvents';
import { StudentLeaveForms } from './StudentLeaveForms';
import { AttendanceQrScannerModal } from './AttendanceQrScannerModal';
import { formatEventDateRange } from '../utils/pdfGenerator';
import { 
  GraduationCap, 
  Calendar, 
  Search, 
  ClipboardList, 
  Bell, 
  FileText, 
  UserCheck, 
  Download, 
  CheckCircle2, 
  Clock, 
  QrCode, 
  Copy, 
  Check, 
  ArrowRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

interface Props {
  student: User;
  onOpenProfileEdit: () => void;
  onRegisterSuccess: (event: CampusEvent, registration: EventRegistration) => void;
  onRefreshData: () => void;
}

type StudentNav = 
  | 'dashboard-overview'
  | 'browse-events'
  | 'my-registration'
  | 'notifications'
  | 'permission-forms'
  | 'leave-forms'
  | 'profile';

export const StudentPanel: React.FC<Props> = ({
  student,
  onOpenProfileEdit,
  onRegisterSuccess,
  onRefreshData
}) => {
  const [activeSubNav, setActiveSubNav] = useState<StudentNav>('dashboard-overview');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [qrModalItem, setQrModalItem] = useState<{ event: CampusEvent; registration: EventRegistration } | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const stats = apiService.getStudentDashboardStats(student.id);
  const registrations = apiService.getStudentRegistrations(student.id);
  const notifications = apiService.getNotifications(student.id, 'student');
  const permissionForms = apiService.getPermissionForms('student');

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Toast Notice */}
      {actionNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Student Sub-Navigation Bar matching exact user request */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {[
          { key: 'dashboard-overview', label: 'Dashboard Overviews' },
          { key: 'browse-events', label: 'Browse Events' },
          { key: 'my-registration', label: 'My Registration' },
          { key: 'notifications', label: 'Notifications' },
          { key: 'permission-forms', label: 'Permission Forms' },
          { key: 'leave-forms', label: 'Leave Form Send By Organizer' },
          { key: 'profile', label: 'My Profile' },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setActiveSubNav(item.key as StudentNav)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeSubNav === item.key
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 1. DASHBOARD OVERVIEWS: Upcoming events, My events, Notifications */}
      {activeSubNav === 'dashboard-overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* My Registrations */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">My Events</span>
              <span className="text-3xl font-extrabold text-blue-600">{stats.myRegistrationsCount}</span>
              <p className="text-[11px] text-slate-500">Confirmed Event Registrations</p>
            </div>

            {/* Leave Applications Unlocked */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Verified Present</span>
              <span className="text-3xl font-extrabold text-emerald-600">{stats.verifiedLeaves}</span>
              <p className="text-[11px] text-emerald-700 font-semibold">Leave Forms Unlocked & Ready</p>
            </div>

            {/* Unread Alerts */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Notifications</span>
              <span className="text-3xl font-extrabold text-purple-600">{stats.unreadNotifications}</span>
              <p className="text-[11px] text-slate-500">Alerts & attendance confirmations</p>
            </div>
          </div>

          {/* Quick Sections: Upcoming Events & My Events */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Upcoming Events Box */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>Upcoming University Events</span>
                </h3>
                <button
                  onClick={() => setActiveSubNav('browse-events')}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Browse All
                </button>
              </div>

              <div className="space-y-3">
                {stats.upcomingEvents.map(evt => (
                  <div key={evt.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                        {evt.category}
                      </span>
                      <h4 className="font-bold text-slate-900 mt-1">{evt.title}</h4>
                      <p className="text-slate-500 text-[11px]">{evt.venue} &bull; {new Date(evt.startDate).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => setActiveSubNav('browse-events')}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold shrink-0"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* My Active Registered Events & QR Status */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-emerald-600" />
                  <span>My Active Registrations</span>
                </h3>
                <button
                  onClick={() => setActiveSubNav('my-registration')}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  View All Passes
                </button>
              </div>

              {registrations.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                  You have not registered for any events yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {registrations.slice(0, 3).map(({ registration, event }) => {
                    const isPresent = registration.attendanceStatus === 'present';

                    return (
                      <div key={registration.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <span className="font-mono text-[10px] font-bold text-purple-900 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                            {registration.registrationCode}
                          </span>
                          <h4 className="font-bold text-slate-900">{event.title}</h4>
                          <span className={`text-[11px] font-semibold ${isPresent ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {isPresent ? 'Verified Present &bull; Leave Form Ready' : 'Pending QR Attendance'}
                          </span>
                        </div>

                        {!isPresent ? (
                          <button
                            onClick={() => setQrModalItem({ event, registration })}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs shrink-0 flex items-center gap-1"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Scan QR</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setActiveSubNav('leave-forms')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shrink-0 flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 2. BROWSE EVENTS: Search, filters, cards, and registration */}
      {activeSubNav === 'browse-events' && (
        <BrowseEvents
          currentUser={student}
          onRegisterSuccess={(evt, reg) => {
            onRegisterSuccess(evt, reg);
            setActiveSubNav('my-registration');
          }}
          onGoToLeaveForms={() => setActiveSubNav('leave-forms')}
        />
      )}

      {/* 3. MY REGISTRATION: Confirmed registrations & passes */}
      {activeSubNav === 'my-registration' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900">My Event Registrations & Entry Passes</h2>
            <p className="text-xs text-slate-500">
              Your unique registration codes are required to mark attendance via the venue QR code.
            </p>
          </div>

          {registrations.length === 0 ? (
            <div className="p-10 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <ClipboardList className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500">No active registrations.</p>
              <button
                onClick={() => setActiveSubNav('browse-events')}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
              >
                Browse Events Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {registrations.map(({ registration, event }) => {
                const isPresent = registration.attendanceStatus === 'present';

                return (
                  <div key={registration.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                          {event.category}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{event.title}</h4>
                        <p className="text-xs text-slate-500">{event.venue}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-bold">Unique Pass ID</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs font-extrabold text-purple-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {registration.registrationCode}
                          </span>
                          <button
                            onClick={() => handleCopyCode(registration.registrationCode, registration.id)}
                            className="p-1 text-slate-400 hover:text-slate-600"
                            title="Copy code"
                          >
                            {copiedCodeId === registration.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                      <div>
                        {isPresent ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Present &bull; Leave Unlocked</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending Check-in</span>
                          </span>
                        )}
                      </div>

                      {!isPresent ? (
                        <button
                          onClick={() => setQrModalItem({ event, registration })}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs flex items-center gap-1"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Scan QR Code</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveSubNav('leave-forms')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>View Leave Form</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. NOTIFICATIONS: Student alerts */}
      {activeSubNav === 'notifications' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900">Notifications & Alerts</h2>
            <p className="text-xs text-slate-500">Attendance verifications, event reminders, and announcements.</p>
          </div>

          <div className="space-y-3">
            {notifications.map(n => (
              <div key={n.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-900 block">{n.title}</span>
                  <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">{new Date(n.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. PERMISSION FORMS: Student consent slips */}
      {activeSubNav === 'permission-forms' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900">Student Permission & Consent Forms</h2>
            <p className="text-xs text-slate-500">Official slips required for overnight events, travel, and specialized labs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {permissionForms.map(form => (
              <div key={form.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-blue-700 uppercase bg-blue-100 px-2 py-0.5 rounded">
                  {form.department}
                </span>
                <h4 className="text-sm font-bold text-slate-900">{form.title}</h4>
                <p className="text-xs text-slate-600">{form.purpose}</p>
                <div className="pt-2">
                  <button
                    onClick={() => showNotice(`Downloading form: ${form.fileName}`)}
                    className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Permission Slip (PDF)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. LEAVE FORM SEND BY ORGANIZER: Gated by QR attendance */}
      {activeSubNav === 'leave-forms' && (
        <StudentLeaveForms
          student={student}
          onOpenProfileEdit={onOpenProfileEdit}
          onBrowseEvents={() => setActiveSubNav('browse-events')}
        />
      )}

      {/* 7. MY PROFILE */}
      {activeSubNav === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">My Academic Profile</h2>
              <p className="text-xs text-slate-500">Details populated into automated HOD leave applications.</p>
            </div>
            <button
              onClick={onOpenProfileEdit}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
            >
              Edit Details
            </button>
          </div>

          <div className="flex items-start gap-4">
            <img src={student.avatarUrl} alt={student.name} className="w-16 h-16 rounded-2xl object-cover border" />
            <div className="space-y-1 text-xs">
              <h3 className="text-base font-bold text-slate-900">{student.name}</h3>
              <p className="text-slate-600">Roll No / ID: <span className="font-mono font-bold text-slate-800">{student.studentId || 'Not Set'}</span></p>
              <p className="text-slate-600">Course: <span className="font-semibold text-slate-800">{student.course || 'Not Set'}</span></p>
              <p className="text-slate-600">Department: <span className="font-semibold text-slate-800">{student.department || 'Not Set'}</span></p>
              <p className="text-slate-600">Semester / Year: <span className="font-semibold text-slate-800">{student.year || 'Not Set'}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Scanner Check-in Modal */}
      {qrModalItem && (
        <AttendanceQrScannerModal
          isOpen={true}
          onClose={() => setQrModalItem(null)}
          event={qrModalItem.event}
          registration={qrModalItem.registration}
          onAttendanceVerified={() => {
            onRefreshData();
            showNotice('Attendance verified PRESENT! Your leave form is unlocked.');
          }}
        />
      )}

    </div>
  );
};
