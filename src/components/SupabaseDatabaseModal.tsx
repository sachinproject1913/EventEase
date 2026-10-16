import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Copy, 
  Check, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Server, 
  UploadCloud, 
  Key, 
  Link, 
  Table, 
  ShieldCheck, 
  Info,
  X
} from 'lucide-react';
import { 
  getStoredSupabaseConfig, 
  saveSupabaseConfig, 
  clearSupabaseConfig, 
  testSupabaseConnection, 
  isSupabaseConfigured 
} from '../lib/supabase';
import { 
  SUPABASE_SQL_SCHEMA, 
  insertEventToSupabase 
} from '../services/supabaseService';
import { apiService } from '../services/apiService';

interface SupabaseDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged?: () => void;
}

export const SupabaseDatabaseModal: React.FC<SupabaseDatabaseModalProps> = ({
  isOpen,
  onClose,
  onConfigChanged
}) => {
  const [activeTab, setActiveTab] = useState<'schema' | 'connect' | 'sync' | 'architecture'>('schema');
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    tables?: { name: string; exists: boolean; count?: number }[];
  } | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const config = getStoredSupabaseConfig();
      setUrl(config.url);
      setAnonKey(config.anonKey);
      if (isSupabaseConfigured()) {
        runTest(config.url, config.anonKey);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(url, anonKey);
    await runTest(url, anonKey);
    if (onConfigChanged) onConfigChanged();
  };

  const runTest = async (testUrl?: string, testKey?: string) => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(testUrl || url, testKey || anonKey);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleClear = () => {
    clearSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setTestResult(null);
    if (onConfigChanged) onConfigChanged();
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    setSeedStatus('Uploading events to Supabase...');
    try {
      const events = apiService.getAllEventsAdmin();
      let successCount = 0;
      for (const event of events) {
        const ok = await insertEventToSupabase({
          id: event.id,
          title: event.title,
          description: event.description,
          category: event.category,
          date: event.startDate.split('T')[0],
          time: '10:00 AM',
          venue: event.venue,
          durationHours: 3,
          capacity: event.maxSeats,
          registeredCount: event.registeredCount,
          bannerUrl: event.bannerImage,
          status: 'upcoming',
          organizerId: event.organizerId,
          organizerName: event.organizerName,
          qrCodeSecret: event.eventSecretCode || `EVENTEASE-QR-${event.id}`,
          leaveTemplateId: event.leaveFormTemplate?.id
        });
        if (ok) successCount++;
      }
      setSeedStatus(`Successfully seeded ${successCount} event(s) to Supabase table 'events'!`);
      runTest();
    } catch (err: any) {
      setSeedStatus(`Error seeding: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const configured = isSupabaseConfigured();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">Supabase Database Integration</h3>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                  configured && testResult?.success 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {configured && testResult?.success ? 'Connected' : 'Configuration Pending'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                GLA UNIVERSITY MATHURA &bull; PostgreSQL Schema, RLS Policies & Cloud Connection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a 
              href="https://supabase.com/dashboard" 
              target="_blank" 
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
            >
              <span>Supabase Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button 
              onClick={onClose} 
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'schema'
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>1. SQL Schema Query (Run in Supabase)</span>
          </button>
          <button
            onClick={() => setActiveTab('connect')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'connect'
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Link className="w-4 h-4" />
            <span>2. Connect Database & Test</span>
            {testResult && (
              <span className={`w-2 h-2 rounded-full ${testResult.success ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            )}
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'sync'
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>3. Seed / Sync Data</span>
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'architecture'
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>4. Schema Architecture & RLS</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: SQL SCHEMA */}
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950">How to create schema in your Supabase project:</h4>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      1. Open your <strong>Supabase Dashboard</strong> &rarr; Click <strong>SQL Editor</strong> on left menu &rarr; 
                      2. Click <strong>New Query</strong> &rarr; 
                      3. Paste the SQL script below and click <strong>Run</strong>.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCopy}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Full SQL Schema</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Viewer */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
                <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                    </div>
                    <span className="font-mono text-slate-300 font-semibold pl-2">supabase_schema_gla_university.sql</span>
                  </div>
                  <button 
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 hover:text-white transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-[460px] leading-relaxed">
                  <code>{SUPABASE_SQL_SCHEMA}</code>
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: CONNECT DATABASE & TEST */}
          {activeTab === 'connect' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span>Where to find your Supabase credentials</span>
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-blue-600 underline font-medium">Supabase Dashboard</a> &rarr; 
                  Select your project &rarr; Click <strong>Project Settings (gear icon)</strong> &rarr; <strong>API</strong>. 
                  Copy the <strong>Project URL</strong> and <strong>Project API key (anon / public)</strong>.
                </p>
              </div>

              <form onSubmit={handleSaveAndTest} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Supabase Project URL
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://xyzabcdefghijklmnop.supabase.co"
                      required
                      className="w-full pl-9 pr-4 py-2.5 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                    <Link className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Must start with <code>https://</code> and end with <code>.supabase.co</code></p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Supabase Anon Public API Key
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={anonKey}
                      onChange={(e) => setAnonKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      required
                      className="w-full pl-9 pr-4 py-2.5 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Safe for client-side queries with Row Level Security enabled.</p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isTesting}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Connection...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Save & Test Connection</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleClear}
                    className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-300 transition-colors"
                  >
                    Reset / Clear
                  </button>
                </div>
              </form>

              {/* Test Result Display */}
              {testResult && (
                <div className={`p-4 rounded-2xl border ${
                  testResult.success 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                    : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}>
                  <div className="flex items-start gap-3">
                    {testResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1">
                      <h5 className="text-xs font-bold">
                        {testResult.success ? 'Connection Successful!' : 'Connection Error'}
                      </h5>
                      <p className="text-xs mt-1">{testResult.message}</p>

                      {testResult.tables && testResult.tables.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-emerald-200">
                          <span className="text-[11px] font-bold uppercase tracking-wider block mb-2 text-emerald-800">
                            Table Verification Status:
                          </span>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {testResult.tables.map(tbl => (
                              <div key={tbl.name} className="flex items-center justify-between p-2 rounded-lg bg-white/70 border border-emerald-200">
                                <span className="font-mono text-[11px]">{tbl.name}</span>
                                {tbl.exists ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    Found ({tbl.count ?? 0} rows)
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                    Missing (Run Schema)
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SEED / SYNC DATA */}
          {activeTab === 'sync' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Seed Local Data to Supabase</h4>
                  <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                    Push your existing GLA UNIVERSITY MATHURA events, registrations, and leave form templates from the local demo memory directly into your Supabase database.
                  </p>
                </div>

                <button
                  onClick={handleSeedData}
                  disabled={!configured || isSeeding}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {isSeeding ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Uploading to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Push Local Events to Supabase</span>
                    </>
                  )}
                </button>

                {!configured && (
                  <p className="text-[11px] text-amber-600 font-medium">
                    Please configure and test your Supabase Project URL in Tab 2 before seeding data.
                  </p>
                )}

                {seedStatus && (
                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700">
                    {seedStatus}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ARCHITECTURE & RLS */}
          {activeTab === 'architecture' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Table className="w-4 h-4 text-emerald-600" />
                    <span>Relational Model for GLA University Mathura</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-600">
                    <li className="p-2 bg-white rounded-lg border border-slate-200">
                      <strong>events:</strong> Main event entity with unique <code className="text-emerald-700">qr_code_secret</code> and <code className="text-emerald-700">leave_template_id</code>.
                    </li>
                    <li className="p-2 bg-white rounded-lg border border-slate-200">
                      <strong>event_registrations:</strong> Student registration details containing the unique token code required for QR verification.
                    </li>
                    <li className="p-2 bg-white rounded-lg border border-slate-200">
                      <strong>attendance_logs:</strong> Real-time records generated when students scan the venue QR code.
                    </li>
                    <li className="p-2 bg-white rounded-lg border border-slate-200">
                      <strong>leave_forms:</strong> Academic exemption letters that automatically unlock from <span className="text-amber-600 font-bold">locked</span> to <span className="text-emerald-600 font-bold">unlocked</span> once attendance is logged.
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Row Level Security (RLS) Policies</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    The generated SQL schema enables Row Level Security on all tables and creates permissive policies for public client interaction via the Anon key.
                  </p>
                  <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 text-xs font-mono text-slate-700 space-y-1">
                    <div>CREATE POLICY "Public read events" ON events FOR SELECT;</div>
                    <div>CREATE POLICY "Public insert attendance" ON attendance_logs;</div>
                    <div>CREATE POLICY "Public update leave_forms" ON leave_forms;</div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    If you later restrict access to logged-in users only, you can alter the policies to use <code>auth.uid() = student_id</code>.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>Supabase PostgreSQL 15 &bull; EventEase & CampusGuard Edition</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
