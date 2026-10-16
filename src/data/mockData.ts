import { 
  User, 
  CampusEvent, 
  EventRegistration, 
  LeaveFormTemplate,
  CampusAnnouncement,
  CampusNotification,
  PermissionForm,
  LeaveFolder,
  LeaveFolderFile
} from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'stu-101',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@campus.edu',
    role: 'student',
    password: 'password123',
    studentId: 'STU-2024-0891',
    course: 'B.Tech Computer Science & Engineering',
    department: 'Department of Computer Science & Engineering',
    year: '3rd Year, Semester V',
    universityName: 'GLA UNIVERSITY MATHURA',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+91 98765 43210',
  },
  {
    id: 'stu-102',
    name: 'Sneha Patel',
    email: 'sneha.patel@campus.edu',
    role: 'student',
    password: 'password123',
    studentId: 'STU-2024-1142',
    course: '', // Deliberately blank to test profile warning feature!
    department: '', // Deliberately blank
    year: '',
    universityName: 'GLA UNIVERSITY MATHURA',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    phone: '+91 91234 56789',
  },
  {
    id: 'org-201',
    name: 'Dr. Vikram Malhotra',
    email: 'vikram.malhotra@campus.edu',
    role: 'organizer',
    password: 'password123',
    department: 'Department of Computer Science & Engineering',
    universityName: 'GLA UNIVERSITY MATHURA',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'org-202',
    name: 'Prof. Priya Nair',
    email: 'priya.nair@campus.edu',
    role: 'organizer',
    password: 'password123',
    department: 'Department of Management & Career Cell',
    universityName: 'GLA UNIVERSITY MATHURA',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'adm-001',
    name: 'Dean Robert Sterling',
    email: 'dean.sterling@campus.edu',
    role: 'admin',
    password: 'adminpassword',
    department: 'Office of Academic Affairs & Dean of Students',
    universityName: 'GLA UNIVERSITY MATHURA',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  }
];

export const INITIAL_EVENTS: CampusEvent[] = [
  {
    id: 'evt-301',
    title: 'CodeSprint 2026: 36-Hour National Hackathon',
    description: 'Flagship university-wide hackathon focusing on AI agents, IoT devices, cyber security, and green mobility. Over $10,000 in prizes with top industry mentors and placement fast-tracks.',
    category: 'Hackathon',
    organizerId: 'org-201',
    organizerName: 'Dr. Vikram Malhotra',
    organizerClub: 'Coding & AI Society (CAS)',
    department: 'Department of Computer Science & Engineering',
    venue: 'Innovation Hub, 3rd Floor, Tech Park',
    startDate: '2026-10-24T09:00:00Z',
    endDate: '2026-10-26T18:00:00Z',
    registrationDeadline: '2026-10-22T23:59:59Z',
    maxSeats: 150,
    registeredCount: 112,
    bannerImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
    status: 'published',
    keywords: ['hackathon', 'ai', 'coding', 'web', 'python', 'software', 'innovation'],
    requiresHODApproval: true,
    leaveFormTemplate: {
      id: 'tmpl-401',
      eventId: 'evt-301',
      eventName: 'CodeSprint 2026: 36-Hour National Hackathon',
      organizerId: 'org-201',
      organizerName: 'Dr. Vikram Malhotra',
      fileName: 'Official_CodeSprint_2026_Leave_Form.pdf',
      fileSize: 245000,
      fileUrl: '#official-codesprint-template',
      uploadedAt: '2026-10-10T14:30:00Z',
      isAvailable: true,
      downloadCount: 38,
      instructions: 'Submit this official template signed by your HOD at the registration desk on Day 1 (October 24).'
    }
  },
  {
    id: 'evt-302',
    title: 'Autonomous Robotics & ROS2 Hands-on Workshop',
    description: 'A comprehensive 2-day practical workshop on building ROS2-powered autonomous ground vehicles with LiDAR navigation and obstacle avoidance.',
    category: 'Workshop',
    organizerId: 'org-201',
    organizerName: 'Dr. Vikram Malhotra',
    organizerClub: 'Robotics & Automation Society',
    department: 'Department of Electronics & Electrical Engineering',
    venue: 'Advanced Robotics Lab, Building B',
    startDate: '2026-10-29T10:00:00Z',
    endDate: '2026-10-30T16:00:00Z',
    registrationDeadline: '2026-10-27T18:00:00Z',
    maxSeats: 60,
    registeredCount: 54,
    bannerImage: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80',
    status: 'published',
    keywords: ['robotics', 'ros2', 'hardware', 'embedded', 'lidar', 'workshop'],
    requiresHODApproval: true,
    // Note: leave form template is NOT uploaded yet for this event, to demonstrate the "Leave form not available yet" state!
  },
  {
    id: 'evt-303',
    title: 'Annual Tech Industry Career Summit & Networking',
    description: 'Connect with talent leaders and directors from Google, Microsoft, and high-growth startups. Includes CV review sessions, mock technical interviews, and on-spot internship offers.',
    category: 'Career',
    organizerId: 'org-202',
    organizerName: 'Prof. Priya Nair',
    organizerClub: 'University Placement & Training Cell',
    department: 'Department of Management & Career Cell',
    venue: 'Grand University Auditorium',
    startDate: '2026-11-04T09:30:00Z',
    endDate: '2026-11-04T17:30:00Z',
    registrationDeadline: '2026-11-01T23:59:00Z',
    maxSeats: 400,
    registeredCount: 310,
    bannerImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80',
    status: 'published',
    keywords: ['career', 'jobs', 'internship', 'interview', 'networking', 'resume'],
    requiresHODApproval: true,
    leaveFormTemplate: {
      id: 'tmpl-403',
      eventId: 'evt-303',
      eventName: 'Annual Tech Industry Career Summit & Networking',
      organizerId: 'org-202',
      organizerName: 'Prof. Priya Nair',
      fileName: 'Official_Career_Summit_Exemption_Form.pdf',
      fileSize: 182000,
      fileUrl: '#official-career-summit-template',
      uploadedAt: '2026-10-12T11:00:00Z',
      isAvailable: true,
      downloadCount: 84,
      instructions: 'Students requiring full-day exemption must submit this form to their department HOD prior to November 3.'
    }
  },
  {
    id: 'evt-304',
    title: 'Quantum Computing & Cryptography Seminar',
    description: 'Special guest lecture by quantum computing researchers exploring post-quantum encryption protocols, Shor algorithm impact, and superconducting qubits.',
    category: 'Seminar',
    organizerId: 'org-201',
    organizerName: 'Dr. Vikram Malhotra',
    organizerClub: 'Physics & Computing Guild',
    department: 'Department of Computer Science & Engineering',
    venue: 'Seminar Hall 4, Science Complex',
    startDate: '2026-11-08T14:00:00Z',
    endDate: '2026-11-08T17:00:00Z',
    registrationDeadline: '2026-11-06T18:00:00Z',
    maxSeats: 80,
    registeredCount: 42,
    bannerImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80',
    status: 'published',
    keywords: ['quantum', 'cryptography', 'security', 'seminar', 'physics'],
    requiresHODApproval: false,
    leaveFormTemplate: {
      id: 'tmpl-404',
      eventId: 'evt-304',
      eventName: 'Quantum Computing & Cryptography Seminar',
      organizerId: 'org-201',
      organizerName: 'Dr. Vikram Malhotra',
      fileName: 'Draft_Quantum_Seminar_Form.pdf',
      fileSize: 160000,
      fileUrl: '#draft-quantum-template',
      uploadedAt: '2026-10-14T09:15:00Z',
      isAvailable: false, // Uploaded but marked UNAVAILABLE by organizer!
      downloadCount: 0,
      instructions: 'Under review by faculty advisor.'
    }
  },
  {
    id: 'evt-305',
    title: 'Inter-Collegiate Symphony & Cultural Gala',
    description: 'The premier annual cultural festival featuring battle of the bands, classical fusion ensembles, drama performances, and art showcases.',
    category: 'Cultural',
    organizerId: 'org-202',
    organizerName: 'Prof. Priya Nair',
    organizerClub: 'Campus Cultural Committee',
    department: 'Student Affairs & Fine Arts',
    venue: 'Open Air Amphitheatre',
    startDate: '2026-11-12T17:00:00Z',
    endDate: '2026-11-14T22:00:00Z',
    registrationDeadline: '2026-11-10T20:00:00Z',
    maxSeats: 800,
    registeredCount: 650,
    bannerImage: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80',
    status: 'published',
    keywords: ['cultural', 'music', 'dance', 'festival', 'amphitheatre', 'arts'],
    requiresHODApproval: true,
  },
  {
    id: 'evt-306',
    title: 'University Football League Finals & Athletics Meet',
    description: 'Championship finals of the Inter-Department Football Tournament followed by track and field events. Come cheer for your department!',
    category: 'Sports',
    organizerId: 'org-202',
    organizerName: 'Prof. Priya Nair',
    organizerClub: 'University Sports Board',
    department: 'Department of Physical Education',
    venue: 'Main University Stadium & Track',
    startDate: '2026-11-18T08:00:00Z',
    endDate: '2026-11-19T18:00:00Z',
    registrationDeadline: '2026-11-15T23:59:00Z',
    maxSeats: 250,
    registeredCount: 190,
    bannerImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
    status: 'published',
    keywords: ['sports', 'football', 'athletics', 'tournament', 'stadium', 'fitness'],
    requiresHODApproval: true,
  },
  {
    id: 'evt-307',
    title: 'Cloud Architecture & DevOps Masterclass',
    description: 'Deep dive into Kubernetes clusters, Terraform infrastructure-as-code, CI/CD pipelines, and microservice observability with real production deployment drills.',
    category: 'Technical',
    organizerId: 'org-201',
    organizerName: 'Dr. Vikram Malhotra',
    organizerClub: 'Coding & AI Society (CAS)',
    department: 'Department of Computer Science & Engineering',
    venue: 'High Performance Computing Lab, Room 204',
    startDate: '2026-11-22T10:00:00Z',
    endDate: '2026-11-23T16:00:00Z',
    registrationDeadline: '2026-11-20T18:00:00Z',
    maxSeats: 45,
    registeredCount: 45, // Full seats to test availability filter!
    bannerImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    status: 'published',
    keywords: ['cloud', 'devops', 'kubernetes', 'docker', 'terraform', 'infrastructure', 'linux'],
    requiresHODApproval: true,
  }
];

export const INITIAL_REGISTRATIONS: EventRegistration[] = [
  {
    id: 'reg-501',
    eventId: 'evt-301', // CodeSprint 2026 (Has available official form & attendance verified!)
    studentId: 'stu-101',
    registeredAt: '2026-10-12T16:20:00Z',
    status: 'confirmed',
    registrationCode: 'CG-REG-8921-X',
    attendanceStatus: 'present',
    attendanceMarkedAt: '2026-10-14T10:05:00Z',
    officialFormDownloaded: false,
    personalApplicationDownloaded: true,
    personalApplicationDownloadedAt: '2026-10-12T16:22:00Z'
  },
  {
    id: 'reg-502',
    eventId: 'evt-302', // Robotics Workshop (Attendance Pending - QR Scan Required)
    studentId: 'stu-101',
    registeredAt: '2026-10-14T09:10:00Z',
    status: 'confirmed',
    registrationCode: 'CG-REG-4412-M',
    attendanceStatus: 'pending',
    officialFormDownloaded: false,
    personalApplicationDownloaded: false
  },
  {
    id: 'reg-503',
    eventId: 'evt-304', // Quantum Computing (Attendance Pending)
    studentId: 'stu-101',
    registeredAt: '2026-10-15T11:45:00Z',
    status: 'confirmed',
    registrationCode: 'CG-REG-7703-Q',
    attendanceStatus: 'pending',
    officialFormDownloaded: false,
    personalApplicationDownloaded: false
  }
];

export const INITIAL_ANNOUNCEMENTS: CampusAnnouncement[] = [
  {
    id: 'ann-1',
    title: 'HOD Leave Application Clearance Notice - Fall 2026',
    content: 'All students attending university hackathons and symposiums must present the QR-verified leave application along with the official organizer template within 3 working days post-event to receive attendance credit.',
    author: 'Dean Robert Sterling',
    authorRole: 'admin',
    targetAudience: 'all',
    createdAt: '2026-10-14T09:00:00Z',
    pinned: true,
    category: 'Urgent'
  },
  {
    id: 'ann-2',
    title: 'CodeSprint 2026 Venue Update: Innovation Hub Floor 3',
    content: 'Registration desk and Wi-Fi credentials for CodeSprint 2026 will be available starting at 8:30 AM on Day 1. Please have your Unique Registration Pass ID ready for QR scanning at the gate.',
    author: 'Dr. Vikram Malhotra',
    authorRole: 'organizer',
    targetAudience: 'students',
    createdAt: '2026-10-15T14:30:00Z',
    pinned: false,
    category: 'Event'
  },
  {
    id: 'ann-3',
    title: 'Organizer Compliance: Official PDF Form Upload Window',
    content: 'Faculty coordinators must upload the Dean-approved official leave application form at least 48 hours prior to event start time. Leave forms become downloadable by students once marked PRESENT.',
    author: 'Office of Academic Affairs',
    authorRole: 'admin',
    targetAudience: 'organizers',
    createdAt: '2026-10-12T11:00:00Z',
    pinned: false,
    category: 'Policy'
  }
];

export const INITIAL_NOTIFICATIONS: CampusNotification[] = [
  {
    id: 'notif-1',
    userId: 'stu-101',
    title: 'Attendance Verified!',
    message: 'You have been marked PRESENT at CodeSprint 2026. Your official leave form and HOD draft letter are now unlocked.',
    createdAt: '2026-10-14T10:05:00Z',
    read: false,
    type: 'attendance'
  },
  {
    id: 'notif-2',
    userId: 'stu-101',
    title: 'Registration Confirmed: Robotics Workshop',
    message: 'Your seat is reserved. Your Unique Registration Pass is CG-REG-4412-M. Scan QR at venue to verify attendance.',
    createdAt: '2026-10-14T09:10:00Z',
    read: true,
    type: 'registration'
  },
  {
    id: 'notif-3',
    roleTarget: 'organizer',
    title: '38 Leave Forms Downloaded',
    message: 'Registered participants for CodeSprint 2026 have downloaded your official PDF leave form.',
    createdAt: '2026-10-13T16:00:00Z',
    read: false,
    type: 'leave_form'
  },
  {
    id: 'notif-4',
    roleTarget: 'admin',
    title: 'New Event Approval Request',
    message: 'Cloud Architecture & DevOps Masterclass has been submitted by Dr. Vikram Malhotra.',
    createdAt: '2026-10-15T10:00:00Z',
    read: false,
    type: 'announcement'
  }
];

export const INITIAL_PERMISSION_FORMS: PermissionForm[] = [
  {
    id: 'pf-1',
    title: 'Inter-Collegiate Event Participation Consent & Travel Clearance',
    purpose: 'Required for students traveling outside campus boundary or attending overnight hackathons.',
    targetRole: 'student',
    fileName: 'Student_Overnight_Hackathon_Consent_Form.pdf',
    department: 'Office of Student Welfare & Safety',
    lastUpdated: '2026-10-01'
  },
  {
    id: 'pf-2',
    title: 'Lab & Heavy Equipment Access Authorization Slip',
    purpose: 'Authorization to operate Robotics Lab equipment and 3D printers during weekend workshops.',
    targetRole: 'student',
    fileName: 'Robotics_Lab_Access_Permission_Slip.pdf',
    department: 'Department of Electronics & Robotics',
    lastUpdated: '2026-09-20'
  },
  {
    id: 'pf-3',
    title: 'Auditorium & Sound Equipment Requisition Form',
    purpose: 'Official requisition for booking main campus auditoriums, projectors, and audio setups.',
    targetRole: 'organizer',
    fileName: 'Auditorium_Booking_Requisition_Form.pdf',
    department: 'Campus Estates & Facilities Directorate',
    lastUpdated: '2026-09-15'
  }
];

export const INITIAL_LEAVE_FOLDERS: LeaveFolder[] = [
  {
    id: 'fld-301-1',
    eventId: 'evt-301',
    name: 'Official Exemption & Leave Forms',
    description: 'Main academic duty leave forms for 36-Hour Hackathon attendees',
    color: 'emerald',
    createdAt: '2026-10-10T14:00:00Z',
    files: [
      {
        id: 'file-301-101',
        folderId: 'fld-301-1',
        eventId: 'evt-301',
        title: 'Official CodeSprint 2026 Academic OD Form',
        fileName: 'Official_CodeSprint_2026_Leave_Form.pdf',
        fileSize: 245000,
        uploadedAt: '2026-10-10T14:30:00Z',
        uploadedBy: 'org-201',
        organizerName: 'Dr. Vikram Malhotra',
        isAvailable: true,
        downloadCount: 38,
        description: 'Mandatory on-duty leave certificate signed by the Hackathon Convenor.'
      }
    ]
  },
  {
    id: 'fld-301-2',
    eventId: 'evt-301',
    name: 'Parental Consent & Night Clearance',
    description: 'Overnight stay permission slips and guardian emergency undertakings',
    color: 'purple',
    createdAt: '2026-10-11T10:00:00Z',
    files: [
      {
        id: 'file-301-201',
        folderId: 'fld-301-2',
        eventId: 'evt-301',
        title: 'Overnight Hackathon Parental Undertaking Slip',
        fileName: 'Parental_Consent_Overnight_Hackathon.pdf',
        fileSize: 184000,
        uploadedAt: '2026-10-11T11:00:00Z',
        uploadedBy: 'org-201',
        organizerName: 'Dr. Vikram Malhotra',
        isAvailable: true,
        downloadCount: 22,
        description: 'Required for all students staying in tech park overnight.'
      }
    ]
  },
  {
    id: 'fld-301-3',
    eventId: 'evt-301',
    name: 'HOD & Department Approvals',
    description: 'Department endorsements and laboratory access clearance formats',
    color: 'amber',
    createdAt: '2026-10-12T09:00:00Z',
    files: [
      {
        id: 'file-301-301',
        folderId: 'fld-301-3',
        eventId: 'evt-301',
        title: 'CSE Department HOD Endorsement Format',
        fileName: 'CSE_Dept_HOD_Endorsement_Format.pdf',
        fileSize: 210000,
        uploadedAt: '2026-10-12T09:30:00Z',
        uploadedBy: 'org-201',
        organizerName: 'Dr. Vikram Malhotra',
        isAvailable: true,
        downloadCount: 19,
        description: 'For submission to semester course coordinators.'
      }
    ]
  },
  {
    id: 'fld-301-4',
    eventId: 'evt-301',
    name: 'Dean & Security Gate Pass Slips',
    description: 'Security gate passes and campus entry/exit authorization after hours',
    color: 'blue',
    createdAt: '2026-10-13T16:00:00Z',
    files: []
  }
];

