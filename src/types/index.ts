export type UserRole = 'student' | 'organizer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  studentId?: string;
  course?: string; // e.g. "B.Tech Computer Science & Engineering"
  department?: string; // e.g. "Department of Computer Science & Engineering"
  year?: string; // e.g. "3rd Year, Semester V"
  universityName?: string; // e.g. "National Institute of Technology"
  avatarUrl?: string;
  phone?: string;
  password?: string;
}

export type EventCategory = 
  | 'Hackathon'
  | 'Workshop'
  | 'Seminar'
  | 'Cultural'
  | 'Sports'
  | 'Technical'
  | 'Career';

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  organizerId: string;
  organizerName: string;
  organizerClub: string;
  department: string;
  venue: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  registrationDeadline: string; // ISO string
  maxSeats: number;
  registeredCount: number;
  bannerImage: string;
  status: 'published' | 'draft' | 'archived';
  approvalStatus?: 'approved' | 'pending' | 'rejected';
  leaveFormTemplate?: LeaveFormTemplate;
  keywords: string[];
  requiresHODApproval: boolean;
  eventSecretCode?: string; // Secret string encoded in Event QR Code
}

export interface LeaveFormTemplate {
  id: string;
  eventId: string;
  eventName: string;
  organizerId: string;
  organizerName: string;
  fileName: string;
  fileSize: number; // in bytes
  fileUrl: string; // data URL or mock storage link
  uploadedAt: string; // ISO string
  isAvailable: boolean; // Form availability status
  downloadCount: number;
  instructions?: string;
}

export type AttendanceStatus = 'pending' | 'present' | 'absent';

export interface EventRegistration {
  id: string;
  eventId: string;
  studentId: string;
  registeredAt: string;
  status: 'confirmed' | 'waitlisted' | 'cancelled';
  registrationCode: string; // Unique ID given to student at registration (e.g. REG-8941)
  attendanceStatus: AttendanceStatus;
  attendanceMarkedAt?: string;
  organizerAllowedLeave?: boolean; // Organizer has approved/allowed leave generation
  organizerAllowedAt?: string;
  leaveUniqueKey?: string; // Unique key issued by organizer (e.g. KEY-GLA-8921-X)
  leaveFormUnlocked?: boolean; // True after student pastes & verifies the unique key inside the form
  leaveFormUnlockedAt?: string;
  officialFormDownloaded: boolean;
  officialFormDownloadedAt?: string;
  personalApplicationDownloaded: boolean;
  personalApplicationDownloadedAt?: string;
  teamName?: string;
  hackathonRole?: string;
  projectTitle?: string;
}

export interface SearchFilterParams {
  q: string;
  category: string;
  department: string;
  venue: string;
  startDate?: string;
  endDate?: string;
  availableOnly: boolean;
  sort: 'upcoming' | 'newest' | 'popularity';
  page: number;
  size: number;
}

export interface SearchResult {
  events: CampusEvent[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

export interface CampusAnnouncement {
  id: string;
  title: string;
  content: string;
  author: string;
  authorRole: 'admin' | 'organizer';
  targetAudience: 'all' | 'students' | 'organizers';
  createdAt: string;
  pinned: boolean;
  category: 'Urgent' | 'Academic' | 'Event' | 'Policy';
}

export interface CampusNotification {
  id: string;
  userId?: string; // undefined means all users of specific role
  roleTarget?: UserRole;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  type: 'attendance' | 'registration' | 'leave_form' | 'announcement';
}

export interface PermissionForm {
  id: string;
  title: string;
  purpose: string;
  targetRole: 'student' | 'organizer';
  fileName: string;
  department: string;
  lastUpdated: string;
  downloadUrl?: string;
  fileDataUrl?: string;
  fileSize?: number;
  uploadedBy?: string;
  organizerName?: string;
  eventId?: string;
  eventTitle?: string;
}

export interface LeaveFolderFile {
  id: string;
  folderId: string;
  eventId: string;
  title: string;
  fileName: string;
  fileSize: number;
  fileDataUrl?: string;
  uploadedAt: string;
  uploadedBy: string;
  organizerName?: string;
  isAvailable: boolean;
  downloadCount: number;
  description?: string;
}

export interface LeaveFolder {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
  files: LeaveFolderFile[];
}

