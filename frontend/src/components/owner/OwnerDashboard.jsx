import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../services/api';
import { 
  Users, 
  BedDouble, 
  IndianRupee, 
  Wrench, 
  CalendarCheck, 
  TrendingUp, 
  AlertCircle, 
  Plus, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function OwnerDashboard({ setActiveTab }) {
  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const summaryPromise = fetchApi('/students/stats/summary').catch(() => null);
      const complaintsPromise = fetchApi('/complaints').catch(() => ({ complaints: [] }));
      const leavesPromise = fetchApi('/leaves').catch(() => ({ leaves: [] }));

      const [summary, complaintsRes, leavesRes] = await Promise.all([
        summaryPromise,
        complaintsPromise,
        leavesPromise
      ]);

      const defaultStats = {
        totalStudents: 0,
        occupiedBeds: 0,
        vacantBeds: 15,
        totalCapacity: 15,
        collectedRevenue: 0,
        pendingRevenue: 0,
        pendingComplaints: 0,
        pendingLeaves: 0
      };

      setStats(summary || defaultStats);
      setRecentComplaints(complaintsRes?.complaints ? complaintsRes.complaints.slice(0, 4) : []);
      setRecentLeaves(leavesRes?.leaves ? leavesRes.leaves.filter(l => l.status === 'Pending' || l.status === 'pending').slice(0, 4) : []);
    } catch (err) {
      console.error('Failed loading dashboard data:', err);
      setStats({
        totalStudents: 0,
        occupiedBeds: 0,
        vacantBeds: 15,
        totalCapacity: 15,
        collectedRevenue: 0,
        pendingRevenue: 0,
        pendingComplaints: 0,
        pendingLeaves: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="p-8 flex items-center justify-center text-slate-400 text-sm">
        Loading Owner Analytics Dashboard...
      </div>
    );
  }

  // Data for Recharts Bar Chart
  const revenueChartData = [
    { month: 'May 2026', Collected: 31500, Pending: 0 },
    { month: 'June 2026', Collected: 33000, Pending: 0 },
    { month: 'July 2026', Collected: stats.collectedRevenue || 19500, Pending: stats.pendingRevenue || 6500 },
    { month: 'Aug 2026 (Est.)', Collected: 0, Pending: 32500 }
  ];

  // Data for Pie Chart (Bed Occupancy)
  const occupancyPieData = [
    { name: 'Occupied Beds', value: stats.occupiedBeds || 5, color: '#6366f1' },
    { name: 'Vacant Beds', value: stats.vacantBeds || 10, color: '#10b981' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/60 border border-indigo-800/30">
        <div>
          <h2 className="text-xl font-extrabold text-white">Owner Overview Dashboard</h2>
          <p className="text-xs text-slate-400 mt-1">Real-time stats for Sakhare Plot Hostel occupancy, payments, and tickets.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('students')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" /> Add Student
          </button>
          <button
            onClick={() => setActiveTab('rooms')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all border border-slate-700"
          >
            Manage Rooms
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Students */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Students</p>
            <p className="text-2xl font-extrabold text-white mt-1">{stats.totalStudents}</p>
            <p className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Registered
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Vacant Beds */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Vacant Beds</p>
            <p className="text-2xl font-extrabold text-emerald-400 mt-1">{stats.vacantBeds}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Out of {stats.totalCapacity} Total</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <BedDouble className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Monthly Collected Revenue */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Fees Collected</p>
            <p className="text-2xl font-extrabold text-white mt-1">₹{stats.collectedRevenue?.toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-emerald-400 mt-0.5">Cleared Dues</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Unresolved Complaints */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Open Complaints</p>
            <p className="text-2xl font-extrabold text-amber-400 mt-1">{stats.pendingComplaints}</p>
            <p className="text-[11px] text-amber-400/80 mt-0.5">Action Required</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        {/* Card 5: Pending Leaves */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pending Leaves</p>
            <p className="text-2xl font-extrabold text-purple-400 mt-1">{stats.pendingLeaves}</p>
            <p className="text-[11px] text-purple-400/80 mt-0.5">Awaiting Review</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <CalendarCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Monthly Rent Collection Breakdown</h3>
              <p className="text-xs text-slate-400">Collected vs. Pending Dues Comparison</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="Collected" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pending" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Occupancy Donut Chart */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Hostel Bed Occupancy Rate</h3>
            <p className="text-xs text-slate-400">Occupied vs Available Capacity</p>
          </div>

          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={occupancyPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {occupancyPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-indigo-950/40 border border-indigo-800/40">
              <span className="text-slate-400 block text-[10px]">OCCUPIED</span>
              <span className="font-extrabold text-indigo-400 text-sm">{stats.occupiedBeds} Beds</span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
              <span className="text-slate-400 block text-[10px]">VACANT</span>
              <span className="font-extrabold text-emerald-400 text-sm">{stats.vacantBeds} Beds</span>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Activity Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Active Complaints */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400" /> Active Maintenance Complaints
            </h3>
            <button onClick={() => setActiveTab('complaints')} className="text-xs text-indigo-400 font-semibold hover:underline">
              View All
            </button>
          </div>

          <div className="space-y-3">
            {recentComplaints.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No active complaints logged.</p>
            ) : (
              recentComplaints.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{item.title}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        item.priority === 'Emergency' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {item.priority}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">By {item.student_name} (Room #{item.room_number || 'N/A'})</p>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-semibold ${
                    item.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Pending Leave Requests */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-purple-400" /> Pending Leave Applications
            </h3>
            <button onClick={() => setActiveTab('leaves')} className="text-xs text-indigo-400 font-semibold hover:underline">
              View All
            </button>
          </div>

          <div className="space-y-3">
            {recentLeaves.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No pending leave applications.</p>
            ) : (
              recentLeaves.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">{item.student_name}</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">{item.reason} ({item.start_date} to {item.end_date})</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('leaves')}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white font-semibold text-[11px] transition-colors"
                  >
                    Review
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
