import React, { useState } from 'react';
import { Sun, Moon, Bell, LogOut, User as UserIcon, Calendar, Check } from 'lucide-react';
import { User, Notification } from '../types';

interface TopbarProps {
  user: User;
  onLogout: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  notifications: Notification[];
  onMarkNotificationRead: (id: string) => void;
}

export default function Topbar({
  user,
  onLogout,
  darkMode,
  onToggleDarkMode,
  notifications,
  onMarkNotificationRead,
}: TopbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadNotifications = notifications.filter(n => !n.read);

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'complaint': return 'text-rose-500 bg-rose-50 dark:bg-rose-950/30';
      case 'inventory': return 'text-amber-500 bg-amber-50 dark:bg-amber-950/30';
      case 'festival': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30';
      case 'announcement': return 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30';
      default: return 'text-blue-500 bg-blue-50 dark:bg-blue-950/30';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass shadow-sm px-6 py-3 flex items-center justify-between transition-colors duration-300">
      <div className="flex items-center space-x-3">
        <div className="bg-gradient-to-r from-blue-600 to-emerald-500 p-2 rounded-xl text-white shadow-md">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-emerald-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-emerald-300">
            Hostel Food Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:block">
            Standard Local Time • {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Dark/Light Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
          title="Toggle Theme"
          id="btn-toggle-theme"
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition relative"
            title="Notifications"
            id="btn-notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
            )}
            {unreadNotifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 max-h-[400px] overflow-y-auto glass-premium shadow-2xl rounded-2xl p-4 border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="flex items-center justify-between border-b pb-2 mb-3 dark:border-slate-800">
                <span className="font-semibold text-sm">Notifications ({unreadNotifications.length})</span>
                {unreadNotifications.length > 0 && (
                  <span className="text-xs text-slate-400">Mark read to dismiss</span>
                )}
              </div>

              {notifications.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No recent alerts</p>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 8).map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 transition ${
                        notif.read ? 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-100 dark:border-slate-800/50 opacity-60' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${getNotificationColor(notif.type)}`}>
                        <Bell className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{notif.title}</div>
                        <p className="text-slate-500 dark:text-slate-400 mt-0.5">{notif.content}</p>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          {new Date(notif.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {!notif.read && (
                        <button
                          onClick={() => onMarkNotificationRead(notif.id)}
                          className="text-emerald-500 hover:bg-emerald-50 p-1 rounded-md transition self-start"
                          title="Mark Read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="flex items-center space-x-3 border-l pl-4 dark:border-slate-800">
          <div className="relative">
            {user.profilePic ? (
              <img
                src={user.profilePic}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-emerald-500 text-white flex items-center justify-center font-bold text-sm">
                {user.name.charAt(0)}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-950" />
          </div>
          <div className="hidden md:block">
            <h4 className="font-semibold text-xs leading-none">{user.name}</h4>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize font-mono leading-none block mt-0.5">
              {user.role === 'staff' ? 'Mess Staff' : user.role}
            </span>
          </div>
          <button
            onClick={onLogout}
            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition"
            title="Log Out"
            id="btn-logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
