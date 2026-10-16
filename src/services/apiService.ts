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
  UserRole,
  AttendanceStatus,
  LeaveFolder,
  LeaveFolderFile
} from '../types';
import { 
  INITIAL_EVENTS, 
  INITIAL_REGISTRATIONS, 
  INITIAL_USERS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PERMISSION_FORMS,
  INITIAL_LEAVE_FOLDERS
} from '../data/mockData';

const STORAGE_KEYS = {
  EVENTS: 'campusguard_events',
  REGISTRATIONS: 'campusguard_registrations',
  USERS: 'campusguard_users',
  ACTIVE_USER_ID: 'campusguard_active_user_id',
  ANNOUNCEMENTS: 'campusguard_announcements',
  NOTIFICATIONS: 'campusguard_notifications',
  PERMISSION_FORMS: 'campusguard_permission_forms',
  LEAVE_FOLDERS: 'campusguard_leave_folders',
};

class ApiService {
  private events: CampusEvent[];
  private registrations: EventRegistration[];
  private users: User[];
  private announcements: CampusAnnouncement[];
  private notifications: CampusNotification[];
  private permissionForms: PermissionForm[];
  private leaveFolders: LeaveFolder[];
  private activeUserId: string;

  constructor() {
    this.events = this.loadFromStorage(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
    this.registrations = this.loadFromStorage(STORAGE_KEYS.REGISTRATIONS, INITIAL_REGISTRATIONS);
    // Ensure all registrations have organizerAllowedLeave, leaveUniqueKey, and leaveFormUnlocked
    let regsUpdated = false;
    this.registrations = this.registrations.map(r => {
      let changed = false;
      let allowed = r.organizerAllowedLeave;
      let key = r.leaveUniqueKey;
      let unlocked = r.leaveFormUnlocked;

      if (allowed === undefined) {
        allowed = r.id === 'reg-501';
        changed = true;
      }
      if (!key) {
        key = `KEY-GLA-${r.registrationCode ? r.registrationCode.replace(/[^a-zA-Z0-9]/g, '').slice(-4) : '8921'}-${r.id.slice(-3).toUpperCase()}`;
        changed = true;
      }
      if (unlocked === undefined) {
        unlocked = false;
        changed = true;
      }
      if (changed) {
        regsUpdated = true;
        return {
          ...r,
          organizerAllowedLeave: allowed,
          leaveUniqueKey: key,
          leaveFormUnlocked: unlocked
        };
      }
      return r;
    });

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
    if (usersUpdated || regsUpdated) {
      this.saveToStorage();
    }
    this.announcements = this.loadFromStorage(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
    this.notifications = this.loadFromStorage(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    this.permissionForms = this.loadFromStorage(STORAGE_KEYS.PERMISSION_FORMS, INITIAL_PERMISSION_FORMS);
    this.leaveFolders = this.loadFromStorage(STORAGE_KEYS.LEAVE_FOLDERS, INITIAL_LEAVE_FOLDERS);
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
      localStorage.setItem(STORAGE_KEYS.LEAVE_FOLDERS, JSON.stringify(this.leaveFolders));
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

    const uniqueLeaveKey = `KEY-GLA-${randomNum}-${randomChar}`;

    const newReg: EventRegistration = {
      id: `reg-${Date.now()}`,
      eventId,
      studentId,
      registeredAt: new Date().toISOString(),
      status: 'confirmed',
      registrationCode: uniqueRegistrationCode,
      attendanceStatus: 'pending',
      organizerAllowedLeave: false, // Requires organizer allowance
      leaveUniqueKey: uniqueLeaveKey,
      leaveFormUnlocked: false, // Requires entering the unique key
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

  // --- PARTICIPANT MANAGEMENT FOR ORGANIZERS ---
  public addStudentParticipant(
    organizerId: string,
    eventId: string,
    studentData: {
      name: string;
      studentId: string;
      email: string;
      department?: string;
      course?: string;
      year?: string;
      teamName?: string;
      hackathonRole?: string;
      attendanceStatus?: AttendanceStatus;
    }
  ): { registration: EventRegistration; student: User } {
    const event = this.events.find(e => e.id === eventId);
    if (!event) throw new Error('Event not found');

    let student = this.users.find(
      u => (u.studentId && u.studentId.trim().toLowerCase() === studentData.studentId.trim().toLowerCase()) ||
           u.email.toLowerCase() === studentData.email.toLowerCase().trim()
    );

    if (!student) {
      student = {
        id: `stu-${Date.now()}`,
        name: studentData.name.trim(),
        email: studentData.email.trim().toLowerCase(),
        role: 'student',
        studentId: studentData.studentId.trim(),
        department: studentData.department?.trim() || 'Computer Science & Engineering',
        course: studentData.course?.trim() || 'B.Tech CSE',
        year: studentData.year?.trim() || '3rd Year',
        universityName: 'GLA UNIVERSITY MATHURA',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      };
      this.users.push(student);
    } else {
      if (studentData.name) student.name = studentData.name.trim();
      if (studentData.studentId) student.studentId = studentData.studentId.trim();
      if (studentData.department) student.department = studentData.department.trim();
      if (studentData.course) student.course = studentData.course.trim();
      if (studentData.year) student.year = studentData.year.trim();
    }

    const existingReg = this.registrations.find(
      r => r.eventId === eventId && r.studentId === student!.id && r.status === 'confirmed'
    );
    if (existingReg) {
      existingReg.teamName = studentData.teamName || existingReg.teamName;
      existingReg.hackathonRole = studentData.hackathonRole || existingReg.hackathonRole;
      if (studentData.attendanceStatus) {
        existingReg.attendanceStatus = studentData.attendanceStatus;
        if (studentData.attendanceStatus === 'present' && !existingReg.attendanceMarkedAt) {
          existingReg.attendanceMarkedAt = new Date().toISOString();
        }
      }
      this.saveToStorage();
      return { registration: existingReg, student };
    }

    const attendance = studentData.attendanceStatus || 'pending';
    const regNum = Math.floor(1000 + Math.random() * 9000);
    const newReg: EventRegistration = {
      id: `reg-${Date.now()}`,
      eventId,
      studentId: student.id,
      registeredAt: new Date().toISOString(),
      status: 'confirmed',
      registrationCode: `GLA-HK-${regNum}`,
      attendanceStatus: attendance,
      attendanceMarkedAt: attendance === 'present' ? new Date().toISOString() : undefined,
      organizerAllowedLeave: false,
      leaveUniqueKey: `KEY-GLA-${regNum}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      leaveFormUnlocked: false,
      officialFormDownloaded: false,
      personalApplicationDownloaded: false,
      teamName: studentData.teamName?.trim() || 'Solo Participant',
      hackathonRole: studentData.hackathonRole?.trim() || 'Fullstack Hacker'
    };

    this.registrations.unshift(newReg);
    event.registeredCount = (event.registeredCount || 0) + 1;
    this.saveToStorage();

    return { registration: newReg, student };
  }

  public updateStudentParticipant(
    organizerId: string,
    registrationId: string,
    studentId: string,
    updates: {
      name?: string;
      studentId?: string;
      email?: string;
      department?: string;
      course?: string;
      year?: string;
      teamName?: string;
      hackathonRole?: string;
      projectTitle?: string;
      attendanceStatus?: AttendanceStatus;
    }
  ): { registration: EventRegistration; student: User } {
    const reg = this.registrations.find(r => r.id === registrationId);
    if (!reg) throw new Error('Registration record not found');

    const student = this.users.find(u => u.id === studentId);
    if (!student) throw new Error('Student profile not found');

    if (updates.name !== undefined) student.name = updates.name.trim();
    if (updates.studentId !== undefined) student.studentId = updates.studentId.trim();
    if (updates.email !== undefined) student.email = updates.email.trim();
    if (updates.department !== undefined) student.department = updates.department.trim();
    if (updates.course !== undefined) student.course = updates.course.trim();
    if (updates.year !== undefined) student.year = updates.year.trim();

    if (updates.teamName !== undefined) reg.teamName = updates.teamName.trim();
    if (updates.hackathonRole !== undefined) reg.hackathonRole = updates.hackathonRole.trim();
    if (updates.projectTitle !== undefined) reg.projectTitle = updates.projectTitle.trim();
    if (updates.attendanceStatus !== undefined) {
      reg.attendanceStatus = updates.attendanceStatus;
      if (updates.attendanceStatus === 'present' && !reg.attendanceMarkedAt) {
        reg.attendanceMarkedAt = new Date().toISOString();
      } else if (updates.attendanceStatus !== 'present') {
        reg.attendanceMarkedAt = undefined;
      }
    }

    this.saveToStorage();
    return { registration: reg, student };
  }

  public deleteStudentParticipant(organizerId: string, registrationId: string): boolean {
    const reg = this.registrations.find(r => r.id === registrationId);
    if (!reg) return false;

    const event = this.events.find(e => e.id === reg.eventId);
    if (event && event.registeredCount && event.registeredCount > 0) {
      event.registeredCount -= 1;
    }

    this.registrations = this.registrations.filter(r => r.id !== registrationId);
    this.saveToStorage();
    return true;
  }

  // --- LEAVE FORM ALLOWANCE & UNIQUE KEY WORKFLOW ---

  /**
   * Organizer allows leave form generation for a student participant,
   * activating/generating a unique clearance key.
   */
  public allowStudentLeave(
    organizerId: string,
    registrationId: string,
    customKey?: string
  ): { success: boolean; message: string; registration: EventRegistration; uniqueKey: string } {
    const reg = this.registrations.find(r => r.id === registrationId);
    if (!reg) throw new Error('Registration not found');

    const event = this.events.find(e => e.id === reg.eventId);
    const key = customKey?.trim() || reg.leaveUniqueKey || `KEY-GLA-${reg.registrationCode ? reg.registrationCode.replace(/[^a-zA-Z0-9]/g, '').slice(-4) : '8921'}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    reg.organizerAllowedLeave = true;
    reg.organizerAllowedAt = new Date().toISOString();
    reg.leaveUniqueKey = key;

    // Send notification to the student
    const student = this.users.find(u => u.id === reg.studentId);
    if (student) {
      this.notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: student.id,
        roleTarget: 'student',
        title: `Leave Form Authorized: ${event?.title || 'Event'}`,
        message: `Organizer has authorized your leave form! Your unique unlock key is: ${key}. Paste this key into your Leave Forms portal to unlock and generate.`,
        createdAt: new Date().toISOString(),
        read: false,
        type: 'leave_form'
      });
    }

    this.saveToStorage();

    return {
      success: true,
      message: `Leave form authorized for ${student?.name || 'student'}. Unique Key: ${key}`,
      registration: reg,
      uniqueKey: key
    };
  }

  /**
   * Organizer revokes leave form generation allowance
   */
  public revokeStudentLeave(
    _organizerId: string,
    registrationId: string
  ): { success: boolean; message: string; registration: EventRegistration } {
    const reg = this.registrations.find(r => r.id === registrationId);
    if (!reg) throw new Error('Registration not found');

    reg.organizerAllowedLeave = false;
    reg.leaveFormUnlocked = false; // Re-lock form
    this.saveToStorage();

    return {
      success: true,
      message: 'Leave authorization revoked. Leave form is now locked.',
      registration: reg
    };
  }

  /**
   * Bulk allow all present students for an event
   */
  public allowAllPresentStudents(
    _organizerId: string,
    eventId: string
  ): { success: boolean; allowedCount: number; message: string } {
    const regs = this.registrations.filter(r => r.eventId === eventId && r.status === 'confirmed');
    let count = 0;
    regs.forEach(reg => {
      if (!reg.organizerAllowedLeave) {
        const key = reg.leaveUniqueKey || `KEY-GLA-${reg.registrationCode ? reg.registrationCode.replace(/[^a-zA-Z0-9]/g, '').slice(-4) : '8921'}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        reg.organizerAllowedLeave = true;
        reg.organizerAllowedAt = new Date().toISOString();
        reg.leaveUniqueKey = key;
        count++;

        const student = this.users.find(u => u.id === reg.studentId);
        if (student) {
          this.notifications.unshift({
            id: `notif-${Date.now()}-${count}`,
            userId: student.id,
            roleTarget: 'student',
            title: `Leave Form Authorized`,
            message: `Organizer authorized your leave form generation! Your unique unlock key is: ${key}. Paste it in your Leave Forms portal to unlock.`,
            createdAt: new Date().toISOString(),
            read: false,
            type: 'leave_form'
          });
        }
      }
    });
    this.saveToStorage();
    return {
      success: true,
      allowedCount: count,
      message: `Successfully authorized leave form generation for ${count} participant(s). Unique keys issued.`
    };
  }

  /**
   * Student pastes and submits their unique key to unlock their leave form
   */
  public unlockStudentLeaveWithKey(
    studentId: string,
    eventId: string,
    enteredKey: string
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

    if (!reg.organizerAllowedLeave) {
      return {
        success: false,
        message: 'Leave form generation is not yet allowed by the organizer. The organizer must authorize your request and issue your unique clearance key first.'
      };
    }

    if (reg.leaveFormUnlocked) {
      return {
        success: true,
        message: 'Leave form is already unlocked and generated!',
        registration: reg
      };
    }

    const cleanEntered = enteredKey.trim().toUpperCase();
    const cleanKey = reg.leaveUniqueKey?.trim().toUpperCase() || '';
    const cleanRegCode = reg.registrationCode.trim().toUpperCase();

    // Verify unique key (also allow registration code as secondary fallback)
    if (cleanEntered !== cleanKey && cleanEntered !== cleanRegCode) {
      return {
        success: false,
        message: `Invalid unique key "${enteredKey.trim()}". Please enter the exact key authorized by your event organizer.`
      };
    }

    // Success: Unlock the leave form!
    reg.leaveFormUnlocked = true;
    reg.leaveFormUnlockedAt = new Date().toISOString();
    this.saveToStorage();

    return {
      success: true,
      message: 'Unique key verified successfully! Your Official Leave Form and HOD Application Letter are now generated and unlocked.',
      registration: reg
    };
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
    if (role === 'student') {
      return this.permissionForms.filter(f => f.targetRole === 'student');
    }
    // Return all forms for organizer dashboard
    return this.permissionForms;
  }

  public uploadPermissionForm(organizerId: string, formPayload: {
    title: string;
    purpose: string;
    department?: string;
    fileName: string;
    fileDataUrl?: string;
    fileSize?: number;
    eventId?: string;
    eventTitle?: string;
  }): PermissionForm {
    const organizer = this.users.find(u => u.id === organizerId);
    const newForm: PermissionForm = {
      id: `pf-${Date.now()}`,
      title: formPayload.title,
      purpose: formPayload.purpose,
      targetRole: 'student', // Published directly for students!
      fileName: formPayload.fileName,
      department: formPayload.department || organizer?.department || 'Student Affairs & Campus Activities',
      lastUpdated: new Date().toISOString().split('T')[0],
      fileDataUrl: formPayload.fileDataUrl,
      fileSize: formPayload.fileSize,
      uploadedBy: organizerId,
      organizerName: organizer?.name || 'Club Organizer',
      eventId: formPayload.eventId,
      eventTitle: formPayload.eventTitle
    };

    this.permissionForms.unshift(newForm);
    this.saveToStorage();

    // Broadcast notification to students
    const notif: CampusNotification = {
      id: `notif-${Date.now()}`,
      userId: 'student',
      title: 'New Permission Form Available',
      message: `${newForm.organizerName} uploaded "${newForm.title}". Students can download this form now.`,
      createdAt: new Date().toISOString(),
      read: false,
      type: 'announcement'
    };
    this.notifications.unshift(notif);
    this.saveToStorage();

    return newForm;
  }

  public deletePermissionForm(formId: string): boolean {
    const initialLen = this.permissionForms.length;
    this.permissionForms = this.permissionForms.filter(f => f.id !== formId);
    if (this.permissionForms.length !== initialLen) {
      this.saveToStorage();
      return true;
    }
    return false;
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
    const verifiedLeaves = myRegs.filter(r => r.leaveFormUnlocked).length;
    const allowedLeaves = myRegs.filter(r => r.organizerAllowedLeave && !r.leaveFormUnlocked).length;
    const unreadNotifications = this.getNotifications(studentId, 'student').filter(n => !n.read).length;

    return {
      myRegistrationsCount: myRegs.length,
      myEvents,
      upcomingEvents,
      verifiedLeaves,
      allowedLeaves,
      unreadNotifications
    };
  }

  // --- LEAVE FORM FOLDERS & REPOSITORY WORKFLOW ---
  public getEventFolders(eventId: string): LeaveFolder[] {
    let folders = this.leaveFolders.filter(f => f.eventId === eventId);
    if (folders.length === 0) {
      // Seed initial standard folders for this event
      const defaultFolders: LeaveFolder[] = [
        {
          id: `fld-${eventId}-1`,
          eventId,
          name: 'Official Exemption & Leave Forms',
          description: 'Official academic duty leave documents and clearance forms',
          color: 'emerald',
          createdAt: new Date().toISOString(),
          files: []
        },
        {
          id: `fld-${eventId}-2`,
          eventId,
          name: 'Parental Consent & Night Clearance',
          description: 'Consent slips and guardian undertakings for participating students',
          color: 'purple',
          createdAt: new Date().toISOString(),
          files: []
        },
        {
          id: `fld-${eventId}-3`,
          eventId,
          name: 'HOD & Department Approvals',
          description: 'Departmental recommendations and academic attendance waiver slips',
          color: 'amber',
          createdAt: new Date().toISOString(),
          files: []
        },
        {
          id: `fld-${eventId}-4`,
          eventId,
          name: 'Dean & Security Gate Pass Slips',
          description: 'Campus gate clearance and security authorization after hours',
          color: 'blue',
          createdAt: new Date().toISOString(),
          files: []
        }
      ];

      // If the event already has an active leaveFormTemplate, place it into the first folder!
      const evt = this.events.find(e => e.id === eventId);
      if (evt?.leaveFormTemplate) {
        defaultFolders[0].files.push({
          id: `file-${eventId}-${Date.now()}`,
          folderId: defaultFolders[0].id,
          eventId,
          title: evt.leaveFormTemplate.fileName.replace(/_/g, ' ').replace('.pdf', ''),
          fileName: evt.leaveFormTemplate.fileName,
          fileSize: evt.leaveFormTemplate.fileSize,
          fileDataUrl: evt.leaveFormTemplate.fileUrl,
          uploadedAt: evt.leaveFormTemplate.uploadedAt,
          uploadedBy: evt.leaveFormTemplate.organizerId,
          organizerName: evt.leaveFormTemplate.organizerName,
          isAvailable: evt.leaveFormTemplate.isAvailable,
          downloadCount: evt.leaveFormTemplate.downloadCount,
          description: evt.leaveFormTemplate.instructions || 'Official event exemption document'
        });
      }

      this.leaveFolders.push(...defaultFolders);
      this.saveToStorage();
      folders = defaultFolders;
    }
    return folders;
  }

  public createFolder(
    organizerId: string,
    eventId: string,
    name: string,
    description?: string,
    color?: string
  ): LeaveFolder {
    const event = this.events.find(e => e.id === eventId);
    if (!event) throw new Error('Event not found');

    const newFolder: LeaveFolder = {
      id: `fld-${eventId}-${Date.now()}`,
      eventId,
      name: name.trim(),
      description: description?.trim() || 'Custom leave document folder',
      color: color || 'purple',
      createdAt: new Date().toISOString(),
      files: []
    };

    this.leaveFolders.push(newFolder);
    this.saveToStorage();
    return newFolder;
  }

  public renameFolder(
    organizerId: string,
    folderId: string,
    newName: string,
    newDesc?: string
  ): LeaveFolder {
    const folder = this.leaveFolders.find(f => f.id === folderId);
    if (!folder) throw new Error('Folder not found');

    folder.name = newName.trim();
    if (newDesc !== undefined) {
      folder.description = newDesc.trim();
    }
    this.saveToStorage();
    return folder;
  }

  public deleteFolder(organizerId: string, folderId: string): boolean {
    const idx = this.leaveFolders.findIndex(f => f.id === folderId);
    if (idx === -1) return false;

    this.leaveFolders.splice(idx, 1);
    this.saveToStorage();
    return true;
  }

  public uploadFileToFolder(
    organizerId: string,
    folderId: string,
    eventId: string,
    fileData: {
      title: string;
      fileName: string;
      fileSize: number;
      fileDataUrl?: string;
      isAvailable: boolean;
      description?: string;
    }
  ): LeaveFolderFile {
    const folder = this.leaveFolders.find(f => f.id === folderId);
    if (!folder) throw new Error('Target folder not found');

    const event = this.events.find(e => e.id === eventId);
    if (!event) throw new Error('Associated event not found');

    const organizer = this.users.find(u => u.id === organizerId);

    const safeName = fileData.fileName.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const newFile: LeaveFolderFile = {
      id: `file-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      folderId,
      eventId,
      title: fileData.title.trim() || safeName.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
      fileName: safeName,
      fileSize: fileData.fileSize,
      fileDataUrl: fileData.fileDataUrl,
      uploadedAt: new Date().toISOString(),
      uploadedBy: organizerId,
      organizerName: organizer?.name || event.organizerName,
      isAvailable: fileData.isAvailable,
      downloadCount: 0,
      description: fileData.description || 'Uploaded leave form document.'
    };

    folder.files.unshift(newFile);

    // If this is the main exemption folder or event has no template, sync to event's primary leaveFormTemplate
    if (folder.name.toLowerCase().includes('official') || folder.name.toLowerCase().includes('exemption') || !event.leaveFormTemplate) {
      event.leaveFormTemplate = {
        id: `tmpl-${newFile.id}`,
        eventId,
        eventName: event.title,
        organizerId,
        organizerName: organizer?.name || event.organizerName,
        fileName: safeName,
        fileSize: fileData.fileSize,
        fileUrl: fileData.fileDataUrl || '#official-template',
        uploadedAt: newFile.uploadedAt,
        isAvailable: fileData.isAvailable,
        downloadCount: 0,
        instructions: fileData.description || 'Official department leave application template.'
      };
    }

    // Also publish as a permission form so students find it in Permission Forms
    const existingPerm = this.permissionForms.find(
      p => p.eventId === eventId && p.fileName === safeName
    );
    if (!existingPerm) {
      this.permissionForms.unshift({
        id: `pf-fld-${newFile.id}`,
        title: newFile.title,
        purpose: fileData.description || `Official leave & exemption document for ${event.title}`,
        targetRole: 'student',
        fileName: safeName,
        department: event.department || organizer?.department || 'Academic Cell',
        lastUpdated: new Date().toISOString().split('T')[0],
        fileDataUrl: fileData.fileDataUrl,
        fileSize: fileData.fileSize,
        uploadedBy: organizerId,
        organizerName: organizer?.name || event.organizerName,
        eventId: event.id,
        eventTitle: event.title
      });
    }

    this.saveToStorage();
    return newFile;
  }

  public deleteFileFromFolder(organizerId: string, folderId: string, fileId: string): boolean {
    const folder = this.leaveFolders.find(f => f.id === folderId);
    if (!folder) return false;

    const fileIdx = folder.files.findIndex(f => f.id === fileId);
    if (fileIdx === -1) return false;

    const deletedFile = folder.files[fileIdx];
    folder.files.splice(fileIdx, 1);

    // If event has this as leaveFormTemplate, clear or fallback to next available
    const event = this.events.find(e => e.id === folder.eventId);
    if (event?.leaveFormTemplate?.fileName === deletedFile.fileName) {
      const fallbackFile = folder.files[0];
      if (fallbackFile) {
        event.leaveFormTemplate = {
          id: `tmpl-${fallbackFile.id}`,
          eventId: event.id,
          eventName: event.title,
          organizerId: fallbackFile.uploadedBy,
          organizerName: fallbackFile.organizerName || event.organizerName,
          fileName: fallbackFile.fileName,
          fileSize: fallbackFile.fileSize,
          fileUrl: fallbackFile.fileDataUrl || '#official-template',
          uploadedAt: fallbackFile.uploadedAt,
          isAvailable: fallbackFile.isAvailable,
          downloadCount: fallbackFile.downloadCount,
          instructions: fallbackFile.description
        };
      } else {
        event.leaveFormTemplate = undefined;
      }
    }

    this.saveToStorage();
    return true;
  }

  public toggleFolderFileAvailability(organizerId: string, folderId: string, fileId: string): boolean {
    const folder = this.leaveFolders.find(f => f.id === folderId);
    if (!folder) return false;

    const file = folder.files.find(f => f.id === fileId);
    if (!file) return false;

    file.isAvailable = !file.isAvailable;

    const event = this.events.find(e => e.id === folder.eventId);
    if (event?.leaveFormTemplate?.fileName === file.fileName) {
      event.leaveFormTemplate.isAvailable = file.isAvailable;
    }

    this.saveToStorage();
    return file.isAvailable;
  }

  public recordFolderFileDownload(fileId: string): void {
    for (const folder of this.leaveFolders) {
      const file = folder.files.find(f => f.id === fileId);
      if (file) {
        file.downloadCount = (file.downloadCount || 0) + 1;
        const event = this.events.find(e => e.id === file.eventId);
        if (event?.leaveFormTemplate?.fileName === file.fileName) {
          event.leaveFormTemplate.downloadCount = file.downloadCount;
        }
        this.saveToStorage();
        break;
      }
    }
  }

  public getStudentEventFolders(eventId: string): LeaveFolder[] {
    const folders = this.getEventFolders(eventId);
    return folders.map(f => ({
      ...f,
      files: f.files.filter(file => file.isAvailable)
    }));
  }

  public resetToDefaults() {
    this.events = INITIAL_EVENTS;
    this.registrations = INITIAL_REGISTRATIONS;
    this.users = INITIAL_USERS;
    this.announcements = INITIAL_ANNOUNCEMENTS;
    this.notifications = INITIAL_NOTIFICATIONS;
    this.permissionForms = INITIAL_PERMISSION_FORMS;
    this.leaveFolders = INITIAL_LEAVE_FOLDERS;
    this.activeUserId = 'stu-101';
    this.saveToStorage();
  }
}

export const apiService = new ApiService();
