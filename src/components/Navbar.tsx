import React from 'react';
import { User } from '../types';
import { 
  ShieldCheck, 
  RotateCcw, 
  LogOut,
  ShieldAlert,
  GraduationCap,
  Building,
  Server,
  Database,
  ChevronDown
} from 'lucide-react';

interface Props {
  currentUser: User | null;
  onSwitchUser: (userId: string) => void;
  onOpenProfileEdit: () => void;
  onResetData: () => void;
  onLogout: () => void;
  onOpenSpecs: () => void;
  onOpenSupabase: () => void;
}

export const Navbar: React.FC<Props> = ({
  currentUser,
  onSwitchUser,
  onOpenProfileEdit: _onOpenProfileEdit,
  onResetData,
  onLogout,
  onOpenSpecs,
  onOpenSupabase
}) => {
  const role = currentUser?.role;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 backdrop-blur-md bg-white/95 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Dedicated Panel Identifier */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${
              role === 'admin' 
                ? 'bg-gradient-to-tr from-slate-900 to-rose-700 shadow-rose-900/20' 
                : role === 'organizer' 
                ? 'bg-gradient-to-tr from-purple-700 to-indigo-600 shadow-purple-600/20' 
                : 'bg-gradient-to-tr from-blue-700 to-indigo-600 shadow-blue-500/20'
            }`}>
              {role === 'admin' ? (
                <ShieldAlert className="w-5 h-5" />
              ) : role === 'organizer' ? (
                <Building className="w-5 h-5" />
              ) : (
                <GraduationCap className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-slate-900">
                  CAMPUSGUARD
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase bg-blue-50 text-blue-800 border border-blue-200">
                  GLA UNIVERSITY MATHURA
                </span>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  role === 'admin' 
                    ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                    : role === 'organizer' 
                    ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {role === 'admin' ? 'Admin Panel' : role === 'organizer' ? 'Organizer Panel' : 'User / Student Panel'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">
                GLA University Mathura &bull; {role === 'admin' 
                  ? 'University Governance & Master Attendance Audit' 
                  : role === 'organizer' 
                  ? 'Event Management & Leave Form Upload Console' 
                  : 'Event Discovery & QR-Verified Leave Downloads'}
              </p>
            </div>
          </div>

          {/* Right Header Controls: Persona Switcher, Backend Specs, and Logout */}
          <div className="flex items-center gap-2.5">
            
            {/* Supabase Database Connection & Schema Shortcut */}
            <button
              onClick={onOpenSupabase}
              title="Connect Supabase Database & Copy Schema Query"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 rounded-xl font-bold shadow-2xs transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Supabase DB</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </button>

            {/* Backend Specs Shortcut */}
            <button
              onClick={onOpenSpecs}
              title="Inspect Java Spring Boot & MySQL Specs"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl font-semibold transition-colors"
            >
              <Server className="w-3.5 h-3.5 text-blue-600" />
              <span>Spring Boot & DB</span>
            </button>

            {currentUser && (
              <>
                {/* Persona Switcher Dropdown */}
                <div className="relative flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
                  <label htmlFor="persona-select" className="sr-only">Switch User Persona</label>
                  <div className="flex items-center gap-2 pl-2 pr-1">
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      className="w-7 h-7 rounded-full object-cover border border-slate-300"
                    />
                    <div className="text-left hidden xl:block pr-1">
                      <div className="text-xs font-bold text-slate-800 leading-tight">
                        {currentUser.name}
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                        {currentUser.role === 'admin' ? 'Dean / Admin' : currentUser.role === 'organizer' ? 'Organizer' : 'Student'}
                      </div>
                    </div>
                  </div>

                  <select
                    id="persona-select"
                    value={currentUser.id}
                    onChange={(e) => onSwitchUser(e.target.value)}
                    className="text-xs font-bold bg-white text-slate-800 py-1.5 pl-2.5 pr-6 rounded-xl border border-slate-200 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500 appearance-none"
                  >
                    <optgroup label="Student Panel (Download Only)">
                      <option value="stu-101">Aarav Sharma (Student - Complete)</option>
                      <option value="stu-102">Sneha Patel (Student - Incomplete Profile)</option>
                    </optgroup>
                    <optgroup label="Organizer Panel (Upload & Manage)">
                      <option value="org-201">Dr. Vikram Malhotra (CAS Organizer)</option>
                      <option value="org-202">Prof. Priya Nair (Career Organizer)</option>
                    </optgroup>
                    <optgroup label="Admin Panel (Governance & Audits)">
                      <option value="adm-001">Dean Robert Sterling (Dean / Admin)</option>
                    </optgroup>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
                </div>

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  title="Log out of panel"
                  className="px-3 py-1.5 text-xs text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 rounded-xl transition-colors font-bold flex items-center gap-1.5 shadow-2xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}

            {/* Reset Demo Data Button */}
            <button
              onClick={onResetData}
              title="Reset Sample Data to Default State"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
