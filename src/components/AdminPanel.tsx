import React, { useState } from 'react';
import { User, CampusEvent, CampusAnnouncement, EventRegistration } from '../types';
import { apiService } from '../services/apiService';
import { 
  Users, 
  Calendar, 
  FileCheck, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Filter, 
  FileSpreadsheet, 
  Building,
  GraduationCap,
  Bell,
  Settings,
  Plus,
  Search,
  Pin,
  ClipboardList,
  AlertTriangle,
  Database,
  ExternalLink,
  Copy,
  Check,
  ArrowUpRight,
  ArrowRight,
  CheckSquare,
  Square,
  UserX,
  CalendarX,
  Layers,
  ShieldAlert,
  RefreshCw,
  X
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import { SUPABASE_SQL_SCHEMA } from '../services/supabaseService';
import { SpotlightCard } from './SpotlightCard';

interface Props {
  adminUser: User;
  onOpenSpecs: () => void;
  onOpenSupabase: () => void;
}

type AdminNav = 
  | 'dashboard'
  | 'overview'
  | 'students'
  | 'organizers'
  | 'events'
  | 'registration'
  | 'announcements'
  | 'reports'
  | 'settings';

interface DeleteModalTarget {
  type: 'event' | 'organizer' | 'student' | 'registration' | 'announcement' | 'bulk_students' | 'bulk_organizers' | 'bulk_events' | 'bulk_registrations';
  id?: string;
  ids?: string[];
  title: string;
  subtitle?: string;
  count?: number;
  cascadeInfo?: string;
  deleteCreatedEvents?: boolean;
}

export const AdminPanel: React.FC<Props> = ({ adminUser, onOpenSpecs, onOpenSupabase }) => {
  const [activeSubNav, setActiveSubNav] = useState<AdminNav>('dashboard');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  // Deletion modal state
  const [pendingDelete, setPendingDelete] = useState<DeleteModalTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Multi-selection state for bulk deletion
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [selectedOrganizerIds, setSelectedOrganizerIds] = useState<Set<string>>(new Set());
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [selectedRegistrationIds, setSelectedRegistrationIds] = useState<Set<string>>(new Set());

  // Filter states
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'present' | 'pending'>('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [eventSearchQuery, setEventSearchQuery] = useState('');

  // Announcement state
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annCategory, setAnnCategory] = useState<'Urgent' | 'Academic' | 'Event' | 'Policy'>('Academic');
  const [annAudience, setAnnAudience] = useState<'all' | 'students' | 'organizers'>('all');

  // Settings state
  const [univName, setUnivName] = useState('GLA UNIVERSITY MATHURA');
  const [leaveDeadlineDays, setLeaveDeadlineDays] = useState(3);
  const [strictAttendanceGate, setStrictAttendanceGate] = useState(true);

  // Load live data (re-evaluated on refreshTick)
  const metrics = apiService.getSystemMetrics();
  const allEvents = apiService.getAllEventsAdmin();
  const allRegistrations = apiService.getAllCampusRegistrations();
  const students = apiService.getStudents();
  const organizers = apiService.getOrganizers();
  const announcements = apiService.getAnnouncements();

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const forceRefresh = () => {
    setRefreshTick(t => t + 1);
  };

  const handleApproveEvent = (eventId: string) => {
    apiService.updateEventApproval(eventId, 'approved');
    forceRefresh();
    showNotice('Event approved and published across campus.');
  };

  const handleRejectEvent = (eventId: string) => {
    apiService.updateEventApproval(eventId, 'rejected');
    forceRefresh();
    showNotice('Event rejected and unpublished.');
  };

  // --- CONFIRMED DELETION EXECUTION ---
  const executeConfirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);

    try {
      switch (pendingDelete.type) {
        case 'event':
          if (pendingDelete.id) {
            apiService.deleteEvent(pendingDelete.id);
            showNotice(`Event "${pendingDelete.title}" deleted permanently.`);
          }
          break;

        case 'organizer':
          if (pendingDelete.id) {
            apiService.deleteUser(pendingDelete.id, pendingDelete.deleteCreatedEvents ?? true);
            showNotice(`Organizer "${pendingDelete.title}" deleted.`);
          }
          break;

        case 'student':
          if (pendingDelete.id) {
            apiService.deleteUser(pendingDelete.id);
            showNotice(`Student "${pendingDelete.title}" deleted.`);
          }
          break;

        case 'registration':
          if (pendingDelete.id) {
            apiService.deleteRegistration(pendingDelete.id);
            showNotice(`Registration pass deleted. Seat restored.`);
          }
          break;

        case 'announcement':
          if (pendingDelete.id) {
            apiService.deleteAnnouncement(pendingDelete.id);
            showNotice(`Announcement removed.`);
          }
          break;

        case 'bulk_students':
          if (pendingDelete.ids && pendingDelete.ids.length > 0) {
            const count = apiService.bulkDeleteUsers(pendingDelete.ids);
            setSelectedStudentIds(new Set());
            showNotice(`Deleted ${count} student accounts.`);
          }
          break;

        case 'bulk_organizers':
          if (pendingDelete.ids && pendingDelete.ids.length > 0) {
            const count = apiService.bulkDeleteUsers(pendingDelete.ids, pendingDelete.deleteCreatedEvents ?? true);
            setSelectedOrganizerIds(new Set());
            showNotice(`Deleted ${count} organizers and their events.`);
          }
          break;

        case 'bulk_events':
          if (pendingDelete.ids && pendingDelete.ids.length > 0) {
            const count = apiService.bulkDeleteEvents(pendingDelete.ids);
            setSelectedEventIds(new Set());
            showNotice(`Deleted ${count} campus events.`);
          }
          break;

        case 'bulk_registrations':
          if (pendingDelete.ids && pendingDelete.ids.length > 0) {
            const count = apiService.bulkDeleteRegistrations(pendingDelete.ids);
            setSelectedRegistrationIds(new Set());
            showNotice(`Deleted ${count} registration passes.`);
          }
          break;
      }

      forceRefresh();
    } catch (err: any) {
      showNotice(`Error during deletion: ${err?.message || 'Operation failed'}`);
    } finally {
      setIsDeleting(false);
      setPendingDelete(null);
    }
  };

  // Helper trigger methods
  const requestDeleteEvent = (event: CampusEvent) => {
    setPendingDelete({
      type: 'event',
      id: event.id,
      title: event.title,
      subtitle: `Venue: ${event.venue} • Seats: ${event.registeredCount}/${event.maxSeats}`,
      cascadeInfo: `Permanently deletes this event, cancels ${event.registeredCount || 0} student registration(s), and removes associated leave form documents from both local and Supabase databases.`
    });
  };

  const requestDeleteStudent = (student: User) => {
    const studentRegsCount = allRegistrations.filter(r => r.student.id === student.id).length;
    setPendingDelete({
      type: 'student',
      id: student.id,
      title: student.name,
      subtitle: `Student ID: ${student.studentId || 'N/A'} • ${student.email}`,
      cascadeInfo: `Deleting this student will cancel their ${studentRegsCount} event registration(s), delete their attendance QR check-in logs, and remove their account permanently from Supabase.`
    });
  };

  const requestDeleteOrganizer = (organizer: User) => {
    const orgEventsCount = allEvents.filter(e => e.organizerId === organizer.id).length;
    setPendingDelete({
      type: 'organizer',
      id: organizer.id,
      title: organizer.name,
      subtitle: `${organizer.department || 'Department Organizer'} • ${organizer.email}`,
      cascadeInfo: `This organizer has managed ${orgEventsCount} event(s). Deleting will permanently remove their profile and all their organized campus events, registrations, and leave forms from Supabase.`,
      deleteCreatedEvents: true
    });
  };

  const requestDeleteRegistration = (regId: string, eventTitle: string, studentName: string, regCode: string) => {
    setPendingDelete({
      type: 'registration',
      id: regId,
      title: `${studentName} — ${regCode}`,
      subtitle: `Event: ${eventTitle}`,
      cascadeInfo: `Revoking this registration frees up 1 seat in "${eventTitle}" and permanently removes this student's entry pass from Supabase.`
    });
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    apiService.addAnnouncement({
      title: annTitle,
      content: annContent,
      author: adminUser.name,
      authorRole: 'admin',
      targetAudience: annAudience,
      category: annCategory,
      pinned: annCategory === 'Urgent'
    });
    setAnnTitle('');
    setAnnContent('');
    forceRefresh();
    showNotice('Campus announcement broadcasted successfully.');
  };

  const handleDeleteAnnouncement = (id: string, title: string) => {
    setPendingDelete({
      type: 'announcement',
      id,
      title,
      cascadeInfo: 'Deletes this campus notice from the feed and Supabase database.'
    });
  };

  const handleExportCsv = () => {
    const headers = ['Student Name', 'Student ID', 'Department', 'Event Title', 'Venue', 'Unique Reg Code', 'Attendance Status', 'Attendance Marked At', 'Official Form Downloaded', 'HOD Letter Downloaded'];
    const rows = filteredRegistrations.map(r => [
      r.student.name,
      r.student.studentId || 'N/A',
      r.student.department || 'N/A',
      r.event.title,
      r.event.venue,
      r.registration.registrationCode,
      r.registration.attendanceStatus.toUpperCase(),
      r.registration.attendanceMarkedAt ? new Date(r.registration.attendanceMarkedAt).toLocaleString() : 'Not Checked In',
      r.registration.officialFormDownloaded ? 'YES' : 'NO',
      r.registration.personalApplicationDownloaded ? 'YES' : 'NO'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CampusGuard_Global_Attendance_Leave_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice('Global Attendance & Leave Audit report exported.');
  };

  const filteredRegistrations = allRegistrations.filter(item => {
    if (attendanceFilter === 'present') return item.registration.attendanceStatus === 'present';
    if (attendanceFilter === 'pending') return item.registration.attendanceStatus === 'pending';
    return true;
  });

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    (s.studentId && s.studentId.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
    s.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const filteredOrganizers = organizers.filter(o =>
    o.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    (o.department && o.department.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
    o.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Toast Notice */}
      {actionNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Admin Sub-Navigation Bar matching exact user request */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {[
          { key: 'dashboard', label: 'Dashboard' },
          { key: 'overview', label: 'Overview' },
          { key: 'students', label: 'Manage Students' },
          { key: 'organizers', label: 'Manage Organizers' },
          { key: 'events', label: 'Manage Events' },
          { key: 'registration', label: 'Registration' },
          { key: 'announcements', label: 'Announcements' },
          { key: 'reports', label: 'Reports' },
          { key: 'settings', label: 'Settings' },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setActiveSubNav(item.key as AdminNav)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeSubNav === item.key
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Admin Universal Scope & Master Authority Notice */}
      <div className="bg-rose-50/80 border border-rose-200/90 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs text-rose-950 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-900 to-rose-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-rose-950 block">
              Dean & Administrator Governance: Universal Campus Data Access
            </span>
            <span className="text-[11px] text-rose-800">
              You can view, audit, and delete all entities across the university (students, organizers, campus events, and registrations).
            </span>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-rose-800 border border-rose-200 shadow-2xs">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          <span>Universal Scope</span>
        </span>
      </div>

      {/* 1. DASHBOARD: Total users, total events, organizers, Registrations */}
      {activeSubNav === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SpotlightCard 
              onClick={() => setActiveSubNav('students')}
              cursorText="Students"
              showHoverArrow={true}
              spotlightColor="rgba(59, 130, 246, 0.15)"
              className="p-5 flex flex-col justify-between space-y-1 cursor-pointer card-interactive hover:border-blue-300"
            >
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Total Users</span>
                <Users className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-3xl font-extrabold text-slate-900">{students.length + organizers.length + 1}</span>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <span>{students.length} Students &bull; {organizers.length} Org</span>
                <ArrowUpRight className="w-3 h-3 text-blue-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </p>
            </SpotlightCard>

            <SpotlightCard 
              onClick={() => setActiveSubNav('events')}
              cursorText="Events"
              showHoverArrow={true}
              spotlightColor="rgba(168, 85, 247, 0.15)"
              className="p-5 flex flex-col justify-between space-y-1 cursor-pointer card-interactive hover:border-purple-300"
            >
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Total Events</span>
                <Calendar className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-3xl font-extrabold text-slate-900">{metrics.totalEvents}</span>
              <p className="text-[11px] text-purple-700 font-semibold flex items-center gap-1">
                <span>{allEvents.filter(e => e.leaveFormTemplate?.isAvailable).length} Forms Live</span>
                <ArrowUpRight className="w-3 h-3 text-purple-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </p>
            </SpotlightCard>

            <SpotlightCard 
              onClick={() => setActiveSubNav('organizers')}
              cursorText="Clubs"
              showHoverArrow={true}
              spotlightColor="rgba(16, 185, 129, 0.15)"
              className="p-5 flex flex-col justify-between space-y-1 cursor-pointer card-interactive hover:border-emerald-300"
            >
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Organizers</span>
                <Building className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-3xl font-extrabold text-emerald-600">{organizers.length}</span>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <span>Registered Clubs</span>
                <ArrowUpRight className="w-3 h-3 text-emerald-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </p>
            </SpotlightCard>

            <SpotlightCard 
              onClick={() => setActiveSubNav('registration')}
              cursorText="Registrations"
              showHoverArrow={true}
              spotlightColor="rgba(244, 63, 94, 0.15)"
              className="p-5 flex flex-col justify-between space-y-1 cursor-pointer card-interactive hover:border-rose-300"
            >
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Registrations</span>
                <ClipboardList className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-3xl font-extrabold text-rose-600">{metrics.totalRegistrations}</span>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <span>{metrics.verifiedAttendance} QR Verified</span>
                <ArrowUpRight className="w-3 h-3 text-rose-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </p>
            </SpotlightCard>
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <span>Attendance Verification Summary</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                CampusGuard requires students to check in via venue QR code before generating HOD leave application letters.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Verification Rate:</span>
                  <span className="text-emerald-700 font-bold">
                    {metrics.totalRegistrations ? Math.round((metrics.verifiedAttendance / metrics.totalRegistrations) * 100) : 0}% Present
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all" 
                    style={{ width: `${metrics.totalRegistrations ? (metrics.verifiedAttendance / metrics.totalRegistrations) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-rose-600" />
                <span>Campus Broadcast Quick Action</span>
              </h3>
              <p className="text-xs text-slate-600">
                Post an announcement to all students or organizers directly from the console.
              </p>
              <button
                onClick={() => setActiveSubNav('announcements')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Go to Announcements
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. OVERVIEW: System metrics and activity */}
      {activeSubNav === 'overview' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900">University System Overview</h2>
            <p className="text-xs text-slate-500">Live operational metrics and attendance policy compliance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-xs font-semibold text-slate-500">Leave Form Downloads</span>
              <span className="text-2xl font-bold text-blue-700 block">{metrics.totalDownloads}</span>
              <span className="text-[11px] text-slate-400">Total verified PDF downloads</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-xs font-semibold text-slate-500">Active Leave Form Templates</span>
              <span className="text-2xl font-bold text-purple-700 block">{metrics.totalTemplates}</span>
              <span className="text-[11px] text-slate-400">Uploaded by organizers</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-xs font-semibold text-slate-500">Technical Infrastructure</span>
              <span className="text-2xl font-bold text-slate-900 block">Spring Boot 3</span>
              <span className="text-[11px] text-slate-400">MySQL 8.0 &bull; OpenPDF Engine</span>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-blue-900 block">Backend Architecture & REST Endpoints Specification</span>
              <span className="text-blue-800 text-[11px]">Inspect Java Spring Boot Controllers, Entities, and schema.sql</span>
            </div>
            <button
              onClick={onOpenSpecs}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
            >
              Open Technical Specs
            </button>
          </div>
        </div>
      )}

      {/* 3. MANAGE STUDENTS: Student list, bulk selection, and delete actions */}
      {activeSubNav === 'students' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Manage Students ({students.length})</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
                  Full Admin Delete Control
                </span>
              </div>
              <p className="text-xs text-slate-500">View registered student profiles, academic records, and remove accounts.</p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name, ID, roll, email..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden w-64"
              />
            </div>
          </div>

          {/* Bulk Action Bar for Students */}
          {selectedStudentIds.size > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                <UserX className="w-4 h-4 text-rose-600" />
                <span>{selectedStudentIds.size} student(s) selected</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudentIds(new Set())}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
                >
                  Deselect
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const ids = Array.from(selectedStudentIds);
                    setPendingDelete({
                      type: 'bulk_students',
                      ids,
                      title: `${ids.length} Selected Student Accounts`,
                      subtitle: 'Multiple Student Profiles',
                      cascadeInfo: `Deleting these ${ids.length} students will cancel all their active event passes, remove their QR check-in records, and permanently erase their accounts from Supabase.`
                    });
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected Students ({selectedStudentIds.size})</span>
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={filteredStudents.length > 0 && filteredStudents.every(s => selectedStudentIds.has(s.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const newSet = new Set(selectedStudentIds);
                          filteredStudents.forEach(s => newSet.add(s.id));
                          setSelectedStudentIds(newSet);
                        } else {
                          const newSet = new Set(selectedStudentIds);
                          filteredStudents.forEach(s => newSet.delete(s.id));
                          setSelectedStudentIds(newSet);
                        }
                      }}
                      className="rounded-sm text-rose-600 h-3.5 w-3.5 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Student ID / Roll</th>
                  <th className="px-4 py-3">Course & Year</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Passes</th>
                  <th className="px-4 py-3 text-right">Delete Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      No students found matching "{userSearchQuery}".
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(stu => {
                    const isSelected = selectedStudentIds.has(stu.id);
                    const stuRegsCount = allRegistrations.filter(r => r.student.id === stu.id).length;

                    return (
                      <tr key={stu.id} className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-rose-50/40' : ''}`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const newSet = new Set(selectedStudentIds);
                              if (e.target.checked) {
                                newSet.add(stu.id);
                              } else {
                                newSet.delete(stu.id);
                              }
                              setSelectedStudentIds(newSet);
                            }}
                            className="rounded-sm text-rose-600 h-3.5 w-3.5 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold text-xs">
                            {stu.name.charAt(0)}
                          </div>
                          <div>
                            <span className="block">{stu.name}</span>
                            <span className="text-[10px] text-slate-400 font-normal">{stu.universityName || 'GLA University'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600 font-semibold">{stu.studentId || 'N/A'}</td>
                        <td className="px-4 py-3 text-slate-600">{stu.course || 'Unassigned'} &bull; {stu.year || '1st Year'}</td>
                        <td className="px-4 py-3 text-slate-600">{stu.department || 'Unassigned'}</td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{stu.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            stuRegsCount > 0 ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {stuRegsCount} Pass{stuRegsCount === 1 ? '' : 'es'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => requestDeleteStudent(stu)}
                            className="p-1.5 text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg border border-transparent hover:border-rose-700 transition-colors"
                            title={`Delete student "${stu.name}" and all records`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. MANAGE ORGANIZERS: Organizer list, clubs, and delete actions */}
      {activeSubNav === 'organizers' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Manage Organizers ({organizers.length})</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800">
                  Full Admin Delete Control
                </span>
              </div>
              <p className="text-xs text-slate-500">Faculty coordinators, student club leads, and authorized campus organizers.</p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search organizers..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden w-64"
              />
            </div>
          </div>

          {/* Bulk Action Bar for Organizers */}
          {selectedOrganizerIds.size > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                <UserX className="w-4 h-4 text-rose-600" />
                <span>{selectedOrganizerIds.size} organizer(s) selected</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrganizerIds(new Set())}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
                >
                  Deselect
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const ids = Array.from(selectedOrganizerIds);
                    setPendingDelete({
                      type: 'bulk_organizers',
                      ids,
                      title: `${ids.length} Selected Organizers`,
                      subtitle: 'Multiple Organizer Profiles',
                      cascadeInfo: `Deleting these ${ids.length} organizers will also permanently remove all events, student registrations, and permission forms they created across campus and Supabase.`,
                      deleteCreatedEvents: true
                    });
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected Organizers ({selectedOrganizerIds.size})</span>
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={filteredOrganizers.length > 0 && filteredOrganizers.every(o => selectedOrganizerIds.has(o.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const newSet = new Set(selectedOrganizerIds);
                          filteredOrganizers.forEach(o => newSet.add(o.id));
                          setSelectedOrganizerIds(newSet);
                        } else {
                          const newSet = new Set(selectedOrganizerIds);
                          filteredOrganizers.forEach(o => newSet.delete(o.id));
                          setSelectedOrganizerIds(newSet);
                        }
                      }}
                      className="rounded-sm text-rose-600 h-3.5 w-3.5 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3">Organizer Name</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Events Managed</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 text-right">Delete Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrganizers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No organizers found matching "{userSearchQuery}".
                    </td>
                  </tr>
                ) : (
                  filteredOrganizers.map(org => {
                    const isSelected = selectedOrganizerIds.has(org.id);
                    const eventCount = allEvents.filter(e => e.organizerId === org.id).length;

                    return (
                      <tr key={org.id} className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-rose-50/40' : ''}`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const newSet = new Set(selectedOrganizerIds);
                              if (e.target.checked) {
                                newSet.add(org.id);
                              } else {
                                newSet.delete(org.id);
                              }
                              setSelectedOrganizerIds(newSet);
                            }}
                            className="rounded-sm text-rose-600 h-3.5 w-3.5 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 font-bold text-xs">
                            <Building className="w-3.5 h-3.5 text-purple-600" />
                          </div>
                          <div>
                            <span className="block">{org.name}</span>
                            <span className="text-[10px] text-slate-400 font-normal">Organizer Account</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{org.department || 'General Administration'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            eventCount > 0 ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {eventCount} Event{eventCount === 1 ? '' : 's'} Managed
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{org.email}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => requestDeleteOrganizer(org)}
                            className="p-1.5 text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg border border-transparent hover:border-rose-700 transition-colors"
                            title={`Delete organizer "${org.name}" and their events`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. MANAGE EVENTS: Event search, approvals, publish/unpublish, and bulk delete */}
      {activeSubNav === 'events' && (() => {
        const filteredEvents = allEvents.filter(e =>
          e.title.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
          e.organizerClub.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
          e.venue.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
          e.department.toLowerCase().includes(eventSearchQuery.toLowerCase())
        );

        return (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">Manage Campus Events ({allEvents.length})</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
                    Full Admin Delete Control
                  </span>
                </div>
                <p className="text-xs text-slate-500">Approve, unpublish, or permanently delete university events and student registrations.</p>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search events, clubs, venues..."
                  value={eventSearchQuery}
                  onChange={(e) => setEventSearchQuery(e.target.value)}
                  className="text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden w-64"
                />
              </div>
            </div>

            {/* Bulk Action Bar for Events */}
            {selectedEventIds.size > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                  <CalendarX className="w-4 h-4 text-rose-600" />
                  <span>{selectedEventIds.size} event(s) selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedEventIds(new Set())}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
                  >
                    Deselect
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const ids = Array.from(selectedEventIds);
                      setPendingDelete({
                        type: 'bulk_events',
                        ids,
                        title: `${ids.length} Selected Campus Events`,
                        subtitle: 'Multiple Events',
                        cascadeInfo: `Deleting these ${ids.length} events will cancel all student registrations, remove attendance check-in logs, and delete all associated files from both local and Supabase databases.`
                      });
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Selected Events ({selectedEventIds.size})</span>
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={filteredEvents.length > 0 && filteredEvents.every(e => selectedEventIds.has(e.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const newSet = new Set(selectedEventIds);
                            filteredEvents.forEach(evt => newSet.add(evt.id));
                            setSelectedEventIds(newSet);
                          } else {
                            const newSet = new Set(selectedEventIds);
                            filteredEvents.forEach(evt => newSet.delete(evt.id));
                            setSelectedEventIds(newSet);
                          }
                        }}
                        className="rounded-sm text-rose-600 h-3.5 w-3.5 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3">Event Title</th>
                    <th className="px-4 py-3">Club / Organizer</th>
                    <th className="px-4 py-3">Venue & Date</th>
                    <th className="px-4 py-3">Seats</th>
                    <th className="px-4 py-3">Leave Template</th>
                    <th className="px-4 py-3 text-right">Delete & Approval Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        No events found matching "{eventSearchQuery}".
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map(evt => {
                      const isSelected = selectedEventIds.has(evt.id);
                      const hasTemplate = evt.leaveFormTemplate?.isAvailable;
                      const isApproved = evt.approvalStatus !== 'rejected';

                      return (
                        <tr key={evt.id} className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-rose-50/40' : ''}`}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const newSet = new Set(selectedEventIds);
                                if (e.target.checked) {
                                  newSet.add(evt.id);
                                } else {
                                  newSet.delete(evt.id);
                                }
                                setSelectedEventIds(newSet);
                              }}
                              className="rounded-sm text-rose-600 h-3.5 w-3.5 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                              <div>
                                <span>{evt.title}</span>
                                <span className="block text-[10px] text-slate-400 font-normal">{evt.category} &bull; {evt.department}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{evt.organizerClub}</td>
                          <td className="px-4 py-3 text-slate-600">{evt.venue} &bull; {new Date(evt.startDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3 font-mono">
                            <span className={evt.registeredCount >= evt.maxSeats ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                              {evt.registeredCount}/{evt.maxSeats}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {hasTemplate ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Available</span>
                            ) : (
                              <span className="text-[10px] text-slate-400">None</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isApproved ? (
                                <button
                                  type="button"
                                  onClick={() => handleRejectEvent(evt.id)}
                                  className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                  title="Unpublish event"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleApproveEvent(evt.id)}
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="Approve event"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => requestDeleteEvent(evt)}
                                className="p-1.5 text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg border border-transparent hover:border-rose-700 transition-colors"
                                title={`Permanently delete "${evt.title}"`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* 6. REGISTRATION: Campus-wide registration audit, pass management, and deletion */}
      {activeSubNav === 'registration' && (() => {
        const filteredBySearchAndAttendance = filteredRegistrations.filter(r =>
          r.student.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
          (r.student.studentId && r.student.studentId.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
          r.registration.registrationCode.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
          r.event.title.toLowerCase().includes(userSearchQuery.toLowerCase())
        );

        return (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">Campus Registrations & Pass Management</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
                    Full Admin Delete Control
                  </span>
                </div>
                <p className="text-xs text-slate-500">Audit all student event entries, QR passes, and revoke/delete registration records.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search reg code, student, event..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden w-56"
                  />
                </div>
                <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setAttendanceFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold ${attendanceFilter === 'all' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-600'}`}
                  >
                    All ({allRegistrations.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceFilter('present')}
                    className={`px-2.5 py-1 rounded-lg font-bold ${attendanceFilter === 'present' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600'}`}
                  >
                    Present
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceFilter('pending')}
                    className={`px-2.5 py-1 rounded-lg font-bold ${attendanceFilter === 'pending' ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-600'}`}
                  >
                    Pending
                  </button>
                </div>
              </div>
            </div>

            {/* Bulk Action Bar for Registrations */}
            {selectedRegistrationIds.size > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                  <ClipboardList className="w-4 h-4 text-rose-600" />
                  <span>{selectedRegistrationIds.size} registration pass(es) selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRegistrationIds(new Set())}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
                  >
                    Deselect
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const ids = Array.from(selectedRegistrationIds);
                      setPendingDelete({
                        type: 'bulk_registrations',
                        ids,
                        title: `${ids.length} Selected Registrations`,
                        subtitle: 'Multiple Student Passes',
                        cascadeInfo: `Revoking these ${ids.length} registrations will delete their access passes and QR attendance check-in entries from Supabase, restoring seats to their respective events.`
                      });
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Selected Passes ({selectedRegistrationIds.size})</span>
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={filteredBySearchAndAttendance.length > 0 && filteredBySearchAndAttendance.every(r => selectedRegistrationIds.has(r.registration.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const newSet = new Set(selectedRegistrationIds);
                            filteredBySearchAndAttendance.forEach(r => newSet.add(r.registration.id));
                            setSelectedRegistrationIds(newSet);
                          } else {
                            const newSet = new Set(selectedRegistrationIds);
                            filteredBySearchAndAttendance.forEach(r => newSet.delete(r.registration.id));
                            setSelectedRegistrationIds(newSet);
                          }
                        }}
                        className="rounded-sm text-rose-600 h-3.5 w-3.5 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3">Student Name & ID</th>
                    <th className="px-4 py-3">Event Title</th>
                    <th className="px-4 py-3">Registration Code</th>
                    <th className="px-4 py-3">Attendance</th>
                    <th className="px-4 py-3">Leave Forms</th>
                    <th className="px-4 py-3 text-right">Delete Pass</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBySearchAndAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        No registrations found matching the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredBySearchAndAttendance.map(({ registration, event, student }) => {
                      const isSelected = selectedRegistrationIds.has(registration.id);

                      return (
                        <tr key={registration.id} className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-rose-50/40' : ''}`}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const newSet = new Set(selectedRegistrationIds);
                                if (e.target.checked) {
                                  newSet.add(registration.id);
                                } else {
                                  newSet.delete(registration.id);
                                }
                                setSelectedRegistrationIds(newSet);
                              }}
                              className="rounded-sm text-rose-600 h-3.5 w-3.5 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {student.name} <span className="font-mono text-slate-400">({student.studentId || 'ID Pending'})</span>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{event.title}</td>
                          <td className="px-4 py-3 font-mono font-bold text-purple-800">{registration.registrationCode}</td>
                          <td className="px-4 py-3">
                            {registration.attendanceStatus === 'present' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Present
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800">
                                Pending QR Check-in
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {registration.attendanceStatus === 'present' ? (
                              <span className="text-emerald-700 font-semibold">Unlocked</span>
                            ) : (
                              <span className="text-slate-400">Locked</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => requestDeleteRegistration(registration.id, event.title, student.name, registration.registrationCode)}
                              className="p-1.5 text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg border border-transparent hover:border-rose-700 transition-colors"
                              title={`Revoke pass for ${student.name} in "${event.title}"`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* 7. ANNOUNCEMENTS: Broadcast notices and deletion */}
      {activeSubNav === 'announcements' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-rose-600" />
              <span>Broadcast Campus Announcement</span>
            </h2>
            <form onSubmit={handleCreateAnnouncement} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Announcement Title</label>
                  <input
                    type="text"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="e.g. Mandatory Attendance Policy for Hackathons"
                    className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={annAudience}
                    onChange={(e) => setAnnAudience(e.target.value as any)}
                    className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  >
                    <option value="all">All University</option>
                    <option value="students">Students Only</option>
                    <option value="organizers">Organizers Only</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message Body</label>
                <textarea
                  rows={3}
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Enter official announcement text..."
                  className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  required
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Post Announcement
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Active Campus Notices ({announcements.length})</h3>
            <div className="space-y-3">
              {announcements.map(ann => (
                <div key={ann.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800">
                        {ann.category}
                      </span>
                      <span className="text-[11px] text-slate-500">To: {ann.targetAudience}</span>
                      <span className="text-[11px] text-slate-400">&bull; {new Date(ann.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{ann.title}</h4>
                    <p className="text-xs text-slate-600">{ann.content}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteAnnouncement(ann.id, ann.title)}
                    className="p-1.5 text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg border border-transparent hover:border-rose-700 transition-colors"
                    title={`Delete notice "${ann.title}"`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 8. REPORTS: Downloadable analytics and audit logs */}
      {activeSubNav === 'reports' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900">University Attendance & Exemption Reports</h2>
            <p className="text-xs text-slate-500">Downloadable audit logs for departmental academic clearance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <FileSpreadsheet className="w-5 h-5" />
                <span>Global Student Attendance Audit</span>
              </div>
              <p className="text-xs text-slate-600">
                Complete spreadsheet containing student IDs, registered events, QR check-in timestamps, and downloaded leave applications.
              </p>
              <button
                onClick={handleExportCsv}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV Report</span>
              </button>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
                <ClipboardList className="w-5 h-5" />
                <span>Event Popularity & Seat Utilization Report</span>
              </div>
              <p className="text-xs text-slate-600">
                Breakdown of event capacities, registered student tallies, and organizer compliance rates.
              </p>
              <button
                onClick={() => {
                  showNotice('Event Utilization summary generated.');
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Generate Summary</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. SETTINGS: University preferences & rules */}
      {activeSubNav === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900">CampusGuard System Settings</h2>
            <p className="text-xs text-slate-500">Configure institutional policies and attendance rules.</p>
          </div>

          <div className="max-w-xl space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">University / Institute Name</label>
              <input
                type="text"
                value={univName}
                onChange={(e) => setUnivName(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">HOD Leave Form Submission Window (Days post-event)</label>
              <input
                type="number"
                value={leaveDeadlineDays}
                onChange={(e) => setLeaveDeadlineDays(Number(e.target.value))}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Strict QR Attendance Gate</span>
                <span className="text-[11px] text-slate-500">Students cannot download leave applications without being marked PRESENT.</span>
              </div>
              <input
                type="checkbox"
                checked={strictAttendanceGate}
                onChange={(e) => setStrictAttendanceGate(e.target.checked)}
                className="rounded-sm text-rose-600 h-4 w-4"
              />
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-950 block">Supabase Cloud Database & Schema</span>
                    <span className="text-[11px] text-emerald-700">PostgreSQL 15+ &bull; RLS Security &bull; GLA University Mathura</span>
                  </div>
                </div>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                  isSupabaseConfigured()
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                  {isSupabaseConfigured() ? 'Connected' : 'Offline / Local'}
                </span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Connect your cloud Supabase database to synchronize live events, student registrations, QR attendance scans, and HOD leave forms.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onOpenSupabase}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Open Supabase Connection & Schema</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
                    showNotice('Copied Supabase SQL schema query to clipboard!');
                  }}
                  className="px-3 py-2 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy SQL Query</span>
                </button>
              </div>
            </div>

            {/* Factory Reset Danger Zone */}
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-rose-950 block">Factory Reset & Data Purge</span>
                  <span className="text-[11px] text-rose-700">Reset all events, accounts, and registrations back to defaults</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    apiService.resetToDefaults();
                    forceRefresh();
                    showNotice('System data reset to initial university defaults.');
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset to Defaults</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => showNotice('System settings updated.')}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* CONFIRMATION DELETION MODAL */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-rose-200 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-sm">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-rose-950">Confirm Permanent Deletion</h3>
                  <span className="text-xs font-semibold text-rose-700">Administrator Privileged Action</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="text-rose-400 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-100 transition-colors"
                disabled={isDeleting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Target for Deletion</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 break-words">{pendingDelete.title}</h4>
                {pendingDelete.subtitle && (
                  <p className="text-xs text-slate-600 font-medium">{pendingDelete.subtitle}</p>
                )}
              </div>

              {pendingDelete.cascadeInfo && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-amber-950 block">Database Cascade Warning</span>
                    <p className="text-amber-800 leading-relaxed">{pendingDelete.cascadeInfo}</p>
                  </div>
                </div>
              )}

              {/* If deleting an organizer, give clear toggle for their events */}
              {pendingDelete.type === 'organizer' && (
                <label className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pendingDelete.deleteCreatedEvents ?? true}
                    onChange={(e) => setPendingDelete({ ...pendingDelete, deleteCreatedEvents: e.target.checked })}
                    className="rounded-sm text-rose-600 h-4 w-4 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 block">Delete all campus events created by this organizer</span>
                    <span className="text-slate-500 text-[11px]">Uncheck to reassign the events to Administrator instead.</span>
                  </div>
                </label>
              )}

              <p className="text-[11px] text-slate-500 italic">
                * Note: Changes will be immediately synchronized to both local state and your connected Supabase PostgreSQL database.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-white transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Deleting...' : 'Yes, Permanently Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
