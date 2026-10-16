import React, { useState } from 'react';
import { User, CampusEvent, EventCategory } from '../types';
import { apiService } from '../services/apiService';
import { formatEventDateRange, generateOfficialTemplateSamplePdf } from '../utils/pdfGenerator';
import { 
  Building, 
  Calendar, 
  Users, 
  Upload, 
  FileCheck, 
  Plus, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Bell, 
  Download, 
  ShieldCheck, 
  Trash2, 
  Printer, 
  Search,
  Check,
  AlertCircle,
  Eye,
  RefreshCw,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface Props {
  organizer: User;
  onRefreshEvents: () => void;
  onOpenProfileEdit: () => void;
}

type OrganizerNav = 
  | 'dashboard'
  | 'overview'
  | 'create-event'
  | 'manage-events'
  | 'participants'
  | 'permission-forms'
  | 'notifications'
  | 'leave-forms'
  | 'profile';

export const OrganizerPanel: React.FC<Props> = ({ organizer, onRefreshEvents, onOpenProfileEdit }) => {
  const [activeSubNav, setActiveSubNav] = useState<OrganizerNav>('dashboard');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Selected event for leave form upload & QR management
  const organizerEvents = apiService.getOrganizerEvents(organizer.id);
  const [selectedEventId, setSelectedEventId] = useState<string>(organizerEvents[0]?.id || '');
  const selectedEvent = organizerEvents.find(e => e.id === selectedEventId) || organizerEvents[0];

  // Create Event Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<EventCategory>('Hackathon');
  const [newVenue, setNewVenue] = useState('Innovation Hub, Tech Park');
  const [newSeats, setNewSeats] = useState(100);
  const [newClub, setNewClub] = useState(organizer.department || 'Coding & AI Society');
  const [newBanner, setNewBanner] = useState('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80');

  // Leave Form Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Participant search state
  const [participantSearch, setParticipantSearch] = useState('');

  // Live stats
  const stats = apiService.getOrganizerDashboardStats(organizer.id);
  const notifications = apiService.getNotifications(organizer.id, 'organizer');
  const permissionForms = apiService.getPermissionForms('organizer');

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    apiService.createEvent(organizer.id, {
      title: newTitle,
      description: newDesc,
      category: newCategory,
      venue: newVenue,
      maxSeats: Number(newSeats),
      organizerClub: newClub,
      bannerImage: newBanner
    });

    setNewTitle('');
    setNewDesc('');
    onRefreshEvents();
    showNotice(`Event "${newTitle}" created and published!`);
    setActiveSubNav('manage-events');
  };

  // Leave Form Management methods (strictly organizer only)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedEvent) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      showNotice('Invalid file format. Only PDF templates are permitted.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        apiService.uploadLeaveFormTemplate(organizer.id, selectedEvent.id, {
          fileName: file.name,
          fileSize: file.size,
          fileDataUrl: reader.result as string,
          isAvailable: true,
          instructions: customInstructions || 'Official department leave template.'
        });
        setIsUploading(false);
        onRefreshEvents();
        showNotice(`Leave form template "${file.name}" uploaded for students!`);
      } catch (err: unknown) {
        setIsUploading(false);
        showNotice(err instanceof Error ? err.message : 'Upload failed');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAttachSampleTemplate = () => {
    if (!selectedEvent) return;
    const sampleDoc = generateOfficialTemplateSamplePdf(selectedEvent);
    const dataUri = sampleDoc.output('datauristring');

    apiService.uploadLeaveFormTemplate(organizer.id, selectedEvent.id, {
      fileName: `Official_${selectedEvent.id}_Dean_Leave_Form.pdf`,
      fileSize: 195000,
      fileDataUrl: dataUri,
      isAvailable: true,
      instructions: customInstructions || 'Dean of Student Affairs approved attendance exemption form.'
    });

    onRefreshEvents();
    showNotice(`Official template generated and linked to ${selectedEvent.title}!`);
  };

  const handleToggleAvailability = (currentStatus: boolean) => {
    if (!selectedEvent) return;
    apiService.updateTemplateAvailability(organizer.id, selectedEvent.id, !currentStatus);
    onRefreshEvents();
    showNotice(!currentStatus ? 'Template is now AVAILABLE for verified present students.' : 'Template set to DRAFT (Hidden).');
  };

  const handleDeleteTemplate = () => {
    if (!selectedEvent) return;
    if (window.confirm('Delete official leave form template?')) {
      apiService.deleteLeaveFormTemplate(organizer.id, selectedEvent.id);
      onRefreshEvents();
      showNotice('Template removed.');
    }
  };

  // Participants roster
  const registrationsForEvent = selectedEvent ? apiService.getEventRegistrations(selectedEvent.id) : [];
  const filteredParticipants = registrationsForEvent.filter(r => 
    r.student.name.toLowerCase().includes(participantSearch.toLowerCase()) ||
    (r.student.studentId && r.student.studentId.toLowerCase().includes(participantSearch.toLowerCase())) ||
    r.registration.registrationCode.toLowerCase().includes(participantSearch.toLowerCase())
  );

  const handleToggleAttendance = (regId: string, currentStatus: string) => {
    if (!selectedEvent) return;
    const nextStatus = currentStatus === 'present' ? 'pending' : 'present';
    apiService.updateRegistrationAttendance(organizer.id, selectedEvent.id, regId, nextStatus);
    onRefreshEvents();
    showNotice(`Attendance marked ${nextStatus.toUpperCase()}.`);
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

      {/* Organizer Sub-Navigation Bar matching exact user request */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {[
          { key: 'dashboard', label: 'Dashboard' },
          { key: 'overview', label: 'Overviews' },
          { key: 'create-event', label: 'Create New Events' },
          { key: 'manage-events', label: 'Manage My Events' },
          { key: 'participants', label: 'Participants' },
          { key: 'permission-forms', label: 'Permission Form' },
          { key: 'notifications', label: 'Notification' },
          { key: 'leave-forms', label: 'Leave Form For The Students' },
          { key: 'profile', label: 'My Profile' },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setActiveSubNav(item.key as OrganizerNav)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeSubNav === item.key
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 1. DASHBOARD: My events, Total Participants, Pending Tasks, Notifications */}
      {activeSubNav === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">My Events</span>
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-3xl font-extrabold text-slate-900">{stats.myEventsCount}</span>
              <p className="text-[11px] text-slate-500">Organized by {organizer.name}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Total Participants</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-3xl font-extrabold text-blue-600">{stats.totalParticipants}</span>
              <p className="text-[11px] text-emerald-700 font-semibold">{stats.verifiedAttendance} Verified Present</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Pending Tasks</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-3xl font-extrabold text-amber-600">{stats.pendingTasks}</span>
              <p className="text-[11px] text-slate-500">Templates pending upload</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Notifications</span>
                <Bell className="w-4 h-4 text-rose-600" />
              </div>
              <span className="text-3xl font-extrabold text-slate-900">{stats.notificationsCount}</span>
              <p className="text-[11px] text-slate-500">Unread updates</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-600" />
                <span>Upload Leave Form Template</span>
              </h3>
              <p className="text-xs text-slate-600">
                Provide the official PDF attendance exemption form for your upcoming events.
              </p>
              <button
                onClick={() => setActiveSubNav('leave-forms')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Manage Leave Forms
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-600" />
                <span>Display Venue Check-in QR</span>
              </h3>
              <p className="text-xs text-slate-600">
                Project or print the event attendance QR code so registered students can check in as PRESENT.
              </p>
              <button
                onClick={() => setActiveSubNav('participants')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Open Participant Roster & QR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. OVERVIEWS: Upcoming dates, attendance breakdown */}
      {activeSubNav === 'overview' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900">Organizer Activity Overview</h2>
            <p className="text-xs text-slate-500">Summary of events hosted by {organizer.name}.</p>
          </div>

          <div className="space-y-4">
            {organizerEvents.map(evt => {
              const regCount = apiService.getEventRegistrations(evt.id).length;
              const hasForm = evt.leaveFormTemplate?.isAvailable;

              return (
                <div key={evt.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                      {evt.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{evt.title}</h4>
                    <p className="text-xs text-slate-500">{evt.venue} &bull; {formatEventDateRange(evt.startDate, evt.endDate)}</p>
                  </div>

                  <div className="flex items-center gap-4 text-xs shrink-0">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Registrations</span>
                      <span className="font-bold text-slate-900">{regCount} / {evt.maxSeats}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Leave Form</span>
                      <span className={`font-bold ${hasForm ? 'text-emerald-700' : 'text-amber-600'}`}>
                        {hasForm ? 'Live' : 'Pending Upload'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. CREATE NEW EVENTS: Full event creation form */}
      {activeSubNav === 'create-event' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900">Create New Campus Event</h2>
            <p className="text-xs text-slate-500">Publish a new hackathon, workshop, or seminar to the university directory.</p>
          </div>

          <form onSubmit={handleCreateEvent} className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Event Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. NextGen AI & Deep Learning Symposium 2026"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as EventCategory)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                >
                  <option value="Hackathon">Hackathon</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Seminar">Seminar</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Sports">Sports</option>
                  <option value="Technical">Technical</option>
                  <option value="Career">Career</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Max Capacity (Seats)</label>
                <input
                  type="number"
                  value={newSeats}
                  onChange={(e) => setNewSeats(Number(e.target.value))}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Campus Venue</label>
                <input
                  type="text"
                  value={newVenue}
                  onChange={(e) => setNewVenue(e.target.value)}
                  placeholder="e.g. Auditorium A, Science Block"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Organizing Body / Club</label>
                <input
                  type="text"
                  value={newClub}
                  onChange={(e) => setNewClub(e.target.value)}
                  placeholder="e.g. Coding & AI Society"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Event Description</label>
              <textarea
                rows={3}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Details about prerequisites, agenda, and awards..."
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Banner Image URL</label>
              <input
                type="text"
                value={newBanner}
                onChange={(e) => setNewBanner(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Publish Event & Open Registration
            </button>
          </form>
        </div>
      )}

      {/* 4. MANAGE MY EVENTS: List & manage */}
      {activeSubNav === 'manage-events' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Manage My Events ({organizerEvents.length})</h2>
              <p className="text-xs text-slate-500">Edit, remove, or monitor registrations for your events.</p>
            </div>
            <button
              onClick={() => setActiveSubNav('create-event')}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Event</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {organizerEvents.map(evt => (
              <div key={evt.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                      {evt.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{evt.title}</h4>
                    <p className="text-xs text-slate-500">{evt.venue}</p>
                  </div>
                  <span className="font-mono text-xs font-bold bg-white px-2 py-1 rounded border border-slate-200">
                    {evt.registeredCount}/{evt.maxSeats}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  <button
                    onClick={() => {
                      setSelectedEventId(evt.id);
                      setActiveSubNav('leave-forms');
                    }}
                    className="flex-1 py-1.5 px-2.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700"
                  >
                    Leave Form
                  </button>
                  <button
                    onClick={() => {
                      setSelectedEventId(evt.id);
                      setActiveSubNav('participants');
                    }}
                    className="flex-1 py-1.5 px-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold"
                  >
                    Roster & QR
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. PARTICIPANTS: Live roster & QR check-in */}
      {activeSubNav === 'participants' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Event Participants & Live Check-in</h2>
              <p className="text-xs text-slate-500">Scan student passes or verify attendance for {selectedEvent?.title}.</p>
            </div>

            {/* Event switcher */}
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800"
            >
              {organizerEvents.map(evt => (
                <option key={evt.id} value={evt.id}>{evt.title}</option>
              ))}
            </select>
          </div>

          {/* Venue QR Code Banner */}
          {selectedEvent && (
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-6">
              <div className="p-3 bg-white rounded-xl shadow-xs border border-purple-100">
                <QRCodeSVG
                  value={JSON.stringify({
                    campusGuardEventId: selectedEvent.id,
                    eventTitle: selectedEvent.title,
                    venue: selectedEvent.venue,
                    secret: selectedEvent.eventSecretCode || `CG-QR-${selectedEvent.id}`,
                    timestamp: Date.now()
                  })}
                  size={120}
                  level="H"
                />
              </div>
              <div className="space-y-1.5 text-center sm:text-left flex-1">
                <span className="text-[10px] uppercase font-bold text-purple-700 bg-purple-200/80 px-2 py-0.5 rounded">
                  Official Venue QR Code
                </span>
                <h4 className="text-sm font-bold text-purple-950">Project or Print at {selectedEvent.venue}</h4>
                <p className="text-xs text-purple-900/80">
                  Students scan this QR code and submit their unique registration number to be verified as <strong>PRESENT</strong>, unlocking their leave forms.
                </p>
                <div className="pt-1">
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print QR Check-in Sign</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search participants */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search registered students by name, roll no, or unique code..."
              value={participantSearch}
              onChange={(e) => setParticipantSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Unique Reg Pass</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Attendance</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredParticipants.map(({ registration, student }) => {
                  const isPresent = registration.attendanceStatus === 'present';

                  return (
                    <tr key={registration.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-semibold text-slate-900">{student.name}</td>
                      <td className="px-4 py-3 font-mono font-bold text-purple-900">{registration.registrationCode}</td>
                      <td className="px-4 py-3 text-slate-600">{student.department || 'Computer Science'}</td>
                      <td className="px-4 py-3">
                        {isPresent ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Present
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleToggleAttendance(registration.id, registration.attendanceStatus)}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                            isPresent ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'
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
        </div>
      )}

      {/* 6. PERMISSION FORM: Requisition & Clearance forms */}
      {activeSubNav === 'permission-forms' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900">Organizer Permission & Clearance Forms</h2>
            <p className="text-xs text-slate-500">Official templates for auditorium booking, lab access, and sponsor clearance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {permissionForms.map(form => (
              <div key={form.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-purple-700 uppercase bg-purple-100 px-2 py-0.5 rounded">
                  {form.department}
                </span>
                <h4 className="text-sm font-bold text-slate-900">{form.title}</h4>
                <p className="text-xs text-slate-600">{form.purpose}</p>
                <div className="pt-2">
                  <button
                    onClick={() => showNotice(`Downloading template: ${form.fileName}`)}
                    className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Official Requisition Form</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. NOTIFICATIONS: Organizer alerts */}
      {activeSubNav === 'notifications' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900">Notifications & Alerts</h2>
            <p className="text-xs text-slate-500">Updates regarding your hosted events and student downloads.</p>
          </div>

          <div className="space-y-3">
            {notifications.map(n => (
              <div key={n.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
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

      {/* 8. LEAVE FORM FOR THE STUDENTS: Upload official PDF template */}
      {activeSubNav === 'leave-forms' && selectedEvent && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-purple-700">
                <Upload className="w-4 h-4" />
                <span>Leave Form Management for Students</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">Official Exemption Template Upload</h2>
              <p className="text-xs text-slate-500">Upload the PDF form that registered students download once marked Present.</p>
            </div>

            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800"
            >
              {organizerEvents.map(evt => (
                <option key={evt.id} value={evt.id}>{evt.title}</option>
              ))}
            </select>
          </div>

          {selectedEvent.leaveFormTemplate ? (
            /* Uploaded State */
            <div className="border-2 border-emerald-200 bg-emerald-50/50 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs uppercase font-bold text-emerald-800">
                      Official PDF Template Uploaded
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 font-mono">
                      {selectedEvent.leaveFormTemplate.fileName}
                    </h4>
                    <span className="text-xs text-slate-500">
                      {(selectedEvent.leaveFormTemplate.fileSize / 1024).toFixed(0)} KB &bull; Uploaded on {new Date(selectedEvent.leaveFormTemplate.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="bg-white px-4 py-2 rounded-xl border border-emerald-200 text-center">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Student Downloads</span>
                  <span className="text-lg font-bold text-emerald-700">{selectedEvent.leaveFormTemplate.downloadCount}</span>
                </div>
              </div>

              {/* Toggle availability */}
              <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-emerald-200">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Form Availability Status</span>
                  <p className="text-[11px] text-slate-500">
                    {selectedEvent.leaveFormTemplate.isAvailable ? 'Available for present students' : 'Hidden as Draft'}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleAvailability(selectedEvent.leaveFormTemplate!.isAvailable)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                    selectedEvent.leaveFormTemplate.isAvailable ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {selectedEvent.leaveFormTemplate.isAvailable ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  <span>{selectedEvent.leaveFormTemplate.isAvailable ? 'Available' : 'Draft'}</span>
                </button>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <label className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                  <RefreshCw className="w-4 h-4 text-slate-500" />
                  <span>Replace PDF File</span>
                  <input type="file" accept=".pdf,application/pdf" onChange={handleFileSelect} className="hidden" />
                </label>
                <button
                  onClick={handleDeleteTemplate}
                  className="px-3.5 py-2 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold ml-auto"
                >
                  Delete Template
                </button>
              </div>
            </div>
          ) : (
            /* Upload Empty State */
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-4 bg-slate-50/50">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Upload Official Leave Form Template</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Attach the official department attendance exemption PDF for <strong>{selectedEvent.title}</strong>.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <label className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs">
                  <Upload className="w-4 h-4" />
                  <span>Select PDF from Disk</span>
                  <input type="file" accept=".pdf,application/pdf" onChange={handleFileSelect} className="hidden" />
                </label>
                <button
                  onClick={handleAttachSampleTemplate}
                  className="px-4 py-2.5 bg-white hover:bg-purple-50 border border-purple-300 text-purple-700 rounded-xl text-xs font-semibold flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Attach Official Sample PDF</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 9. MY PROFILE */}
      {activeSubNav === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900">Organizer Profile</h2>
            <p className="text-xs text-slate-500">Faculty & Club coordinator details.</p>
          </div>

          <div className="flex items-start gap-4">
            <img src={organizer.avatarUrl} alt={organizer.name} className="w-16 h-16 rounded-2xl object-cover border" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">{organizer.name}</h3>
              <p className="text-xs text-slate-600">{organizer.email}</p>
              <p className="text-xs font-semibold text-purple-700">{organizer.department}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
