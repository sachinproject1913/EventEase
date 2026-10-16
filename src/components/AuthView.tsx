import React, { useState, useRef, useEffect } from 'react';
import { User, UserRole, DispatchedEmailOtp } from '../types';
import { apiService } from '../services/apiService';
import { 
  ShieldCheck, 
  User as UserIcon, 
  Building, 
  ShieldAlert, 
  ArrowRight, 
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Mail, 
  GraduationCap,
  Key,
  RotateCcw
} from 'lucide-react';

interface Props {
  onAuthSuccess: (user: User) => void;
  defaultMode?: 'login' | 'signup';
}

export const AuthView: React.FC<Props> = ({ onAuthSuccess, defaultMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(defaultMode === 'login');
  const [role, setRole] = useState<UserRole>('student');

  // Multi-step authentication state: 'credentials' | 'otp_verify'
  const [step, setStep] = useState<'credentials' | 'otp_verify'>('credentials');

  // Credentials Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [course, setCourse] = useState('B.Tech Computer Science & Engineering');
  const [department, setDepartment] = useState('Department of Computer Science & Engineering');
  const [organizerClub, setOrganizerClub] = useState('');

  // OTP Verification State
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [activeOtpInfo, setActiveOtpInfo] = useState<DispatchedEmailOtp | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [otpSuccessNotice, setOtpSuccessNotice] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Autofocus first digit box when moving to OTP step
  useEffect(() => {
    if (step === 'otp_verify') {
      setTimeout(() => {
        digitInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  // Quick Demo Logins: Dispatches OTP for that demo persona, prompts for OTP verification
  const handleQuickDemoInitiate = (demoEmail: string, demoPass: string) => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      setEmail(demoEmail);
      setPassword(demoPass);
      const res = apiService.requestLoginOtp(demoEmail, demoPass);
      setActiveOtpInfo({
        email: res.email,
        otp: res.otp,
        action: 'login',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        recipientName: res.user.name
      });
      setOtpDigits(['', '', '', '', '', '']);
      setResendCooldown(45);
      setStep('otp_verify');
      setIsSubmitting(false);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMessage(err instanceof Error ? err.message : 'Login failed');
    }
  };

  // Credentials submission: Sends OTP to email before permitting entry
  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (isLogin) {
        if (!email.trim()) throw new Error('Please enter your university email');
        const res = apiService.requestLoginOtp(email, password);
        setActiveOtpInfo({
          email: res.email,
          otp: res.otp,
          action: 'login',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          recipientName: res.user.name
        });
        setOtpDigits(['', '', '', '', '', '']);
        setResendCooldown(45);
        setStep('otp_verify');
        setIsSubmitting(false);
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

        const res = apiService.requestSignupOtp(payload);
        setActiveOtpInfo({
          email: res.email,
          otp: res.otp,
          action: 'signup',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          recipientName: name
        });
        setOtpDigits(['', '', '', '', '', '']);
        setResendCooldown(45);
        setStep('otp_verify');
        setIsSubmitting(false);
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMessage(err instanceof Error ? err.message : 'Authentication failed');
    }
  };

  // OTP Digit handling
  const handleDigitChange = (index: number, val: string) => {
    setErrorMessage(null);
    // If multiple digits pasted
    const cleanNumbers = val.replace(/\D/g, '');
    if (cleanNumbers.length > 1) {
      const nextDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        if (cleanNumbers[i]) {
          nextDigits[i] = cleanNumbers[i];
        }
      }
      setOtpDigits(nextDigits);
      const nextFocus = Math.min(cleanNumbers.length, 5);
      digitInputRefs.current[nextFocus]?.focus();
      return;
    }

    const singleDigit = cleanNumbers.slice(-1);
    const updated = [...otpDigits];
    updated[index] = singleDigit;
    setOtpDigits(updated);

    if (singleDigit && index < 5) {
      digitInputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      digitInputRefs.current[index - 1]?.focus();
    }
  };

  const handleDigitPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const nextDigits = [...otpDigits];
    for (let i = 0; i < pasted.length; i++) {
      nextDigits[i] = pasted[i];
    }
    setOtpDigits(nextDigits);
    const focusIdx = Math.min(pasted.length, 5);
    digitInputRefs.current[focusIdx]?.focus();
  };

  // Verify OTP and complete authentication
  const handleVerifyOtpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    const enteredCode = otpDigits.join('');

    if (enteredCode.length < 6) {
      setErrorMessage('Please enter the full 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await apiService.verifyOtp(email, enteredCode, isLogin ? 'login' : 'signup');
      setOtpSuccessNotice(`Verification successful! Accessing ${user.name}'s ${user.role} portal...`);
      setTimeout(() => {
        setIsSubmitting(false);
        onAuthSuccess(user);
      }, 500);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMessage(err instanceof Error ? err.message : 'Verification failed');
    }
  };

  // Resend OTP
  const handleResendOtp = () => {
    if (resendCooldown > 0) return;
    setErrorMessage(null);
    try {
      const res = apiService.resendOtp(email, isLogin ? 'login' : 'signup');
      setActiveOtpInfo({
        email: res.email,
        otp: res.otp,
        action: isLogin ? 'login' : 'signup',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        recipientName: name || 'GLA University Member'
      });
      setOtpDigits(['', '', '', '', '', '']);
      setResendCooldown(60);
      setOtpSuccessNotice(`A fresh 6-digit OTP code has been dispatched to ${email}.`);
      setTimeout(() => setOtpSuccessNotice(null), 4000);
      digitInputRefs.current[0]?.focus();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to resend code');
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

          {/* Stepper indicator */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              step === 'credentials' ? 'bg-blue-500 text-white shadow-xs' : 'bg-blue-900/60 text-blue-300'
            }`}>
              <span>1</span>
              <span>Credentials</span>
            </div>
            <span className="text-blue-400 text-xs">&rarr;</span>
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              step === 'otp_verify' ? 'bg-emerald-500 text-white shadow-xs' : 'bg-blue-900/60 text-blue-300'
            }`}>
              <span>2</span>
              <span>Email OTP Verification</span>
            </div>
          </div>
        </div>

        {/* STEP 1: CREDENTIALS (LOGIN / SIGNUP) */}
        {step === 'credentials' && (
          <>
            {/* Quick Demo Logins Bar */}
            <div className="bg-slate-50 border-b border-slate-200 p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
                <span>Instant Demo Accounts (Dispatches Test OTP):</span>
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Ready to test
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  data-cursor-text="Student Demo"
                  onClick={() => handleQuickDemoInitiate('aarav.sharma@campus.edu', 'password123')}
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
                  onClick={() => handleQuickDemoInitiate('vikram.malhotra@campus.edu', 'password123')}
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
                  onClick={() => handleQuickDemoInitiate('dean.sterling@campus.edu', 'adminpassword')}
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

            {/* Toggle Login vs Signup */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => { setIsLogin(true); setErrorMessage(null); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    isLogin ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Sign In with Email OTP
                </button>
                <button
                  type="button"
                  onClick={() => { setIsLogin(false); setErrorMessage(null); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    !isLogin ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Create Account with OTP
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
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                
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
                  data-cursor-text="Get OTP Code"
                  className="group w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 mt-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Dispatching Verification OTP...</span>
                  ) : (
                    <>
                      <span>{isLogin ? 'Send Email OTP to Sign In' : 'Send Email OTP to Register'}</span>
                      <ArrowRight className="w-4 h-4 text-blue-200 group-hover:text-white group-hover:translate-x-1.5 transition-transform duration-200" />
                    </>
                  )}
                </button>

              </form>

              {/* Role access breakdown note */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-[11px] text-slate-500 space-y-1">
                <span className="font-bold text-slate-700 block">Strict Separation of Panels & Role-Isolated Data:</span>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Student Panel:</strong> Only sees their own registrations, passes, and personal leave forms.</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span><strong>Organizer Panel:</strong> Only sees and manages events & attendees created by their club.</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span><strong>Admin Panel:</strong> Master campus oversight, can view and delete all entities across the university.</span>
                </div>
              </div>

            </div>
          </>
        )}

        {/* STEP 2: EMAIL OTP VERIFICATION SCREEN */}
        {step === 'otp_verify' && (
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Header info */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center mx-auto shadow-xs">
                <Key className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Email Verification Required</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                We dispatched a secure 6-digit one-time password (OTP) to:
                <br />
                <span className="font-bold text-slate-800 font-mono text-sm">{email}</span>
              </p>
            </div>

            {/* Secure Email Delivery Status (No OTP exposed on-screen) */}
            <div className="bg-slate-50/90 rounded-2xl border border-slate-200 p-4 text-center space-y-2 shadow-2xs">
              <div className="inline-flex items-center gap-2 text-indigo-700 font-bold text-xs bg-indigo-50 px-3.5 py-1.5 rounded-full border border-indigo-200">
                <Mail className="w-3.5 h-3.5 text-indigo-600" />
                <span>Verification OTP Sent to Available Email</span>
              </div>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                An authentication code has been dispatched to your email: <strong className="text-slate-900 font-mono">{email}</strong>
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Please check your inbox (including promotions, spam, or junk folder) and enter the 6-digit code below to access your portal.
              </p>
            </div>

            {/* Error or Success notification */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {otpSuccessNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{otpSuccessNotice}</span>
              </div>
            )}

            {/* 6-Digit Code Inputs */}
            <form onSubmit={handleVerifyOtpSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 text-center mb-3 uppercase tracking-wider">
                  Enter 6-Digit Verification Code
                </label>
                <div className="flex justify-center items-center gap-2 sm:gap-3">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => {
                        digitInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleDigitChange(idx, e.target.value)}
                      onKeyDown={e => handleDigitKeyDown(idx, e)}
                      onPaste={handleDigitPaste}
                      className={`w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl sm:text-2xl font-black rounded-xl border transition-all duration-150 focus:outline-hidden ${
                        digit 
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 shadow-xs ring-2 ring-indigo-200' 
                          : 'border-slate-300 bg-slate-50 text-slate-800 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <button
                  type="submit"
                  disabled={isSubmitting || otpDigits.join('').length < 6}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 active:scale-[0.98] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Verifying Code & Authenticating...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-indigo-200" />
                      <span>{isLogin ? 'Verify OTP & Log In' : 'Verify OTP & Complete Account Setup'}</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('credentials');
                      setErrorMessage(null);
                      setOtpDigits(['', '', '', '', '', '']);
                    }}
                    className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Change Email / Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0}
                    className={`font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                      resendCooldown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-800'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>
                      {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend OTP Code'}
                    </span>
                  </button>
                </div>
              </div>
            </form>

          </div>
        )}

      </div>
    </div>
  );
};
