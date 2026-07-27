const { useState, useEffect, useMemo } = React;

// Main HostelFlow Application Component
function App() {
  const [theme, setTheme] = useState(localStorage.getItem('hf_theme') || 'dark');
  const [token, setToken] = useState(localStorage.getItem('hf_token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('hf_user') || 'null'));
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // App State Data
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [lightBills, setLightBills] = useState([]);
  const [parkingSlots, setParkingSlots] = useState([]);
  const [gateLogs, setGateLogs] = useState([]);
  const [rules, setRules] = useState([]);
  const [settings, setSettings] = useState({
    hostelName: 'Sakhare Plot Hostel',
    upiId: '9322465627@ybl',
    gateClosingTime: '22:00',
    gateStatus: 'OPEN'
  });

  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Modals state
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [showLightBillModal, setShowLightBillModal] = useState(false);
  const [showGateLogModal, setShowGateLogModal] = useState(false);
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [selectedStudentLedger, setSelectedStudentLedger] = useState(null);
  const [viewDocStudent, setViewDocStudent] = useState(null);
  const [showSubmitPaymentModal, setShowSubmitPaymentModal] = useState(false);

  // Helper API fetch
  const apiFetch = async (url, options = {}) => {
    let targetUrl = url;
    if (!url.startsWith('http')) {
      const baseUrl = (window.location.protocol === 'file:' || window.location.port !== '5000')
        ? 'http://localhost:5000'
        : '';
      targetUrl = `${baseUrl}${url}`;
    }

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    };
    try {
      const res = await fetch(targetUrl, { ...options, headers });
      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (jsonErr) {
        throw new Error('Backend server at http://localhost:5000 returned non-JSON response.');
      }
      if (!res.ok) {
        if (res.status === 401 && url !== '/api/auth/login') {
          handleLogout();
          throw new Error('Session expired. Please sign in again.');
        }
        throw new Error(data.error || 'Server error occurred');
      }
      return data;
    } catch (err) {
      const isNetworkOrJsonError = err.name === 'TypeError' || err.message.includes('fetch') || err.message.includes('Failed to fetch') || err.message.includes('JSON') || err.message.includes('non-JSON');
      const errorMessage = isNetworkOrJsonError
        ? 'Cannot connect to backend server. Please verify node server.js is running at http://localhost:5000'
        : (err.message || 'Network or server error');
      showToast(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Toggle Dark/Light Mode
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('hf_theme', theme);
  }, [theme]);

  // Load App Data on Login
  const fetchAllData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [stData, payData, lbData, pkData, gtData, rlData] = await Promise.all([
        apiFetch('/api/students'),
        apiFetch('/api/payments'),
        apiFetch('/api/lightbill'),
        apiFetch('/api/parking'),
        apiFetch('/api/gate'),
        apiFetch('/api/rules')
      ]);
      setStudents(stData.students || []);
      setPayments(payData.payments || []);
      setLightBills(lbData.lightBills || []);
      setParkingSlots(pkData.parkingSlots || []);
      setGateLogs(gtData.gateLogs || []);
      setRules(rlData.rules || []);
      if (gtData.settings) {
        setSettings(prev => ({ ...prev, ...gtData.settings }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAllData();
    }
  }, [token]);

  // Handle Login
  const handleLogin = async (email, password) => {
    const cleanEmail = (email || '').trim();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail || !cleanPassword) {
      const err = 'Please enter both email and password';
      setLoginError(err);
      showToast(err, 'error');
      return;
    }

    setLoginError(null);
    setLoginLoading(true);

    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword })
      });
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('hf_token', data.token);
      localStorage.setItem('hf_user', JSON.stringify(data.user));
      showToast(`Welcome back, ${data.user.name}!`);
    } catch (e) {
      setLoginError(e.message || 'Invalid email or password credentials');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('hf_token');
    localStorage.removeItem('hf_user');
  };

  // Quick Stats
  const stats = useMemo(() => {
    const totalCollected = payments
      .filter(p => p.status === 'confirmed')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const pendingConfirmations = payments.filter(p => p.status === 'pending_owner');
    const pendingConfirmAmount = pendingConfirmations.reduce((sum, p) => sum + (p.amount || 0), 0);
    const activeStudents = students.filter(s => s.status === 'active').length;
    const occupiedParking = parkingSlots.filter(p => p.status === 'occupied').length;
    const today = new Date().toISOString().split('T')[0];
    const todayLateEntries = gateLogs.filter(g => g.date === today && g.status === 'late').length;

    return {
      totalCollected,
      pendingConfirmationsCount: pendingConfirmations.length,
      pendingConfirmAmount,
      activeStudents,
      occupiedParking,
      totalParking: parkingSlots.length || 8,
      todayLateEntries
    };
  }, [students, payments, parkingSlots, gateLogs]);

  // If not logged in, render sleek Login Page
  if (!token || !user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Toast Notification Container */}
        {toast && (
          <div className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-medium flex items-center space-x-3 transition-all ${
            toast.type === 'error' ? 'bg-rose-600 text-white' :
            toast.type === 'info' ? 'bg-blue-600 text-white' :
            'bg-emerald-600 text-white'
          }`}>
            <span>{toast.message}</span>
          </div>
        )}

        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-4 shadow-lg shadow-indigo-500/10">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0v-4m0 4h4" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold font-display bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">Sakhare Plot</h1>
            <p className="text-slate-400 text-sm mt-1">Smart Hostel Management & Owner Portal</p>
          </div>

          {loginError && (
            <div className="mb-6 p-4 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-200 text-xs flex items-center space-x-3">
              <svg className="w-5 h-5 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={(e) => {
            e.preventDefault();
            const email = e.target.email.value;
            const password = e.target.password.value;
            handleLogin(email, password);
          }} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Email / Room ID</label>
              <input
                type="text"
                name="email"
                required
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                placeholder="kskrushna1615@gmail.com or room01"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                name="password"
                required
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40 transition-all text-sm flex items-center justify-center space-x-2"
            >
              <span>{loginLoading ? 'Signing In...' : 'Sign In to Dashboard'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </form>

          {/* Room Student Login Credentials Helper */}
          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <details className="cursor-pointer text-left text-[11px] text-slate-400 bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
              <summary className="font-semibold text-indigo-400 select-none flex items-center justify-between">
                <span>🔑 Room Student Accounts (Room 01 - 08)</span>
                <span className="text-[10px] text-slate-500 font-normal">Click to view</span>
              </summary>
              <div className="mt-2 space-y-1.5 font-mono text-[10px] text-slate-300 grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-700/50">
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">R01: <b className="text-white">room01</b> / <b className="text-emerald-400">ONEROOM</b></div>
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">R02: <b className="text-white">room02</b> / <b className="text-emerald-400">TWOROOM</b></div>
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">R03: <b className="text-white">room03</b> / <b className="text-emerald-400">THREEROOM</b></div>
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">R04: <b className="text-white">room04</b> / <b className="text-emerald-400">FOURROOM</b></div>
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">R05: <b className="text-white">room05</b> / <b className="text-emerald-400">FIVEROOM</b></div>
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">R06: <b className="text-white">room06</b> / <b className="text-emerald-400">SIXROOM</b></div>
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">R07: <b className="text-white">room07</b> / <b className="text-emerald-400">SEVENROOM</b></div>
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">R08: <b className="text-white">room08</b> / <b className="text-emerald-400">EIGHTROOM</b></div>
              </div>
            </details>
          </div>

          {/* Footer Credit */}
          <div className="mt-4 text-center text-xs text-slate-400">
            Created by <span className="text-indigo-400 font-bold">Krushna Sakhare</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row light:bg-slate-100 light:text-slate-900 transition-colors duration-200">

      {/* Toast Notification Container */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-medium flex items-center space-x-3 transition-all ${toast.type === 'error' ? 'bg-rose-600 text-white' :
            toast.type === 'info' ? 'bg-blue-600 text-white' :
              'bg-emerald-600 text-white'
          }`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-900/90 border-r border-slate-800 backdrop-blur-xl flex flex-col justify-between transition-transform duration-300 light:bg-white light:border-slate-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
        <div>
          {/* Logo & Hostel Name Header */}
          <div className="p-6 border-b border-slate-800 light:border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
                SP
              </div>
              <div>
                <h2 className="font-bold font-display text-base leading-tight text-white light:text-slate-900">Sakhare Plot</h2>
                <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{user.hostelName || 'Sakhare Plot Hostel'}</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
              { id: 'students', label: 'Students & Docs', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
              { id: 'payments', label: 'Payment QR & Confirmation', badge: stats.pendingConfirmationsCount, icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
              { id: 'lightbill', label: 'Electricity / Light Bill', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
              { id: 'parking', label: 'Bike Parking Matrix', icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1' },
              { id: 'gate', label: 'Gate Closing & Curfew', badge: stats.todayLateEntries > 0 ? `${stats.todayLateEntries} Late` : null, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
              { id: 'rules', label: 'Rules & Regulations', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${activeTab === item.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 light:text-slate-600 light:hover:bg-slate-100'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                  </svg>
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
        </div>

        {/* Profile Card & Logout */}
        <div className="p-4 border-t border-slate-800 light:border-slate-200">
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 light:bg-slate-100 light:border-slate-200 mb-3 flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs uppercase ${user.role === 'admin' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                }`}>
                {user.role === 'admin' ? '👑' : '👮'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white light:text-slate-900 truncate">{user.name}</p>
                <span className={`inline-block text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase ${user.role === 'admin' ? 'bg-amber-500/20 text-amber-300' : 'bg-indigo-500/20 text-indigo-300'
                  }`}>
                  {user.role === 'admin' ? 'Hostel Owner' : 'Staff / Warden'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/40 py-2.5 rounded-xl text-xs font-semibold transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Header Bar */}
        <header className="h-16 bg-slate-900/60 border-b border-slate-800 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-30 light:bg-white light:border-slate-200">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="text-lg font-bold font-display text-white light:text-slate-900 capitalize">
              {activeTab === 'dashboard' ? 'Hostel Overview & Stats' : activeTab.replace('-', ' ')}
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            {/* Gate Status Pill */}
            <div className={`hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold border ${settings.gateStatus === 'OPEN'
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-950/60 text-rose-400 border-rose-500/30'
              }`}>
              <span className={`w-2 h-2 rounded-full ${settings.gateStatus === 'OPEN' ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`}></span>
              <span>Gate: {settings.gateStatus} ({settings.gateClosingTime})</span>
            </div>

            {/* Dark/Light Mode Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:text-white transition-all light:bg-slate-100 light:border-slate-200 light:text-slate-700"
              title="Toggle Theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        {/* View Router Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="text-sm text-slate-400">Loading hostel records...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: DASHBOARD VIEW */}
              {activeTab === 'dashboard' && (
                <div className="space-y-8">
                  {/* STUDENT HERO DASHBOARD BANNER */}
                  {user.role === 'student' && (
                    <div className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-2 text-left">
                          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-semibold">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                            <span>Student Room Portal • Room {user.roomNo}</span>
                          </div>
                          <h3 className="text-2xl font-extrabold text-white font-display">Welcome, {user.name}</h3>
                          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                            View your monthly rent status, electricity sub-meter bill, payment history, and pay directly via your hostel PhonePe UPI QR code.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => setShowSubmitPaymentModal(true)}
                            className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all"
                          >
                            <span>💳 Submit TXN Proof</span>
                          </button>
                          <button
                            onClick={async () => {
                              const res = await apiFetch('/api/payments/qr-payload?amount=6500');
                              setQrData(res);
                              setShowQRModal(true);
                            }}
                            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition-all"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Pay Rent via PhonePe QR</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Top KPI Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

                    {/* Revenue Collected */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-indigo-500/40 transition-all light:bg-white light:border-slate-200 shadow-lg">
                      <div className="absolute top-0 right-0 p-4 text-indigo-500/20 group-hover:text-indigo-500/30 transition-all">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Confirmed Rent Revenue</p>
                      <h3 className="text-3xl font-extrabold font-display text-white mt-2 light:text-slate-900">
                        ₹{stats.totalCollected.toLocaleString()}
                      </h3>
                      <p className="text-[11px] text-emerald-400 mt-2 font-medium">Approved by Owner</p>
                    </div>

                    {/* Pending Owner Confirmation */}
                    <div className={`bg-slate-900/80 border rounded-2xl p-5 relative overflow-hidden group transition-all light:bg-white light:border-slate-200 shadow-lg ${stats.pendingConfirmationsCount > 0 ? 'border-amber-500/50 shadow-amber-500/5' : 'border-slate-800'
                      }`}>
                      <div className="absolute top-0 right-0 p-4 text-amber-500/20 group-hover:text-amber-500/30 transition-all">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Owner Confirmation Pending</p>
                      <h3 className="text-3xl font-extrabold font-display text-amber-300 mt-2">
                        {stats.pendingConfirmationsCount} Logs
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-2 font-medium">₹{stats.pendingConfirmAmount.toLocaleString()} awaiting approval</p>
                    </div>

                    {/* Active Students */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-indigo-500/40 transition-all light:bg-white light:border-slate-200 shadow-lg">
                      <div className="absolute top-0 right-0 p-4 text-blue-500/20 group-hover:text-blue-500/30 transition-all">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Hostel Residents</p>
                      <h3 className="text-3xl font-extrabold font-display text-white mt-2 light:text-slate-900">
                        {stats.activeStudents} Students
                      </h3>
                      <p className="text-[11px] text-blue-400 mt-2 font-medium">Docs & Profiles Uploaded</p>
                    </div>

                    {/* Bike Parking Occupancy */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-indigo-500/40 transition-all light:bg-white light:border-slate-200 shadow-lg">
                      <div className="absolute top-0 right-0 p-4 text-purple-500/20 group-hover:text-purple-500/30 transition-all">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" />
                        </svg>
                      </div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bike Parking Slots</p>
                      <h3 className="text-3xl font-extrabold font-display text-white mt-2 light:text-slate-900">
                        {stats.occupiedParking} / {stats.totalParking} Occupied
                      </h3>
                      <p className="text-[11px] text-purple-400 mt-2 font-medium">{stats.totalParking - stats.occupiedParking} Vacant Slots</p>
                    </div>

                  </div>

                  {/* Quick Action Hub */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 light:bg-white light:border-slate-200">
                    <h3 className="text-base font-bold text-white mb-4 light:text-slate-900">
                      {user.role === 'student' ? 'My Student Quick Actions' : 'Quick Hostel Operations'}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {user.role === 'student' ? (
                        <>
                          <button
                            onClick={async () => {
                              const res = await apiFetch('/api/payments/qr-payload?amount=6500');
                              setQrData(res);
                              setShowQRModal(true);
                            }}
                            className="p-4 bg-emerald-600/10 border border-emerald-500/30 rounded-xl hover:bg-emerald-600/20 text-left transition-all group"
                          >
                            <span className="text-2xl block mb-2">📱</span>
                            <div className="font-bold text-sm text-emerald-300 group-hover:text-emerald-200">Show PhonePe QR</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">Pay Rent & Electricity</div>
                          </button>

                          <button
                            onClick={() => setShowSubmitPaymentModal(true)}
                            className="p-4 bg-indigo-600/10 border border-indigo-500/30 rounded-xl hover:bg-indigo-600/20 text-left transition-all group"
                          >
                            <span className="text-2xl block mb-2">💳</span>
                            <div className="font-bold text-sm text-indigo-300 group-hover:text-indigo-200">Submit Paid Proof</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">Enter UPI TXN ID</div>
                          </button>

                          <button
                            onClick={() => setActiveTab('lightbill')}
                            className="p-4 bg-amber-600/10 border border-amber-500/30 rounded-xl hover:bg-amber-600/20 text-left transition-all group"
                          >
                            <span className="text-2xl block mb-2">⚡</span>
                            <div className="font-bold text-sm text-amber-300 group-hover:text-amber-200">My Light Bill</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">Meter Reading Split</div>
                          </button>

                          <button
                            onClick={() => setActiveTab('rules')}
                            className="p-4 bg-purple-600/10 border border-purple-500/30 rounded-xl hover:bg-purple-600/20 text-left transition-all group"
                          >
                            <span className="text-2xl block mb-2">📋</span>
                            <div className="font-bold text-sm text-purple-300 group-hover:text-purple-200">Hostel Rules</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">Gate Closing & Timings</div>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setShowAddStudent(true)}
                            className="p-4 bg-indigo-600/10 border border-indigo-500/30 rounded-xl hover:bg-indigo-600/20 text-left transition-all group"
                          >
                            <span className="text-2xl block mb-2">👤</span>
                            <div className="font-bold text-sm text-indigo-300 group-hover:text-indigo-200">Add New Student</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">Register & Doc Upload</div>
                          </button>

                          <button
                            onClick={async () => {
                              const res = await apiFetch('/api/payments/qr-payload?amount=6500');
                              setQrData(res);
                              setShowQRModal(true);
                            }}
                            className="p-4 bg-emerald-600/10 border border-emerald-500/30 rounded-xl hover:bg-emerald-600/20 text-left transition-all group"
                          >
                            <span className="text-2xl block mb-2">📱</span>
                            <div className="font-bold text-sm text-emerald-300 group-hover:text-emerald-200">Generate UPI QR</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">Dynamic Rent QR Code</div>
                          </button>

                          <button
                            onClick={() => setShowLightBillModal(true)}
                            className="p-4 bg-amber-600/10 border border-amber-500/30 rounded-xl hover:bg-amber-600/20 text-left transition-all group"
                          >
                            <span className="text-2xl block mb-2">⚡</span>
                            <div className="font-bold text-sm text-amber-300 group-hover:text-amber-200">Calculate Light Bill</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">Room meter split</div>
                          </button>

                          <button
                            onClick={() => setShowGateLogModal(true)}
                            className="p-4 bg-purple-600/10 border border-purple-500/30 rounded-xl hover:bg-purple-600/20 text-left transition-all group"
                          >
                            <span className="text-2xl block mb-2">⏰</span>
                            <div className="font-bold text-sm text-purple-300 group-hover:text-purple-200">Log Late Entry</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">Curfew violation entry</div>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Dashboard Split View: Pending Approvals & Recent Students */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Owner Confirmation Queue */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 light:bg-white light:border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-base text-white light:text-slate-900 flex items-center space-x-2">
                          <span>Owner Confirmation Queue</span>
                          <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full font-bold">
                            {stats.pendingConfirmationsCount}
                          </span>
                        </h3>
                        <button
                          onClick={() => setActiveTab('payments')}
                          className="text-xs text-indigo-400 hover:underline font-semibold"
                        >
                          View All Payments &rarr;
                        </button>
                      </div>

                      {payments.filter(p => p.status === 'pending_owner').length === 0 ? (
                        <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-400 text-sm">
                          ✨ All payment submissions confirmed by owner!
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                          {payments.filter(p => p.status === 'pending_owner').map(pay => (
                            <div key={pay.id} className="p-4 bg-slate-800/60 border border-amber-500/30 rounded-xl flex items-center justify-between light:bg-slate-50">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-sm text-white light:text-slate-900">{pay.studentName}</span>
                                  <span className="text-xs text-slate-400 bg-slate-700/60 px-2 py-0.5 rounded">Room {pay.roomNo}</span>
                                </div>
                                <p className="text-xs text-amber-300 mt-1 font-semibold">₹{pay.amount.toLocaleString()} ({pay.month})</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">TXN: {pay.upiTransactionId}</p>
                              </div>

                              {user.role === 'admin' ? (
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={async () => {
                                      await apiFetch(`/api/payments/${pay.id}/confirm`, {
                                        method: 'PUT',
                                        body: JSON.stringify({ status: 'confirmed' })
                                      });
                                      showToast(`Payment confirmed for ${pay.studentName}`);
                                      fetchAllData();
                                    }}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md transition-all"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={async () => {
                                      await apiFetch(`/api/payments/${pay.id}/confirm`, {
                                        method: 'PUT',
                                        body: JSON.stringify({ status: 'rejected' })
                                      });
                                      showToast(`Payment rejected for ${pay.studentName}`, 'error');
                                      fetchAllData();
                                    }}
                                    className="px-3 py-1.5 bg-rose-600/30 text-rose-300 border border-rose-500/30 hover:bg-rose-600/50 text-xs font-bold rounded-lg transition-all"
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-amber-400 font-semibold italic">Submitted & Pending Owner Approval</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Recent Resident Roster */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 light:bg-white light:border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-base text-white light:text-slate-900">Registered Students</h3>
                        <button
                          onClick={() => setActiveTab('students')}
                          className="text-xs text-indigo-400 hover:underline font-semibold"
                        >
                          Manage All &rarr;
                        </button>
                      </div>

                      <div className="space-y-3">
                        {students.slice(0, 4).map(st => (
                          <div key={st.id} className="p-3.5 bg-slate-800/40 border border-slate-700/50 rounded-xl flex items-center justify-between light:bg-slate-50">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
                                {st.roomNo}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-white light:text-slate-900">{st.name} ({st.bedNo})</h4>
                                <p className="text-[11px] text-slate-400">Joined: {st.joinDate} • ₹{st.monthlyRent}/mo</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setSelectedStudentLedger(st)}
                              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded-lg transition-all"
                            >
                              Ledger
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 2: STUDENTS VIEW & DOCUMENT UPLOAD */}
              {activeTab === 'students' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-white light:text-slate-900 font-display">Student Roster & ID Document Vault</h3>
                      <p className="text-xs text-slate-400">Manage hostel residents, room allocations, join dates, and Aadhaar/Passport doc proofs.</p>
                    </div>
                    {user.role !== 'student' && (
                      <button
                        onClick={() => setShowAddStudent(true)}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Register New Student</span>
                      </button>
                    )}
                  </div>

                  {/* Student Table */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden light:bg-white light:border-slate-200 shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700/60 light:bg-slate-100">
                          <tr>
                            <th className="p-4">Student Name</th>
                            <th className="p-4">Room & Bed</th>
                            <th className="p-4">Phone & Parent</th>
                            <th className="p-4">Join Date</th>
                            <th className="p-4">Rent Dues</th>
                            <th className="p-4">ID Doc</th>
                            <th className="p-4">Bike & Slot</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 light:divide-slate-200">
                          {(user.role === 'student' && user.roomNo
                            ? students.filter(st => st.roomNo === user.roomNo || st.roomNo === user.roomNo.replace(/^0+/, '') || `0${st.roomNo}` === user.roomNo)
                            : students
                          ).map(st => (
                            <tr key={st.id} className="hover:bg-slate-800/30 transition-all light:hover:bg-slate-50">
                              <td className="p-4 font-bold text-white light:text-slate-900">
                                {st.name}
                                <div className="text-[10px] text-slate-400 font-normal">{st.email || 'No email'}</div>
                              </td>
                              <td className="p-4">
                                <span className="inline-block bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-bold">
                                  Room {st.roomNo} ({st.bedNo})
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="text-slate-200 light:text-slate-800">{st.phone}</div>
                                <div className="text-[10px] text-slate-400">Parent: {st.parentPhone || 'N/A'}</div>
                              </td>
                              <td className="p-4 text-slate-300 light:text-slate-700">{st.joinDate}</td>
                              <td className="p-4">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${st.currentMonthStatus === 'paid' ? 'bg-emerald-500/20 text-emerald-300' :
                                    st.currentMonthStatus === 'pending_owner' ? 'bg-amber-500/20 text-amber-300' :
                                      'bg-rose-500/20 text-rose-300'
                                  }`}>
                                  ₹{st.monthlyRent}/mo ({st.currentMonthStatus || 'unpaid'})
                                </span>
                              </td>
                              <td className="p-4">
                                {st.idDocUrl ? (
                                  <button
                                    onClick={() => setViewDocStudent(st)}
                                    className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-indigo-300 hover:text-indigo-200 text-[11px] rounded font-medium flex items-center space-x-1"
                                  >
                                    <span>👁️ View ID</span>
                                  </button>
                                ) : (
                                  <span className="text-slate-500 italic">No Doc</span>
                                )}
                              </td>
                              <td className="p-4 text-slate-300">
                                {st.parkingSlot && st.parkingSlot !== 'None' ? (
                                  <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded font-medium text-[11px]">
                                    {st.parkingSlot} ({st.bikeNumber})
                                  </span>
                                ) : (
                                  <span className="text-slate-500">None</span>
                                )}
                              </td>
                              <td className="p-4 text-right space-x-2">
                                <button
                                  onClick={() => setSelectedStudentLedger(st)}
                                  className="px-2.5 py-1 bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/50 rounded font-semibold text-[11px]"
                                >
                                  Ledger
                                </button>
                                {user.role === 'admin' && (
                                  <button
                                    onClick={async () => {
                                      if (confirm(`Are you sure you want to remove/vacate ${st.name}?`)) {
                                        await apiFetch(`/api/students/${st.id}`, { method: 'DELETE' });
                                        showToast(`Student ${st.name} removed`);
                                        fetchAllData();
                                      }
                                    }}
                                    className="px-2 py-1 bg-rose-600/20 border border-rose-500/30 text-rose-400 hover:bg-rose-600/40 rounded font-semibold text-[11px]"
                                  >
                                    Delete
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PAYMENT QR & OWNER CONFIRMATION */}
              {activeTab === 'payments' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-white light:text-slate-900 font-display">UPI Payment QR & Owner Confirmation Portal</h3>
                      <p className="text-xs text-slate-400">Generate dynamic UPI QR codes for monthly rent & verify staff/student payment submissions.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowSubmitPaymentModal(true)}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Submit Paid TXN Proof</span>
                      </button>
                      <button
                        onClick={async () => {
                          const res = await apiFetch('/api/payments/qr-payload?amount=6500');
                          setQrData(res);
                          setShowQRModal(true);
                        }}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Show Dynamic UPI QR</span>
                      </button>
                    </div>
                  </div>

                  {/* Official PhonePe QR Banner */}
                  <div className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl backdrop-blur-xl">
                    <div className="space-y-2.5 max-w-md text-left">
                      <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-semibold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Official PhonePe UPI QR Code</span>
                      </div>
                      <h4 className="text-lg font-bold text-white font-display">Scan & Pay Monthly Rent Directly</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Students & staff can scan this official PhonePe QR code to pay rent, electricity sub-meter charges, or deposits directly.
                      </p>
                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] bg-slate-800 text-emerald-400 px-3 py-1 rounded-lg border border-slate-700 font-mono font-bold">UPI ID: {settings.upiId || '9322465627@ybl'}</span>
                        <span className="text-[11px] bg-purple-950/80 text-purple-300 px-3 py-1 rounded-lg border border-purple-800 font-medium">GPay / PhonePe / Paytm / BHIM</span>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-2xl shadow-2xl border-4 border-indigo-500 text-center shrink-0">
                      <img
                        src={(typeof window !== 'undefined' && window.PHONEPE_QR_IMAGE) || './upi_qr.jpg'}
                        alt="Official PhonePe UPI QR Code"
                        className="w-48 h-48 object-contain mx-auto rounded-lg"
                      />
                      <div className="mt-1.5 text-[11px] font-extrabold text-slate-900 tracking-wide">PHONEPE UPI QR</div>
                    </div>
                  </div>

                  {/* Payment Logs Table */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden light:bg-white light:border-slate-200 shadow-xl">
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                      <h4 className="font-bold text-sm text-white light:text-slate-900">Payment Collection Records</h4>
                      <span className="text-xs text-slate-400">Owner UPI: <strong className="text-indigo-400">{settings.upiId}</strong></span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700/60">
                          <tr>
                            <th className="p-4">Student & Room</th>
                            <th className="p-4">Month & Type</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">UPI TXN ID</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Submitted By</th>
                            <th className="p-4 text-right">Owner Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 light:divide-slate-200">
                          {(user.role === 'student' && user.roomNo
                            ? payments.filter(pay => pay.roomNo === user.roomNo || pay.roomNo === user.roomNo.replace(/^0+/, '') || `0${pay.roomNo}` === user.roomNo)
                            : payments
                          ).map(pay => (
                            <tr key={pay.id} className="hover:bg-slate-800/30 transition-all">
                              <td className="p-4 font-bold text-white light:text-slate-900">
                                {pay.studentName}
                                <div className="text-[10px] text-slate-400 font-normal">Room {pay.roomNo}</div>
                              </td>
                              <td className="p-4">
                                <div className="font-semibold text-slate-200 light:text-slate-800">{pay.month}</div>
                                <div className="text-[10px] text-slate-400 uppercase">{pay.type}</div>
                              </td>
                              <td className="p-4 font-bold text-emerald-400 text-sm">
                                ₹{pay.amount.toLocaleString()}
                              </td>
                              <td className="p-4 font-mono text-[11px] text-slate-300">
                                {pay.upiTransactionId}
                              </td>
                              <td className="p-4">
                                <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold uppercase ${pay.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                    pay.status === 'pending_owner' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse' :
                                      'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  }`}>
                                  {pay.status === 'pending_owner' ? '⏳ Pending Owner' : pay.status}
                                </span>
                              </td>
                              <td className="p-4 text-slate-400 text-[11px]">
                                {pay.submittedBy}
                              </td>
                              <td className="p-4 text-right">
                                {pay.status === 'pending_owner' && user.role === 'admin' ? (
                                  <div className="flex items-center justify-end space-x-2">
                                    <button
                                      onClick={async () => {
                                        await apiFetch(`/api/payments/${pay.id}/confirm`, {
                                          method: 'PUT',
                                          body: JSON.stringify({ status: 'confirmed' })
                                        });
                                        showToast(`Payment confirmed!`);
                                        fetchAllData();
                                      }}
                                      className="px-3 py-1 bg-emerald-600 text-white text-[11px] font-bold rounded hover:bg-emerald-500 shadow"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={async () => {
                                        await apiFetch(`/api/payments/${pay.id}/confirm`, {
                                          method: 'PUT',
                                          body: JSON.stringify({ status: 'rejected' })
                                        });
                                        showToast(`Payment rejected`, 'error');
                                        fetchAllData();
                                      }}
                                      className="px-2.5 py-1 bg-rose-600/30 text-rose-300 border border-rose-500/30 text-[11px] font-bold rounded hover:bg-rose-600/50"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-slate-400">
                                    {pay.confirmedBy ? `Confirmed by ${pay.confirmedBy}` : 'Approved'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: ELECTRICITY / LIGHT BILL */}
              {activeTab === 'lightbill' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-white light:text-slate-900 font-display">Electricity & Light Bill Calculator</h3>
                      <p className="text-xs text-slate-400">Record sub-meter readings per room, split light bill equally per resident, and post directly to dues.</p>
                    </div>
                    <button
                      onClick={() => setShowLightBillModal(true)}
                      className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-600/30 flex items-center space-x-2 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Add Meter Reading</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(user.role === 'student' && user.roomNo
                      ? lightBills.filter(lb => lb.roomNo === user.roomNo || lb.roomNo === user.roomNo.replace(/^0+/, '') || `0${lb.roomNo}` === user.roomNo)
                      : lightBills
                    ).map(lb => (
                      <div key={lb.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 light:bg-white light:border-slate-200 shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                          <div>
                            <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">Room Meter Log</span>
                            <h4 className="text-xl font-extrabold font-display text-white light:text-slate-900">Room {lb.roomNo}</h4>
                          </div>
                          <span className="text-xs font-bold px-2.5 py-1 rounded bg-slate-800 text-slate-300">
                            {lb.month} {lb.year}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between text-slate-400">
                            <span>Meter Readings:</span>
                            <span className="text-slate-200 font-mono">{lb.previousReading} ➔ {lb.currentReading}</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Units Consumed:</span>
                            <span className="text-amber-300 font-bold">{lb.totalUnits} Units</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Rate per Unit:</span>
                            <span className="text-slate-300">₹{lb.ratePerUnit}/unit</span>
                          </div>
                          <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-2 font-bold text-sm">
                            <span className="text-white light:text-slate-900">Total Room Bill:</span>
                            <span className="text-emerald-400">₹{lb.totalAmount}</span>
                          </div>
                          <div className="bg-indigo-950/60 border border-indigo-500/30 p-2.5 rounded-xl text-center mt-3">
                            <span className="text-[11px] text-indigo-300 block">Split per Resident ({lb.studentCount} Beds):</span>
                            <span className="text-base font-extrabold text-white">₹{lb.perStudentAmount} / student</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: BIKE PARKING MATRIX */}
              {activeTab === 'parking' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-white light:text-slate-900 font-display">Bike & Scooter Parking Slot Matrix</h3>
                    <p className="text-xs text-slate-400">Real-time status of assigned vehicle parking slots and helmet lockers for residents.</p>
                  </div>

                  {/* Slot Matrix Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {parkingSlots.map(slot => (
                      <div key={slot.id} className={`p-5 rounded-2xl border transition-all ${slot.status === 'occupied'
                          ? 'bg-purple-950/40 border-purple-500/40 shadow-lg shadow-purple-500/5'
                          : 'bg-slate-900/60 border-slate-800/80 light:bg-white light:border-slate-200'
                        }`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-lg font-extrabold font-display text-white light:text-slate-900">{slot.slotNo}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${slot.status === 'occupied' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-400'
                            }`}>
                            {slot.status}
                          </span>
                        </div>

                        {slot.status === 'occupied' ? (
                          <div className="space-y-1.5 text-xs">
                            <div className="font-bold text-white light:text-slate-900">{slot.studentName}</div>
                            <div className="text-[11px] text-purple-300 font-mono">Bike: {slot.vehicleNumber}</div>
                            <div className="text-[10px] text-slate-400">Locker: {slot.helmetLockerNo || 'Assigned'}</div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 italic py-2">
                            Slot vacant & available
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: GATE CLOSING TIME & CURFEW */}
              {activeTab === 'gate' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-white light:text-slate-900 font-display">Gate Closing & Curfew Tracker</h3>
                      <p className="text-xs text-slate-400">Hostel gate timing rules, live gate status toggle, and late student entry logs.</p>
                    </div>
                    <button
                      onClick={() => setShowGateLogModal(true)}
                      className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/30 flex items-center space-x-2 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Log Late Entry</span>
                    </button>
                  </div>

                  {/* Gate Status Banner */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 light:bg-white light:border-slate-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center text-2xl font-bold">
                        ⏱️
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white light:text-slate-900">Standard Gate Closing Time: {settings.gateClosingTime}</h4>
                        <p className="text-xs text-slate-400">Late entry fines apply for arrivals post {settings.gateClosingTime} without prior permission.</p>
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        const newStatus = settings.gateStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
                        const data = await apiFetch('/api/gate/toggle-status', {
                          method: 'POST',
                          body: JSON.stringify({ gateStatus: newStatus })
                        });
                        setSettings(prev => ({ ...prev, gateStatus: newStatus }));
                        showToast(`Gate status changed to ${newStatus}`);
                      }}
                      className={`px-6 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-lg ${settings.gateStatus === 'OPEN'
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                          : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                        }`}
                    >
                      Toggle Gate Status ({settings.gateStatus})
                    </button>
                  </div>

                  {/* Late Logs Table */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden light:bg-white light:border-slate-200 shadow-xl">
                    <div className="p-4 border-b border-slate-800">
                      <h4 className="font-bold text-sm text-white light:text-slate-900">Late Entry & Curfew Logbook</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700/60">
                          <tr>
                            <th className="p-4">Student</th>
                            <th className="p-4">Room</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Actual Arrival Time</th>
                            <th className="p-4">Reason for Delay</th>
                            <th className="p-4">Approval Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 light:divide-slate-200">
                          {gateLogs.map(log => (
                            <tr key={log.id} className="hover:bg-slate-800/30">
                              <td className="p-4 font-bold text-white light:text-slate-900">{log.studentName}</td>
                              <td className="p-4 text-indigo-300">Room {log.roomNo}</td>
                              <td className="p-4 text-slate-300">{log.date}</td>
                              <td className="p-4 font-mono font-bold text-rose-400">{log.inTime} (Curfew: {log.expectedTime})</td>
                              <td className="p-4 text-slate-300 max-w-xs">{log.reason}</td>
                              <td className="p-4">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${log.status === 'permission_granted' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                                  }`}>
                                  {log.approvedBy ? `Approved (${log.approvedBy})` : 'Unapproved Late Entry'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: RULES & REGULATIONS */}
              {activeTab === 'rules' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-white light:text-slate-900 font-display">Hostel Code of Conduct & Rulebook</h3>
                      <p className="text-xs text-slate-400">Official hostel rules, timing discipline, safety policies, and fine structures.</p>
                    </div>
                    {user.role === 'admin' && (
                      <button
                        onClick={() => setShowAddRuleModal(true)}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add Hostel Rule</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {rules.map(rule => (
                      <div key={rule.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 light:bg-white light:border-slate-200 shadow-xl space-y-3 relative group">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                            {rule.category}
                          </span>
                          {user.role === 'admin' && (
                            <button
                              onClick={async () => {
                                await apiFetch(`/api/rules/${rule.id}`, { method: 'DELETE' });
                                showToast('Rule deleted');
                                fetchAllData();
                              }}
                              className="text-rose-400 hover:text-rose-300 text-xs"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        <h4 className="text-base font-bold text-white light:text-slate-900">{rule.title}</h4>
                        <p className="text-xs text-slate-300 leading-relaxed light:text-slate-700">{rule.description}</p>
                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                          <span className="text-slate-400">Violation Penalty:</span>
                          <span className="text-rose-400 font-bold">{rule.penalty}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </>
          )}
        </main>

        {/* Dashboard Footer Credit */}
        <footer className="p-4 border-t border-slate-800 text-center text-xs text-slate-400 light:border-slate-200">
          Created by <strong className="text-indigo-400 font-bold light:text-indigo-600">Krushna Sakhare</strong> • Sakhare Plot Hostel Management System
        </footer>
      </div>

      {/* MODAL 1: REGISTER NEW STUDENT */}
      {showAddStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white font-display">Register New Hostel Resident</h3>
              <button onClick={() => setShowAddStudent(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target;
              const payload = {
                name: form.name.value,
                phone: form.phone.value,
                parentPhone: form.parentPhone.value,
                roomNo: form.roomNo.value,
                bedNo: form.bedNo.value,
                joinDate: form.joinDate.value,
                monthlyRent: form.monthlyRent.value,
                idType: form.idType.value,
                idNumber: form.idNumber.value,
                bikeNumber: form.bikeNumber.value,
                parkingSlot: form.parkingSlot.value,
                idDocUrl: form.idDocUrl.value || ''
              };
              await apiFetch('/api/students', { method: 'POST', body: JSON.stringify(payload) });
              showToast(`Student ${payload.name} registered successfully!`);
              setShowAddStudent(false);
              fetchAllData();
            }} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Student Full Name</label>
                  <input required name="name" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" placeholder="e.g. Rohan Sharma" />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Student Phone Number</label>
                  <input required name="phone" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" placeholder="+91 98765 00000" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Room No</label>
                  <input required name="roomNo" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" placeholder="101" />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Bed Assigned</label>
                  <select name="bedNo" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white">
                    <option>Bed A</option>
                    <option>Bed B</option>
                    <option>Bed C</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Monthly Rent (₹)</label>
                  <input type="number" name="monthlyRent" defaultValue="6500" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Join Date</label>
                  <input type="date" name="joinDate" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Parent Contact</label>
                  <input name="parentPhone" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" placeholder="+91 98765 11111" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ID Document Type</label>
                  <select name="idType" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white">
                    <option>Aadhaar Card</option>
                    <option>Passport</option>
                    <option>College Student ID</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ID Number</label>
                  <input name="idNumber" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" placeholder="4521 8890 0000" />
                </div>
              </div>

              {/* Base64 ID Photo URL / Data input */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Aadhaar/ID Document Photo (Base64 / Image Link)</label>
                <input name="idDocUrl" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white text-[11px]" placeholder="Leave blank to auto-generate digital ID proof badge" />
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Bike Vehicle Number (Optional)</label>
                  <input name="bikeNumber" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" placeholder="MH-12-AB-1234" />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Parking Slot</label>
                  <select name="parkingSlot" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white">
                    <option value="None">None</option>
                    <option value="P-02">P-02 (Vacant)</option>
                    <option value="P-04">P-04 (Vacant)</option>
                    <option value="P-06">P-06 (Vacant)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowAddStudent(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30">Register & Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DYNAMIC UPI QR MODAL */}
      {showQRModal && qrData && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white font-display">Scan UPI QR to Pay</h3>
              <button onClick={() => setShowQRModal(false)} className="text-slate-400">✕</button>
            </div>

            <div className="bg-white p-3 rounded-2xl inline-block shadow-xl my-2 border-4 border-indigo-500 overflow-hidden">
              <img
                src={(typeof window !== 'undefined' && window.PHONEPE_QR_IMAGE) || './upi_qr.jpg'}
                alt="PhonePe UPI QR Code"
                className="w-52 h-52 object-contain mx-auto rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <div className="text-xs text-slate-400">Hostel Owner UPI ID:</div>
              <div className="font-mono text-sm font-bold text-emerald-400 bg-slate-800/80 py-1.5 px-3 rounded-lg border border-slate-700 inline-block">
                {qrData.upiId}
              </div>
              <div className="text-2xl font-extrabold text-white mt-2">₹{qrData.amount}</div>
              <div className="text-[11px] text-slate-400">{qrData.note}</div>
            </div>

            <a
              href={qrData.upiLink}
              className="block w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-600/30"
            >
              Open GPay / PhonePe / Paytm App
            </a>
          </div>
        </div>
      )}

      {/* MODAL 3: LIGHT BILL METER READING */}
      {showLightBillModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white font-display">Calculate Room Light Bill</h3>
              <button onClick={() => setShowLightBillModal(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target;
              const payload = {
                roomNo: form.roomNo.value,
                month: form.month.value,
                previousReading: form.previousReading.value,
                currentReading: form.currentReading.value,
                ratePerUnit: form.ratePerUnit.value
              };
              const res = await apiFetch('/api/lightbill', { method: 'POST', body: JSON.stringify(payload) });
              showToast(res.message);
              setShowLightBillModal(false);
              fetchAllData();
            }} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Room No</label>
                  <input required name="roomNo" defaultValue="101" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Month</label>
                  <input required name="month" defaultValue="August 2026" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Prev Meter Reading</label>
                  <input type="number" required name="previousReading" defaultValue="1420" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Current Meter Reading</label>
                  <input type="number" required name="currentReading" defaultValue="1650" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Rate per Unit (₹)</label>
                <input type="number" step="0.5" name="ratePerUnit" defaultValue="8.5" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" />
              </div>

              <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-amber-600/30">
                Calculate & Auto-Post Dues
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: GATE LATE ENTRY LOG */}
      {showGateLogModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white font-display">Record Gate Late Entry</h3>
              <button onClick={() => setShowGateLogModal(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target;
              const payload = {
                studentId: form.studentId.value,
                inTime: form.inTime.value,
                reason: form.reason.value,
                status: form.status.value
              };
              await apiFetch('/api/gate/log', { method: 'POST', body: JSON.stringify(payload) });
              showToast('Late entry log saved');
              setShowGateLogModal(false);
              fetchAllData();
            }} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Student</label>
                <select name="studentId" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white">
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (Room {s.roomNo})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Actual In Time</label>
                  <input required name="inTime" defaultValue="22:45" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status Tag</label>
                  <select name="status" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white">
                    <option value="late">Unapproved Late</option>
                    <option value="permission_granted">Prior Permission Granted</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reason for Delay</label>
                <textarea required name="reason" rows="2" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" placeholder="e.g. College lab project / Bus delay"></textarea>
              </div>

              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-600/30">
                Save Curfew Log
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: STUDENT MONTHLY LEDGER VIEW */}
      {selectedStudentLedger && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-lg text-white font-display">{selectedStudentLedger.name} - Monthly Rent Ledger</h3>
                <p className="text-xs text-slate-400">Join Date: {selectedStudentLedger.joinDate} • Monthly Rent: ₹{selectedStudentLedger.monthlyRent}</p>
              </div>
              <button onClick={() => setSelectedStudentLedger(null)} className="text-slate-400">✕</button>
            </div>

            <div className="space-y-3">
              {selectedStudentLedger.ledger.map((item, idx) => (
                <div key={idx} className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white text-sm">{item.month}</div>
                    <div className="text-[10px] text-slate-400">Due Date: {item.dueDate}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">₹{item.rentAmount}</div>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-0.5 ${item.status === 'paid' ? 'bg-emerald-500/20 text-emerald-300' :
                        item.status === 'pending_owner' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-rose-500/20 text-rose-300'
                      }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: VIEW STUDENT ID DOCUMENT PREVIEW */}
      {viewDocStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-center">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white font-display">ID Document Proof: {viewDocStudent.name}</h3>
              <button onClick={() => setViewDocStudent(null)} className="text-slate-400">✕</button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex justify-center">
              <img
                src={viewDocStudent.idDocUrl}
                alt="Student ID Proof"
                className="max-h-56 rounded-lg shadow"
              />
            </div>
            <div className="text-xs text-slate-400">
              Document Type: <strong className="text-indigo-400">{viewDocStudent.idType}</strong> ({viewDocStudent.idNumber})
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: ADD HOSTEL RULE */}
      {showAddRuleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white font-display">Add Hostel Rule</h3>
              <button onClick={() => setShowAddRuleModal(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target;
              const payload = {
                category: form.category.value,
                title: form.title.value,
                description: form.description.value,
                penalty: form.penalty.value
              };
              await apiFetch('/api/rules', { method: 'POST', body: JSON.stringify(payload) });
              showToast('Hostel rule added');
              setShowAddRuleModal(false);
              fetchAllData();
            }} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Category</label>
                <select name="category" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white">
                  <option>Gate Timings</option>
                  <option>Payments</option>
                  <option>Light Bill</option>
                  <option>Bike Parking</option>
                  <option>Visitors & Security</option>
                  <option>Mess & Cleanliness</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Rule Title</label>
                <input required name="title" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" placeholder="e.g. Quiet Hours" />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Rule Description</label>
                <textarea required name="description" rows="3" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" placeholder="Detailed explanation..."></textarea>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Violation Penalty / Fine</label>
                <input name="penalty" defaultValue="₹200 Fine" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" />
              </div>

              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-600/30">
                Save Rule
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 8: SUBMIT PAYMENT TXN PROOF */}
      {showSubmitPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white font-display">Submit UPI Rent Payment Proof</h3>
              <button onClick={() => setShowSubmitPaymentModal(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target;
              const payload = {
                amount: form.amount.value,
                month: form.month.value,
                upiTransactionId: form.upiTransactionId.value,
                roomNo: user?.roomNo || '01',
                studentName: user?.name || 'Resident',
                notes: form.notes.value || 'PhonePe QR Payment'
              };
              await apiFetch('/api/payments', { method: 'POST', body: JSON.stringify(payload) });
              showToast('Payment proof submitted! Awaiting owner confirmation.');
              setShowSubmitPaymentModal(false);
              fetchAllData();
            }} className="space-y-4 text-xs text-left">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Room & Resident</label>
                <input disabled value={`Room ${user?.roomNo || '01'} - ${user?.name || 'Resident'}`} className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5 text-slate-300 font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Payment Month</label>
                  <input required name="month" defaultValue="July 2026" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Amount Paid (₹)</label>
                  <input required type="number" name="amount" defaultValue="6500" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">PhonePe / UPI Transaction ID</label>
                <input required name="upiTransactionId" placeholder="e.g. 420918827104 or UPI-998811" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Note / Reference</label>
                <input name="notes" defaultValue="Rent paid via PhonePe QR" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" />
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-600/30">
                Submit Payment for Verification
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Render React App
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
