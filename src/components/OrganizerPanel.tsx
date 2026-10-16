import React, { useState, useRef } from 'react';
import { User, CampusEvent, EventCategory, PermissionForm, AttendanceStatus, EventRegistration, LeaveFolder, LeaveFolderFile } from '../types';
import { apiService } from '../services/apiService';
import { formatEventDateRange, generateOfficialTemplateSamplePdf, downloadPermissionForm, generatePermissionSlipPdf } from '../utils/pdfGenerator';
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
  ToggleRight,
  Image as ImageIcon,
  UploadCloud,
  UserPlus,
  Edit3,
  X,
  User as UserIcon,
  Code2,
  Copy,
  Trophy,
  Filter,
  Folder,
  FolderOpen,
  FolderPlus,
  FileUp,
  Key,
  Unlock,
  ArrowUpRight,
  ArrowRight
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { SpotlightCard } from './SpotlightCard';


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
  const [newBanner, setNewBanner] = useState('');
  const [bannerFileName, setBannerFileName] = useState('');
  const [bannerFileSize, setBannerFileSize] = useState('');
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

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
  const permissionForms = apiService.getPermissionForms('organizer', organizer.id);

  // Participant Management state
  const [participantAttendanceFilter, setParticipantAttendanceFilter] = useState<'all' | 'present' | 'pending'>('all');
  const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<{ registration: EventRegistration; student: User } | null>(null);

  // Add Participant Form state
  const [addName, setAddName] = useState('');
  const [addRollNo, setAddRollNo] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addDept, setAddDept] = useState('Computer Science & Engineering');
  const [addCourse, setAddCourse] = useState('B.Tech CSE');
  const [addYear, setAddYear] = useState('3rd Year / 6th Sem');
  const [addTeamName, setAddTeamName] = useState('');
  const [addHackathonRole, setAddHackathonRole] = useState('Fullstack Developer');
  const [addAttendance, setAddAttendance] = useState<AttendanceStatus>('pending');

  // Edit Participant Form state
  const [editName, setEditName] = useState('');
  const [editRollNo, setEditRollNo] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editCourse, setEditCourse] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editTeamName, setEditTeamName] = useState('');
  const [editHackathonRole, setEditHackathonRole] = useState('');
  const [editAttendance, setEditAttendance] = useState<AttendanceStatus>('pending');

  // Leave Form drag-and-drop state
  const [isDraggingLeaveTemplate, setIsDraggingLeaveTemplate] = useState(false);

  // Leave Folders & File Repository state
  const eventFolders = selectedEvent ? apiService.getEventFolders(selectedEvent.id) : [];
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const activeFolder: LeaveFolder | undefined = eventFolders.find(f => f.id === selectedFolderId) || eventFolders[0];

  // Create Folder state
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('purple');

  // Rename Folder state
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [renamedFolderName, setRenamedFolderName] = useState('');

  // Upload to Folder state
  const [isUploadToFolderOpen, setIsUploadToFolderOpen] = useState(false);
  const [folderUploadTitle, setFolderUploadTitle] = useState('');
  const [folderUploadDesc, setFolderUploadDesc] = useState('');
  const [folderUploadIsLive, setFolderUploadIsLive] = useState(true);
  const [folderUploadFile, setFolderUploadFile] = useState<{ name: string; size: number; dataUrl: string } | null>(null);
  const [isDraggingIntoFolder, setIsDraggingIntoFolder] = useState(false);
  const folderFileInputRef = useRef<HTMLInputElement>(null);
  const directSystemFileInputRef = useRef<HTMLInputElement>(null);

  // Permission Form Upload state for Organizers
  const [permFormTitle, setPermFormTitle] = useState('');
  const [permFormPurpose, setPermFormPurpose] = useState('');
  const [permFormEventId, setPermFormEventId] = useState('');
  const [permFormDepartment, setPermFormDepartment] = useState(organizer.department || 'Event & Activity Cell');
  const [permFormFile, setPermFormFile] = useState<{ name: string; size: number; dataUrl: string } | null>(null);
  const [permFormSubTab, setPermFormSubTab] = useState<'upload' | 'published' | 'requisitions'>('upload');
  const [isDraggingPermFile, setIsDraggingPermFile] = useState(false);
  const permFileInputRef = useRef<HTMLInputElement>(null);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleBannerFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showNotice('Invalid file format. Please choose an image file (PNG, JPG, WEBP, GIF, SVG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotice('Selected image is too large. Maximum supported size is 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setNewBanner(reader.result as string);
      setBannerFileName(file.name);
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${(file.size / 1024).toFixed(1)} KB`;
      setBannerFileSize(sizeStr);
      showNotice(`Image "${file.name}" loaded from your device!`);
    };
    reader.onerror = () => {
      showNotice('Failed to read image file from device.');
    };
    reader.readAsDataURL(file);
  };

  const handleBannerFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleBannerFile(file);
    }
  };

  const handleBannerRemove = () => {
    setNewBanner('');
    setBannerFileName('');
    setBannerFileSize('');
    if (bannerFileInputRef.current) {
      bannerFileInputRef.current.value = '';
    }
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
      bannerImage: newBanner || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80'
    });

    setNewTitle('');
    setNewDesc('');
    setNewBanner('');
    setBannerFileName('');
    setBannerFileSize('');
    if (bannerFileInputRef.current) {
      bannerFileInputRef.current.value = '';
    }
    onRefreshEvents();
    showNotice(`Event "${newTitle}" created and published!`);
    setActiveSubNav('manage-events');
  };

  const handlePermFileSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      showNotice('File size exceeds 10MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPermFormFile({
        name: file.name,
        size: file.size,
        dataUrl: reader.result as string
      });
      showNotice(`Attached "${file.name}" for upload.`);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateOfficialPermSample = () => {
    const title = permFormTitle.trim() || 'Parental Consent & Event Clearance Slip';
    const purpose = permFormPurpose.trim() || 'Mandatory parental clearance and medical undertaking for students attending campus events.';
    const linkedEvt = organizerEvents.find(e => e.id === permFormEventId);

    const sampleForm: PermissionForm = {
      id: `sample-${Date.now()}`,
      title,
      purpose,
      targetRole: 'student',
      fileName: `${title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 25)}_Slip.pdf`,
      department: permFormDepartment.trim() || organizer.department || 'Event & Activity Cell',
      lastUpdated: new Date().toISOString().split('T')[0],
      organizerName: organizer.name,
      eventTitle: linkedEvt?.title
    };

    const doc = generatePermissionSlipPdf(sampleForm);
    const dataUri = doc.output('datauristring');
    setPermFormTitle(title);
    setPermFormPurpose(purpose);
    setPermFormFile({
      name: sampleForm.fileName,
      size: 142000,
      dataUrl: dataUri
    });
    showNotice('Generated official university permission slip PDF template!');
  };

  const handleUploadPermissionForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!permFormTitle.trim()) {
      showNotice('Please enter a title for the permission form.');
      return;
    }
    if (!permFormPurpose.trim()) {
      showNotice('Please enter the purpose or instructions for students.');
      return;
    }

    let fileToSave = permFormFile;
    const linkedEvt = organizerEvents.find(e => e.id === permFormEventId);

    if (!fileToSave) {
      const sampleForm: PermissionForm = {
        id: `pf-${Date.now()}`,
        title: permFormTitle.trim(),
        purpose: permFormPurpose.trim(),
        targetRole: 'student',
        fileName: `${permFormTitle.trim().replace(/[^a-zA-Z0-9]/g, '_').slice(0, 25)}_Form.pdf`,
        department: permFormDepartment.trim() || organizer.department || 'Event Organizing Committee',
        lastUpdated: new Date().toISOString().split('T')[0],
        organizerName: organizer.name,
        eventTitle: linkedEvt?.title
      };
      const doc = generatePermissionSlipPdf(sampleForm);
      fileToSave = {
        name: sampleForm.fileName,
        size: 148000,
        dataUrl: doc.output('datauristring')
      };
    }

    apiService.uploadPermissionForm(organizer.id, {
      title: permFormTitle.trim(),
      purpose: permFormPurpose.trim(),
      department: permFormDepartment.trim() || organizer.department || 'Event Organizing Committee',
      fileName: fileToSave.name,
      fileDataUrl: fileToSave.dataUrl,
      fileSize: fileToSave.size,
      eventId: linkedEvt?.id,
      eventTitle: linkedEvt?.title
    });

    setPermFormTitle('');
    setPermFormPurpose('');
    setPermFormFile(null);
    if (permFileInputRef.current) permFileInputRef.current.value = '';
    onRefreshEvents();
    showNotice(`Permission form "${permFormTitle}" published! Students can now see and download it.`);
    setPermFormSubTab('published');
  };

  const handleDeletePermissionForm = (formId: string, formTitle: string) => {
    if (window.confirm(`Delete permission form "${formTitle}"? It will be removed from the students' portal.`)) {
      apiService.deletePermissionForm(formId);
      onRefreshEvents();
      showNotice(`Deleted "${formTitle}".`);
    }
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
  const filteredParticipants = registrationsForEvent.filter(r => {
    const q = participantSearch.toLowerCase();
    const matchesSearch = 
      r.student.name.toLowerCase().includes(q) ||
      (r.student.studentId && r.student.studentId.toLowerCase().includes(q)) ||
      r.registration.registrationCode.toLowerCase().includes(q) ||
      (r.registration.teamName && r.registration.teamName.toLowerCase().includes(q)) ||
      (r.registration.hackathonRole && r.registration.hackathonRole.toLowerCase().includes(q)) ||
      (r.student.department && r.student.department.toLowerCase().includes(q));

    const matchesStatus = 
      participantAttendanceFilter === 'all' || 
      r.registration.attendanceStatus === participantAttendanceFilter;

    return matchesSearch && matchesStatus;
  });

  const handleToggleAttendance = (regId: string, currentStatus: string) => {
    if (!selectedEvent) return;
    const nextStatus = currentStatus === 'present' ? 'pending' : 'present';
    apiService.updateRegistrationAttendance(organizer.id, selectedEvent.id, regId, nextStatus);
    onRefreshEvents();
    showNotice(`Attendance marked ${nextStatus.toUpperCase()}.`);
  };

  const handleAllowLeave = (regId: string) => {
    try {
      const res = apiService.allowStudentLeave(organizer.id, regId);
      navigator.clipboard.writeText(res.uniqueKey);
      showNotice(`Leave form authorized! Unique key "${res.uniqueKey}" generated & copied to clipboard.`);
      onRefreshEvents();
    } catch (e: any) {
      showNotice(e.message || 'Failed to authorize leave form');
    }
  };

  const handleRevokeLeave = (regId: string) => {
    try {
      apiService.revokeStudentLeave(organizer.id, regId);
      showNotice('Leave authorization revoked. Leave form is now locked.');
      onRefreshEvents();
    } catch (e: any) {
      showNotice(e.message || 'Failed to revoke leave');
    }
  };

  const handleAllowAllPresent = () => {
    if (!selectedEvent) return;
    try {
      const res = apiService.allowAllPresentStudents(organizer.id, selectedEvent.id);
      showNotice(res.message);
      onRefreshEvents();
    } catch (e: any) {
      showNotice(e.message || 'Failed to authorize present participants');
    }
  };

  const handleOpenEditParticipant = (item: { registration: EventRegistration; student: User }) => {
    setEditingParticipant(item);
    setEditName(item.student.name || '');
    setEditRollNo(item.student.studentId || '');
    setEditEmail(item.student.email || '');
    setEditDept(item.student.department || 'Computer Science & Engineering');
    setEditCourse(item.student.course || 'B.Tech CSE');
    setEditYear(item.student.year || '3rd Year');
    setEditTeamName(item.registration.teamName || 'Solo Participant');
    setEditHackathonRole(item.registration.hackathonRole || 'Fullstack Developer');
    setEditAttendance(item.registration.attendanceStatus || 'pending');
  };

  const handleSaveEditParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParticipant) return;
    if (!editName.trim()) {
      showNotice('Please enter student name.');
      return;
    }

    apiService.updateStudentParticipant(
      organizer.id,
      editingParticipant.registration.id,
      editingParticipant.student.id,
      {
        name: editName.trim(),
        studentId: editRollNo.trim(),
        email: editEmail.trim(),
        department: editDept.trim(),
        course: editCourse.trim(),
        year: editYear.trim(),
        teamName: editTeamName.trim(),
        hackathonRole: editHackathonRole.trim(),
        attendanceStatus: editAttendance
      }
    );

    setEditingParticipant(null);
    onRefreshEvents();
    showNotice(`Updated details for student "${editName}".`);
  };

  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    if (!addName.trim()) {
      showNotice('Please enter student name.');
      return;
    }
    if (!addRollNo.trim()) {
      showNotice('Please enter student roll number or ID.');
      return;
    }

    const email = addEmail.trim() || `${addRollNo.trim().toLowerCase()}@gla.ac.in`;

    apiService.addStudentParticipant(organizer.id, selectedEvent.id, {
      name: addName.trim(),
      studentId: addRollNo.trim(),
      email,
      department: addDept.trim(),
      course: addCourse.trim(),
      year: addYear.trim(),
      teamName: addTeamName.trim() || 'Team Innovation',
      hackathonRole: addHackathonRole.trim() || 'Fullstack Developer',
      attendanceStatus: addAttendance
    });

    setIsAddParticipantOpen(false);
    setAddName('');
    setAddRollNo('');
    setAddEmail('');
    setAddTeamName('');
    onRefreshEvents();
    showNotice(`Student "${addName}" added as hackathon participant!`);
  };

  const handleDeleteParticipant = (regId: string, studentName: string) => {
    if (window.confirm(`Are you sure you want to delete participant "${studentName}" from this event?`)) {
      apiService.deleteStudentParticipant(organizer.id, regId);
      onRefreshEvents();
      showNotice(`Participant "${studentName}" removed from event.`);
    }
  };

  const handleDownloadLeaveTemplate = () => {
    if (!selectedEvent?.leaveFormTemplate) return;
    const tmpl = selectedEvent.leaveFormTemplate;
    if (tmpl.fileUrl) {
      const link = document.createElement('a');
      link.href = tmpl.fileUrl;
      link.download = tmpl.fileName || `Official_Leave_Form_${selectedEvent.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotice(`Downloaded template "${tmpl.fileName}".`);
    } else {
      const doc = generateOfficialTemplateSamplePdf(selectedEvent);
      doc.save(`Official_Leave_Form_${selectedEvent.id}.pdf`);
      showNotice(`Downloaded official sample PDF for "${selectedEvent.title}".`);
    }
  };

  // Folder management handlers
  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !newFolderName.trim()) return;
    try {
      const created = apiService.createFolder(
        organizer.id, 
        selectedEvent.id, 
        newFolderName.trim(), 
        newFolderDesc.trim(), 
        newFolderColor
      );
      setSelectedFolderId(created.id);
      setIsCreatingFolder(false);
      setNewFolderName('');
      setNewFolderDesc('');
      onRefreshEvents();
      showNotice(`Folder "${created.name}" created! You can now upload leave forms into it.`);
    } catch (err: unknown) {
      showNotice(err instanceof Error ? err.message : 'Failed to create folder');
    }
  };

  const handleRenameFolderSubmit = (folderId: string) => {
    if (!renamedFolderName.trim()) return;
    try {
      apiService.renameFolder(organizer.id, folderId, renamedFolderName.trim());
      setEditingFolderId(null);
      setRenamedFolderName('');
      onRefreshEvents();
      showNotice('Folder renamed successfully.');
    } catch (err: unknown) {
      showNotice(err instanceof Error ? err.message : 'Failed to rename folder');
    }
  };

  const handleDeleteFolderAction = (folderId: string, folderName: string) => {
    if (window.confirm(`Delete folder "${folderName}" and its documents?`)) {
      apiService.deleteFolder(organizer.id, folderId);
      onRefreshEvents();
      showNotice(`Folder "${folderName}" removed.`);
    }
  };

  const handleFolderFileUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFolder || !selectedEvent || !folderUploadFile) {
      showNotice('Please attach a document file.');
      return;
    }

    try {
      apiService.uploadFileToFolder(organizer.id, activeFolder.id, selectedEvent.id, {
        title: folderUploadTitle.trim() || folderUploadFile.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
        fileName: folderUploadFile.name,
        fileSize: folderUploadFile.size,
        fileDataUrl: folderUploadFile.dataUrl,
        isAvailable: folderUploadIsLive,
        description: folderUploadDesc.trim() || 'Official leave form document'
      });

      setFolderUploadFile(null);
      setFolderUploadTitle('');
      setFolderUploadDesc('');
      setIsUploadToFolderOpen(false);
      if (folderFileInputRef.current) folderFileInputRef.current.value = '';
      onRefreshEvents();
      showNotice(`Leave form "${folderUploadFile.name}" uploaded to folder "${activeFolder.name}"!`);
    } catch (err: unknown) {
      showNotice(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const handleFolderFileAttached = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      showNotice('File size exceeds 10MB limit.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFolderUploadFile({
        name: file.name,
        size: file.size,
        dataUrl: reader.result as string
      });
      if (!folderUploadTitle) {
        setFolderUploadTitle(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      }
      showNotice(`Attached "${file.name}". Ready to upload into folder.`);
    };
    reader.readAsDataURL(file);
  };

  // Direct upload from organizer's system / local computer files into active leave folder
  const handleDirectSystemFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showNotice('Selected file exceeds 15MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const fileDataUrl = reader.result as string;
      const targetFolder = activeFolder || eventFolders[0];
      if (!targetFolder || !selectedEvent) {
        showNotice('No active folder or event found to save the file.');
        return;
      }

      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      try {
        apiService.uploadFileToFolder(organizer.id, targetFolder.id, selectedEvent.id, {
          title: cleanTitle,
          fileName: file.name,
          fileSize: file.size,
          fileDataUrl: fileDataUrl,
          isAvailable: true,
          description: `Official leave form uploaded from local system on ${new Date().toLocaleDateString()}`
        });

        // Set state for workspace review
        setFolderUploadFile({
          name: file.name,
          size: file.size,
          dataUrl: fileDataUrl
        });
        setFolderUploadTitle(cleanTitle);

        onRefreshEvents();
        showNotice(`File "${file.name}" uploaded successfully from your system into "${targetFolder.name}"!`);
      } catch (err: unknown) {
        showNotice(err instanceof Error ? err.message : 'System file upload failed');
      }
    };
    reader.readAsDataURL(file);

    // Reset input value so subsequent uploads of same named file trigger correctly
    e.target.value = '';
  };

  const handleGenerateOfficialToActiveFolder = () => {
    if (!selectedEvent || !activeFolder) return;
    const sampleDoc = generateOfficialTemplateSamplePdf(selectedEvent);
    const dataUri = sampleDoc.output('datauristring');
    const safeTitle = `${selectedEvent.title.slice(0, 25)} Official Leave Slip`;
    const safeName = `Official_${selectedEvent.id}_Leave_Slip.pdf`;

    apiService.uploadFileToFolder(organizer.id, activeFolder.id, selectedEvent.id, {
      title: safeTitle,
      fileName: safeName,
      fileSize: 198000,
      fileDataUrl: dataUri,
      isAvailable: true,
      description: 'Official verified attendance exemption and leave letter approved by Convenor.'
    });

    onRefreshEvents();
    showNotice(`Official leave slip generated and stored in "${activeFolder.name}"!`);
  };

  const handleDownloadFileFromFolder = (file: LeaveFolderFile) => {
    apiService.recordFolderFileDownload(file.id);
    if (file.fileDataUrl && file.fileDataUrl.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = file.fileDataUrl;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotice(`Downloading "${file.fileName}"...`);
    } else {
      const doc = generateOfficialTemplateSamplePdf(selectedEvent);
      doc.save(file.fileName || `Official_Leave_Form_${selectedEvent.id}.pdf`);
      showNotice(`Downloaded sample PDF for "${file.title}".`);
    }
    onRefreshEvents();
  };

  const handleToggleFileLiveInFolder = (folderId: string, fileId: string) => {
    const isLive = apiService.toggleFolderFileAvailability(organizer.id, folderId, fileId);
    onRefreshEvents();
    showNotice(isLive ? 'File is now LIVE and accessible to students.' : 'File set to DRAFT (Hidden from students).');
  };

  const handleDeleteFileFromActiveFolder = (folderId: string, fileId: string, fileName: string) => {
    if (window.confirm(`Delete "${fileName}" from this folder?`)) {
      apiService.deleteFileFromFolder(organizer.id, folderId, fileId);
      onRefreshEvents();
      showNotice(`Removed "${fileName}" from folder.`);
    }
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

      {/* Role-Scoped Data Isolation Notice */}
      <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs text-purple-900 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-purple-950 block">
              Organizer Scope: {organizer.department || organizer.name}
            </span>
            <span className="text-[11px] text-purple-700">
              You are viewing data strictly for your events and attendees. Other clubs' private records remain restricted.
            </span>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-purple-800 border border-purple-200 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
          <span>Role Isolated</span>
        </span>
      </div>

      {/* 1. DASHBOARD: My events, Total Participants, Pending Tasks, Notifications */}
      {activeSubNav === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SpotlightCard 
              onClick={() => setActiveSubNav('manage-events')}
              cursorText="My Events"
              showHoverArrow={true}
              spotlightColor="rgba(168, 85, 247, 0.15)"
              className="p-5 flex flex-col justify-between space-y-1 cursor-pointer card-interactive hover:border-purple-300"
            >
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">My Events</span>
                <Calendar className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-3xl font-extrabold text-slate-900">{stats.myEventsCount}</span>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <span>Organized by {organizer.name}</span>
                <ArrowUpRight className="w-3 h-3 text-purple-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </p>
            </SpotlightCard>

            <SpotlightCard 
              onClick={() => setActiveSubNav('participants')}
              cursorText="Roster"
              showHoverArrow={true}
              spotlightColor="rgba(59, 130, 246, 0.15)"
              className="p-5 flex flex-col justify-between space-y-1 cursor-pointer card-interactive hover:border-blue-300"
            >
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Total Participants</span>
                <Users className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-3xl font-extrabold text-blue-600">{stats.totalParticipants}</span>
              <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <span>{stats.verifiedAttendance} Verified Present</span>
                <ArrowUpRight className="w-3 h-3 text-emerald-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </p>
            </SpotlightCard>

            <SpotlightCard 
              onClick={() => setActiveSubNav('leave-forms')}
              cursorText="Tasks"
              showHoverArrow={true}
              spotlightColor="rgba(245, 158, 11, 0.15)"
              className="p-5 flex flex-col justify-between space-y-1 cursor-pointer card-interactive hover:border-amber-300"
            >
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Pending Tasks</span>
                <Clock className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-3xl font-extrabold text-amber-600">{stats.pendingTasks}</span>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <span>Templates pending upload</span>
                <ArrowUpRight className="w-3 h-3 text-amber-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </p>
            </SpotlightCard>

            <SpotlightCard 
              onClick={() => setActiveSubNav('notifications')}
              cursorText="Alerts"
              showHoverArrow={true}
              spotlightColor="rgba(244, 63, 94, 0.15)"
              className="p-5 flex flex-col justify-between space-y-1 cursor-pointer card-interactive hover:border-rose-300"
            >
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Notifications</span>
                <Bell className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-3xl font-extrabold text-slate-900">{stats.notificationsCount}</span>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <span>Unread updates</span>
                <ArrowUpRight className="w-3 h-3 text-rose-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </p>
            </SpotlightCard>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SpotlightCard 
              cursorText="Leave Forms"
              spotlightColor="rgba(168, 85, 247, 0.12)"
              className="p-6 space-y-3 card-interactive hover:border-purple-300 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-purple-600" />
                  <span>Upload Leave Form Template</span>
                </h3>
                <p className="text-xs text-slate-600">
                  Provide the official PDF attendance exemption form for your upcoming events.
                </p>
              </div>
              <div>
                <button
                  onClick={() => setActiveSubNav('leave-forms')}
                  data-cursor-text="Manage Forms"
                  className="group px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5"
                >
                  <span>Manage Leave Forms</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </SpotlightCard>

            <SpotlightCard 
              cursorText="QR Check-in"
              spotlightColor="rgba(16, 185, 129, 0.12)"
              className="p-6 space-y-3 card-interactive hover:border-emerald-300 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-600" />
                  <span>Display Venue Check-in QR</span>
                </h3>
                <p className="text-xs text-slate-600">
                  Project or print the event attendance QR code so registered students can check in as PRESENT.
                </p>
              </div>
              <div>
                <button
                  onClick={() => setActiveSubNav('participants')}
                  data-cursor-text="Participant QR"
                  className="group px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5"
                >
                  <span>Open Participant Roster & QR</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </SpotlightCard>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                  <span>Banner Image (Add from System Files)</span>
                </span>
                {newBanner && (
                  <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> File Selected
                  </span>
                )}
              </label>

              {/* Native file input for local system files */}
              <input
                ref={bannerFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerFileInputChange}
                className="hidden"
              />

              {newBanner ? (
                <div className="border border-purple-200 rounded-xl p-3 bg-purple-50/30 space-y-2.5">
                  <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-900 h-40 flex items-center justify-center group">
                    <img
                      src={newBanner}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 p-4">
                      <button
                        type="button"
                        onClick={() => bannerFileInputRef.current?.click()}
                        className="px-3.5 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <UploadCloud className="w-3.5 h-3.5 text-purple-600" />
                        <span>Change Image</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleBannerRemove}
                        className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs px-1">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-semibold text-slate-800 truncate">{bannerFileName || 'Selected banner image'}</span>
                      {bannerFileSize && (
                        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {bannerFileSize}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => bannerFileInputRef.current?.click()}
                      className="text-xs font-bold text-purple-600 hover:text-purple-800 underline ml-2 shrink-0 cursor-pointer"
                    >
                      Browse different file
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => bannerFileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingBanner(true);
                  }}
                  onDragLeave={() => setIsDraggingBanner(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingBanner(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleBannerFile(file);
                  }}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                    isDraggingBanner
                      ? 'border-purple-600 bg-purple-50 scale-[1.01]'
                      : 'border-slate-300 hover:border-purple-500 bg-slate-50/70 hover:bg-purple-50/30'
                  }`}
                >
                  <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-purple-700 hover:text-purple-800">
                      Choose an image from your device
                    </span>
                    <span className="text-xs text-slate-600"> or drag and drop here</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Supports PNG, JPG, JPEG, WEBP, SVG (up to 5MB)
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      bannerFileInputRef.current?.click();
                    }}
                    className="mt-1 px-3 py-1.5 bg-white border border-slate-200 hover:border-purple-300 text-slate-700 hover:text-purple-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                    <span>Select Image File</span>
                  </button>
                </div>
              )}
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

      {/* 5. PARTICIPANTS: Live roster, Hackathon details & Organizer Authentication (Add/Edit/Delete) */}
      {activeSubNav === 'participants' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Event Participants & Hackathon Roster</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  {registrationsForEvent.length} Registered
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage student attendees, hackathon teams, roles, verify live attendance, or add/edit/delete participants.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Event switcher */}
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:bg-white"
              >
                {organizerEvents.map(evt => (
                  <option key={evt.id} value={evt.id}>{evt.title}</option>
                ))}
              </select>

              {/* Add Student Button */}
              <button
                type="button"
                onClick={() => setIsAddParticipantOpen(true)}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Student Participant</span>
              </button>
            </div>
          </div>

          {/* Venue QR Code Banner */}
          {selectedEvent && (
            <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-6">
              <div className="p-3 bg-white rounded-xl shadow-xs border border-purple-100 shrink-0">
                <QRCodeSVG
                  value={JSON.stringify({
                    campusGuardEventId: selectedEvent.id,
                    eventTitle: selectedEvent.title,
                    venue: selectedEvent.venue,
                    secret: selectedEvent.eventSecretCode || `CG-QR-${selectedEvent.id}`,
                    timestamp: Date.now()
                  })}
                  size={110}
                  level="H"
                />
              </div>
              <div className="space-y-1.5 text-center sm:text-left flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="text-[10px] uppercase font-bold text-purple-700 bg-purple-200/80 px-2 py-0.5 rounded">
                    Official Venue QR Check-In
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Venue: {selectedEvent.venue}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-purple-950">Project or Print at {selectedEvent.venue}</h4>
                <p className="text-xs text-purple-900/80">
                  Students scan this QR code and verify their unique pass to unlock their academic leave forms automatically.
                </p>
                <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print QR Sign</span>
                  </button>
                  <span className="text-xs text-purple-700 font-medium">
                    {registrationsForEvent.filter(r => r.registration.attendanceStatus === 'present').length} of {registrationsForEvent.length} marked Present
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search students by name, roll no, team name, track, or code..."
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setParticipantAttendanceFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  participantAttendanceFilter === 'all'
                    ? 'bg-white text-purple-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({registrationsForEvent.length})
              </button>
              <button
                type="button"
                onClick={() => setParticipantAttendanceFilter('present')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  participantAttendanceFilter === 'present'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Present ({registrationsForEvent.filter(r => r.registration.attendanceStatus === 'present').length})
              </button>
              <button
                type="button"
                onClick={() => setParticipantAttendanceFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  participantAttendanceFilter === 'pending'
                    ? 'bg-white text-amber-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending ({registrationsForEvent.filter(r => r.registration.attendanceStatus !== 'present').length})
              </button>
            </div>

            <button
              type="button"
              onClick={handleAllowAllPresent}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
              title="Authorize leave form generation and issue unique keys for all participants"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Allow All Present Students</span>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Student & Roll No</th>
                  <th className="px-4 py-3">Hackathon Participation & Team</th>
                  <th className="px-4 py-3">Department & Academic</th>
                  <th className="px-4 py-3">Registration Code</th>
                  <th className="px-4 py-3">Attendance</th>
                  <th className="px-4 py-3">Leave Clearance & Unique Key</th>
                  <th className="px-4 py-3 text-right">Organizer Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                      <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-medium text-slate-500">No participants match the search criteria</p>
                      <button
                        onClick={() => setIsAddParticipantOpen(true)}
                        className="mt-2 text-xs font-bold text-purple-600 hover:text-purple-800 underline cursor-pointer"
                      >
                        + Add a student participant now
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map(({ registration, student }) => {
                    const isPresent = registration.attendanceStatus === 'present';
                    const isAllowed = Boolean(registration.organizerAllowedLeave);
                    const isUnlocked = Boolean(registration.leaveFormUnlocked);

                    return (
                      <tr key={registration.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Student Info */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0 uppercase text-xs">
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{student.name}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                {student.studentId || 'No Roll No'}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                                {student.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Hackathon Participation */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800 flex items-center gap-1">
                                <Trophy className="w-3 h-3 text-indigo-600" />
                                <span>{registration.teamName || 'Solo Hacker'}</span>
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 flex items-center gap-1">
                              <Code2 className="w-3 h-3 text-purple-600" />
                              <span>{registration.hackathonRole || 'Participant'}</span>
                            </div>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="px-4 py-3.5">
                          <div className="text-slate-800 font-medium">{student.department || 'Computer Science'}</div>
                          <div className="text-[11px] text-slate-500">
                            {student.course || 'B.Tech'} {student.year ? `• ${student.year}` : ''}
                          </div>
                        </td>

                        {/* Registration Code */}
                        <td className="px-4 py-3.5">
                          <span className="font-mono font-bold text-purple-900 bg-purple-50 border border-purple-200 px-2 py-1 rounded-md text-[11px]">
                            {registration.registrationCode}
                          </span>
                        </td>

                        {/* Attendance */}
                        <td className="px-4 py-3.5">
                          {isPresent ? (
                            <div>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                                <Check className="w-3 h-3" /> Present
                              </span>
                              {registration.attendanceMarkedAt && (
                                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                  {new Date(registration.attendanceMarkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800">
                              Pending
                            </span>
                          )}
                        </td>

                        {/* Leave Clearance & Unique Key */}
                        <td className="px-4 py-3.5">
                          {isAllowed ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Allowed</span>
                                </span>
                                {isUnlocked ? (
                                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                    Unlocked
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                    Key Pending
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                <code className="font-mono text-[11px] font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                                  {registration.leaveUniqueKey}
                                </code>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (registration.leaveUniqueKey) {
                                      navigator.clipboard.writeText(registration.leaveUniqueKey);
                                      showNotice(`Unique key "${registration.leaveUniqueKey}" copied to clipboard!`);
                                    }
                                  }}
                                  className="p-1 text-slate-400 hover:text-indigo-700 rounded transition-colors cursor-pointer"
                                  title="Copy Unique Key to share with student"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 inline-flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>Awaiting Allowance</span>
                              </span>
                              <div>
                                <button
                                  type="button"
                                  onClick={() => handleAllowLeave(registration.id)}
                                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <Key className="w-3 h-3" />
                                  <span>Allow & Generate Key</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Toggle attendance */}
                            <button
                              onClick={() => handleToggleAttendance(registration.id, registration.attendanceStatus)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                                isPresent 
                                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                              }`}
                              title={isPresent ? 'Revert to Pending' : 'Mark Present'}
                            >
                              {isPresent ? 'Mark Pending' : 'Mark Present'}
                            </button>

                            {/* Allow or Revoke Leave Button */}
                            {isAllowed ? (
                              <button
                                type="button"
                                onClick={() => handleRevokeLeave(registration.id)}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                                title="Revoke Leave Form Allowance"
                              >
                                Revoke Key
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAllowLeave(registration.id)}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 hover:border-indigo-600 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Allow leave form generation and generate unique clearance key"
                              >
                                <Key className="w-3 h-3" />
                                <span>Allow Leave</span>
                              </button>
                            )}

                            {/* Edit Student Details */}
                            <button
                              onClick={() => handleOpenEditParticipant({ registration, student })}
                              className="p-1.5 text-slate-600 hover:text-purple-700 bg-slate-100 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit student details & hackathon participation"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Student */}
                            <button
                              onClick={() => handleDeleteParticipant(registration.id, student.name)}
                              className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete student participant"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* 6. PERMISSION FORM: Requisition, Upload & Published Forms */}
      {activeSubNav === 'permission-forms' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Event Permission Forms & Clearance Slips</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  Organizer Hub
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload and publish permission & consent slips for students, or download campus administration booking requisitions.
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setPermFormSubTab('upload')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  permFormSubTab === 'upload'
                    ? 'bg-white text-purple-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                + Upload Form for Students
              </button>
              <button
                type="button"
                onClick={() => setPermFormSubTab('published')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  permFormSubTab === 'published'
                    ? 'bg-white text-purple-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Live Student Forms</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 text-purple-800">
                  {permissionForms.filter(f => f.targetRole === 'student').length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPermFormSubTab('requisitions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  permFormSubTab === 'requisitions'
                    ? 'bg-white text-purple-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Organizer Requisitions
              </button>
            </div>
          </div>

          {/* TAB 1: UPLOAD FORM FOR STUDENTS */}
          {permFormSubTab === 'upload' && (
            <form onSubmit={handleUploadPermissionForm} className="space-y-4 max-w-2xl">
              <div className="bg-purple-50/50 border border-purple-200/80 rounded-xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div className="text-xs text-purple-900">
                  <p className="font-bold">Student Visibility Guarantee</p>
                  <p className="text-purple-700 mt-0.5">
                    Any permission form uploaded here immediately appears in the <strong>Permission Forms</strong> tab of registered and attending students. Students can download it with a single click.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Permission Form Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={permFormTitle}
                  onChange={(e) => setPermFormTitle(e.target.value)}
                  placeholder="e.g. Parental Consent & Overnight Hackathon Clearance Slip"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Associated Event (Optional)
                  </label>
                  <select
                    value={permFormEventId}
                    onChange={(e) => setPermFormEventId(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  >
                    <option value="">All Events / General University Slips</option>
                    {organizerEvents.map(evt => (
                      <option key={evt.id} value={evt.id}>
                        {evt.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Issuing Department / Club
                  </label>
                  <input
                    type="text"
                    value={permFormDepartment}
                    onChange={(e) => setPermFormDepartment(e.target.value)}
                    placeholder="e.g. Coding & AI Society"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Purpose & Submission Instructions for Students <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={permFormPurpose}
                  onChange={(e) => setPermFormPurpose(e.target.value)}
                  placeholder="e.g. Required for all students staying overnight on campus. Must be signed by parent/guardian and submitted to the registration desk."
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  required
                />
              </div>

              {/* Upload Document File or Generate */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Attach Document File (PDF, Word, or Image)</span>
                  <button
                    type="button"
                    onClick={handleGenerateOfficialPermSample}
                    className="text-xs font-bold text-purple-700 hover:text-purple-900 underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Generate Official Template PDF</span>
                  </button>
                </label>

                <input
                  ref={permFileInputRef}
                  type="file"
                  accept=".pdf,application/pdf,image/*,.doc,.docx"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handlePermFileSelect(f);
                  }}
                  className="hidden"
                />

                {permFormFile ? (
                  <div className="border border-purple-200 rounded-xl p-3 bg-purple-50/40 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-800 truncate">{permFormFile.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {permFormFile.size > 1024 * 1024
                            ? `${(permFormFile.size / (1024 * 1024)).toFixed(2)} MB`
                            : `${Math.round(permFormFile.size / 1024)} KB`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => permFileInputRef.current?.click()}
                        className="px-2.5 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-100 rounded-lg cursor-pointer"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPermFormFile(null);
                          if (permFileInputRef.current) permFileInputRef.current.value = '';
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => permFileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingPermFile(true);
                    }}
                    onDragLeave={() => setIsDraggingPermFile(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingPermFile(false);
                      const f = e.dataTransfer.files?.[0];
                      if (f) handlePermFileSelect(f);
                    }}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                      isDraggingPermFile
                        ? 'border-purple-600 bg-purple-50 scale-[1.01]'
                        : 'border-slate-300 hover:border-purple-500 bg-slate-50/70 hover:bg-purple-50/20'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-purple-700 hover:text-purple-800">
                        Click to upload permission slip file
                      </span>
                      <span className="text-xs text-slate-500"> or drag and drop</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      PDF, DOCX, or Image (or leave empty to auto-generate an official PDF slip)
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Publish Permission Form to Students</span>
                </button>
                <button
                  type="button"
                  onClick={handleGenerateOfficialPermSample}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Create Official Template Slip
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: FORMS PUBLISHED FOR STUDENTS */}
          {permFormSubTab === 'published' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <p>Forms currently active in the students' <strong>Permission Forms</strong> menu:</p>
                <button
                  onClick={() => setPermFormSubTab('upload')}
                  className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload Another Form</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {permissionForms
                  .filter(f => f.targetRole === 'student')
                  .map(form => (
                    <div key={form.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold text-blue-700 uppercase bg-blue-100 px-2 py-0.5 rounded">
                            {form.department}
                          </span>
                          {form.organizerName && (
                            <span className="text-[10px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-purple-600" />
                              <span>By {form.organizerName}</span>
                            </span>
                          )}
                          {form.eventTitle && (
                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded truncate max-w-[180px]">
                              {form.eventTitle}
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-slate-900">{form.title}</h4>
                        <p className="text-xs text-slate-600">{form.purpose}</p>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                          <span>{form.fileName}</span>
                          {form.fileSize && (
                            <span>• {Math.round(form.fileSize / 1024)} KB</span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                        <button
                          onClick={() => {
                            downloadPermissionForm(form);
                            showNotice(`Downloading "${form.fileName}"...`);
                          }}
                          className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-purple-600" />
                          <span>Download / Test File</span>
                        </button>

                        <button
                          onClick={() => handleDeletePermissionForm(form.id, form.title)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete permission form"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 3: ORGANIZER REQUISITION FORMS */}
          {permFormSubTab === 'requisitions' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">Official university forms required for auditorium booking, sound equipment, and sponsorship approvals:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {permissionForms
                  .filter(f => f.targetRole === 'organizer')
                  .map(form => (
                    <div key={form.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-purple-700 uppercase bg-purple-100 px-2 py-0.5 rounded">
                          {form.department}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{form.title}</h4>
                        <p className="text-xs text-slate-600">{form.purpose}</p>
                      </div>
                      <div className="pt-2 border-t border-slate-200">
                        <button
                          onClick={() => {
                            downloadPermissionForm(form);
                            showNotice(`Downloading "${form.fileName}"...`);
                          }}
                          className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-purple-600" />
                          <span>Download Requisition Slip (PDF)</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
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
              <p className="text-xs text-slate-500">
                Upload the official attendance exemption PDF that registered students download once marked Present.
              </p>
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

          {/* Automated unlock notice */}
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 rounded-2xl p-4.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <Key className="w-5 h-5" />
              </div>
              <div className="text-xs text-purple-950">
                <p className="font-bold text-sm">Two-Step Student Leave Generation Protocol</p>
                <p className="text-purple-800 mt-1 leading-relaxed">
                  Students can only generate their leave forms after you <strong>ALLOW</strong> their registration. Once allowed, a <strong>Unique Clearance Key</strong> is issued. The student enters this key in their portal to unlock and generate their personalized HOD application and official template.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveSubNav('participants')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Manage Student Clearances & Keys</span>
            </button>
          </div>

          {/* Child 3: OFFICIAL LEAVE FORM FOLDER & FILE REPOSITORY */}
          <div className="border-2 border-slate-200/90 rounded-2xl bg-white p-6 shadow-xs space-y-6">
            {/* Folder Header & Global Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
                  <FolderOpen className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">Leave Form Document Folders</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                      /campus-drive/{selectedEvent.id}/
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                      {eventFolders.length} Folders
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage folders and upload official attendance leave forms for <strong className="text-slate-800">{selectedEvent.title}</strong>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">

                <input
                  ref={directSystemFileInputRef}
                  type="file"
                  accept=".pdf,application/pdf,image/*,.doc,.docx,.xls,.xlsx"
                  onChange={handleDirectSystemFileSelected}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => directSystemFileInputRef.current?.click()}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer ring-1 ring-purple-400/40 active:scale-95"
                  title="Upload leave form document directly from your system / local storage"
                >
                  <UploadCloud className="w-4 h-4 text-purple-200" />
                  <span>Upload File from System</span>
                  <span className="text-[10px] bg-white/20 text-white font-mono px-1.5 py-0.2 rounded-md">
                    Local Files
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerateOfficialToActiveFolder}
                  className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Generate standard stamped PDF for this folder"
                >
                  <Plus className="w-3.5 h-3.5 text-purple-600" />
                  <span>Generate Stamped PDF</span>
                </button>
              </div>
            </div>

            {/* Inline / Modal Create Folder Form */}
            {isCreatingFolder && (
              <form onSubmit={handleCreateFolder} className="p-4.5 bg-amber-50/50 border-2 border-amber-200 rounded-2xl space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <FolderPlus className="w-4 h-4 text-amber-600" />
                    <span>Create New Leave Form Folder</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreatingFolder(false)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Folder Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="e.g. Overnight Hackathon Clearance Forms"
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:border-purple-600 focus:outline-hidden"
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Folder Color Theme
                    </label>
                    <div className="flex items-center gap-2 pt-1">
                      {[
                        { key: 'purple', bg: 'bg-purple-500', border: 'border-purple-300' },
                        { key: 'amber', bg: 'bg-amber-500', border: 'border-amber-300' },
                        { key: 'emerald', bg: 'bg-emerald-500', border: 'border-emerald-300' },
                        { key: 'blue', bg: 'bg-blue-500', border: 'border-blue-300' },
                        { key: 'rose', bg: 'bg-rose-500', border: 'border-rose-300' }
                      ].map(c => (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => setNewFolderColor(c.key)}
                          className={`w-6 h-6 rounded-full ${c.bg} transition-transform ${
                            newFolderColor === c.key ? 'scale-125 ring-2 ring-slate-900 ring-offset-2' : 'hover:scale-110 opacity-70'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Folder Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={newFolderDesc}
                    onChange={(e) => setNewFolderDesc(e.target.value)}
                    placeholder="e.g. Leave authorization slips for students staying overnight at campus innovation lab"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:border-purple-600 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreatingFolder(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    Create Folder
                  </button>
                </div>
              </form>
            )}

            {/* Folder Shelf / Directory Switcher */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold uppercase tracking-wider text-[11px] text-slate-600 flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-amber-500" />
                  <span>Folders for {selectedEvent.title} (Select a folder to view & upload)</span>
                </span>
                <span className="text-[11px] text-purple-700 font-semibold">
                  Active: {activeFolder ? activeFolder.name : 'None'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {eventFolders.map(folder => {
                  const isActive = activeFolder?.id === folder.id;
                  const fileCount = folder.files.length;
                  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
                    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
                    purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
                    amber: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
                    blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
                    rose: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300' }
                  };
                  const colorTheme = colorClasses[folder.color || 'purple'] || colorClasses.purple;

                  return (
                    <div
                      key={folder.id}
                      onClick={() => {
                        setSelectedFolderId(folder.id);
                        setEditingFolderId(null);
                      }}
                      className={`group relative p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between gap-2.5 ${
                        isActive
                          ? 'border-purple-600 bg-purple-50/70 ring-2 ring-purple-600/30 shadow-xs'
                          : 'border-slate-200 bg-slate-50/80 hover:bg-white hover:border-slate-300 hover:shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colorTheme.bg} ${colorTheme.text} shadow-2xs`}>
                          {isActive ? <FolderOpen className="w-5 h-5" /> : <Folder className="w-5 h-5" />}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          fileCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {fileCount} {fileCount === 1 ? 'file' : 'files'}
                        </span>
                      </div>

                      <div>
                        {editingFolderId === folder.id ? (
                          <div onClick={(e) => e.stopPropagation()} className="space-y-1.5 pt-1">
                            <input
                              type="text"
                              value={renamedFolderName}
                              onChange={(e) => setRenamedFolderName(e.target.value)}
                              className="text-xs px-2 py-1 bg-white border border-purple-400 rounded-md w-full focus:outline-hidden"
                              autoFocus
                            />
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleRenameFolderSubmit(folder.id)}
                                className="px-2 py-0.5 bg-purple-600 text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingFolderId(null)}
                                className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h4 className="text-xs font-bold text-slate-900 truncate" title={folder.name}>
                              {folder.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {folder.description || 'Leave form document folder'}
                            </p>
                          </>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                        <span className="text-slate-400">
                          {new Date(folder.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFolderId(folder.id);
                              setRenamedFolderName(folder.name);
                            }}
                            className="p-1 text-slate-500 hover:text-purple-700 hover:bg-purple-100 rounded cursor-pointer"
                            title="Rename folder"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          {eventFolders.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteFolderAction(folder.id, folder.name)}
                              className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                              title="Delete folder"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Folder Workspace */}
            {activeFolder ? (
              <div className="border border-purple-200/90 bg-white rounded-2xl p-5 space-y-5 shadow-2xs">
                {/* Active Folder Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                      <FolderOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{activeFolder.name}</span>
                        <span className="text-[10px] font-mono bg-purple-100 text-purple-800 px-2 py-0.2 rounded-full font-bold">
                          {activeFolder.files.length} {activeFolder.files.length === 1 ? 'Form' : 'Forms'} Uploaded
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{activeFolder.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsUploadToFolderOpen(prev => !prev)}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{isUploadToFolderOpen ? 'Close Uploader' : 'Upload Leave Form Here'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleGenerateOfficialToActiveFolder}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Auto-Generate Sample PDF</span>
                    </button>
                  </div>
                </div>

                {/* Upload Form (Expandable or when triggered) */}
                {isUploadToFolderOpen && (
                  <form onSubmit={handleFolderFileUpload} className="p-4 bg-purple-50/40 border border-purple-200 rounded-2xl space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-purple-200/60 pb-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
                        <FileUp className="w-4 h-4 text-purple-700" />
                        <span>Upload Leave Form into "{activeFolder.name}"</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsUploadToFolderOpen(false)}
                        className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Document Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={folderUploadTitle}
                          onChange={(e) => setFolderUploadTitle(e.target.value)}
                          placeholder="e.g. Official Duty Leave Slip (CodeSprint 2026)"
                          className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:border-purple-600 focus:outline-hidden"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Student Instructions / Purpose
                        </label>
                        <input
                          type="text"
                          value={folderUploadDesc}
                          onChange={(e) => setFolderUploadDesc(e.target.value)}
                          placeholder="e.g. Must be stamped by HOD and submitted to academic registrar"
                          className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:border-purple-600 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* File Attachment Box */}
                    <div>
                      <input
                        ref={folderFileInputRef}
                        type="file"
                        accept=".pdf,application/pdf,image/*,.doc,.docx"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFolderFileAttached(f);
                        }}
                        className="hidden"
                      />

                      {folderUploadFile ? (
                        <div className="border border-purple-200 rounded-xl p-3 bg-white flex items-center justify-between">
                          <div className="flex items-center gap-3 truncate">
                            <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                              <FileCheck className="w-5 h-5" />
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-800 truncate">{folderUploadFile.name}</p>
                              <p className="text-[11px] text-slate-500 font-mono">
                                {(folderUploadFile.size / 1024).toFixed(1)} KB &bull; Ready to save into folder
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => folderFileInputRef.current?.click()}
                              className="px-2.5 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-50 rounded-lg cursor-pointer"
                            >
                              Change
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFolderUploadFile(null);
                                if (folderFileInputRef.current) folderFileInputRef.current.value = '';
                              }}
                              className="p-1 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => folderFileInputRef.current?.click()}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDraggingIntoFolder(true);
                          }}
                          onDragLeave={() => setIsDraggingIntoFolder(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingIntoFolder(false);
                            const f = e.dataTransfer.files?.[0];
                            if (f) handleFolderFileAttached(f);
                          }}
                          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                            isDraggingIntoFolder
                              ? 'border-purple-600 bg-purple-100/50 scale-[1.01]'
                              : 'border-slate-300 hover:border-purple-500 bg-white hover:bg-purple-50/20'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-purple-700 hover:text-purple-800">
                              Choose Leave Form PDF/Document from device
                            </span>
                            <span className="text-xs text-slate-500"> or drag and drop</span>
                          </div>
                          <p className="text-[11px] text-slate-400">PDF, Word, or Scanned Images up to 10MB</p>
                        </div>
                      )}
                    </div>

                    {/* Live Toggle & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-purple-200/60">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={folderUploadIsLive}
                          onChange={(e) => setFolderUploadIsLive(e.target.checked)}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-slate-700">
                          Publish immediately for attending students (Live)
                        </span>
                      </label>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsUploadToFolderOpen(false)}
                          className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!folderUploadFile}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          Save Form to Folder
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Folder Contents Display */}
                {activeFolder.files.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Documents in this Folder ({activeFolder.files.length})</span>
                      <span className="text-[11px] text-slate-400 font-normal">All verified present students can download live forms</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {activeFolder.files.map(file => (
                        <div
                          key={file.id}
                          className="border border-slate-200 hover:border-purple-300 rounded-xl p-4 bg-slate-50/50 hover:bg-white transition-all space-y-3 shadow-2xs flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold text-slate-900 truncate" title={file.title}>
                                    {file.title}
                                  </h4>
                                  <p className="text-[10px] text-slate-500 font-mono truncate">
                                    {file.fileName} &bull; {(file.fileSize / 1024).toFixed(0)} KB
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleToggleFileLiveInFolder(activeFolder.id, file.id)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 cursor-pointer transition-colors ${
                                  file.isAvailable
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                                title="Click to toggle student accessibility"
                              >
                                {file.isAvailable ? '● Student Live' : '○ Draft'}
                              </button>
                            </div>

                            {file.description && (
                              <p className="text-[11px] text-slate-600 line-clamp-2 bg-white/70 p-2 rounded-lg border border-slate-100">
                                {file.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                              <span>Uploaded by {file.organizerName || organizer.name}</span>
                              <span className="font-semibold text-emerald-700">
                                {file.downloadCount || 0} student downloads
                              </span>
                            </div>
                          </div>

                          <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleDownloadFileFromFolder(file)}
                              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-purple-600" />
                              <span>Download File</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteFileFromActiveFolder(activeFolder.id, file.id, file.fileName)}
                              className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete file from folder"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Empty Folder State */
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingIntoFolder(true);
                    }}
                    onDragLeave={() => setIsDraggingIntoFolder(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingIntoFolder(false);
                      const f = e.dataTransfer.files?.[0];
                      if (f) handleFolderFileAttached(f);
                      setIsUploadToFolderOpen(true);
                    }}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center space-y-3.5 transition-all ${
                      isDraggingIntoFolder
                        ? 'border-purple-600 bg-purple-50 scale-[1.01]'
                        : 'border-slate-200 bg-slate-50/50 hover:border-purple-300'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-2xs">
                      <FolderPlus className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Folder "{activeFolder.name}" is Empty</h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                        Upload leave forms or attendance slips directly into this folder so participating students can download them once marked Present.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUploadToFolderOpen(true);
                          setTimeout(() => folderFileInputRef.current?.click(), 100);
                        }}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Upload Leave Form to this Folder</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleGenerateOfficialToActiveFolder}
                        className="px-4 py-2 bg-white hover:bg-purple-50 border border-purple-300 text-purple-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Generate Stamped Sample PDF</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">Drag & drop files directly into this box to upload</p>
                  </div>
                )}
              </div>
            ) : null}

            {/* Quick Campus Directory: Jump Between All Your Hosted Events */}
            <div className="border-t border-slate-100 pt-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-amber-500" />
                  <span>Switch Event Folders ({organizerEvents.length} Campus Events)</span>
                </span>
                <span className="text-[11px]">Click an event to switch its document repository</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {organizerEvents.map(evt => {
                  const isCurrent = evt.id === selectedEvent.id;
                  const folders = apiService.getEventFolders(evt.id);
                  const totalDocs = folders.reduce((sum, f) => sum + f.files.length, 0);

                  return (
                    <div
                      key={evt.id}
                      onClick={() => {
                        setSelectedEventId(evt.id);
                        setSelectedFolderId('');
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                        isCurrent
                          ? 'border-purple-600 bg-purple-50/60 ring-2 ring-purple-600/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        totalDocs > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {totalDocs > 0 ? <FileCheck className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h6 className="text-xs font-bold text-slate-900 truncate">{evt.title}</h6>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            totalDocs > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {totalDocs} {totalDocs === 1 ? 'doc' : 'docs'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {folders.length} Folders organized
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Summary of all organizer events and their leave form status */}
          <div className="border-t pt-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Leave Form Status Across All My Events ({organizerEvents.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {organizerEvents.map(evt => {
                const hasTmpl = Boolean(evt.leaveFormTemplate);
                const isSelected = evt.id === selectedEvent.id;

                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEventId(evt.id)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-600/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-bold text-purple-700 uppercase bg-purple-100 px-1.5 py-0.5 rounded">
                        {evt.category}
                      </span>
                      {hasTmpl ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          Missing Form
                        </span>
                      )}
                    </div>
                    <h5 className="text-xs font-bold text-slate-900 truncate">{evt.title}</h5>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {hasTmpl ? `${evt.leaveFormTemplate?.downloadCount} downloads` : 'Upload template'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
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

      {/* MODAL: ADD STUDENT PARTICIPANT */}
      {isAddParticipantOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Student Participant</h3>
                <p className="text-xs text-slate-500">Register a student for {selectedEvent.title}</p>
              </div>
              <button
                onClick={() => setIsAddParticipantOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddParticipant} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Roll No / Student ID *</label>
                  <input
                    type="text"
                    value={addRollNo}
                    onChange={(e) => setAddRollNo(e.target.value)}
                    placeholder="e.g. 2115000984"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Student Email Address</label>
                <input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="e.g. rahul.sharma@gla.ac.in"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={addDept}
                    onChange={(e) => setAddDept(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Course</label>
                  <input
                    type="text"
                    value={addCourse}
                    onChange={(e) => setAddCourse(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Year / Semester</label>
                  <input
                    type="text"
                    value={addYear}
                    onChange={(e) => setAddYear(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-[11px]"
                  />
                </div>
              </div>

              {/* Hackathon Participation Details */}
              <div className="p-3.5 bg-purple-50/50 border border-purple-200 rounded-xl space-y-2.5">
                <span className="text-[11px] font-bold text-purple-900 block">
                  Hackathon Team & Participation Details
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Team Name</label>
                    <input
                      type="text"
                      value={addTeamName}
                      onChange={(e) => setAddTeamName(e.target.value)}
                      placeholder="e.g. Team ByteCrafters"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Role / Track</label>
                    <input
                      type="text"
                      value={addHackathonRole}
                      onChange={(e) => setAddHackathonRole(e.target.value)}
                      placeholder="e.g. AI Engineer / Team Lead"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Attendance Status</label>
                <select
                  value={addAttendance}
                  onChange={(e) => setAddAttendance(e.target.value as AttendanceStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                >
                  <option value="pending">Pending (Not yet checked in)</option>
                  <option value="present">Present (Verified immediately & unlocks leave form)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddParticipantOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Save & Register Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT STUDENT PARTICIPANT DETAILS */}
      {editingParticipant && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Participant Details</h3>
                <p className="text-xs text-slate-500">
                  Organizer Authorization: Modify student credentials and hackathon participation
                </p>
              </div>
              <button
                onClick={() => setEditingParticipant(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditParticipant} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Roll No / Student ID</label>
                  <input
                    type="text"
                    value={editRollNo}
                    onChange={(e) => setEditRollNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={editDept}
                    onChange={(e) => setEditDept(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Course</label>
                  <input
                    type="text"
                    value={editCourse}
                    onChange={(e) => setEditCourse(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Year / Semester</label>
                  <input
                    type="text"
                    value={editYear}
                    onChange={(e) => setEditYear(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-[11px]"
                  />
                </div>
              </div>

              {/* Hackathon Participation Details */}
              <div className="p-3.5 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-2.5">
                <span className="text-[11px] font-bold text-indigo-900 block flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Hackathon Participation Details</span>
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Team Name</label>
                    <input
                      type="text"
                      value={editTeamName}
                      onChange={(e) => setEditTeamName(e.target.value)}
                      placeholder="e.g. Team CyberKnights"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Role / Specialty</label>
                    <input
                      type="text"
                      value={editHackathonRole}
                      onChange={(e) => setEditHackathonRole(e.target.value)}
                      placeholder="e.g. Lead Developer"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Attendance Status</label>
                <select
                  value={editAttendance}
                  onChange={(e) => setEditAttendance(e.target.value as AttendanceStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                >
                  <option value="pending">Pending (Not Verified)</option>
                  <option value="present">Present (Leave Form Unlocked)</option>
                  <option value="absent">Absent</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteParticipant(editingParticipant.registration.id, editName);
                    setEditingParticipant(null);
                  }}
                  className="text-xs text-red-600 hover:text-red-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Participant</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingParticipant(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                  >
                    Update Details
                  </button>
                </div>
              </div>
            </form>
          </div>
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
