import { 
  CampusEvent, 
  EventRegistration, 
  LeaveFormTemplate, 
  SearchFilterParams, 
  SearchResult, 
  User,
  CampusAnnouncement,
  CampusNotification,
  PermissionForm,
  UserRole
} from '../types';
import { 
  INITIAL_EVENTS, 
  INITIAL_REGISTRATIONS, 
  INITIAL_USERS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PERMISSION_FORMS
} from '../data/mockData';

const STORAGE_KEYS = {
  EVENTS: 'campusguard_events',
  REGISTRATIONS: 'campusguard_registrations',
  USERS: 'campusguard_users',
  ACTIVE_USER_ID: 'campusguard_active_user_id',
  ANNOUNCEMENTS: 'campusguard_announcements',
  NOTIFICATIONS: 'campusguard_notifications',
  PERMISSION_FORMS: 'campusguard_permission_forms',
};

class ApiService {
  private events: CampusEvent[];
  private registrations: EventRegistration[];
  private users: User[];
  private announcements: CampusAnnouncement[];
  private notifications: CampusNotification[];
  private permissionForms: PermissionForm[];
  private activeUserId: string;

  constructor() {
    this.events = this.loadFromStorage(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
    this.registrations = this.loadFromStorage(STORAGE_KEYS.REGISTRATIONS, INITIAL_REGISTRATIONS);
    this.users = this.loadFromStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
    // Ensure all existing cached user profiles are migrated to GLA UNIVERSITY MATHURA
    let usersUpdated = false;
    this.users = this.users.map(u => {
      if (!u.universityName || u.universityName.includes('Apex Institute')) {
        usersUpdated = true;
        return { ...u, universityName: 'GLA UNIVERSITY MATHURA' };
      }
      return u;
    });
    if (usersUpdated) {
      this.saveToStorage();
    }
    this.announcements = this.loadFromStorage(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
    this.notifications = this.loadFromStorage(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    this.permissionForms = this.loadFromStorage(STORAGE_KEYS.PERMISSION_FORMS, INITIAL_PERMISSION_FORMS);
    this.activeUserId = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID) || 'stu-101';
  }

  private loadFromStorage<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      console.warn(`Failed to parse ${key} from localStorage`);
    }
    return fallback;
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(this.events));
      localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(this.registrations));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(this.announcements));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(this.notifications));
      localStorage.setItem(STORAGE_KEYS.PERMISSION_FORMS, JSON.stringify(this.permissionForms));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, this.activeUserId);
    } catch (err) {
      console.error('Error saving to localStorage', err);
    }
  }

  // Active User & Authentication Session
  public getActiveUser(): User | null {
    if (!this.activeUserId) return null;
    const user = this.users.find(u => u.id === this.activeUserId);
    return user || null;
  }

  public login(email: string, password?: string): User {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      throw new Error('Account not found with this email address.');
    }
    if (password && user.password && user.password !== password) {
      throw new Error('Incorrect password. Please verify and try again.');
    }
    this.activeUserId = user.id;
    this.saveToStorage();
    return user;
  }

  public signup(data: {
    name: string;
    email: string;
    role: 'student' | 'organizer' | 'admin';
    password?: string;
    studentId?: string;
    course?: string;
    department?: string;
    year?: string;
    universityName?: string;
  }): User {
    const cleanEmail = data.email.trim().toLowerCase();
    const existing = this.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error('An account with this email address already exists. Please log in.');
    }

    const newUser: User = {
      id: `${data.role === 'student' ? 'stu' : data.role === 'organizer' ? 'org' : 'adm'}-${Date.now()}`,
      name: data.name.trim(),
      email: cleanEmail,
      role: data.role,
      password: data.password || 'password123',
      studentId: data.studentId || (data.role === 'student' ? `STU-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}` : undefined),
      course: data.course || (data.role === 'student' ? 'B.Tech Computer Science' : undefined),
      department: data.department || (data.role === 'student' ? 'Department of Computer Science' : 'Department of Student Affairs'),
      year: data.year || (data.role === 'student' ? '1st Year' : undefined),
      universityName: data.universityName || 'GLA UNIVERSITY MATHURA',
      avatarUrl: data.role === 'student'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        : data.role === 'organizer'
        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    };

    this.users.push(newUser);
    this.activeUserId = newUser.id;
    this.saveToStorage();
    return newUser;
  }

  public logout(): void {
    this.activeUserId = '';
    this.saveToStorage();
  }

  public setActiveUser(userId: string): User {
    const found = this.users.find(u => u.id === userId);
    if (found) {
      this.activeUserId = userId;
      this.saveToStorage();
      return found;
    }
    return this.users[0];
  }

  public getAllUsers(): User[] {
    return this.users;
  }

  public getAllEventsAdmin(): CampusEvent[] {
    return this.events;
  }

  public createEvent(organizerId: string, eventData: Partial<CampusEvent>): CampusEvent {
    const organizer = this.users.find(u => u.id === organizerId);
    const newEvtId = `evt-${Date.now()}`;
    const cleanTitle = eventData.title || 'New Campus Event';
    const safeTitle = cleanTitle.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 25);

    // Feature 1: Automatically generate corresponding formal leave application template mapped to event's specific details
    const autoLeaveTemplate: LeaveFormTemplate = {
      id: `tmpl-${Date.now()}`,
      eventId: newEvtId,
      eventName: cleanTitle,
      organizerId,
      organizerName: organizer?.name || 'Faculty Organizer',
      fileName: `Official_Leave_Application_${safeTitle}.pdf`,
      fileSize: 185000,
      fileUrl: '#auto-initialized-template',
      uploadedAt: new Date().toISOString(),
      isAvailable: true,
      downloadCount: 0,
      instructions: `Official EventEase HOD leave application template automatically configured for ${cleanTitle}. Submit signed copy to department office within 3 working days.`
    };

    // Feature 2: Automatically generate unique QR code for the event upon creation
    const dynamicQrSecret = `EVENTEASE-QR-${newEvtId}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const newEvt: CampusEvent = {
      id: newEvtId,
      title: cleanTitle,
      description: eventData.description || 'Event description',
      category: eventData.category || 'Technical',
      organizerId,
      organizerName: organizer?.name || 'Organizer',
      organizerClub: eventData.organizerClub || 'Student Society',
      department: eventData.department || organizer?.department || 'Computer Science',
      venue: eventData.venue || 'Main Auditorium',
      startDate: eventData.startDate || new Date(Date.now() + 86400000 * 3).toISOString(),
      endDate: eventData.endDate || new Date(Date.now() + 86400000 * 4).toISOString(),
      registrationDeadline: eventData.registrationDeadline || new Date(Date.now() + 86400000 * 2).toISOString(),
      maxSeats: eventData.maxSeats || 100,
      registeredCount: 0,
      bannerImage: eventData.bannerImage || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
      status: 'published',
      approvalStatus: 'approved',
      leaveFormTemplate: autoLeaveTemplate,
      keywords: eventData.keywords || ['campus', 'event'],
      requiresHODApproval: true,
      eventSecretCode: dynamicQrSecret
    };
    this.events.unshift(newEvt);
    this.saveToStorage();
    return newEvt;
  }

  public updateEventApproval(eventId: string, approvalStatus: 'approved' | 'rejected'): CampusEvent {
    const event = this.events.find(e => e.id === eventId);
    if (!event) throw new Error('Event not found');
    event.approvalStatus = approvalStatus;
    if (approvalStatus === 'approved') {
      event.status = 'published';
    } else {
      event.status = 'draft';
    }
    this.saveToStorage();
    return event;
  }

  public deleteEvent(eventId: string): void {
    this.events = this.events.filter(e => e.id !== eventId);
    this.registrations = this.registrations.filter(r => r.eventId !== eventId);
    this.saveToStorage();
  }

  public getAllCampusRegistrations(): { registration: EventRegistration; event: CampusEvent; student: User }[] {
    return this.registrations.map(r => {
      const event = this.events.find(e => e.id === r.eventId);
      const student = this.users.find(u => u.id === r.studentId);
      if (!event || !student) return null;
      return { registration: r, event, student };
    }).filter(Boolean) as { registration: EventRegistration; event: CampusEvent; student: User }[];
  }

  public getSystemMetrics() {
    const totalEvents = this.events.length;
    const totalRegistrations = this.registrations.length;
    const verifiedAttendance = this.registrations.filter(r => r.attendanceStatus === 'present').length;
    const pendingAttendance = this.registrations.filter(r => r.attendanceStatus === 'pending').length;
    const totalTemplates = this.events.filter(e => e.leaveFormTemplate?.isAvailable).length;
    const totalStudents = this.users.filter(u => u.role === 'student').length;
    const totalOrganizers = this.users.filter(u => u.role === 'organizer').length;
    const totalDownloads = this.events.reduce((acc, e) => acc + (e.leaveFormTemplate?.downloadCount || 0), 0);

    return {
      totalEvents,
      totalRegistrations,
      verifiedAttendance,
      pendingAttendance,
      totalTemplates,
      totalStudents,
      totalOrganizers,
      totalDownloads
    };
  }

  public updateUserProfile(userId: string, updates: Partial<User>): User {
    const idx = this.users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error('User not found');
    this.users[idx] = { ...this.users[idx], ...updates };
    this.saveToStorage();
    return this.users[idx];
  }

  // --- REQUIREMENT 3: SEARCH API ---
  // GET /api/events/search?q=hackathon&category=Technical&sort=upcoming&page=0&size=10
  public searchEvents(params: SearchFilterParams): Promise<SearchResult> {
    return new Promise((resolve) => {
      // Simulate real network debounce and latency
      setTimeout(() => {
        let results = this.events.filter(e => e.status === 'published');

        // Text search across title, description, category, organizer, club, venue, department, keywords
        if (params.q && params.q.trim()) {
          const query = params.q.trim().toLowerCase();
          results = results.filter(e => {
            const inTitle = e.title.toLowerCase().includes(query);
            const inDesc = e.description.toLowerCase().includes(query);
            const inCat = e.category.toLowerCase().includes(query);
            const inOrg = e.organizerName.toLowerCase().includes(query);
            const inClub = e.organizerClub.toLowerCase().includes(query);
            const inVenue = e.venue.toLowerCase().includes(query);
            const inDept = e.department.toLowerCase().includes(query);
            const inKeywords = e.keywords?.some(k => k.toLowerCase().includes(query));
            return inTitle || inDesc || inCat || inOrg || inClub || inVenue || inDept || inKeywords;
          });
        }

        // Category filter
        if (params.category && params.category !== 'All') {
          results = results.filter(e => e.category.toLowerCase() === params.category.toLowerCase());
        }

        // Department filter
        if (params.department && params.department !== 'All') {
          results = results.filter(e => e.department.toLowerCase().includes(params.department.toLowerCase()));
        }

        // Venue filter
        if (params.venue && params.venue !== 'All') {
          results = results.filter(e => e.venue.toLowerCase().includes(params.venue.toLowerCase()));
        }

        // Date range filter
        if (params.startDate) {
          const startFilter = new Date(params.startDate).getTime();
          results = results.filter(e => new Date(e.startDate).getTime() >= startFilter);
        }
        if (params.endDate) {
          const endFilter = new Date(params.endDate).getTime();
          results = results.filter(e => new Date(e.startDate).getTime() <= endFilter);
        }

        // Available seats filter
        if (params.availableOnly) {
          results = results.filter(e => e.registeredCount < e.maxSeats);
        }

        // Sorting
        results = [...results].sort((a, b) => {
          if (params.sort === 'upcoming') {
            return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          } else if (params.sort === 'newest') {
            return b.id.localeCompare(a.id);
          } else if (params.sort === 'popularity') {
            return b.registeredCount - a.registeredCount;
          }
          return 0;
        });

        // Pagination
        const totalElements = results.length;
        const totalPages = Math.ceil(totalElements / params.size) || 1;
        const safePage = Math.min(params.page, Math.max(0, totalPages - 1));
        const startIndex = safePage * params.size;
        const pagedEvents = results.slice(startIndex, startIndex + params.size);

        resolve({
          events: pagedEvents,
          totalElements,
          totalPages,
          currentPage: safePage
        });
      }, 120);
    });
  }

  public getEventById(eventId: string): CampusEvent | undefined {
    return this.events.find(e => e.id === eventId);
  }

  // --- REGISTRATION WORKFLOW ---
  public registerForEvent(eventId: string, studentId: string): { registration: EventRegistration; event: CampusEvent } {
    const event = this.events.find(e => e.id === eventId);
    if (!event) throw new Error('Event not found');

    if (event.registeredCount >= event.maxSeats) {
      throw new Error('Event is already fully booked');
    }

    // Check duplicate registrations
    const existing = this.registrations.find(
      r => r.eventId === eventId && r.studentId === studentId && r.status === 'confirmed'
    );
    if (existing) {
      throw new Error('You are already registered for this event');
    }

    // Generate unique registration number (e.g. CG-REG-7241-A)
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const randomChar = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    const uniqueRegistrationCode = `CG-REG-${randomNum}-${randomChar}`;

    const newReg: EventRegistration = {
      id: `reg-${Date.now()}`,
      eventId,
      studentId,
      registeredAt: new Date().toISOString(),
      status: 'confirmed',
      registrationCode: uniqueRegistrationCode,
      attendanceStatus: 'pending', // Attendance MUST be marked via QR code during/after event to unlock leave form!
      officialFormDownloaded: false,
      personalApplicationDownloaded: false
    };

    this.registrations.push(newReg);
    event.registeredCount += 1;
    this.saveToStorage();

    return { registration: newReg, event };
  }

  // --- ATTENDANCE & QR CODE WORKFLOW ---
  public markAttendanceWithQr(
    studentId: string,
    eventId: string,
    enteredRegistrationCode: string
  ): { success: boolean; message: string; registration?: EventRegistration } {
    const reg = this.registrations.find(
      r => r.eventId === eventId && r.studentId === studentId && r.status === 'confirmed'
    );

    if (!reg) {
      return {
        success: false,
        message: 'No active event registration found for this student.'
      };
    }

    if (reg.attendanceStatus === 'present') {
      return {
        success: true,
        message: 'Attendance is already verified and marked PRESENT. Leave application is unlocked.',
        registration: reg
      };
    }

    // Validate unique registration code provided by student
    const cleanEntered = enteredRegistrationCode.trim().toUpperCase();
    const cleanActual = reg.registrationCode.trim().toUpperCase();

    if (cleanEntered !== cleanActual) {
      return {
        success: false,
        message: `Invalid registration number. Your unique code is required to verify physical presence.`
      };
    }

    // Mark as PRESENT
    reg.attendanceStatus = 'present';
    reg.attendanceMarkedAt = new Date().toISOString();
    this.saveToStorage();

    return {
      success: true,
      message: 'Attendance successfully verified via Event QR Code! You are marked PRESENT and your leave form is now unlocked.',
      registration: reg
    };
  }

  // Organizer manual verification or override
  public updateRegistrationAttendance(
    organizerId: string,
    eventId: string,
    registrationId: string,
    newStatus: 'pending' | 'present' | 'absent'
  ): EventRegistration {
    const event = this.events.find(e => e.id === eventId);
    if (!event || event.organizerId !== organizerId) {
      throw new Error('Unauthorized to manage attendance for this event');
    }

    const reg = this.registrations.find(r => r.id === registrationId);
    if (!reg) throw new Error('Registration not found');

    reg.attendanceStatus = newStatus;
    if (newStatus === 'present') {
      reg.attendanceMarkedAt = new Date().toISOString();
    }
    this.saveToStorage();
    return reg;
  }

  public getEventRegistrations(eventId: string): { registration: EventRegistration; student: User }[] {
    const regs = this.registrations.filter(r => r.eventId === eventId && r.status === 'confirmed');
    return regs.map(r => {
      const student = this.users.find(u => u.id === r.studentId)!;
      return { registration: r, student };
    }).filter(item => item.student !== undefined);
  }

  public getStudentRegistrationForEvent(eventId: string, studentId: string): EventRegistration | undefined {
    return this.registrations.find(
      r => r.eventId === eventId && r.studentId === studentId && r.status === 'confirmed'
    );
  }

  public getStudentRegistrations(studentId: string): { registration: EventRegistration; event: CampusEvent }[] {
    const studentRegs = this.registrations.filter(r => r.studentId === studentId);
    return studentRegs.map(r => {
      const event = this.events.find(e => e.id === r.eventId)!;
      return { registration: r, event };
    }).filter(item => item.event !== undefined);
  }

  public isStudentRegistered(eventId: string, studentId: string): boolean {
    return this.registrations.some(
      r => r.eventId === eventId && r.studentId === studentId && r.status === 'confirmed'
    );
  }

  // --- REQUIREMENT 1: ORGANIZER LEAVE FORM MANAGEMENT ---
  // POST /api/organizer/events/{eventId}/leave-form-template
  public uploadLeaveFormTemplate(
    organizerId: string,
    eventId: string,
    data: {
      fileName: string;
      fileSize: number;
      fileDataUrl: string;
      isAvailable: boolean;
      instructions?: string;
    }
  ): LeaveFormTemplate {
    const event = this.events.find(e => e.id === eventId);
    if (!event) throw new Error('Event not found');

    // Authorization check: organizer can only manage their own events
    if (event.organizerId !== organizerId) {
      throw new Error('Unauthorized: You can only manage leave forms for events you organize');
    }

    // File validation: Size limit 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (data.fileSize > MAX_SIZE) {
      throw new Error('File exceeds maximum allowed size of 10MB');
    }

    // File type validation: PDF only
    if (!data.fileName.toLowerCase().endsWith('.pdf')) {
      throw new Error('Invalid file type. Only PDF templates are permitted.');
    }

    // Safe filename generation (sanitized)
    const sanitizedBase = data.fileName.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const safeName = `Official_${event.id}_${sanitizedBase}`;

    const template: LeaveFormTemplate = {
      id: `tmpl-${Date.now()}`,
      eventId,
      eventName: event.title,
      organizerId,
      organizerName: event.organizerName,
      fileName: safeName,
      fileSize: data.fileSize,
      fileUrl: data.fileDataUrl,
      uploadedAt: new Date().toISOString(),
      isAvailable: data.isAvailable,
      downloadCount: event.leaveFormTemplate?.downloadCount || 0,
      instructions: data.instructions || 'Official department leave application template.'
    };

    event.leaveFormTemplate = template;
    this.saveToStorage();
    return template;
  }

  // PATCH /api/organizer/events/{eventId}/leave-form-template/availability
  public updateTemplateAvailability(
    organizerId: string, 
    eventId: string, 
    isAvailable: boolean
  ): LeaveFormTemplate {
    const event = this.events.find(e => e.id === eventId);
    if (!event) throw new Error('Event not found');
    if (event.organizerId !== organizerId) {
      throw new Error('Unauthorized: You can only manage your own events');
    }
    if (!event.leaveFormTemplate) {
      throw new Error('No leave form template exists for this event');
    }

    event.leaveFormTemplate.isAvailable = isAvailable;
    this.saveToStorage();
    return event.leaveFormTemplate;
  }

  // DELETE /api/organizer/events/{eventId}/leave-form-template
  public deleteLeaveFormTemplate(organizerId: string, eventId: string): void {
    const event = this.events.find(e => e.id === eventId);
    if (!event) throw new Error('Event not found');
    if (event.organizerId !== organizerId) {
      throw new Error('Unauthorized: You can only manage your own events');
    }
    event.leaveFormTemplate = undefined;
    this.saveToStorage();
  }

  // Download counter tracking for official leave form
  public recordOfficialFormDownload(studentId: string, eventId: string): void {
    const event = this.events.find(e => e.id === eventId);
    if (event && event.leaveFormTemplate) {
      event.leaveFormTemplate.downloadCount += 1;
    }

    const reg = this.registrations.find(r => r.eventId === eventId && r.studentId === studentId);
    if (reg) {
      reg.officialFormDownloaded = true;
      reg.officialFormDownloadedAt = new Date().toISOString();
    }
    this.saveToStorage();
  }

  // Download counter tracking for personalized leave application
  public recordPersonalApplicationDownload(studentId: string, eventId: string): void {
    const reg = this.registrations.find(r => r.eventId === eventId && r.studentId === studentId);
    if (reg) {
      reg.personalApplicationDownloaded = true;
      reg.personalApplicationDownloadedAt = new Date().toISOString();
      this.saveToStorage();
    }
  }

  public getOrganizerEvents(organizerId: string): CampusEvent[] {
    return this.events.filter(e => e.organizerId === organizerId);
  }

  public getUniqueVenues(): string[] {
    const venues = new Set(this.events.map(e => e.venue));
    return Array.from(venues);
  }

  public getUniqueDepartments(): string[] {
    const depts = new Set(this.events.map(e => e.department));
    return Array.from(depts);
  }

  // Announcements API
  public getAnnouncements(): CampusAnnouncement[] {
    return this.announcements;
  }

  public addAnnouncement(data: {
    title: string;
    content: string;
    author: string;
    authorRole: 'admin' | 'organizer';
    targetAudience: 'all' | 'students' | 'organizers';
    pinned?: boolean;
    category?: 'Urgent' | 'Academic' | 'Event' | 'Policy';
  }): CampusAnnouncement {
    const ann: CampusAnnouncement = {
      id: `ann-${Date.now()}`,
      title: data.title,
      content: data.content,
      author: data.author,
      authorRole: data.authorRole,
      targetAudience: data.targetAudience,
      createdAt: new Date().toISOString(),
      pinned: data.pinned ?? false,
      category: data.category || 'Academic'
    };
    this.announcements.unshift(ann);
    this.saveToStorage();
    return ann;
  }

  public deleteAnnouncement(id: string): void {
    this.announcements = this.announcements.filter(a => a.id !== id);
    this.saveToStorage();
  }

  // Notifications API
  public getNotifications(userId?: string, role?: UserRole): CampusNotification[] {
    return this.notifications.filter(n => {
      if (n.userId && userId && n.userId === userId) return true;
      if (n.roleTarget && role && n.roleTarget === role) return true;
      if (!n.userId && !n.roleTarget) return true;
      return false;
    });
  }

  public markNotificationRead(id: string): void {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      this.saveToStorage();
    }
  }

  // Permission Forms API
  public getPermissionForms(role?: 'student' | 'organizer'): PermissionForm[] {
    if (!role) return this.permissionForms;
    return this.permissionForms.filter(f => f.targetRole === role);
  }

  // Users management for Admin
  public getStudents(): User[] {
    return this.users.filter(u => u.role === 'student');
  }

  public getOrganizers(): User[] {
    return this.users.filter(u => u.role === 'organizer');
  }

  public deleteUser(userId: string): void {
    this.users = this.users.filter(u => u.id !== userId);
    this.saveToStorage();
  }

  public addUser(userData: Partial<User>): User {
    const newUser: User = {
      id: `${userData.role === 'student' ? 'stu' : userData.role === 'organizer' ? 'org' : 'adm'}-${Date.now()}`,
      name: userData.name || 'New Member',
      email: userData.email || `user${Date.now()}@campus.edu`,
      role: userData.role || 'student',
      password: 'password123',
      studentId: userData.studentId,
      course: userData.course,
      department: userData.department,
      year: userData.year,
      universityName: userData.universityName || 'GLA UNIVERSITY MATHURA',
      avatarUrl: userData.role === 'student'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    };
    this.users.push(newUser);
    this.saveToStorage();
    return newUser;
  }

  // Role-specific dashboard stats
  public getOrganizerDashboardStats(organizerId: string) {
    const myEvents = this.events.filter(e => e.organizerId === organizerId);
    const myEventIds = new Set(myEvents.map(e => e.id));
    const myRegistrations = this.registrations.filter(r => myEventIds.has(r.eventId));
    const totalParticipants = myRegistrations.length;
    const verifiedAttendance = myRegistrations.filter(r => r.attendanceStatus === 'present').length;
    const pendingTasks = myEvents.filter(e => !e.leaveFormTemplate || !e.leaveFormTemplate.isAvailable).length;
    const notificationsCount = this.getNotifications(organizerId, 'organizer').filter(n => !n.read).length;

    return {
      myEventsCount: myEvents.length,
      totalParticipants,
      verifiedAttendance,
      pendingTasks,
      notificationsCount
    };
  }

  public getStudentDashboardStats(studentId: string) {
    const myRegs = this.registrations.filter(r => r.studentId === studentId && r.status === 'confirmed');
    const myEvents = myRegs.map(r => this.events.find(e => e.id === r.eventId)).filter(Boolean) as CampusEvent[];
    const upcomingEvents = this.events.filter(e => new Date(e.startDate) > new Date()).slice(0, 5);
    const verifiedLeaves = myRegs.filter(r => r.attendanceStatus === 'present').length;
    const unreadNotifications = this.getNotifications(studentId, 'student').filter(n => !n.read).length;

    return {
      myRegistrationsCount: myRegs.length,
      myEvents,
      upcomingEvents,
      verifiedLeaves,
      unreadNotifications
    };
  }

  public resetToDefaults() {
    this.events = INITIAL_EVENTS;
    this.registrations = INITIAL_REGISTRATIONS;
    this.users = INITIAL_USERS;
    this.announcements = INITIAL_ANNOUNCEMENTS;
    this.notifications = INITIAL_NOTIFICATIONS;
    this.permissionForms = INITIAL_PERMISSION_FORMS;
    this.activeUserId = 'stu-101';
    this.saveToStorage();
  }
}

export const apiService = new ApiService();
