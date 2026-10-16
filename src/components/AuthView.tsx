import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { apiService } from '../services/apiService';
import { 
  ShieldCheck, 
  User as UserIcon, 
  Building, 
  ShieldAlert, 
  ArrowRight, 
  ArrowUpRight,
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Mail, 
  GraduationCap 
} from 'lucide-react';

interface Props {
  onAuthSuccess: (user: User) => void;
  defaultMode?: 'login' | 'signup';
}

export const AuthView: React.FC<Props> = ({ onAuthSuccess, defaultMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(defaultMode === 'login');
  const [role, setRole] = useState<UserRole>('student');

  // Credentials Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [course, setCourse] = useState('B.Tech Computer Science & Engineering');
  const [department, setDepartment] = useState('Department of Computer Science & Engineering');
  const [organizerClub, setOrganizerClub] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Demo Logins: Immediately authenticates and accesses the portal
  const handleQuickDemoLogin = (demoEmail: string, demoPass: string) => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      setEmail(demoEmail);
      setPassword(demoPass);
      const user = apiService.login(demoEmail, demoPass);
      setTimeout(() => {
        setIsSubmitting(false);
        onAuthSuccess(user);
      }, 300);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMessage(err instanceof Error ? err.message : 'Login failed');
    }
  };

  // Direct Credentials Submission (No OTP verification required)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (isLogin) {
        if (!email.trim()) throw new Error('Please enter your university email');
        const user = apiService.login(email.trim(), password);
        setTimeout(() => {
          setIsSubmitting(false);
          onAuthSuccess(user);
        }, 300);
      } else {
        if (!name.trim()) throw new Error('Please enter your full name');
        if (!email.trim()) throw new Error('Please enter a valid university email');

        const payload = {
          name: name.trim(),
          email: email.trim(),
          role,
          password: password || 'password123',
          studentId: role === 'student' ? studentId || `STU-2024-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
          course: role === 'student' ? course : undefined,
          department: role === 'student' ? department : organizerClub || 'Student Affairs',
        };

        const user = apiService.signup(payload);
        setTimeout(() => {
          setIsSubmitting(false);
          onAuthSuccess(user);
        }, 300);
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMessage(err instanceof Error ? err.message : 'Authentication failed');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
        
        {/* Brand Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-8 text-center relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400 mx-auto mb-3 shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-200 border border-blue-400/30 mb-2">
            GLA UNIVERSITY MATHURA
          </span>
          <h2 className="text-2xl font-black tracking-tight">EVENTEASE PORTAL</h2>

          <p className="text-xs text-blue-200 mt-1 max-w-sm mx-auto">
            GLA University Mathura &bull; Official Event Management, Leave Templates & QR Attendance
          </p>
        </div>

        {/* Quick Demo Logins Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
            <span>Instant Demo Accounts (One-Click Access):</span>
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Direct Login
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              data-cursor-text="Student Demo"
              onClick={() => handleQuickDemoLogin('aarav.sharma@campus.edu', 'password123')}
              className="p-2.5 rounded-xl border border-blue-200 bg-white hover:bg-blue-50/80 text-left transition-all duration-200 group shadow-2xs hover:shadow-xs hover:border-blue-300 cursor-pointer"
            >
              <div className="flex items-center justify-between text-blue-700 font-bold text-xs mb-0.5">
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span>Student</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-blue-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
              </div>
              <p className="text-[10px] text-slate-500 truncate">Aarav Sharma</p>
            </button>

            <button
              type="button"
              data-cursor-text="Organizer Demo"
              onClick={() => handleQuickDemoLogin('vikram.malhotra@campus.edu', 'password123')}
              className="p-2.5 rounded-xl border border-purple-200 bg-white hover:bg-purple-50/80 text-left transition-all duration-200 group shadow-2xs hover:shadow-xs hover:border-purple-300 cursor-pointer"
            >
              <div className="flex items-center justify-between text-purple-700 font-bold text-xs mb-0.5">
                <div className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span>Organizer</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-purple-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
              </div>
              <p className="text-[10px] text-slate-500 truncate">Dr. Malhotra (CAS)</p>
            </button>

            <button
              type="button"
              data-cursor-text="Admin Demo"
              onClick={() => handleQuickDemoLogin('dean.sterling@campus.edu', 'adminpassword')}
              className="p-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100/80 text-left transition-all duration-200 group shadow-2xs hover:shadow-xs hover:border-rose-300 cursor-pointer"
            >
              <div className="flex items-center justify-between text-slate-900 font-bold text-xs mb-0.5">
                <div className="flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600 group-hover:scale-110 transition-transform" />
                  <span>Admin</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
              </div>
              <p className="text-[10px] text-slate-500 truncate">Dean Sterling</p>
            </button>
          </div>
        </div>

        {/* Main Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Toggle Login vs Signup */}
          <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setErrorMessage(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                isLogin ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setErrorMessage(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                !isLogin ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Role selector for Signup */}
          {!isLogin && (
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Select Your University Role:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    role === 'student'
                      ? 'border-blue-500 bg-blue-50/70 text-blue-900 font-bold ring-2 ring-blue-200'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <UserIcon className="w-4 h-4 text-blue-600" />
                  <span className="text-xs">Student</span>
                  <span className="text-[9px] text-slate-400">Download Leaves</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('organizer')}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    role === 'organizer'
                      ? 'border-purple-500 bg-purple-50/70 text-purple-900 font-bold ring-2 ring-purple-200'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building className="w-4 h-4 text-purple-600" />
                  <span className="text-xs">Organizer</span>
                  <span className="text-[9px] text-slate-400">Upload Forms</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    role === 'admin'
                      ? 'border-slate-800 bg-slate-100 text-slate-900 font-bold ring-2 ring-slate-300'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span className="text-xs">Dean / Admin</span>
                  <span className="text-[9px] text-slate-400">Governance</span>
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Error banner */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">University Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@campus.edu"
                  className="w-full text-xs pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Role specific inputs on signup */}
            {!isLogin && role === 'student' && (
              <div className="space-y-3 pt-1 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Student ID / Roll No</label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="STU-2024-XXXX"
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Course / Program</label>
                    <input
                      type="text"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      placeholder="B.Tech Computer Science"
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Department of Computer Science & Engineering"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
              </div>
            )}

            {!isLogin && role === 'organizer' && (
              <div className="pt-1 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Club / Department Body Name</label>
                <input
                  type="text"
                  value={organizerClub}
                  onChange={(e) => setOrganizerClub(e.target.value)}
                  placeholder="e.g. Robotics & Innovation Club"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              data-cursor-text={isLogin ? 'Sign In' : 'Sign Up'}
              className="group w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 mt-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Create Account & Sign In'}</span>
                  <ArrowRight className="w-4 h-4 text-blue-200 group-hover:text-white group-hover:translate-x-1.5 transition-transform duration-200" />
                </>
              )}
            </button>

          </form>

          {/* Role access breakdown note */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-[11px] text-slate-500 space-y-1">
            <span className="font-bold text-slate-700 block">Role-Isolated Portal Access:</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span><strong>Student Panel:</strong> Access registrations, event QR passes, and downloadable leave applications.</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span><strong>Organizer Panel:</strong> Manage events, upload official leave templates, and track check-ins.</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span><strong>Admin Panel:</strong> Campus governance, analytics, and event approval oversight.</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
