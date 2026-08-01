import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  BedDouble, 
  CreditCard, 
  Wrench, 
  CalendarCheck, 
  Bell, 
  ChevronRight 
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { role } = useAuth();

  const ownerNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Student Directory', icon: Users },
    { id: 'rooms', label: 'Rooms & Beds', icon: BedDouble },
    { id: 'payments', label: 'Fees & Receipts', icon: CreditCard },
    { id: 'complaints', label: 'Complaints', icon: Wrench },
    { id: 'leaves', label: 'Leave Requests', icon: CalendarCheck },
    { id: 'notices', label: 'Notice Board', icon: Bell },
  ];

  const studentNavItems = [
    { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { id: 'payments', label: 'Fee Status & Receipts', icon: CreditCard },
    { id: 'complaints', label: 'Maintenance Tickets', icon: Wrench },
    { id: 'leaves', label: 'Leave & Outings', icon: CalendarCheck },
    { id: 'notices', label: 'Notice Board', icon: Bell },
  ];

  const isOwner = role === 'owner' || role === 'admin';
  const navItems = isOwner ? ownerNavItems : studentNavItems;

  return (
    <aside className="no-print w-64 bg-slate-900/60 border-r border-slate-800/80 p-4 flex flex-col justify-between min-h-[calc(100vh-65px)]">
      <div className="space-y-6">
        {/* Navigation Section Title */}
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            {isOwner ? 'Owner Control Center' : 'Student Portal'}
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-200" />}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Hostel Info Widget Footer */}
      <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 text-xs">
        <p className="font-bold text-slate-300">Sakhare Plot Hostel</p>
        <p className="text-[11px] text-slate-500 mt-0.5">24/7 Security & Support</p>
        <p className="text-[11px] text-indigo-400 font-mono mt-1">+91 89835 35847</p>
      </div>
    </aside>
  );
}
