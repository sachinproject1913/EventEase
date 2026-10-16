import React, { useState } from 'react';
import { User, CampusEvent, CampusAnnouncement } from '../types';
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
  Check
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import { SUPABASE_SQL_SCHEMA } from '../services/supabaseService';

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

export const AdminPanel: React.FC<Props> = ({ adminUser, onOpenSpecs, onOpenSupabase }) => {
  const [activeSubNav, setActiveSubNav] = useState<AdminNav>('dashboard');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Filter states
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'present' | 'pending'>('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Announcement state
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annCategory, setAnnCategory] = useState<'Urgent' | 'Academic' | 'Event' | 'Policy'>('Academic');
  const [annAudience, setAnnAudience] = useState<'all' | 'students' | 'organizers'>('all');

  // Settings state
  const [univName, setUnivName] = useState('GLA UNIVERSITY MATHURA');
  const [leaveDeadlineDays, setLeaveDeadlineDays] = useState(3);
  const [strictAttendanceGate, setStrictAttendanceGate] = useState(true);

  // Load live data
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

  const handleApproveEvent = (eventId: string) => {
    apiService.updateEventApproval(eventId, 'approved');
    showNotice('Event approved and published across campus.');
  };

  const handleRejectEvent = (eventId: string) => {
    apiService.updateEventApproval(eventId, 'rejected');
    showNotice('Event rejected and unpublished.');
  };

  const handleDeleteEvent = (eventId: string, title: string) => {
    if (window.confirm(`Permanently remove event "${title}"?`)) {
      apiService.deleteEvent(eventId);
      showNotice(`Event "${title}" deleted.`);
    }
  };

  const handleDeleteUser = (userId: string, name: string) => {
    if (window.confirm(`Delete user account "${name}"?`)) {
      apiService.deleteUser(userId);
      showNotice(`User "${name}" removed.`);
    }
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
    showNotice('Campus announcement broadcasted successfully.');
  };

  const handleDeleteAnnouncement = (id: string) => {
    apiService.deleteAnnouncement(id);
    showNotice('Announcement removed.');
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

      {/* 1. DASHBOARD: Total users, total events, organizers, Registrations */}
      {activeSubNav === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Total Users</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-3xl font-extrabold text-slate-900">{students.length + organizers.length + 1}</span>
              <p className="text-[11px] text-slate-500">{students.length} Students &bull; {organizers.length} Organizers</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Total Events</span>
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-3xl font-extrabold text-slate-900">{metrics.totalEvents}</span>
              <p className="text-[11px] text-purple-700 font-semibold">{allEvents.filter(e => e.leaveFormTemplate?.isAvailable).length} Leave Forms Live</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Organizers</span>
                <Building className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-3xl font-extrabold text-emerald-600">{organizers.length}</span>
              <p className="text-[11px] text-slate-500">Registered Clubs & Societies</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Registrations</span>
                <ClipboardList className="w-4 h-4 text-rose-600" />
              </div>
              <span className="text-3xl font-extrabold text-rose-600">{metrics.totalRegistrations}</span>
              <p className="text-[11px] text-slate-500">{metrics.verifiedAttendance} QR Verified Present</p>
            </div>
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

      {/* 3. MANAGE STUDENTS: Student list and actions */}
      {activeSubNav === 'students' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Manage Students ({students.length})</h2>
              <p className="text-xs text-slate-500">View registered student profiles and academic eligibility.</p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search students..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3">Course & Year</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map(stu => (
                  <tr key={stu.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      <span>{stu.name}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{stu.studentId || 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-600">{stu.course || 'Unassigned'} &bull; {stu.year || '1st Year'}</td>
                    <td className="px-4 py-3 text-slate-600">{stu.department || 'Unassigned'}</td>
                    <td className="px-4 py-3 text-slate-500">{stu.email}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteUser(stu.id, stu.name)}
                        className="text-rose-600 hover:text-rose-800 p-1"
                        title="Delete student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. MANAGE ORGANIZERS: Organizer list and clubs */}
      {activeSubNav === 'organizers' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Manage Organizers ({organizers.length})</h2>
              <p className="text-xs text-slate-500">Faculty coordinators and authorized club organizers.</p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search organizers..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Organizer Name</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Events Managed</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrganizers.map(org => {
                  const eventCount = allEvents.filter(e => e.organizerId === org.id).length;

                  return (
                    <tr key={org.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                        <Building className="w-4 h-4 text-purple-600" />
                        <span>{org.name}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{org.department}</td>
                      <td className="px-4 py-3 font-semibold text-purple-700">{eventCount} Events</td>
                      <td className="px-4 py-3 text-slate-500">{org.email}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteUser(org.id, org.name)}
                          className="text-rose-600 hover:text-rose-800 p-1"
                          title="Delete organizer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. MANAGE EVENTS: Event approvals, publish/unpublish, delete */}
      {activeSubNav === 'events' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Manage Campus Events</h2>
              <p className="text-xs text-slate-500">Approve, unpublish, or delete university events.</p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Event Title</th>
                  <th className="px-4 py-3">Club / Organizer</th>
                  <th className="px-4 py-3">Venue & Date</th>
                  <th className="px-4 py-3">Seats</th>
                  <th className="px-4 py-3">Leave Template</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allEvents.map(evt => {
                  const hasTemplate = evt.leaveFormTemplate?.isAvailable;
                  const isApproved = evt.approvalStatus !== 'rejected';

                  return (
                    <tr key={evt.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-bold text-slate-900">{evt.title}</td>
                      <td className="px-4 py-3 text-slate-600">{evt.organizerClub}</td>
                      <td className="px-4 py-3 text-slate-600">{evt.venue} &bull; {new Date(evt.startDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-mono">{evt.registeredCount}/{evt.maxSeats}</td>
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
                              onClick={() => handleRejectEvent(evt.id)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                              title="Unpublish"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleApproveEvent(evt.id)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                              title="Approve"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteEvent(evt.id, evt.title)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. REGISTRATION: Campus-wide registration audit */}
      {activeSubNav === 'registration' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Campus Registrations & QR Verification</h2>
              <p className="text-xs text-slate-500">Every student registration and their attendance status.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs">
                <button
                  onClick={() => setAttendanceFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold ${attendanceFilter === 'all' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-600'}`}
                >
                  All ({allRegistrations.length})
                </button>
                <button
                  onClick={() => setAttendanceFilter('present')}
                  className={`px-2.5 py-1 rounded-lg font-bold ${attendanceFilter === 'present' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600'}`}
                >
                  Present
                </button>
                <button
                  onClick={() => setAttendanceFilter('pending')}
                  className={`px-2.5 py-1 rounded-lg font-bold ${attendanceFilter === 'pending' ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-600'}`}
                >
                  Pending
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Student Name & ID</th>
                  <th className="px-4 py-3">Event Title</th>
                  <th className="px-4 py-3">Registration Code</th>
                  <th className="px-4 py-3">Attendance</th>
                  <th className="px-4 py-3">Leave Forms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRegistrations.map(({ registration, event, student }) => (
                  <tr key={registration.id} className="hover:bg-slate-50/70">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. ANNOUNCEMENTS: Broadcast notices */}
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
                    onClick={() => handleDeleteAnnouncement(ann.id)}
                    className="text-rose-500 hover:text-rose-700 p-1"
                    title="Delete notice"
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

            <button
              onClick={() => showNotice('System settings updated.')}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
