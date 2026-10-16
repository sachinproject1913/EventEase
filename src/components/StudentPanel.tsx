import React, { useState } from 'react';
import { User, CampusEvent, EventRegistration } from '../types';
import { apiService } from '../services/apiService';
import { BrowseEvents } from './BrowseEvents';
import { StudentLeaveForms } from './StudentLeaveForms';
import { AttendanceQrScannerModal } from './AttendanceQrScannerModal';
import { downloadPermissionForm } from '../utils/pdfGenerator';
import { 
  LayoutDashboard,
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
  ShieldCheck, 
  FileCheck, 
  RefreshCw, 
  FileDown 
} from 'lucide-react';

interface Props {
  student: User;
  onOpenProfileEdit: () => void;
  onRegisterSuccess: (event: CampusEvent, registration: EventRegistration) => void;
  onRefreshData: () => void;
}

type StudentNav = 
  | 'dashboard-overview'
  | 'my-registration'
  | 'browse-events'
  | 'leave-forms'
  | 'permission-forms'
  | 'notifications'
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

  // Structured navigation items honoring user's required naming and accessible layout
  const navTabs: { key: StudentNav; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    { 
      key: 'dashboard-overview', 
      label: 'Dashboard', 
      icon: <LayoutDashboard className="w-3.5 h-3.5 shrink-0" /> 
    },
    { 
      key: 'my-registration', 
      label: 'My Events', 
      icon: <ClipboardList className="w-3.5 h-3.5 shrink-0" />,
      badge: stats.myRegistrationsCount > 0 ? stats.myRegistrationsCount : undefined
    },
    { 
      key: 'browse-events', 
      label: 'Browse Events', 
      icon: <Search className="w-3.5 h-3.5 shrink-0" /> 
    },
    { 
      key: 'leave-forms', 
      label: 'Leave Form Sent By Organizer', 
      icon: <FileDown className="w-3.5 h-3.5 shrink-0" />,
      badge: stats.verifiedLeaves > 0 ? `${stats.verifiedLeaves} Ready` : undefined
    },
    { 
      key: 'permission-forms', 
      label: 'Permission Forms', 
      icon: <FileCheck className="w-3.5 h-3.5 shrink-0" />,
      badge: permissionForms.length > 0 ? permissionForms.length : undefined
    },
    { 
      key: 'notifications', 
      label: 'Notifications', 
      icon: <Bell className="w-3.5 h-3.5 shrink-0" />,
      badge: stats.unreadNotifications > 0 ? stats.unreadNotifications : undefined
    },
    { 
      key: 'profile', 
      label: 'My Profile', 
      icon: <GraduationCap className="w-3.5 h-3.5 shrink-0" /> 
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
      
      {/* Toast Notice */}
      {actionNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Navigation Tabs: Fully responsive horizontal bar with subtle swipe scrolling on mobile and no tab clipping */}
      <nav 
        aria-label="Student Panel Navigation"
        className="bg-white rounded-2xl border border-slate-200 p-1.5 sm:p-2 shadow-xs w-full overflow-hidden"
      >
        <div className="flex items-center gap-1.5 overflow-x-auto subtle-scrollbar py-0.5 px-1 scroll-smooth w-full">
          {navTabs.map(item => {
            const isActive = activeSubNav === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveSubNav(item.key)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all select-none cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* 1. DASHBOARD: Summary cards + upcoming events & registrations */}
      {activeSubNav === 'dashboard-overview' && (
        <div className="space-y-4 sm:space-y-6 w-full">
          
          {/* Dashboard Summary Cards: 
              - Mobile: 2 compact columns (prevents excessive vertical space)
              - Tablet: 2 columns 
              - Desktop: 3 columns
          */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 w-full">
            
            {/* Card 1: My Events */}
            <div 
              onClick={() => setActiveSubNav('my-registration')}
              className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-sm transition-all flex flex-col justify-between cursor-pointer min-w-0"
              title="View my registered events"
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
                  My Events
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3 min-w-0">
                <span className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tight block leading-tight">
                  {stats.myRegistrationsCount}
                </span>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate font-medium">
                  Confirmed Registrations
                </p>
              </div>
            </div>

            {/* Card 2: Verified Present */}
            <div 
              onClick={() => setActiveSubNav('leave-forms')}
              className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-sm transition-all flex flex-col justify-between cursor-pointer min-w-0"
              title="View unlocked official leave forms"
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
                  Verified Present
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3 min-w-0">
                <span className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight block leading-tight">
                  {stats.verifiedLeaves}
                </span>
                <p className="text-[10px] sm:text-[11px] text-emerald-700 font-semibold mt-0.5 truncate">
                  Leave Forms Unlocked & Ready
                </p>
              </div>
            </div>

            {/* Card 3: Notifications */}
            <div 
              onClick={() => setActiveSubNav('notifications')}
              className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-purple-400 hover:shadow-sm transition-all flex flex-col justify-between cursor-pointer col-span-2 sm:col-span-2 lg:col-span-1 min-w-0"
              title="View announcements & alerts"
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
                  Notifications
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3 min-w-0">
                <span className="text-2xl sm:text-3xl font-black text-purple-600 tracking-tight block leading-tight">
                  {stats.unreadNotifications}
                </span>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate font-medium">
                  Alerts & attendance confirmations
                </p>
              </div>
            </div>

          </div>

          {/* Quick Sections: Upcoming Events & Active Registrations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full">
            
            {/* Upcoming Events Box */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-3 sm:space-y-4 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" />
                  <span>Upcoming University Events</span>
                </h3>
                <button
                  onClick={() => setActiveSubNav('browse-events')}
                  className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  Browse All
                </button>
              </div>

              <div className="space-y-2.5 sm:space-y-3">
                {stats.upcomingEvents.map(evt => (
                  <div key={evt.id} className="p-3 sm:p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs">
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                        {evt.category}
                      </span>
                      <h4 className="font-bold text-slate-900 mt-1 truncate">{evt.title}</h4>
                      <p className="text-slate-500 text-[11px] truncate">{evt.venue} &bull; {new Date(evt.startDate).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => setActiveSubNav('browse-events')}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* My Active Registered Events & QR Status */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-3 sm:space-y-4 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
                  <span>My Active Registrations</span>
                </h3>
                <button
                  onClick={() => setActiveSubNav('my-registration')}
                  className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  View All Passes
                </button>
              </div>

              {registrations.length === 0 ? (
                <div className="p-6 sm:p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  You have not registered for any events yet.
                </div>
              ) : (
                <div className="space-y-2.5 sm:space-y-3">
                  {registrations.slice(0, 3).map(({ registration, event }) => {
                    const isPresent = registration.attendanceStatus === 'present';

                    return (
                      <div key={registration.id} className="p-3 sm:p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs">
                        <div className="space-y-1 min-w-0">
                          <span className="font-mono text-[10px] font-bold text-purple-900 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                            {registration.registrationCode}
                          </span>
                          <h4 className="font-bold text-slate-900 truncate">{event.title}</h4>
                          <span className={`text-[11px] font-semibold block truncate ${isPresent ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {isPresent ? 'Verified Present &bull; Leave Form Ready' : 'Pending QR Attendance'}
                          </span>
                        </div>

                        <div className="self-start sm:self-auto shrink-0">
                          {!isPresent ? (
                            <button
                              onClick={() => setQrModalItem({ event, registration })}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>Scan QR</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setActiveSubNav('leave-forms')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 2. MY EVENTS: Confirmed registrations & passes */}
      {activeSubNav === 'my-registration' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4 w-full">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-lg font-bold text-slate-900">My Event Registrations & Entry Passes</h2>
            <p className="text-xs text-slate-500">
              Your unique registration codes are required to mark attendance via the venue QR code.
            </p>
          </div>

          {registrations.length === 0 ? (
            <div className="p-8 sm:p-10 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <ClipboardList className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500">No active registrations.</p>
              <button
                onClick={() => setActiveSubNav('browse-events')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Browse Events Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {registrations.map(({ registration, event }) => {
                const isPresent = registration.attendanceStatus === 'present';

                return (
                  <div key={registration.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                          {event.category}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1 truncate">{event.title}</h4>
                        <p className="text-xs text-slate-500 truncate">{event.venue}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 block font-bold">Unique Pass ID</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs font-extrabold text-purple-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {registration.registrationCode}
                          </span>
                          <button
                            onClick={() => handleCopyCode(registration.registrationCode, registration.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                            title="Copy code"
                          >
                            {copiedCodeId === registration.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs gap-2">
                      <div className="min-w-0">
                        {isPresent ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 truncate">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>Present &bull; Leave Unlocked</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 truncate">
                            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Pending Check-in</span>
                          </span>
                        )}
                      </div>

                      <div className="shrink-0">
                        {!isPresent ? (
                          <button
                            onClick={() => setQrModalItem({ event, registration })}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Scan QR Code</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setActiveSubNav('leave-forms')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>View Leave Form</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. BROWSE EVENTS: Search, filters, cards, and registration */}
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

      {/* 4. LEAVE FORM SENT BY ORGANIZER: Gated by QR attendance */}
      {activeSubNav === 'leave-forms' && (
        <StudentLeaveForms
          student={student}
          onOpenProfileEdit={onOpenProfileEdit}
          onBrowseEvents={() => setActiveSubNav('browse-events')}
        />
      )}

      {/* 5. PERMISSION FORMS: Student consent slips */}
      {activeSubNav === 'permission-forms' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-5 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Student Permission & Consent Forms</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {permissionForms.length} Available
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Official slips uploaded by event organizers and faculty for event participation, lab clearance, and travel.
              </p>
            </div>
            <button
              onClick={() => {
                onRefreshData();
                showNotice('Refreshed permission forms list.');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh List</span>
            </button>
          </div>

          {permissionForms.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No permission forms published yet</p>
              <p className="text-xs text-slate-400 mt-1">Event organizers will post clearance slips here for upcoming events.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {permissionForms.map(form => (
                <div 
                  key={form.id} 
                  className="p-4 sm:p-5 bg-slate-50 hover:bg-slate-50/80 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4 transition-all hover:shadow-xs"
                >
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-blue-800 uppercase bg-blue-100 px-2 py-0.5 rounded-md">
                        {form.department}
                      </span>
                      {form.organizerName && (
                        <span className="text-[10px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-purple-600" />
                          <span>Uploaded by {form.organizerName}</span>
                        </span>
                      )}
                      {form.eventTitle && (
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md truncate max-w-[200px]" title={form.eventTitle}>
                          Event: {form.eventTitle}
                        </span>
                      )}
                    </div>
                    
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{form.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{form.purpose}</p>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 pt-1">
                      <span className="truncate max-w-[180px] font-mono text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                        {form.fileName}
                      </span>
                      {form.fileSize && (
                        <span>• {form.fileSize > 1024 * 1024 ? `${(form.fileSize / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(form.fileSize / 1024)} KB`}</span>
                      )}
                      <span>• Updated {form.lastUpdated}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1 truncate">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Ready to download</span>
                    </span>
                    <button
                      onClick={() => {
                        downloadPermissionForm(form, student);
                        showNotice(`Downloaded "${form.fileName}" successfully!`);
                      }}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. NOTIFICATIONS: Student alerts */}
      {activeSubNav === 'notifications' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4 w-full">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Notifications & Alerts</h2>
            <p className="text-xs text-slate-500">Attendance verifications, event reminders, and announcements.</p>
          </div>

          <div className="space-y-3">
            {notifications.map(n => (
              <div key={n.id} className="p-3.5 sm:p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-900 block truncate">{n.title}</span>
                  <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">{new Date(n.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. MY PROFILE */}
      {activeSubNav === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-5 sm:space-y-6 w-full">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">My Academic Profile</h2>
              <p className="text-xs text-slate-500">Details populated into automated HOD leave applications.</p>
            </div>
            <button
              onClick={onOpenProfileEdit}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Edit Details
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <img src={student.avatarUrl} alt={student.name} className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0" />
            <div className="space-y-1.5 text-xs">
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
