import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Building2, Shield, User, LogOut, GraduationCap, Sparkles } from 'lucide-react';

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const isAdmin = role === 'owner';

  return (
    <header className={`no-print sticky top-0 z-40 backdrop-blur-md border-b px-4 lg:px-8 py-3.5 flex items-center justify-between transition-colors ${
      isAdmin 
        ? 'bg-slate-900/95 border-amber-500/30' 
        : 'bg-slate-900/95 border-emerald-500/30'
    }`}>
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform ${
          isAdmin 
            ? 'bg-gradient-to-br from-amber-500 via-orange-600 to-indigo-600 shadow-orange-500/25' 
            : 'bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-600 shadow-teal-500/25'
        }`}>
          {isAdmin ? (
            <Building2 className="w-5 h-5 text-white" />
          ) : (
            <GraduationCap className="w-5 h-5 text-white" />
          )}
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <span>Sakhare Plot Hostel</span>
            {isAdmin ? (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Shield className="w-3 h-3" /> OWNER ADMIN CONTROL PANEL
              </span>
            ) : (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <GraduationCap className="w-3 h-3" /> STUDENT RESIDENTIAL PORTAL
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            {isAdmin 
              ? 'Hostel Owner & Admin: Sandeep Sakhare' 
              : `Logged in Resident: ${user?.name || 'Student Resident'}`}
          </p>
        </div>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center gap-3">
        {/* Active User Profile Badge */}
        {user && (
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white ${
              isAdmin 
                ? 'bg-gradient-to-tr from-amber-500 to-indigo-600 shadow-md shadow-orange-500/20' 
                : 'bg-gradient-to-tr from-emerald-500 to-teal-600 shadow-md shadow-teal-500/20'
            }`}>
              {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </div>
            
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-100 leading-tight">{user.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {isAdmin ? (
                  <span className="text-[10px] font-semibold text-amber-400 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Owner (Admin)
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                    <User className="w-3 h-3" /> Student Resident
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors ml-2 border border-slate-800"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
