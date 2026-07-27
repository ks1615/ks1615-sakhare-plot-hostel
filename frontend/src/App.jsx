import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import LoginModal from './components/auth/LoginModal';
import RegisterModal from './components/auth/RegisterModal';

// Owner Components
import OwnerDashboard from './components/owner/OwnerDashboard';
import StudentManagement from './components/owner/StudentManagement';
import RoomManagement from './components/owner/RoomManagement';
import FeeTracking from './components/owner/FeeTracking';
import ComplaintManagement from './components/owner/ComplaintManagement';
import LeaveApproval from './components/owner/LeaveApproval';
import NoticeManagement from './components/owner/NoticeManagement';

// Student Components
import StudentDashboard from './components/student/StudentDashboard';
import StudentFeeHistory from './components/student/StudentFeeHistory';
import StudentComplaints from './components/student/StudentComplaints';
import StudentLeaveRequests from './components/student/StudentLeaveRequests';
import StudentNoticeBoard from './components/student/StudentNoticeBoard';

export default function App() {
  const { user, role, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm font-semibold">
        Initializing Sakhare Plot Hostel System...
      </div>
    );
  }

  // Unauthenticated View
  if (!user) {
    return authView === 'login' ? (
      <LoginModal onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <RegisterModal onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  // Render Owner Content Based on Tab
  const renderOwnerContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <OwnerDashboard setActiveTab={setActiveTab} />;
      case 'students':
        return <StudentManagement />;
      case 'rooms':
        return <RoomManagement />;
      case 'payments':
        return <FeeTracking />;
      case 'complaints':
        return <ComplaintManagement />;
      case 'leaves':
        return <LeaveApproval />;
      case 'notices':
        return <NoticeManagement />;
      default:
        return <OwnerDashboard setActiveTab={setActiveTab} />;
    }
  };

  // Render Student Content Based on Tab
  const renderStudentContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <StudentDashboard setActiveTab={setActiveTab} />;
      case 'payments':
        return <StudentFeeHistory />;
      case 'complaints':
        return <StudentComplaints />;
      case 'leaves':
        return <StudentLeaveRequests />;
      case 'notices':
        return <StudentNoticeBoard />;
      default:
        return <StudentDashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {role === 'owner' ? renderOwnerContent() : renderStudentContent()}
        </main>
      </div>
    </div>
  );
}
