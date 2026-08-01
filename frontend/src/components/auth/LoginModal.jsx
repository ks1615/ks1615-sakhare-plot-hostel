import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Building2, Shield, Phone, Lock, Mail, ArrowRight, Flame, CheckCircle2, AlertCircle, ExternalLink, GraduationCap } from 'lucide-react';

export default function LoginModal({ onSwitchToRegister }) {
  const { login, loginDirectBackend, isFirebaseConfigured } = useAuth();
  const [selectedRole, setSelectedRole] = useState('owner'); // 'owner' | 'student'
  
  // Form state
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isFirebaseDisabledError, setIsFirebaseDisabledError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsFirebaseDisabledError(false);
    setLoading(true);
    try {
      await login(emailOrPhone, password, selectedRole);
    } catch (err) {
      if (err.code === 'auth/operation-not-allowed') {
        setIsFirebaseDisabledError(true);
        setError('Firebase Notice: Email/Password provider is not enabled in Firebase Console yet.');
      } else {
        setError(err.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBypassLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const defaultInput = selectedRole === 'owner' ? 'kskrushna1615@gmail.com' : emailOrPhone;
      const defaultPass = selectedRole === 'owner' ? 'Sakhare1615' : password;
      await loginDirectBackend(emailOrPhone || defaultInput, password || defaultPass, selectedRole);
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = selectedRole === 'owner';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden font-sans">
      {/* Ambient background glows */}
      {isAdmin ? (
        <>
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute top-1/2 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
        </>
      ) : (
        <>
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute top-1/2 -right-40 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl pointer-events-none"></div>
        </>
      )}

      <div className={`relative w-full max-w-md bg-slate-900/90 border rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
        isAdmin ? 'border-amber-500/30 shadow-amber-500/10' : 'border-emerald-500/30 shadow-emerald-500/10'
      }`}>
        
        {/* Top Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950/90 rounded-2xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('owner');
              setEmailOrPhone('');
              setPassword('');
              setError('');
              setIsFirebaseDisabledError(false);
            }}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all ${
              isAdmin
                ? 'bg-gradient-to-r from-amber-500 via-orange-600 to-indigo-600 text-white shadow-lg shadow-orange-500/30 scale-[1.02]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Owner / Admin</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('student');
              setEmailOrPhone('');
              setPassword('');
              setError('');
              setIsFirebaseDisabledError(false);
            }}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all ${
              !isAdmin
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white shadow-lg shadow-teal-500/30 scale-[1.02]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Student Portal</span>
          </button>
        </div>

        {/* Portal Header Badge */}
        <div className="flex items-center justify-between mb-5">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
            isAdmin
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}>
            {isAdmin ? (
              <>
                <Shield className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span>ADMIN PANEL ACCESS</span>
              </>
            ) : (
              <>
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>STUDENT RESIDENTIAL PORTAL</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs font-medium text-slate-400">
            {isFirebaseConfigured ? (
              <span className="flex items-center gap-1 text-emerald-400" title="Project: sakhare-hostel-app">
                <CheckCircle2 className="w-3.5 h-3.5" /> Firebase Live
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400/90">
                <CheckCircle2 className="w-3.5 h-3.5" /> System Mode
              </span>
            )}
          </div>
        </div>

        {/* Portal Title & Branding */}
        <div className="text-center mb-6">
          <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center shadow-lg mb-3 transition-all ${
            isAdmin
              ? 'bg-gradient-to-tr from-amber-500 via-orange-600 to-indigo-600 shadow-orange-500/20'
              : 'bg-gradient-to-tr from-emerald-500 via-teal-600 to-indigo-600 shadow-teal-500/20'
          }`}>
            {isAdmin ? (
              <Building2 className="w-7 h-7 text-white" />
            ) : (
              <GraduationCap className="w-7 h-7 text-white" />
            )}
          </div>

          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {isAdmin ? 'Owner & Admin Control Panel' : 'Student Residential Portal'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isAdmin
              ? 'Management Dashboard for Sandeep Sakhare'
              : 'Resident Portal: Rent Payments, Complaints & Requests'}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-semibold space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>

            {isFirebaseDisabledError && (
              <div className="pt-2 border-t border-rose-500/20 space-y-2">
                <a
                  href="https://console.firebase.google.com/project/sakhare-hostel-app/authentication/providers"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] text-amber-300 hover:underline font-bold"
                >
                  <span>Open Firebase Console → Enable Email/Password</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  type="button"
                  onClick={handleBypassLogin}
                  className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-xl text-amber-200 font-bold text-[11px] transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Proceed to {isAdmin ? 'Admin Panel' : 'Student Panel'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              {isAdmin ? 'Admin Email Address' : 'Student Mobile Phone Number'}
            </label>
            <div className="relative">
              {isAdmin ? (
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              ) : (
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              )}
              <input
                type={isAdmin ? 'email' : 'text'}
                required
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder={isAdmin ? 'kskrushna1615@gmail.com' : 'e.g. 9876543210'}
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-950 border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                  isAdmin ? 'border-slate-800 focus:border-amber-500' : 'border-slate-800 focus:border-emerald-500'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-950 border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                  isAdmin ? 'border-slate-800 focus:border-amber-500' : 'border-slate-800 focus:border-emerald-500'
                }`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-xs text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
              isAdmin
                ? 'bg-gradient-to-r from-amber-500 via-orange-600 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 shadow-orange-500/25'
                : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 shadow-teal-500/25'
            }`}
          >
            <span>
              {loading
                ? 'Authenticating...'
                : isAdmin
                ? 'Login to Admin Control Panel'
                : 'Login to Student Portal'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          New Student?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-amber-400 font-semibold hover:underline"
          >
            Register Student Mobile Account
          </button>
        </p>

      </div>
    </div>
  );
}
