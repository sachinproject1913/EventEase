import React from 'react';
import { User } from '../types';
import { 
  LogOut,
  ShieldAlert,
  GraduationCap,
  Building,
  Server,
  Database,
  RotateCcw,
  ArrowUpRight,
  MousePointer2
} from 'lucide-react';

interface Props {
  currentUser: User | null;
  onSwitchUser: (userId: string) => void;
  onOpenProfileEdit: () => void;
  onResetData: () => void;
  onLogout: () => void;
  onOpenSpecs: () => void;
  onOpenSupabase: () => void;
  isCursorActive?: boolean;
  onToggleCursor?: () => void;
}


export const Navbar: React.FC<Props> = ({
  currentUser,
  onSwitchUser: _onSwitchUser,
  onOpenProfileEdit: _onOpenProfileEdit,
  onResetData,
  onLogout,
  onOpenSpecs,
  onOpenSupabase,
  isCursorActive = true,
  onToggleCursor
}) => {
  const role = currentUser?.role;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs w-full">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 md:py-0">
        
        {/* Desktop Layout: Clean single horizontal row */}
        {/* Mobile Layout: Two stacked responsive rows to prevent crowding */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between md:h-16 gap-2 md:gap-4">
          
          {/* Top Row on Mobile / Left Section on Desktop: Branding & University Identification */}
          <div className="flex items-center justify-between md:justify-start gap-2.5 sm:gap-3 shrink-0 min-w-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 group cursor-pointer" data-cursor-text="GLA Portal">
              {/* Logo Icon with subtle hover tilt */}
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 group-hover:rotate-1 transition-transform duration-300 ${
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

              {/* Branding Titles & Badges */}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="text-lg sm:text-xl font-black tracking-tight bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-700 bg-clip-text text-transparent shrink-0 flex items-center gap-1 drop-shadow-xs group-hover:brightness-110 transition-all duration-300">
                    EventEase
                    <ArrowUpRight className="w-4 h-4 text-indigo-600 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                  </span>

                  <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-md font-extrabold uppercase bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
                    GLA UNIVERSITY MATHURA
                  </span>
                  <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                    role === 'admin' 
                      ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                      : role === 'organizer' 
                      ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {role === 'admin' ? 'Admin Panel' : role === 'organizer' ? 'Organizer Panel' : 'Student Panel'}
                  </span>

                  <button
                    onClick={onOpenSupabase}
                    title="Live Supabase Cloud Connected: bzdhuperkoycgtcfzflw"
                    data-cursor-text="Supabase DB"
                    className="hidden xl:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-colors shadow-2xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-mono">bzdhuperkoycgtcfzflw</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 font-medium hidden md:block truncate">
                  GLA University Mathura &bull; {role === 'admin' 
                    ? 'University Governance & Master Attendance Audit' 
                    : role === 'organizer' 
                    ? 'Event Management & Leave Form Upload Console' 
                    : 'Event Discovery & QR-Verified Leave Downloads'}
                </p>
              </div>
            </div>

            {/* Mobile Utility Shortcut (Supabase & Reset) in Row 1 */}
            <div className="flex items-center gap-1.5 md:hidden shrink-0">
              {onToggleCursor && (
                <button
                  onClick={onToggleCursor}
                  title="Toggle Animated Mouse Arrow Follower"
                  className={`p-1.5 rounded-lg text-xs border ${
                    isCursorActive ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                  }`}
                >
                  <MousePointer2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={onOpenSupabase}
                title="Connect Supabase Database"
                className="p-1.5 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs"
              >
                <Database className="w-3.5 h-3.5 text-emerald-600" />
              </button>
              <button
                onClick={onResetData}
                title="Reset Sample Data"
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-lg text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Desktop Right Controls / Mobile Row 2: Account Dropdown & Logout Button */}
          <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-2.5 pt-1.5 md:pt-0 border-t border-slate-100 md:border-none min-w-0">
            
            {/* Desktop Only Utility Buttons with animated hover linking arrows */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              
              {/* Interactive Cursor Toggle */}
              {onToggleCursor && (
                <button
                  onClick={onToggleCursor}
                  data-cursor-text={isCursorActive ? 'Disable FX' : 'Enable FX'}
                  title={isCursorActive ? 'Animated Cursor Active (Click to toggle)' : 'Enable Animated Mouse Arrow Cursor'}
                  className={`group flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-xl font-bold border transition-all duration-200 active:scale-95 ${
                    isCursorActive 
                      ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 shadow-2xs' 
                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <MousePointer2 className={`w-3.5 h-3.5 transition-transform duration-200 ${isCursorActive ? 'text-blue-600 rotate-12 scale-110' : 'text-slate-400'}`} />
                  <span className="hidden xl:inline">Cursor FX</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${isCursorActive ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`} />
                </button>
              )}

              <button
                onClick={onOpenSupabase}
                data-cursor-text="Connect DB"
                title="Connect Supabase Database & Copy Schema Query"
                className="group flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 rounded-xl font-bold shadow-2xs transition-all duration-200 hover:border-emerald-400 active:scale-95"
              >
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden lg:inline">Supabase DB</span>
                <ArrowUpRight className="w-3 h-3 text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
              </button>

              <button
                onClick={onOpenSpecs}
                data-cursor-text="Spring Specs"
                title="Inspect Java Spring Boot & MySQL Specs"
                className="group hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl font-semibold transition-all duration-200 hover:border-slate-300 active:scale-95"
              >
                <Server className="w-3.5 h-3.5 text-blue-600" />
                <span>Spring Boot & DB</span>
                <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
              </button>
            </div>

            {currentUser && (
              <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end min-w-0">
                {/* User Account Info showing Complete User Name and Role */}
                <div 
                  className="relative flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200 min-w-0 flex-1 md:flex-initial"
                >
                  <div className="flex items-center gap-2 px-1.5 min-w-0">
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-slate-300 shrink-0"
                    />
                    <div className="text-left min-w-0 leading-tight pr-1">
                      <div className="text-xs font-bold text-slate-800 truncate max-w-[140px] xs:max-w-[180px] sm:max-w-[220px]">
                        {currentUser.name}
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold truncate">
                        {currentUser.role === 'admin' ? 'Dean / Admin' : currentUser.role === 'organizer' ? 'Organizer' : 'Student'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Logout Button: Kept Together with Account Dropdown, with animated hover arrow */}
                <button
                  onClick={onLogout}
                  data-cursor-text="Exit"
                  title="Log out of panel"
                  className="group px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 active:bg-rose-700 border border-rose-200 hover:border-rose-600 rounded-xl transition-all duration-200 font-bold flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0 group-hover:-translate-x-0.5 transition-transform" />
                  <span className="inline font-bold">Logout</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
                </button>
              </div>
            )}

            {/* Desktop Reset Demo Data Button */}
            <button
              onClick={onResetData}
              data-cursor-text="Reset DB"
              title="Reset Sample Data to Default State"
              className="group hidden md:flex p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
            >
              <RotateCcw className="w-4 h-4 group-hover:-rotate-90 transition-transform duration-300" />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};

