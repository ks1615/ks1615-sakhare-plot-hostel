import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Building2, Shield, User, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, role, logout } = useAuth();

  return (
    <header className="no-print sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <span>Sakhare Plot Hostel</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Official Portal
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">Hostel Owner & Admin: Sandeep Sakhare</p>
        </div>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center gap-3">
        {/* Active User Profile Badge */}
        {user && (
          <div className="flex items-center gap-2.5">
            <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center font-bold text-xs text-white ${
              role === 'owner' 
                ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-sm shadow-purple-500/30' 
                : 'bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-sm shadow-emerald-500/30'
            }`}>
              {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </div>
            
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-100 leading-tight">{user.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {role === 'owner' ? (
                  <span className="text-[10px] font-semibold text-purple-400 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Owner (Admin)
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                    <User className="w-3 h-3" /> Student
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
