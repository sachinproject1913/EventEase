import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { CampusEvent, EventRegistration, User, CampusAnnouncement } from '../types';

export interface SupabaseEventItem {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  venue: string;
  durationHours?: number;
  capacity?: number;
  registeredCount?: number;
  bannerUrl?: string;
  status: string;
  organizerId: string;
  organizerName: string;
  qrCodeSecret: string;
  leaveTemplateId?: string;
}

export interface SupabaseRegistrationItem {
  id: string;
  eventId: string;
  studentId: string;
  studentName: string;
  studentRollNo: string;
  course?: string;
  department?: string;
  registeredAt: string;
  status: string;
  uniqueRegistrationCode: string;
  attendanceStatus?: string;
  attendanceMarkedAt?: string;
  organizerAllowedLeave?: boolean;
  leaveUniqueKey?: string;
  leaveFormUnlocked?: boolean;
  teamName?: string;
  hackathonRole?: string;
}

export const SUPABASE_SQL_SCHEMA = `-- =====================================================================
-- GLA UNIVERSITY MATHURA - EVENTEASE SCHEMA FOR SUPABASE (PostgreSQL 15+)
-- Run this in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- Project ID: bzdhuperkoycgtcfzflw
-- =====================================================================

-- 1. Enable UUID & Crypto Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. USERS / PROFILES TABLE (Stores Students, Organizers, Admin accounts)
CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'organizer', 'student')),
  student_id TEXT,
  course TEXT,
  department TEXT,
  year TEXT,
  university_name TEXT NOT NULL DEFAULT 'GLA UNIVERSITY MATHURA',
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. EVENTS TABLE (Campus Events, Hackathons, Workshops)
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Technical',
  event_date TEXT,
  event_time TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  registration_deadline TIMESTAMPTZ,
  venue TEXT NOT NULL,
  duration_hours NUMERIC NOT NULL DEFAULT 2,
  capacity INTEGER NOT NULL DEFAULT 100,
  registered_count INTEGER NOT NULL DEFAULT 0,
  banner_url TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  approval_status TEXT NOT NULL DEFAULT 'approved',
  organizer_id TEXT NOT NULL,
  organizer_name TEXT NOT NULL,
  organizer_club TEXT,
  department TEXT,
  qr_code_secret TEXT NOT NULL,
  leave_template_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. EVENT REGISTRATIONS TABLE (All student registrations & QR keys)
CREATE TABLE IF NOT EXISTS event_registrations (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_roll_no TEXT NOT NULL,
  course TEXT,
  department TEXT,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  status TEXT NOT NULL DEFAULT 'confirmed',
  unique_registration_code TEXT NOT NULL UNIQUE,
  attendance_status TEXT NOT NULL DEFAULT 'pending',
  attendance_marked_at TIMESTAMPTZ,
  organizer_allowed_leave BOOLEAN DEFAULT false,
  leave_unique_key TEXT,
  leave_form_unlocked BOOLEAN DEFAULT false,
  leave_form_unlocked_at TIMESTAMPTZ,
  official_form_downloaded BOOLEAN DEFAULT false,
  personal_application_downloaded BOOLEAN DEFAULT false,
  team_name TEXT,
  hackathon_role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. ATTENDANCE LOGS TABLE (Populated via QR Scanner check-ins)
CREATE TABLE IF NOT EXISTS attendance_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  student_roll_no TEXT NOT NULL,
  student_name TEXT NOT NULL,
  unique_registration_code TEXT NOT NULL,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  verification_status TEXT NOT NULL DEFAULT 'verified',
  marked_by TEXT NOT NULL DEFAULT 'qr_scan',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. LEAVE FORMS TABLE (Generated & Unlocked Leave Slips)
CREATE TABLE IF NOT EXISTS leave_forms (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_roll_no TEXT NOT NULL,
  department TEXT,
  event_title TEXT NOT NULL,
  event_date TEXT,
  hod_name TEXT NOT NULL DEFAULT 'Prof. Head of Department',
  status TEXT NOT NULL DEFAULT 'unlocked',
  unlocked_at TIMESTAMPTZ,
  downloaded_at TIMESTAMPTZ,
  reason TEXT NOT NULL DEFAULT 'Official Academic Leave for participating in university sanctioned event.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  target_role TEXT NOT NULL DEFAULT 'all',
  sender_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_reg_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_reg_student ON event_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_reg_code ON event_registrations(unique_registration_code);
CREATE INDEX IF NOT EXISTS idx_att_event ON attendance_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_att_student ON attendance_logs(student_id);

-- 9. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- 10. PERMISSIVE POLICIES FOR PUBLIC CLIENT ACCESS (Allows Web App Read/Write)
DROP POLICY IF EXISTS "Public access app_users" ON app_users;
CREATE POLICY "Public access app_users" ON app_users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access events" ON events;
CREATE POLICY "Public access events" ON events FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access event_registrations" ON event_registrations;
CREATE POLICY "Public access event_registrations" ON event_registrations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access attendance_logs" ON attendance_logs;
CREATE POLICY "Public access attendance_logs" ON attendance_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access leave_forms" ON leave_forms;
CREATE POLICY "Public access leave_forms" ON leave_forms FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access announcements" ON announcements;
CREATE POLICY "Public access announcements" ON announcements FOR ALL USING (true) WITH CHECK (true);
`;

// --- SUPABASE CLIENT DATA OPERATIONS ---

export async function upsertUserToSupabase(user: User): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('app_users').upsert({
      id: user.id,
      email: user.email.toLowerCase(),
      name: user.name,
      role: user.role,
      password_hash: user.password || 'password123',
      student_id: user.studentId || null,
      course: user.course || null,
      department: user.department || null,
      year: user.year || null,
      university_name: user.universityName || 'GLA UNIVERSITY MATHURA',
      avatar_url: user.avatarUrl || null,
      phone: user.phone || null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase upsert user warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error saving user to Supabase:', err);
    return false;
  }
}

export async function upsertEventToSupabase(event: CampusEvent): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('events').upsert({
      id: event.id,
      title: event.title,
      description: event.description || '',
      category: event.category || 'Technical',
      event_date: event.startDate ? event.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
      event_time: '10:00 AM',
      start_date: event.startDate || new Date().toISOString(),
      end_date: event.endDate || new Date().toISOString(),
      registration_deadline: event.registrationDeadline || new Date().toISOString(),
      venue: event.venue || 'GLA University Mathura',
      duration_hours: 3,
      capacity: event.maxSeats || 100,
      registered_count: event.registeredCount || 0,
      banner_url: event.bannerImage || '',
      status: event.status || 'published',
      approval_status: event.approvalStatus || 'approved',
      organizer_id: event.organizerId || 'org-201',
      organizer_name: event.organizerName || 'Faculty Coordinator',
      organizer_club: event.organizerClub || 'Student Activity Council',
      department: event.department || 'Computer Science & Engineering',
      qr_code_secret: event.eventSecretCode || `EVENTEASE-QR-${event.id}`,
      leave_template_id: event.leaveFormTemplate?.id || null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase upsert event warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error saving event to Supabase:', err);
    return false;
  }
}

export async function upsertRegistrationToSupabase(
  reg: EventRegistration, 
  student?: User
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('event_registrations').upsert({
      id: reg.id,
      event_id: reg.eventId,
      student_id: reg.studentId,
      student_name: student?.name || 'GLA Student',
      student_roll_no: student?.studentId || reg.studentId,
      course: student?.course || 'B.Tech CSE',
      department: student?.department || 'Computer Science & Engineering',
      registered_at: reg.registeredAt || new Date().toISOString(),
      status: reg.status || 'confirmed',
      unique_registration_code: reg.registrationCode,
      attendance_status: reg.attendanceStatus || 'pending',
      attendance_marked_at: reg.attendanceMarkedAt || null,
      organizer_allowed_leave: Boolean(reg.organizerAllowedLeave),
      leave_unique_key: reg.leaveUniqueKey || null,
      leave_form_unlocked: Boolean(reg.leaveFormUnlocked),
      leave_form_unlocked_at: reg.leaveFormUnlockedAt || null,
      official_form_downloaded: Boolean(reg.officialFormDownloaded),
      personal_application_downloaded: Boolean(reg.personalApplicationDownloaded),
      team_name: reg.teamName || null,
      hackathon_role: reg.hackathonRole || null
    }, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase upsert registration warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error saving registration to Supabase:', err);
    return false;
  }
}

export async function insertAttendanceLogToSupabase(log: {
  eventId: string;
  studentId: string;
  studentRollNo: string;
  studentName: string;
  uniqueRegistrationCode: string;
  verificationStatus: string;
  markedBy: string;
}): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('attendance_logs').insert({
      event_id: log.eventId,
      student_id: log.studentId,
      student_roll_no: log.studentRollNo,
      student_name: log.studentName,
      unique_registration_code: log.uniqueRegistrationCode,
      verification_status: log.verificationStatus,
      marked_by: log.markedBy,
      scanned_at: new Date().toISOString()
    });

    if (error) {
      console.warn('Supabase insert attendance log warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error saving attendance log to Supabase:', err);
    return false;
  }
}

export async function upsertLeaveFormToSupabase(form: {
  eventId: string;
  studentId: string;
  studentName: string;
  studentRollNo: string;
  department: string;
  eventTitle: string;
  eventDate?: string;
  status: string;
}): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('leave_forms').insert({
      event_id: form.eventId,
      student_id: form.studentId,
      student_name: form.studentName,
      student_roll_no: form.studentRollNo,
      department: form.department,
      event_title: form.eventTitle,
      event_date: form.eventDate || new Date().toISOString().split('T')[0],
      status: form.status,
      unlocked_at: new Date().toISOString()
    });

    return !error;
  } catch {
    return false;
  }
}

// --- ADMIN DELETION SUPABASE METHODS ---

/**
 * Delete a user (student or organizer) from Supabase and cascade delete their related records
 */
export async function deleteUserFromSupabase(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    // 1. Delete associated registrations for this student
    await client.from('event_registrations').delete().eq('student_id', userId);
    // 2. Delete associated attendance logs
    await client.from('attendance_logs').delete().eq('student_id', userId);
    // 3. Delete associated leave forms
    await client.from('leave_forms').delete().eq('student_id', userId);
    // 4. Delete user profile record
    const { error } = await client.from('app_users').delete().eq('id', userId);
    if (error) {
      console.warn('Supabase delete user error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to delete user from Supabase:', err);
    return false;
  }
}

/**
 * Delete an event from Supabase (cascades to registrations, attendance logs, leave forms)
 */
export async function deleteEventFromSupabase(eventId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    // Clean up dependent child records to avoid foreign key constraints
    await client.from('leave_forms').delete().eq('event_id', eventId);
    await client.from('attendance_logs').delete().eq('event_id', eventId);
    await client.from('event_registrations').delete().eq('event_id', eventId);
    // Delete event
    const { error } = await client.from('events').delete().eq('id', eventId);
    if (error) {
      console.warn('Supabase delete event error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to delete event from Supabase:', err);
    return false;
  }
}

/**
 * Delete a specific registration from Supabase
 */
export async function deleteRegistrationFromSupabase(registrationId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('event_registrations').delete().eq('id', registrationId);
    if (error) {
      console.warn('Supabase delete registration error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to delete registration from Supabase:', err);
    return false;
  }
}

/**
 * Delete an announcement from Supabase
 */
export async function deleteAnnouncementFromSupabase(announcementId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('announcements').delete().eq('id', announcementId);
    return !error;
  } catch {
    return false;
  }
}

// Master One-Click Sync: Push all events, accounts, registrations, and logs to Supabase
export async function syncAllLocalDataToSupabase(
  users: User[],
  events: CampusEvent[],
  registrations: EventRegistration[],
  announcements?: CampusAnnouncement[]
): Promise<{
  success: boolean;
  message: string;
  counts: { users: number; events: number; registrations: number; announcements: number };
}> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase URL or Key is not configured.',
      counts: { users: 0, events: 0, registrations: 0, announcements: 0 }
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Could not connect to Supabase client.',
      counts: { users: 0, events: 0, registrations: 0, announcements: 0 }
    };
  }

  let usersSaved = 0;
  let eventsSaved = 0;
  let regsSaved = 0;
  let annsSaved = 0;

  // 1. Sync Users
  for (const user of users) {
    const ok = await upsertUserToSupabase(user);
    if (ok) usersSaved++;
  }

  // 2. Sync Events
  for (const event of events) {
    const ok = await upsertEventToSupabase(event);
    if (ok) eventsSaved++;
  }

  // 3. Sync Registrations
  for (const reg of registrations) {
    const student = users.find(u => u.id === reg.studentId);
    const ok = await upsertRegistrationToSupabase(reg, student);
    if (ok) regsSaved++;
  }

  // 4. Sync Announcements if provided
  if (announcements) {
    for (const ann of announcements) {
      try {
        const { error } = await client.from('announcements').upsert({
          id: ann.id,
          title: ann.title,
          message: ann.content,
          priority: ann.category || 'normal',
          target_role: ann.targetAudience || 'all',
          sender_name: ann.author || 'University Administration'
        }, { onConflict: 'id' });
        if (!error) annsSaved++;
      } catch {
        // ignore
      }
    }
  }

  const anySaved = usersSaved > 0 || eventsSaved > 0 || regsSaved > 0;

  return {
    success: anySaved,
    message: anySaved 
      ? `Successfully synchronized to Supabase! Uploaded ${usersSaved} users, ${eventsSaved} events, and ${regsSaved} registrations.`
      : `Unable to save to Supabase tables. Please make sure the SQL schema has been executed in the Supabase SQL Editor.`,
    counts: {
      users: usersSaved,
      events: eventsSaved,
      registrations: regsSaved,
      announcements: annsSaved
    }
  };
}

// Alias for backward compatibility with modal
export const insertEventToSupabase = upsertEventToSupabase;

// Fetch remote registrations from Supabase
export async function syncRegistrationsFromSupabase(): Promise<SupabaseRegistrationItem[] | null> {
  if (!isSupabaseConfigured()) return null;
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('event_registrations')
      .select('*')
      .order('registered_at', { ascending: false });

    if (error || !data) return null;

    return data.map((row: any) => ({
      id: row.id,
      eventId: row.event_id,
      studentId: row.student_id,
      studentName: row.student_name,
      studentRollNo: row.student_roll_no,
      course: row.course,
      department: row.department,
      registeredAt: row.registered_at,
      status: row.status,
      uniqueRegistrationCode: row.unique_registration_code,
      attendanceStatus: row.attendance_status,
      attendanceMarkedAt: row.attendance_marked_at,
      organizerAllowedLeave: row.organizer_allowed_leave,
      leaveUniqueKey: row.leave_unique_key,
      leaveFormUnlocked: row.leave_form_unlocked,
      teamName: row.team_name,
      hackathonRole: row.hackathon_role
    }));
  } catch {
    return null;
  }
}

// Fetch remote events from Supabase
export async function fetchEventsFromSupabase(): Promise<CampusEvent[] | null> {
  if (!isSupabaseConfigured()) return null;
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) return null;

    return data.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description || '',
      category: row.category as any,
      organizerId: row.organizer_id,
      organizerName: row.organizer_name,
      organizerClub: row.organizer_club || 'Event Committee',
      department: row.department || 'GLA University Mathura',
      venue: row.venue,
      startDate: row.start_date || (row.event_date ? `${row.event_date}T10:00:00Z` : new Date().toISOString()),
      endDate: row.end_date || (row.event_date ? `${row.event_date}T17:00:00Z` : new Date().toISOString()),
      registrationDeadline: row.registration_deadline || new Date().toISOString(),
      maxSeats: row.capacity || 100,
      registeredCount: row.registered_count || 0,
      bannerImage: row.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
      status: (row.status || 'published') as any,
      approvalStatus: (row.approval_status || 'approved') as any,
      keywords: [row.category, 'GLA', 'EventEase'],
      requiresHODApproval: true,
      eventSecretCode: row.qr_code_secret
    }));
  } catch (err) {
    console.warn('Failed to fetch events from Supabase:', err);
    return null;
  }
}

// Fetch remote users from Supabase
export async function fetchUsersFromSupabase(): Promise<User[] | null> {
  if (!isSupabaseConfigured()) return null;
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('app_users')
      .select('*');

    if (error || !data || data.length === 0) return null;

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role as any,
      studentId: row.student_id,
      course: row.course,
      department: row.department,
      year: row.year,
      universityName: row.university_name || 'GLA UNIVERSITY MATHURA',
      avatarUrl: row.avatar_url,
      phone: row.phone,
      password: row.password_hash
    }));
  } catch (err) {
    console.warn('Failed to fetch users from Supabase:', err);
    return null;
  }
}

