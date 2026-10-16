import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'campusease_supabase_url';
const STORAGE_KEY_KEY = 'campusease_supabase_anon_key';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = localStorage.getItem(STORAGE_KEY_URL);
  const localKey = localStorage.getItem(STORAGE_KEY_KEY);

  return {
    url: localUrl || envUrl || '',
    anonKey: localKey || envKey || ''
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  localStorage.setItem(STORAGE_KEY_URL, url.trim());
  localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
  cachedClient = null; // Reset cached client
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_KEY);
  cachedClient = null;
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getStoredSupabaseConfig();
  return Boolean(
    url && 
    anonKey && 
    !url.includes('your-project-id') && 
    !anonKey.includes('your-anon-public-key') &&
    url.startsWith('https://')
  );
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getStoredSupabaseConfig();

  if (!url || !anonKey || url.includes('your-project-id') || !url.startsWith('https://')) {
    return null;
  }

  if (!cachedClient) {
    try {
      cachedClient = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        }
      });
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      return null;
    }
  }

  return cachedClient;
}

export async function testSupabaseConnection(customUrl?: string, customKey?: string): Promise<{
  success: boolean;
  message: string;
  tables?: { name: string; exists: boolean; count?: number }[];
}> {
  const url = customUrl || getStoredSupabaseConfig().url;
  const anonKey = customKey || getStoredSupabaseConfig().anonKey;

  if (!url || !anonKey) {
    return {
      success: false,
      message: 'Supabase URL or Anon Public Key is missing.'
    };
  }

  if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
    return {
      success: false,
      message: 'Invalid Supabase Project URL. Expected format: https://[project-ref].supabase.co'
    };
  }

  try {
    const testClient = createClient(url, anonKey);
    
    // Test basic query to events or users table
    const tableChecks = ['events', 'event_registrations', 'attendance_logs', 'leave_forms', 'announcements'];
    const results: { name: string; exists: boolean; count?: number }[] = [];

    for (const tableName of tableChecks) {
      try {
        const { count, error } = await testClient
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error) {
          // If error is relation does not exist
          results.push({ name: tableName, exists: false });
        } else {
          results.push({ name: tableName, exists: true, count: count ?? 0 });
        }
      } catch {
        results.push({ name: tableName, exists: false });
      }
    }

    const anyTableExists = results.some(r => r.exists);

    if (anyTableExists) {
      return {
        success: true,
        message: 'Connected to Supabase successfully! Database tables found.',
        tables: results
      };
    } else {
      return {
        success: true,
        message: 'Connected to Supabase project, but tables are not yet created! Please execute the provided SQL schema script in the Supabase SQL Editor.',
        tables: results
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Connection failed. Please verify your Project URL and Anon Key.'
    };
  }
}
