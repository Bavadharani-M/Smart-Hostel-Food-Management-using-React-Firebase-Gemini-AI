import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Lock, 
  Mail, 
  Phone, 
  MapPin, 
  Sparkles, 
  X, 
  CheckCircle2, 
  Bell, 
  Settings, 
  Camera,
  UtensilsCrossed,
  Eye,
  EyeOff
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import StudentDashboard from './components/StudentDashboard';
import StaffDashboard from './components/StaffDashboard';
import WardenDashboard from './components/WardenDashboard';
import AdminDashboard from './components/AdminDashboard';
import { User, Notification, UserRole } from './types';

export default function App() {
  // Authentication states
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showForgotPwd, setShowForgotPwd] = useState(false);

  // Form input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [hostelName, setHostelName] = useState('Mandakini Hostel');
  const [forgotEmail, setForgotEmail] = useState('');

  // UI States
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Profile Edit Form State
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRoomNo, setEditRoomNo] = useState('');
  const [editHostelName, setEditHostelName] = useState('Mandakini Hostel');
  const [editProfilePic, setEditProfilePic] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Global Toast Alert state
  const [toast, setToast] = useState<{ title: string; content: string } | null>(null);

  // Retrieve active session from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('hostel_user');
    const storedToken = localStorage.getItem('hostel_token');
    const storedTheme = localStorage.getItem('hostel_dark_theme');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    if (storedTheme === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Fetch notifications for the active user session
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        const safeData = Array.isArray(data) ? data : [];
        // filter notifications for 'all' or active user ID
        const userNotifs = safeData.filter((n: Notification) => n.userId === 'all' || n.userId === user.id);
        setNotifications(userNotifs);
      }
    } catch (err) {
      console.error("Failed to load alerts:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000); // sync notifications every 20 seconds
    return () => clearInterval(interval);
  }, [user]);

  // Handle Mark Notification as Read
  const handleMarkNotificationRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Dark Mode
  const handleToggleDarkMode = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    localStorage.setItem('hostel_dark_theme', String(nextMode));
    if (nextMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Toast Notification Trigger
  const triggerNotification = (title: string, content: string) => {
    setToast({ title, content });
    setTimeout(() => {
      setToast(null);
    }, 5500);
    // Refresh alerts count as well
    fetchNotifications();
  };

  // Handle Login Submit
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('hostel_user', JSON.stringify(data.user));
        localStorage.setItem('hostel_token', data.token);
        setActiveTab('dashboard');
        triggerNotification('Welcome back!', `Logged in as ${data.user.name}.`);
      } else {
        alert(data.message || 'Invalid username or password.');
      }
    } catch (err) {
      console.error("Authentication failed:", err);
      alert('Connection refused. Please try again.');
    }
  };

  // Handle Registration Submit
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
          role: 'student', // Students are allowed self-service registration
          roomNo,
          hostelName,
          phone
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Auto-login after signup
        setUser(data.user);
        setToken(`mock-jwt-${data.user.id}`);
        localStorage.setItem('hostel_user', JSON.stringify(data.user));
        localStorage.setItem('hostel_token', `mock-jwt-${data.user.id}`);
        setIsRegistering(false);
        setActiveTab('dashboard');
        triggerNotification('Account Registered 🎉', `Welcome to Hostel Dining, ${data.user.name}!`);
      } else {
        alert(data.message || 'Failed to complete registration.');
      }
    } catch (err) {
      console.error("Signup failed:", err);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerNotification('Password Reset Sent 📧', 'Please check your inbox for instructions.');
        setShowForgotPwd(false);
        setForgotEmail('');
      } else {
        alert(data.message || 'Email not found.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger Profile Modal Loader
  const handleOpenProfileModal = () => {
    if (!user) return;
    setEditName(user.name);
    setEditPhone(user.phone || '');
    setEditRoomNo(user.roomNo || '');
    setEditHostelName(user.hostelName || 'Mandakini Hostel');
    setEditProfilePic(user.profilePic || '');
    setShowProfileModal(true);
  };

  // Save updated profile info
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: editName,
          phone: editPhone,
          roomNo: user.role === 'student' ? editRoomNo : undefined,
          hostelName: user.role === 'student' || user.role === 'warden' ? editHostelName : undefined,
          profilePic: editProfilePic
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        localStorage.setItem('hostel_user', JSON.stringify(data.user));
        setShowProfileModal(false);
        triggerNotification('Profile Updated ✅', 'Your settings variables have been refreshed.');
      }
    } catch (err) {
      console.error("Failed profile edit:", err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Log Out
  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('hostel_user');
    localStorage.removeItem('hostel_token');
    triggerNotification('Logged Out', 'Your security session was safely terminated.');
  };

  // Render correct dashboard component
  const renderDashboardByRole = () => {
    if (!user) return null;
    switch (user.role) {
      case 'student':
        return (
          <StudentDashboard
            userId={user.id}
            userName={user.name}
            roomNo={user.roomNo}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            triggerNotification={triggerNotification}
          />
        );
      case 'staff':
        return (
          <StaffDashboard
            userId={user.id}
            userName={user.name}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            triggerNotification={triggerNotification}
          />
        );
      case 'warden':
        return (
          <WardenDashboard
            userId={user.id}
            userName={user.name}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            triggerNotification={triggerNotification}
          />
        );
      case 'admin':
        return (
          <AdminDashboard
            userId={user.id}
            userName={user.name}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            triggerNotification={triggerNotification}
          />
        );
      default:
        return <div className="p-8 text-center text-slate-400">Access Denied. Contact support.</div>;
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col bg-gradient-to-br from-blue-100 via-emerald-50 to-white dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-900 transition-colors duration-300">
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-400/10 dark:bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Global Toast Alert */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 glass-premium p-4 rounded-2xl border border-emerald-500/20 shadow-2xl flex items-start space-x-3 max-w-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wider">{toast.title}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{toast.content}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-300 hover:text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* RENDER VIEW PORTAL */}
      {!user ? (
        // NOT LOGGED IN - SHOW AUTH SCREEN
        <div className="flex-1 flex items-center justify-center p-4 md:p-6">
          <div className="w-full max-w-md glass-premium rounded-[2.5rem] p-6 md:p-8 shadow-2xl border border-white/50 dark:border-slate-800/80">
            
            {/* Header Brand */}
            <div className="flex flex-col items-center space-y-3 mb-8">
              <div className="bg-gradient-to-tr from-blue-600 to-emerald-500 p-3.5 rounded-[1.25rem] text-white shadow-lg">
                <UtensilsCrossed className="w-8 h-8 animate-pulse" />
              </div>
              <h2 className="text-2xl font-black text-center bg-gradient-to-r from-blue-700 to-emerald-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-emerald-300">
                Hostel Food Management
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono text-center">
                AI-Powered Smart Catering Services
              </p>
            </div>

            {/* Forgot Password View */}
            {showForgotPwd ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="text-center space-y-1 mb-4">
                  <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">Password Recovery</h3>
                  <p className="text-[11px] text-slate-400">Input registered email to receive access instructions.</p>
                </div>

                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Registered Email"
                    className="w-full pl-11 pr-4 py-3 bg-white/40 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-md"
                >
                  Retrieve Access Key
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowForgotPwd(false)}
                    className="text-xs text-slate-400 hover:underline"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            ) : isRegistering ? (
              // STUDENT SIGNUP FORM
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="text-center space-y-1">
                  <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">Student Portal Registration</h3>
                  <p className="text-[11px] text-slate-400">Initialize standard credentials immediately.</p>
                </div>

                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Campus Email"
                    className="w-full pl-11 pr-4 py-3 bg-white/40 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password Profile"
                    className="w-full pl-11 pr-4 py-3 bg-white/40 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full pl-11 pr-4 py-3 bg-white/40 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={roomNo}
                      onChange={(e) => setRoomNo(e.target.value)}
                      placeholder="Room No"
                      className="w-full pl-11 pr-4 py-3 bg-white/40 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <select
                      value={hostelName}
                      onChange={(e) => setHostelName(e.target.value)}
                      className="w-full p-3 bg-white/40 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="Mandakini Hostel">Mandakini</option>
                      <option value="Ganga Hostel">Ganga</option>
                      <option value="Yamuna Hostel">Yamuna</option>
                    </select>
                  </div>
                </div>

                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Mobile contact (+91)"
                    className="w-full pl-11 pr-4 py-3 bg-white/40 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-md transition"
                >
                  Register Resident Card
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRegistering(false)}
                    className="text-xs text-slate-500 hover:underline"
                  >
                    Already have an account? Sign In
                  </button>
                </div>
              </form>
            ) : (
              // SECURE LOGIN SYSTEM
              <form onSubmit={handleLogin} className="space-y-4">
                
                <div className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Username Email"
                      className="w-full pl-11 pr-10 py-3 bg-white/40 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-100"
                      required
                      id="input-email"
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password Key"
                      className="w-full pl-11 pr-10 py-3 bg-white/40 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-100"
                      required
                      id="input-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <button
                    type="button"
                    onClick={() => setShowForgotPwd(true)}
                    className="hover:underline"
                  >
                    Forgot Password?
                  </button>
                  <span className="font-mono text-[10px] text-slate-400">Secure Access</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-lg hover:from-blue-700 hover:to-emerald-600 transition"
                  id="btn-login-submit"
                >
                  Verify Access Card
                </button>

                <div className="text-center space-y-1.5 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                  <button
                    type="button"
                    onClick={() => setIsRegistering(true)}
                    className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    Self-Register Resident Account
                  </button>
                  <p className="text-[10px] text-slate-400">
                    Students can self-register. Staff & Warden are registered by Admin.
                  </p>
                </div>

                {/* Quick login reference help */}
                <div className="p-3 bg-slate-100/50 dark:bg-slate-900/40 rounded-xl border mt-4 text-[10px] space-y-1 text-slate-500">
                  <p className="font-bold text-center">🔐 DEMO CREDENTIALS:</p>
                  <p>• Student: <span className="font-mono">student@hostel.com</span> / password</p>
                  <p>• Mess Chef: <span className="font-mono">staff@hostel.com</span> / password</p>
                  <p>• Warden: <span className="font-mono">warden@hostel.com</span> / password</p>
                  <p>• Administrator: <span className="font-mono">admin@hostel.com</span> / password</p>
                </div>
              </form>
            )}

          </div>
        </div>
      ) : (
        // LOGGED IN VIEWPORT
        <div className="flex-1 flex flex-col md:flex-row">
          
          {/* Topbar + Navigation */}
          <div className="flex-1 flex flex-col min-w-0">
            <Topbar
              user={user}
              onLogout={handleLogout}
              darkMode={darkMode}
              onToggleDarkMode={handleToggleDarkMode}
              notifications={notifications}
              onMarkNotificationRead={handleMarkNotificationRead}
            />

            <div className="flex-1 flex flex-col md:flex-row">
              {/* Sidebar */}
              <Sidebar
                role={user.role}
                activeTab={activeTab}
                setActiveTab={(tab) => {
                  setActiveTab(tab);
                  // Close modal if navigation occurs
                  setShowProfileModal(false);
                }}
              />

              {/* Main Content Area */}
              <main className="flex-1 overflow-y-auto relative p-4 md:p-6">
                
                {/* Floating Profile Action shortcut */}
                <div className="absolute top-4 right-4 z-10 hidden sm:block">
                  <button
                    onClick={handleOpenProfileModal}
                    className="p-2.5 bg-white/50 hover:bg-white dark:bg-slate-900/60 dark:hover:bg-slate-900 rounded-xl border text-slate-600 hover:text-blue-500 transition shadow-sm"
                    title="Account Profile Management"
                    id="btn-edit-profile-shortcut"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>

                {renderDashboardByRole()}
              </main>
            </div>
          </div>
        </div>
      )}

      {/* PROFILE SECTOR SETTINGS EDIT MODAL */}
      {showProfileModal && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md glass-premium rounded-[2rem] p-6 shadow-2xl border border-white/40 dark:border-slate-800/80 animate-in zoom-in-95 duration-200 relative">
            
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <Settings className="w-6 h-6 text-blue-600 animate-spin-slow" />
              <h3 className="font-black text-lg text-slate-800 dark:text-slate-100">Profile Management</h3>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              
              {/* Profile image picker */}
              <div className="flex items-center space-x-4 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed">
                <div className="relative">
                  {editProfilePic ? (
                    <img 
                      src={editProfilePic} 
                      alt="avatar" 
                      className="w-12 h-12 rounded-full object-cover border"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                      {editName.charAt(0)}
                    </div>
                  )}
                  <label htmlFor="modal-avatar-file" className="absolute bottom-0 right-0 p-1 bg-blue-600 text-white rounded-full cursor-pointer shadow-md hover:bg-blue-700">
                    <Camera className="w-3 h-3" />
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    id="modal-avatar-file"
                    className="hidden"
                    onChange={handleProfileImageUpload}
                  />
                </div>
                <div className="text-xs">
                  <span className="font-bold block">Avatar Photo</span>
                  <span className="text-slate-400 mt-0.5 block">Click camera icon to upload file.</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Filer Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                  required
                />
              </div>

              {user.role === 'student' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Room No</label>
                    <input
                      type="text"
                      value={editRoomNo}
                      onChange={(e) => setEditRoomNo(e.target.value)}
                      className="w-full mt-1 p-2.5 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Hostel Block</label>
                    <select
                      value={editHostelName}
                      onChange={(e) => setEditHostelName(e.target.value)}
                      className="w-full mt-1 p-2.5 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                    >
                      <option value="Mandakini Hostel">Mandakini</option>
                      <option value="Ganga Hostel">Ganga</option>
                      <option value="Yamuna Hostel">Yamuna</option>
                    </select>
                  </div>
                </div>
              )}

              {user.role === 'warden' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Warden block responsibility</label>
                  <select
                    value={editHostelName}
                    onChange={(e) => setEditHostelName(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-white dark:bg-slate-900 border rounded-xl text-xs font-semibold"
                  >
                    <option value="Mandakini Hostel">Mandakini Hostel</option>
                    <option value="Ganga Hostel">Ganga Hostel</option>
                    <option value="Yamuna Hostel">Yamuna Hostel</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Phone contact (+91)</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 text-xs font-semibold flex-1 text-slate-400"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-bold rounded-xl text-xs hover:from-blue-700 hover:to-emerald-600 shadow-md flex-1 transition disabled:opacity-50"
                >
                  {savingProfile ? 'Saving...' : 'Save Profiles'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
