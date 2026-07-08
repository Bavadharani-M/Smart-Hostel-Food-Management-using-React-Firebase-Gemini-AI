import React from 'react';
import { 
  Home, 
  Calendar, 
  CheckSquare, 
  Sparkles, 
  ShieldAlert, 
  Package, 
  Clock, 
  TrendingUp, 
  FileText, 
  Users, 
  Bell, 
  Utensils 
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  role: UserRole;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ role, activeTab, setActiveTab }: SidebarProps) {
  
  // Define nav links per role
  const getLinks = () => {
    switch (role) {
      case 'student':
        return [
          { id: 'dashboard', name: 'Meal Dashboard', icon: Utensils },
          { id: 'menu', name: 'Weekly Menu', icon: Calendar },
          { id: 'attendance', name: 'My Attendance', icon: CheckSquare },
          { id: 'ai-recs', name: 'AI Seasonal Food', icon: Sparkles },
          { id: 'complaints', name: 'Complaints Box', icon: ShieldAlert },
        ];
      case 'staff':
        return [
          { id: 'dashboard', name: 'Mess Control', icon: Utensils },
          { id: 'inventory', name: 'Stock & Grocery', icon: Package },
          { id: 'timings', name: 'Serving Timings', icon: Clock },
        ];
      case 'warden':
        return [
          { id: 'dashboard', name: 'Warden Portal', icon: Home },
          { id: 'attendance-analytics', name: 'Attendance Logs', icon: TrendingUp },
          { id: 'feedback-sentiment', name: 'AI Feedback Audit', icon: FileText },
          { id: 'complaints-inbox', name: 'Student Complaints', icon: ShieldAlert },
        ];
      case 'admin':
        return [
          { id: 'dashboard', name: 'Admin Console', icon: Home },
          { id: 'manage-users', name: 'User Accounts', icon: Users },
          { id: 'manage-menus', name: 'Master Menu', icon: Calendar },
          { id: 'manage-inventory', name: 'Inventory Master', icon: Package },
          { id: 'manage-announcements', name: 'Announcements', icon: Bell },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <nav className="w-full md:w-64 shrink-0 glass border-r border-slate-100 dark:border-slate-800/80 p-4 flex flex-row md:flex-col justify-start md:justify-start gap-1 overflow-x-auto md:overflow-x-visible md:min-h-[calc(100vh-64px)] transition-all">
      <div className="hidden md:block mb-6 px-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Main Navigation</span>
      </div>
      
      <div className="flex flex-row md:flex-col w-full gap-1.5 min-w-max md:min-w-0">
        {links.map((link) => {
          const IconComponent = link.icon;
          const isActive = activeTab === link.id;
          
          return (
            <button
              key={link.id}
              onClick={() => setActiveTab(link.id)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition duration-200 w-full ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100/50 dark:text-slate-300 dark:hover:bg-slate-800/50'
              }`}
              id={`nav-link-${link.id}`}
            >
              <IconComponent className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
              <span className="text-xs sm:text-sm">{link.name}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
