import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Users, 
  Calendar, 
  Package, 
  Bell, 
  Trash2, 
  Plus, 
  Sparkles, 
  TrendingUp, 
  FileText, 
  RefreshCw, 
  UserPlus, 
  Edit3, 
  AlertTriangle,
  Info,
  CalendarDays,
  Activity
} from 'lucide-react';
import { User, MenuItem, InventoryItem, Announcement, AIWeeklyPrediction } from '../types';

interface AdminDashboardProps {
  userId: string;
  userName: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  triggerNotification: (title: string, content: string) => void;
}

interface MonthlyReport {
  month: string;
  totalFeedbacksProcessed: number;
  overallQualityScore: number;
  scores: {
    taste: number;
    hygiene: number;
    quantity: number;
    variety: number;
    freshness: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  analysisText: string;
  source: string;
}

export default function AdminDashboard({
  userId,
  userName,
  activeTab,
  setActiveTab,
  triggerNotification
}: AdminDashboardProps) {
  // Lists
  const [users, setUsers] = useState<User[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // User form state
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('password');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'student' | 'staff' | 'warden' | 'admin'>('student');
  const [newUserRoom, setNewUserRoom] = useState('');
  const [newUserHostel, setNewUserHostel] = useState('Mandakini Hostel');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [submittingUser, setSubmittingUser] = useState(false);

  // Menu form state
  const [menuDay, setMenuDay] = useState('Monday');
  const [menuDate, setMenuDate] = useState(new Date().toISOString().split('T')[0]);
  const [menuType, setMenuType] = useState<'breakfast' | 'lunch' | 'snacks' | 'dinner'>('breakfast');
  const [menuItemsText, setMenuItemsText] = useState('');
  const [menuCalories, setMenuCalories] = useState(400);
  const [menuProtein, setMenuProtein] = useState(12);
  const [menuCarbs, setMenuCarbs] = useState(60);
  const [menuFat, setMenuFat] = useState(10);
  const [isSpecial, setIsSpecial] = useState(false);
  const [festivalName, setFestivalName] = useState('');
  const [menuStatus, setMenuStatus] = useState<'Planned' | 'Preparing' | 'Ready' | 'Served'>('Planned');
  const [menuQty, setMenuQty] = useState('200 servings');
  const [menuTimings, setMenuTimings] = useState('07:30 AM - 09:00 AM');
  const [submittingMenu, setSubmittingMenu] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);

  // Inventory form state
  const [invName, setInvName] = useState('');
  const [invCategory, setInvCategory] = useState<'groceries' | 'vegetables' | 'dairy' | 'others'>('groceries');
  const [invQty, setInvQty] = useState(100);
  const [invUnit, setInvUnit] = useState('kg');
  const [invMinStock, setInvMinStock] = useState(25);
  const [invCost, setInvCost] = useState(3000);
  const [submittingInv, setSubmittingInv] = useState(false);
  const [editingInvId, setEditingInvId] = useState<string | null>(null);

  // Announcement form state
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annType, setAnnType] = useState<'info' | 'warning' | 'festival' | 'holiday'>('info');
  const [submittingAnn, setSubmittingAnn] = useState(false);

  // AI Feature States
  const [predictionSeason, setPredictionSeason] = useState<'Summer' | 'Winter' | 'Rainy' | 'Exam' | 'Festivals'>('Summer');
  const [aiPrediction, setAiPrediction] = useState<AIWeeklyPrediction | null>(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);

  const [aiReport, setAiReport] = useState<MonthlyReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const [selectedFestival, setSelectedFestival] = useState('Diwali');
  const [generatedFestMenu, setGeneratedFestMenu] = useState<any>(null);
  const [loadingFestMenu, setLoadingFestMenu] = useState(false);

  // Fetch all listings
  const fetchData = async () => {
    try {
      const [resUsers, resMenus, resInv, resAnn] = await Promise.all([
        fetch('/api/users').then(r => r.ok ? r.json() : []),
        fetch('/api/menus').then(r => r.ok ? r.json() : []),
        fetch('/api/inventory').then(r => r.ok ? r.json() : []),
        fetch('/api/announcements').then(r => r.ok ? r.json() : []),
      ]);
      setUsers(Array.isArray(resUsers) ? resUsers : []);
      setMenus(Array.isArray(resMenus) ? resMenus : []);
      setInventory(Array.isArray(resInv) ? resInv : []);
      setAnnouncements(Array.isArray(resAnn) ? resAnn : []);
    } catch (err) {
      console.error('Error loading admin dashboards:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // AI Predict Stocks
  const runAIPrediction = async () => {
    setLoadingPrediction(true);
    try {
      const res = await fetch('/api/ai/weekly-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setAiPrediction(data);
      triggerNotification('AI Prediction Ready 🔮', 'Stock optimization model completed successfully.');
    } catch (err) {
      console.error('Failed stock forecast:', err);
    } finally {
      setLoadingPrediction(false);
    }
  };

  // AI Audit Quality Report
  const runAIQualityReport = async () => {
    setLoadingReport(true);
    try {
      const res = await fetch('/api/ai/monthly-quality-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setAiReport(data);
      triggerNotification('AI Quality Audit Generated 📊', 'Student sentiments analyzed & suggestions populated.');
    } catch (err) {
      console.error('Failed quality audit:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  // AI Festival menu generator
  const runAIFestivalMenu = async (fest: string) => {
    setLoadingFestMenu(true);
    try {
      const res = await fetch('/api/ai/festival-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ festivalName: fest })
      });
      const data = await res.json();
      setGeneratedFestMenu(data);
      triggerNotification('Festival Menu Generated 🍲', `AI suggested traditional recipe variables for ${fest}.`);
    } catch (err) {
      console.error('Failed festival menu:', err);
    } finally {
      setLoadingFestMenu(false);
    }
  };

  // Save generated special menu back to master menus
  const handleSaveFestivalMenu = async () => {
    if (!generatedFestMenu) return;
    try {
      const res = await fetch('/api/menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day: 'Friday',
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days ahead
          type: 'lunch',
          items: generatedFestMenu.items,
          calories: generatedFestMenu.calories || 900,
          protein: generatedFestMenu.protein || 24,
          carbs: generatedFestMenu.carbs || 120,
          fat: generatedFestMenu.fat || 30,
          isSpecial: true,
          festivalName: generatedFestMenu.festival || `${selectedFestival} Feast`,
          status: 'Planned',
          quantityPrepared: '250 servings',
          timings: generatedFestMenu.timings || '12:00 PM - 02:30 PM'
        })
      });
      if (res.ok) {
        triggerNotification('Festival Feast Saved 💾', 'The proposed special menu has been published to the master planner.');
        setGeneratedFestMenu(null);
        fetchData();
      }
    } catch (err) {
      console.error('Failed saving festival menu:', err);
    }
  };

  // Add User Account
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail.trim() || !newUserName.trim() || !userPassword) return;
    setSubmittingUser(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          password: userPassword,
          name: newUserName,
          role: newUserRole,
          roomNo: newUserRole === 'student' ? newUserRoom : undefined,
          hostelName: newUserRole === 'student' || newUserRole === 'warden' ? newUserHostel : undefined,
          phone: newUserPhone
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerNotification('User Account Created 👤', `Registered ${newUserName} as a ${newUserRole}.`);
        setUserEmail('');
        setNewUserName('');
        setNewUserRoom('');
        setNewUserPhone('');
        fetchData();
      } else {
        alert(data.message || 'Failed to register account.');
      }
    } catch (err) {
      console.error('Failed to create account:', err);
    } finally {
      setSubmittingUser(false);
    }
  };

  // Delete User Account
  const handleDeleteUser = async (id: string) => {
    if (id === userId) {
      alert('Cannot delete yourself!');
      return;
    }
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        triggerNotification('User Purged 🗑️', 'Account has been removed from database.');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create or Update Master Menu Item
  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuItemsText.trim()) return;
    setSubmittingMenu(true);
    const payload = {
      day: menuDay,
      date: menuDate,
      type: menuType,
      items: menuItemsText,
      calories: Number(menuCalories),
      protein: Number(menuProtein),
      carbs: Number(menuCarbs),
      fat: Number(menuFat),
      isSpecial,
      festivalName: isSpecial ? festivalName : undefined,
      status: menuStatus,
      quantityPrepared: menuQty,
      timings: menuTimings
    };

    try {
      let res;
      if (editingMenuId) {
        res = await fetch(`/api/menus/${editingMenuId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/menus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        triggerNotification(
          editingMenuId ? 'Menu Item Updated 🍳' : 'Meal Planned Successfully 🍳',
          `The meal scheduled for ${menuDate} (${menuType}) has been logged.`
        );
        setMenuItemsText('');
        setFestivalName('');
        setIsSpecial(false);
        setEditingMenuId(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingMenu(false);
    }
  };

  // Edit Menu loader
  const loadMenuToEdit = (m: MenuItem) => {
    setEditingMenuId(m.id);
    setMenuDay(m.day);
    setMenuDate(m.date);
    setMenuType(m.type);
    setMenuItemsText(m.items);
    setMenuCalories(m.calories);
    setMenuProtein(m.protein);
    setMenuCarbs(m.carbs);
    setMenuFat(m.fat);
    setIsSpecial(!!m.isSpecial);
    setFestivalName(m.festivalName || '');
    setMenuStatus(m.status || 'Planned');
    setMenuQty(m.quantityPrepared || '200 servings');
    setMenuTimings(m.timings || '07:30 AM - 09:00 AM');
  };

  // Delete Menu Item
  const handleDeleteMenu = async (id: string) => {
    if (!confirm('Delete this meal from calendar?')) return;
    try {
      const res = await fetch(`/api/menus/${id}`, { method: 'DELETE' });
      if (res.ok) {
        triggerNotification('Menu Deleted 🗑️', 'The meal has been removed from hostel planner.');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save or Update Inventory stock item
  const handleSaveInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invName.trim()) return;
    setSubmittingInv(true);
    const payload = {
      name: invName,
      category: invCategory,
      quantity: Number(invQty),
      unit: invUnit,
      minStock: Number(invMinStock),
      cost: Number(invCost),
      lastPurchased: new Date().toISOString().split('T')[0]
    };

    try {
      let res;
      if (editingInvId) {
        res = await fetch(`/api/inventory/${editingInvId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        triggerNotification(
          editingInvId ? 'Ingredient Modified 📦' : 'Commodity Logged 📦',
          `Updated stock master file for: ${invName}.`
        );
        setInvName('');
        setInvQty(100);
        setInvCost(3000);
        setEditingInvId(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingInv(false);
    }
  };

  const loadInvToEdit = (item: InventoryItem) => {
    setEditingInvId(item.id);
    setInvName(item.name);
    setInvCategory(item.category);
    setInvQty(item.quantity);
    setInvUnit(item.unit);
    setInvMinStock(item.minStock);
    setInvCost(item.cost || 0);
  };

  const handleDeleteInventory = async (id: string) => {
    if (!confirm('Remove ingredient from master ledger?')) return;
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
      if (res.ok) {
        triggerNotification('Commodity Deleted 🗑️', 'Stock record cleared.');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Publish Announcement
  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    setSubmittingAnn(true);
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: annTitle,
          content: annContent,
          date: new Date().toISOString().split('T')[0],
          author: userName,
          role: 'admin',
          type: annType
        })
      });
      if (res.ok) {
        triggerNotification('Announcement Published 📢', `Broadcasted: "${annTitle}" successfully.`);
        setAnnTitle('');
        setAnnContent('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingAnn(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Withdraw announcement?')) return;
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
      if (res.ok) {
        triggerNotification('Notice Withdrawn 🗑️', 'Announcement post removed.');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 animate-in fade-in duration-300">
      
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-800 via-indigo-700 to-slate-900 rounded-3xl text-white p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
        <div className="relative z-10 space-y-1.5">
          <span className="bg-white/20 text-white font-semibold text-xs px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md">
            SuperAdmin Command Terminal
          </span>
          <h2 className="text-2xl md:text-4xl font-black tracking-tight">
            Console Administrator: {userName}
          </h2>
          <p className="text-sm text-blue-100 max-w-2xl">
            Control master settings, create authorized staff credentials, verify logistics variables, and run predictive AI models for catering metrics.
          </p>
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* AI Tools Panel (Left col-span-2) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* AI Predictions & Audits Launchpad */}
            <div className="glass-premium rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">AI Logistic Optimizer & Food Audits</h3>
              </div>
              <p className="text-xs text-slate-400">
                Trigger predictive logistics calculation models on live kitchen attendance matrices, or compile student review sentiments instantly.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={runAIPrediction}
                  disabled={loadingPrediction}
                  className="p-4 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 rounded-2xl text-center transition flex flex-col items-center justify-center space-y-2 disabled:opacity-50"
                >
                  <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold block">Predict Weekly Stocks</span>
                  <span className="text-[10px] text-slate-400">Logistics forecast</span>
                </button>

                <button
                  onClick={runAIQualityReport}
                  disabled={loadingReport}
                  className="p-4 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-center transition flex flex-col items-center justify-center space-y-2 disabled:opacity-50"
                >
                  <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold block">AI Quality Audit</span>
                  <span className="text-[10px] text-slate-400">Sentiment reports</span>
                </button>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 border rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center space-x-1.5 mb-2">
                    <CalendarDays className="w-4.5 h-4.5 text-emerald-500" />
                    <span className="text-xs font-bold">Fest Specials</span>
                  </div>
                  <select
                    value={selectedFestival}
                    onChange={(e) => setSelectedFestival(e.target.value)}
                    className="p-1.5 bg-white dark:bg-slate-950 border rounded-xl text-xs"
                  >
                    <option value="Diwali">Diwali Feast</option>
                    <option value="Holi">Holi Specials</option>
                    <option value="Eid">Eid Biryani</option>
                    <option value="Pongal">Pongal Meals</option>
                  </select>
                  <button
                    onClick={() => runAIFestivalMenu(selectedFestival)}
                    disabled={loadingFestMenu}
                    className="mt-2 w-full py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {loadingFestMenu ? 'Generating...' : 'Generate Feast'}
                  </button>
                </div>
              </div>

              {/* Display AI Results */}
              {loadingPrediction && (
                <div className="flex items-center justify-center py-6 space-x-3 font-mono text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                  <span>Calculating optimized grocery kilograms with Gemini API...</span>
                </div>
              )}

              {aiPrediction && !loadingPrediction && (
                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-3 animate-in fade-in">
                  <div className="flex justify-between items-center border-b pb-1.5 border-blue-500/20 text-xs">
                    <span className="font-extrabold text-blue-700 dark:text-blue-400">📈 Optimized Next Week Grocery Recommendations</span>
                    <span className="font-mono text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-600 px-2 py-0.5 rounded-full">Source: {aiPrediction.source || 'Offline'}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal italic">"{aiPrediction.reasoning}"</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center">
                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border">
                      <span className="text-[10px] text-slate-400 block">Basmati Rice</span>
                      <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{aiPrediction.rice} kg</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border">
                      <span className="text-[10px] text-slate-400 block">Vegetables</span>
                      <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{aiPrediction.vegetables} kg</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border">
                      <span className="text-[10px] text-slate-400 block">Cooking Oil</span>
                      <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{aiPrediction.oil} L</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border">
                      <span className="text-[10px] text-slate-400 block">Fresh Milk</span>
                      <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{aiPrediction.milk} L</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border">
                      <span className="text-[10px] text-slate-400 block">Fresh Eggs</span>
                      <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{aiPrediction.eggs} pcs</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border">
                      <span className="text-[10px] text-slate-400 block">Seasonal Fruits</span>
                      <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{aiPrediction.fruits} kg</span>
                    </div>
                  </div>
                </div>
              )}

              {loadingReport && (
                <div className="flex items-center justify-center py-6 space-x-3 font-mono text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
                  <span>Auditing sentiment scores and suggestions...</span>
                </div>
              )}

              {aiReport && !loadingReport && (
                <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl space-y-4 animate-in fade-in text-xs">
                  <div className="flex justify-between items-center border-b pb-1.5 border-indigo-500/20">
                    <span className="font-extrabold text-indigo-700 dark:text-indigo-400">📊 AI-Driven Mess Performance Audit Report ({aiReport.month})</span>
                    <span className="font-mono text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-600 px-2 py-0.5 rounded-full">Overall Rating: {aiReport.overallQualityScore || 4.2}/5</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 italic">"{aiReport.analysisText}"</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">💡 Key Strengths</span>
                      <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                        {aiReport.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div>
                      <span className="font-bold text-rose-600 block mb-1">⚠️ Friction Points</span>
                      <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-500/80">
                        {aiReport.weaknesses?.map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-500/10">
                    <span className="font-extrabold text-indigo-600 block mb-1">🎯 Action Plan for Mess Staff</span>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                      {aiReport.recommendations?.map((r, i) => <li key={i}>{r}</li>)}
                    </ol>
                  </div>
                </div>
              )}

              {loadingFestMenu && (
                <div className="flex items-center justify-center py-6 space-x-3 font-mono text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
                  <span>Consulting cultural meal standards with Gemini...</span>
                </div>
              )}

              {generatedFestMenu && !loadingFestMenu && (
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-3 animate-in fade-in text-xs">
                  <div className="flex justify-between items-center border-b pb-1.5 border-emerald-500/20">
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-400">🍲 Special Feast Proposal: {generatedFestMenu.festival}</span>
                    <button
                      onClick={handleSaveFestivalMenu}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-lg"
                    >
                      Publish Feast Menu
                    </button>
                  </div>
                  <div>
                    <span className="font-bold text-slate-600 block">Proposed Sweet & Savory Items:</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 leading-relaxed">{generatedFestMenu.items}</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono text-[10px] text-slate-500">
                    <span>🔥 {generatedFestMenu.calories || 900} Kcal</span>
                    <span>P: {generatedFestMenu.protein || 24}g</span>
                    <span>C: {generatedFestMenu.carbs || 120}g</span>
                    <span>F: {generatedFestMenu.fat || 32}g</span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-600 block">Decoration & Hospitality Tips:</span>
                    <ul className="list-disc list-inside space-y-1 mt-0.5 text-[11px]">
                      {generatedFestMenu.tips?.map((t: string, i: number) => <li key={i} className="text-slate-500">{t}</li>)}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Metrics display */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="glass-premium p-4 rounded-2xl border text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Accounts</span>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono mt-1">{users.length}</p>
              </div>
              <div className="glass-premium p-4 rounded-2xl border text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Active Students</span>
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1">
                  {users.filter(u => u.role === 'student').length}
                </p>
              </div>
              <div className="glass-premium p-4 rounded-2xl border text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Planned Menus</span>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">{menus.length}</p>
              </div>
              <div className="glass-premium p-4 rounded-2xl border text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Pantry Stocks</span>
                <p className="text-2xl font-black text-amber-500 font-mono mt-1">{inventory.length}</p>
              </div>
            </div>

          </div>

          {/* User Account Registry (Right column) */}
          <div className="space-y-6">
            
            {/* Create Authorized user credentials */}
            <div className="glass-premium rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">Add Hostel Accounts</h3>
              </div>
              <p className="text-xs text-slate-400">Initialize secure credentials for student body, kitchen crew, or wardens.</p>

              <form onSubmit={handleAddUser} className="space-y-3.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Filer Email</label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="name@hostel.com"
                    className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Default Password</label>
                  <input
                    type="password"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder="password"
                    className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Rahul Sharma"
                    className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Access Role</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as any)}
                      className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs font-bold"
                    >
                      <option value="student">Student</option>
                      <option value="staff">Mess Staff</option>
                      <option value="warden">Warden</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Room (Student)</label>
                    <input
                      type="text"
                      value={newUserRoom}
                      onChange={(e) => setNewUserRoom(e.target.value)}
                      placeholder="e.g. 102"
                      disabled={newUserRole !== 'student'}
                      className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs disabled:opacity-40"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Hostel block assignment</label>
                  <select
                    value={newUserHostel}
                    onChange={(e) => setNewUserHostel(e.target.value)}
                    disabled={newUserRole !== 'student' && newUserRole !== 'warden'}
                    className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs disabled:opacity-40"
                  >
                    <option value="Mandakini Hostel">Mandakini Hostel</option>
                    <option value="Ganga Hostel">Ganga Hostel</option>
                    <option value="Yamuna Hostel">Yamuna Hostel</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Phone contact (+91)</label>
                  <input
                    type="text"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingUser}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50 font-mono"
                >
                  {submittingUser ? 'Registering...' : 'Register Authorized User'}
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* MANAGING ALL USERS LIST */}
      {activeTab === 'manage-users' && (
        <div className="glass-premium rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-black text-2xl text-slate-800 dark:text-slate-100">Hostel Resident & Staff Registry</h3>
              <p className="text-xs text-slate-400 mt-1">Authorized personnel logged in the security database.</p>
            </div>
            
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition shadow-sm"
            >
              Add New User Account
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((item) => (
              <div key={item.id} className="p-4 bg-white dark:bg-slate-900 border rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-emerald-500 text-white font-bold flex items-center justify-center">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{item.name}</h4>
                    <p className="text-xs text-slate-400 font-mono">{item.email}</p>
                    <div className="flex space-x-2 text-[10px] text-slate-500 font-mono mt-1">
                      <span className="capitalize font-bold bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded text-blue-600">{item.role}</span>
                      {item.roomNo && <span>Room {item.roomNo}</span>}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteUser(item.id)}
                  className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition"
                  title="Purge Account"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MASTER MENU CALENDAR MANAGER */}
      {activeTab === 'manage-menus' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Menu input form (col-span-1) */}
          <div className="glass-premium rounded-3xl p-6 border border-slate-100 dark:border-slate-800 h-fit space-y-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                {editingMenuId ? 'Edit Meal Parameters' : 'Publish Meal Calendar'}
              </h3>
            </div>
            <p className="text-xs text-slate-400">Select day and record dietary/caloric information.</p>

            <form onSubmit={handleSaveMenu} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Day</label>
                  <select
                    value={menuDay}
                    onChange={(e) => setMenuDay(e.target.value)}
                    className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Meal date</label>
                  <input
                    type="date"
                    value={menuDate}
                    onChange={(e) => setMenuDate(e.target.value)}
                    className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Meal Slot</label>
                  <select
                    value={menuType}
                    onChange={(e) => setMenuType(e.target.value as any)}
                    className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs font-bold"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="snacks">Snacks</option>
                    <option value="dinner">Dinner</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Prep Status</label>
                  <select
                    value={menuStatus}
                    onChange={(e) => setMenuStatus(e.target.value as any)}
                    className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                  >
                    <option value="Planned">Planned</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Ready">Ready</option>
                    <option value="Served">Served</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Standard items list</label>
                <input
                  type="text"
                  value={menuItemsText}
                  onChange={(e) => setMenuItemsText(e.target.value)}
                  placeholder="e.g. Masala Dosa, Sambhar, Tea"
                  className="w-full mt-1 p-2.5 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Calories</label>
                  <input
                    type="number"
                    value={menuCalories}
                    onChange={(e) => setMenuCalories(Number(e.target.value))}
                    className="w-full mt-1 p-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Protein (g)</label>
                  <input
                    type="number"
                    value={menuProtein}
                    onChange={(e) => setMenuProtein(Number(e.target.value))}
                    className="w-full mt-1 p-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Carbs (g)</label>
                  <input
                    type="number"
                    value={menuCarbs}
                    onChange={(e) => setMenuCarbs(Number(e.target.value))}
                    className="w-full mt-1 p-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Fat (g)</label>
                  <input
                    type="number"
                    value={menuFat}
                    onChange={(e) => setMenuFat(Number(e.target.value))}
                    className="w-full mt-1 p-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Prep volume</label>
                  <input
                    type="text"
                    value={menuQty}
                    onChange={(e) => setMenuQty(e.target.value)}
                    className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Serving Timing</label>
                  <input
                    type="text"
                    value={menuTimings}
                    onChange={(e) => setMenuTimings(e.target.value)}
                    className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2.5 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border">
                <input
                  type="checkbox"
                  checked={isSpecial}
                  onChange={(e) => setIsSpecial(e.target.checked)}
                  className="w-4.5 h-4.5 accent-emerald-500 cursor-pointer"
                  id="chk-special"
                />
                <label htmlFor="chk-special" className="text-xs font-semibold cursor-pointer">Mark as Special Festival Feast</label>
              </div>

              {isSpecial && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Festival Name</label>
                  <input
                    type="text"
                    value={festivalName}
                    onChange={(e) => setFestivalName(e.target.value)}
                    placeholder="e.g. Monsoon Special Lunch"
                    className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                  />
                </div>
              )}

              <div className="flex gap-2">
                {editingMenuId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMenuId(null);
                      setMenuItemsText('');
                    }}
                    className="p-2 border text-slate-400 text-xs rounded-xl hover:bg-slate-100 flex-1"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submittingMenu}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex-2 shadow-md transition disabled:opacity-50"
                >
                  {submittingMenu ? 'Saving...' : editingMenuId ? 'Update Meal' : 'Publish Meal Calendar'}
                </button>
              </div>
            </form>
          </div>

          {/* Master Menus list (col-span-2) */}
          <div className="lg:col-span-2 glass-premium rounded-3xl p-6 border border-slate-100 dark:border-slate-800 space-y-4">
            <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100 block">Published Master Menu List</span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menus
                .sort((a,b) => b.date.localeCompare(a.date))
                .slice(0, 16)
                .map((m) => (
                  <div key={m.id} className="p-3.5 bg-white dark:bg-slate-900 border rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start text-[10px]">
                        <span className="font-mono text-slate-400">{m.date} ({m.day})</span>
                        <span className="font-bold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                          {m.type}
                        </span>
                      </div>
                      
                      {m.isSpecial && (
                        <span className="inline-block text-[9px] bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-full mt-1.5">
                          ⭐ Special: {m.festivalName}
                        </span>
                      )}

                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mt-2 leading-relaxed">{m.items}</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">Status: {m.status || 'Planned'}</p>
                    </div>

                    <div className="flex justify-between items-center border-t pt-2.5 mt-3 dark:border-slate-800">
                      <span className="text-[9px] font-mono text-slate-400">🔥 {m.calories} kcal</span>
                      <div className="flex space-x-1.5">
                        <button
                          onClick={() => loadMenuToEdit(m)}
                          className="p-1 rounded-lg border hover:bg-slate-50 text-slate-500"
                          title="Edit meal"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMenu(m.id)}
                          className="p-1 rounded-lg border hover:bg-rose-50 text-rose-500"
                          title="Delete meal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PANTRY INVENTORY MASTER LEDGER */}
      {activeTab === 'manage-inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Inventory form (Left col) */}
          <div className="glass-premium rounded-3xl p-6 border border-slate-100 dark:border-slate-800 h-fit space-y-4">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                {editingInvId ? 'Edit Stock item' : 'Record Supply Order'}
              </h3>
            </div>
            <p className="text-xs text-slate-400">Initialize commodity files or replenish stock reserves directly.</p>

            <form onSubmit={handleSaveInventory} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Ingredient/Item Name</label>
                <input
                  type="text"
                  value={invName}
                  onChange={(e) => setInvName(e.target.value)}
                  placeholder="e.g. Basmati Rice"
                  className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                  <select
                    value={invCategory}
                    onChange={(e) => setInvCategory(e.target.value as any)}
                    className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                  >
                    <option value="groceries">Groceries</option>
                    <option value="vegetables">Vegetables</option>
                    <option value="dairy">Dairy</option>
                    <option value="others">Others</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Volume Qty</label>
                  <input
                    type="number"
                    value={invQty}
                    onChange={(e) => setInvQty(Number(e.target.value))}
                    className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Measurement Unit</label>
                  <input
                    type="text"
                    value={invUnit}
                    onChange={(e) => setInvUnit(e.target.value)}
                    placeholder="kg, liters, pcs"
                    className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Min alert limit</label>
                  <input
                    type="number"
                    value={invMinStock}
                    onChange={(e) => setInvMinStock(Number(e.target.value))}
                    className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Purchase Cost (₹)</label>
                <input
                  type="number"
                  value={invCost}
                  onChange={(e) => setInvCost(Number(e.target.value))}
                  className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2">
                {editingInvId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingInvId(null);
                      setInvName('');
                    }}
                    className="p-2 border text-slate-400 text-xs rounded-xl hover:bg-slate-100 flex-1"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submittingInv}
                  className="py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs rounded-xl flex-2 shadow-md transition disabled:opacity-50"
                >
                  {submittingInv ? 'Saving...' : editingInvId ? 'Update Stock' : 'Record Order'}
                </button>
              </div>
            </form>
          </div>

          {/* Inventory list (Right col-span-2) */}
          <div className="lg:col-span-2 glass-premium rounded-3xl p-6 border border-slate-100 dark:border-slate-800 space-y-4">
            <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100 block">Ingredient Master File Ledger</span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inventory.map((item) => {
                const isLow = item.quantity <= item.minStock;
                return (
                  <div key={item.id} className="p-3.5 bg-white dark:bg-slate-900 border rounded-2xl flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                        {item.category}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 mt-1.5">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">Qty: {item.quantity} {item.unit}</p>
                      {item.cost && <p className="text-[10px] text-slate-400 font-mono mt-0.5">Value: ₹{item.cost}</p>}
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${isLow ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {isLow ? 'REPLENISH' : 'ADEQUATE'}
                      </span>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => loadInvToEdit(item)}
                          className="p-1 rounded-lg border hover:bg-slate-50 text-slate-500"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteInventory(item.id)}
                          className="p-1 rounded-lg border hover:bg-rose-50 text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* BROADCAST ANNOUNCEMENTS BAR */}
      {activeTab === 'manage-announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Announcement form (Left col) */}
          <div className="glass-premium rounded-3xl p-6 border border-slate-100 dark:border-slate-800 h-fit space-y-4">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Broadcast Notice Board</h3>
            </div>
            <p className="text-xs text-slate-400">Post warnings, holidays, serving timings extensions, or special festival feast announcements.</p>

            <form onSubmit={handlePublishAnnouncement} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Broadcast Title</label>
                <input
                  type="text"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. Extension of Dinner serving hours"
                  className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Announcement content</label>
                <textarea
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Draft details here..."
                  rows={4}
                  className="w-full mt-1 p-3 bg-white dark:bg-slate-900 border rounded-2xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Notice category</label>
                <select
                  value={annType}
                  onChange={(e) => setAnnType(e.target.value as any)}
                  className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs font-bold"
                >
                  <option value="info">General Info</option>
                  <option value="warning">Warning / Pest Control</option>
                  <option value="festival">Festival celebration</option>
                  <option value="holiday">Holiday schedule</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submittingAnn}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
              >
                {submittingAnn ? 'Publishing...' : 'Publish Announcement & Alert All'}
              </button>
            </form>
          </div>

          {/* Announcements listings (Right col-span-2) */}
          <div className="lg:col-span-2 glass-premium rounded-3xl p-6 border border-slate-100 dark:border-slate-800 space-y-4">
            <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100 block">Active Broadcast Bulletins</span>

            <div className="space-y-3">
              {announcements.map((ann) => (
                <div key={ann.id} className="p-4 bg-white dark:bg-slate-900 border rounded-2xl flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        ann.type === 'festival' ? 'bg-emerald-100 text-emerald-800' :
                        ann.type === 'warning' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {ann.type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{ann.date}</span>
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 mt-2">{ann.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{ann.content}</p>
                    <span className="text-[9px] text-slate-400 block mt-2">— Published by Admin: {ann.author}</span>
                  </div>

                  <button
                    onClick={() => handleDeleteAnnouncement(ann.id)}
                    className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg border transition"
                    title="Withdraw Announcement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
