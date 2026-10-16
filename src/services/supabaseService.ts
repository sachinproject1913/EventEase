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
}

export const SUPABASE_SQL_SCHEMA = `-- =====================================================================
-- GLA UNIVERSITY MATHURA - EVENTEASE & CAMPUSGUARD SCHEMA FOR SUPABASE
-- PostgreSQL 15+ compatible with Row Level Security (RLS) enabled
-- =====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. DROP TABLES IF RESEEDING (SAFE FOR CLEAN SETUP)
-- DROP TABLE IF EXISTS leave_forms CASCADE;
-- DROP TABLE IF EXISTS attendance_logs CASCADE;
-- DROP TABLE IF EXISTS event_registrations CASCADE;
-- DROP TABLE IF EXISTS events CASCADE;
-- DROP TABLE IF EXISTS announcements CASCADE;
-- DROP TABLE IF EXISTS system_settings CASCADE;
-- DROP TABLE IF EXISTS app_users CASCADE;

-- 3. USERS / PROFILES TABLE
CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'organizer', 'student')),
  student_id TEXT,
  course TEXT,
  branch TEXT,
  semester TEXT,
  phone TEXT,
  university_name TEXT NOT NULL DEFAULT 'GLA UNIVERSITY MATHURA',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. EVENTS TABLE
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Technical',
  event_date TEXT NOT NULL,
  event_time TEXT NOT NULL,
  venue TEXT NOT NULL,
  duration_hours NUMERIC NOT NULL DEFAULT 2,
  capacity INTEGER NOT NULL DEFAULT 100,
  registered_count INTEGER NOT NULL DEFAULT 0,
  banner_url TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  organizer_id TEXT NOT NULL,
  organizer_name TEXT NOT NULL,
  qr_code_secret TEXT NOT NULL,
  leave_template_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. EVENT REGISTRATIONS TABLE
CREATE TABLE IF NOT EXISTS event_registrations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_roll_no TEXT NOT NULL,
  course TEXT,
  department TEXT,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled')),
  unique_registration_code TEXT NOT NULL UNIQUE
);

-- 6. ATTENDANCE LOGS TABLE (Populated via QR Scanner)
CREATE TABLE IF NOT EXISTS attendance_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  student_roll_no TEXT NOT NULL,
  student_name TEXT NOT NULL,
  unique_registration_code TEXT NOT NULL,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  verification_status TEXT NOT NULL DEFAULT 'verified' CHECK (verification_status IN ('verified', 'rejected')),
  marked_by TEXT NOT NULL DEFAULT 'qr_scan',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. LEAVE FORMS TABLE (Unlocked after QR Attendance)
CREATE TABLE IF NOT EXISTS leave_forms (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_roll_no TEXT NOT NULL,
  department TEXT,
  event_title TEXT NOT NULL,
  event_date TEXT NOT NULL,
  hod_name TEXT NOT NULL DEFAULT 'Prof. Head of Department',
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'unlocked', 'submitted', 'approved', 'rejected')),
  unlocked_at TIMESTAMPTZ,
  downloaded_at TIMESTAMPTZ,
  reason TEXT NOT NULL DEFAULT 'Official Academic Leave for participating in university sanctioned event.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'urgent')),
  target_role TEXT NOT NULL DEFAULT 'all',
  sender_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. INDEXES FOR HIGH-CONCURRENCY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_reg_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_reg_student ON event_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_reg_code ON event_registrations(unique_registration_code);
CREATE INDEX IF NOT EXISTS idx_att_event ON attendance_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_att_student ON attendance_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_leave_event_student ON leave_forms(event_id, student_id);

-- 11. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- 12. PERMISSIVE POLICIES FOR SUPABASE CLIENT ACCESS (Anon & Authenticated)
-- Allows reading and writing for the web app with public API key
DROP POLICY IF EXISTS "Public read events" ON events;
CREATE POLICY "Public read events" ON events FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert events" ON events;
CREATE POLICY "Public insert events" ON events FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update events" ON events;
CREATE POLICY "Public update events" ON events FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public read registrations" ON event_registrations;
CREATE POLICY "Public read registrations" ON event_registrations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert registrations" ON event_registrations;
CREATE POLICY "Public insert registrations" ON event_registrations FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update registrations" ON event_registrations;
CREATE POLICY "Public update registrations" ON event_registrations FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public read attendance" ON attendance_logs;
CREATE POLICY "Public read attendance" ON attendance_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert attendance" ON attendance_logs;
CREATE POLICY "Public insert attendance" ON attendance_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public read leave_forms" ON leave_forms;
CREATE POLICY "Public read leave_forms" ON leave_forms FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert leave_forms" ON leave_forms;
CREATE POLICY "Public insert leave_forms" ON leave_forms FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update leave_forms" ON leave_forms;
CREATE POLICY "Public update leave_forms" ON leave_forms FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public read users" ON app_users;
CREATE POLICY "Public read users" ON app_users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert users" ON app_users;
CREATE POLICY "Public insert users" ON app_users FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update users" ON app_users;
CREATE POLICY "Public update users" ON app_users FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public read announcements" ON announcements;
CREATE POLICY "Public read announcements" ON announcements FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert announcements" ON announcements;
CREATE POLICY "Public insert announcements" ON announcements FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public read settings" ON system_settings;
CREATE POLICY "Public read settings" ON system_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public manage settings" ON system_settings;
CREATE POLICY "Public manage settings" ON system_settings FOR ALL USING (true);

-- 13. SEED INITIAL UNIVERSITY DATA (GLA UNIVERSITY MATHURA)
INSERT INTO system_settings (key, value) 
VALUES 
  ('university_name', 'GLA UNIVERSITY MATHURA'),
  ('portal_name', 'CAMPUSGUARD / EventEase'),
  ('system_status', 'operational')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Seed Sample Event
INSERT INTO events (
  id, title, description, category, event_date, event_time, venue, duration_hours,
  capacity, registered_count, banner_url, status, organizer_id, organizer_name,
  qr_code_secret, leave_template_id
) VALUES (
  'ev-hack-2026',
  'HackGLA 2026 - Annual 24h Hackathon',
  'Flagship 24-hour inter-college hackathon hosted at GLA University Mathura. Attendance verified via venue QR code for HOD duty leave.',
  'Technical',
  '2026-11-15',
  '09:00 AM',
  'GLA University Academic Block VIII Auditorium',
  24,
  250,
  1,
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
  'upcoming',
  'usr-org-1',
  'Prof. Rajesh Kumar (GLA Tech Club)',
  'EVENTEASE-QR-ev-hack-2026-SECRET',
  'tmpl-leave-ev-hack-2026'
) ON CONFLICT (id) DO NOTHING;

-- Seed Sample Announcement
INSERT INTO announcements (
  id, title, message, priority, target_role, sender_name
) VALUES (
  'ann-gla-01',
  'Welcome to GLA University Mathura Event & Leave Portal',
  'Students must scan the venue QR code during events with their unique registration ID to instantly unlock their official HOD Leave Form.',
  'urgent',
  'all',
  'Dean Student Welfare (GLA University)'
) ON CONFLICT (id) DO NOTHING;
`;

// Supabase sync helpers
export async function syncEventsFromSupabase(): Promise<SupabaseEventItem[] | null> {
  if (!isSupabaseConfigured()) return null;
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('Supabase fetch events error:', error);
      return null;
    }

    return data.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      date: row.event_date,
      time: row.event_time,
      venue: row.venue,
      durationHours: Number(row.duration_hours) || 2,
      capacity: row.capacity,
      registeredCount: row.registered_count,
      bannerUrl: row.banner_url,
      status: row.status,
      organizerId: row.organizer_id,
      organizerName: row.organizer_name,
      qrCodeSecret: row.qr_code_secret,
      leaveTemplateId: row.leave_template_id
    }));
  } catch (err) {
    console.warn('Error reading from Supabase:', err);
    return null;
  }
}

export async function insertEventToSupabase(event: SupabaseEventItem): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('events').insert({
      id: event.id,
      title: event.title,
      description: event.description,
      category: event.category,
      event_date: event.date,
      event_time: event.time,
      venue: event.venue,
      duration_hours: event.durationHours || 2,
      capacity: event.capacity,
      registered_count: event.registeredCount || 0,
      banner_url: event.bannerUrl,
      status: event.status,
      organizer_id: event.organizerId,
      organizer_name: event.organizerName,
      qr_code_secret: event.qrCodeSecret,
      leave_template_id: event.leaveTemplateId
    });

    return !error;
  } catch {
    return false;
  }
}

export async function insertRegistrationToSupabase(reg: SupabaseRegistrationItem): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('event_registrations').insert({
      id: reg.id,
      event_id: reg.eventId,
      student_id: reg.studentId,
      student_name: reg.studentName,
      student_roll_no: reg.studentRollNo,
      course: reg.course,
      department: reg.department,
      registered_at: reg.registeredAt,
      status: reg.status,
      unique_registration_code: reg.uniqueRegistrationCode
    });

    if (error) console.warn('Supabase registration error:', error);
    return !error;
  } catch {
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
      marked_by: log.markedBy
    });

    return !error;
  } catch {
    return false;
  }
}
