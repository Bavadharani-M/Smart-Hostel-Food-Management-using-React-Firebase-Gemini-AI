import React, { useState, useEffect } from 'react';
import { 
  Home, 
  TrendingUp, 
  FileText, 
  ShieldAlert, 
  Check, 
  MessageSquare, 
  AlertTriangle, 
  Star, 
  CheckCircle, 
  ThumbsUp, 
  ThumbsDown, 
  Utensils 
} from 'lucide-react';
import { MenuItem, Attendance, Feedback, Complaint, InventoryItem } from '../types';

interface WardenDashboardProps {
  userId: string;
  userName: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  triggerNotification: (title: string, content: string) => void;
}

export default function WardenDashboard({
  userId,
  userName,
  activeTab,
  setActiveTab,
  triggerNotification
}: WardenDashboardProps) {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  // Resolution Form
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [resolutionStatus, setResolutionStatus] = useState<'In Progress' | 'Resolved'>('In Progress');
  const [savingResolution, setSavingResolution] = useState(false);

  // Fetch all core Warden datasets
  const fetchData = async () => {
    try {
      const [resMenus, resAtt, resFb, resComp, resInv] = await Promise.all([
        fetch('/api/menus').then(r => r.ok ? r.json() : []),
        fetch('/api/attendance').then(r => r.ok ? r.json() : []),
        fetch('/api/feedback').then(r => r.ok ? r.json() : []),
        fetch('/api/complaints').then(r => r.ok ? r.json() : []),
        fetch('/api/inventory').then(r => r.ok ? r.json() : []),
      ]);

      setMenus(Array.isArray(resMenus) ? resMenus : []);
      setAttendance(Array.isArray(resAtt) ? resAtt : []);
      setFeedback(Array.isArray(resFb) ? resFb : []);
      setComplaints(Array.isArray(resComp) ? resComp : []);
      setInventory(Array.isArray(resInv) ? resInv : []);
    } catch (err) {
      console.error("Error loading warden data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  // Handle Complaint Response
  const handleSubmitResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaintId || !resolutionText.trim()) return;
    setSavingResolution(true);
    try {
      const res = await fetch(`/api/complaints/${selectedComplaintId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: resolutionStatus,
          response: resolutionText,
          respondedBy: userName,
          respondedAt: new Date().toISOString()
        })
      });
      if (res.ok) {
        triggerNotification('Complaint Updated 📝', 'Your official response was logged. Student will receive alerts.');
        setSelectedComplaintId(null);
        setResolutionText('');
        fetchData();
      }
    } catch (err) {
      console.error("Error updating complaint resolution:", err);
    } finally {
      setSavingResolution(false);
    }
  };

  // Approve Proposed Menu Special Feasts
  const handleApproveSpecialMenu = async (menuId: string) => {
    try {
      const res = await fetch(`/api/menus/${menuId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Ready' })
      });
      if (res.ok) {
        triggerNotification('Proposed Menu Approved ✅', 'The special feast was approved and scheduled.');
        fetchData();
      }
    } catch (err) {
      console.error("Error approving special menu:", err);
    }
  };

  // Attendance metrics for today
  const getTodayHeadcounts = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayAtt = attendance.filter(a => a.date === todayStr);
    
    let breakfast = 0;
    let lunch = 0;
    let snacks = 0;
    let dinner = 0;

    todayAtt.forEach(a => {
      if (a.breakfast) breakfast++;
      if (a.lunch) lunch++;
      if (a.snacks) snacks++;
      if (a.dinner) dinner++;
    });

    return { breakfast, lunch, snacks, dinner, totalRecords: todayAtt.length };
  };

  const headcounts = getTodayHeadcounts();

  // Sentiment analytics metrics
  const getSentimentStats = () => {
    let positive = 0;
    let neutral = 0;
    let negative = 0;

    feedback.forEach(f => {
      if (f.sentiment === 'Positive') positive++;
      else if (f.sentiment === 'Negative') negative++;
      else neutral++;
    });

    return { positive, neutral, negative, total: feedback.length };
  };

  const sentimentStats = getSentimentStats();

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 animate-in fade-in duration-300">
      
      {/* Upper Warden Info */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-700 rounded-3xl text-white p-6 md:p-8 shadow-xl">
        <div className="space-y-2">
          <span className="bg-white/20 text-white font-semibold text-xs px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md">
            Warden Office portal
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">
            Warden Console: {userName}
          </h2>
          <p className="text-sm text-blue-100 max-w-xl">
            Respond to active student grievances, monitor daily meal consumption headcounts, and inspect kitchen quality metrics.
          </p>
        </div>
      </div>

      {/* TABS 1: CORE PORTAL HOME */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main overview (Left column col-span-2) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Live attendance headcounts dials */}
            <div className="glass-premium rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Today's Meal Opt-In Attendance Counters</h3>
              </div>
              <p className="text-xs text-slate-400 mb-5">
                Calculated dynamically from live student dashboards for standard meal allocation checks.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Breakfast</span>
                  <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono block mt-1">
                    {headcounts.breakfast}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-1">opt-ins</span>
                </div>

                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Lunch</span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono block mt-1">
                    {headcounts.lunch}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-1">opt-ins</span>
                </div>

                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Snacks Tea</span>
                  <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono block mt-1">
                    {headcounts.snacks}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-1">opt-ins</span>
                </div>

                <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Dinner</span>
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono block mt-1">
                    {headcounts.dinner}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-1">opt-ins</span>
                </div>
              </div>
            </div>

            {/* Menu approvals list panel */}
            <div className="glass-premium rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 mb-4">
                <Utensils className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Review & Approve Menu Special Adjustments</h3>
              </div>
              
              {menus.filter(m => m.isSpecial && m.status === 'Planned').length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No proposed special feast menus waiting for approval.</p>
              ) : (
                <div className="space-y-3">
                  {menus
                    .filter(m => m.isSpecial && m.status === 'Planned')
                    .map((festMenu) => (
                      <div key={festMenu.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <span className="inline-block text-[9px] font-black uppercase bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                            Proposed: {festMenu.festivalName || 'Special Dinner'}
                          </span>
                          <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 mt-1.5 leading-relaxed">
                            {festMenu.items}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono block mt-1">Scheduled for: {festMenu.date} ({festMenu.day})</span>
                        </div>

                        <button
                          onClick={() => handleApproveSpecialMenu(festMenu.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition whitespace-nowrap shrink-0"
                        >
                          Approve Schedule
                        </button>
                      </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Grievances inbox portal list */}
            <div className="glass-premium rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Active Student Complaints (AI Prioritized)</h3>
                </div>
                <span className="text-xs bg-rose-50 px-2 py-1 rounded-full text-rose-500 font-bold font-mono">
                  {complaints.filter(c => c.status !== 'Resolved').length} Active
                </span>
              </div>

              {complaints.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No reported student grievances ✅</p>
              ) : (
                <div className="space-y-4">
                  {complaints
                    .filter(c => c.status !== 'Resolved')
                    .sort((a,b) => {
                      // High priority first
                      const pA = a.priority === 'High' ? 3 : a.priority === 'Medium' ? 2 : 1;
                      const pB = b.priority === 'High' ? 3 : b.priority === 'Medium' ? 2 : 1;
                      return pB - pA;
                    })
                    .map((comp) => (
                      <div key={comp.id} className="p-4 bg-white dark:bg-slate-900 border rounded-2xl space-y-3">
                        <div className="flex items-center justify-between border-b pb-2 dark:border-slate-800 text-xs">
                          <div className="flex items-center space-x-2">
                            <span className={`font-black text-[10px] px-2.5 py-0.5 rounded-full ${
                              comp.priority === 'High' ? 'bg-rose-100 text-rose-800' :
                              comp.priority === 'Medium' ? 'bg-amber-100 text-amber-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              AI priority: {comp.priority}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">Filer: {comp.studentName} (Room {comp.roomNo})</span>
                          </div>
                          
                          <span className="text-[10px] text-slate-400 font-mono">{comp.date}</span>
                        </div>

                        <div>
                          <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{comp.subject}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">{comp.description}</p>
                        </div>

                        {comp.imageUrl && (
                          <div className="mt-2">
                            <span className="text-[10px] text-slate-400 block mb-1">Filer proof photo:</span>
                            <img 
                              src={comp.imageUrl} 
                              alt="proof" 
                              className="max-h-24 rounded-lg object-cover border dark:border-slate-800"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        {/* Respond toggle controls */}
                        {selectedComplaintId !== comp.id ? (
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">Status: {comp.status}</span>
                            <button
                              onClick={() => {
                                setSelectedComplaintId(comp.id);
                                setResolutionStatus(comp.status === 'Pending' ? 'In Progress' : 'Resolved');
                              }}
                              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                            >
                              Respond / Action
                            </button>
                          </div>
                        ) : (
                          // Response Form Inline
                          <form onSubmit={handleSubmitResolution} className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Input Response Statement</span>
                              <select
                                value={resolutionStatus}
                                onChange={(e) => setResolutionStatus(e.target.value as any)}
                                className="p-1 text-xs border rounded-lg bg-white dark:bg-slate-900 font-bold"
                              >
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                              </select>
                            </div>

                            <input
                              type="text"
                              value={resolutionText}
                              onChange={(e) => setResolutionText(e.target.value)}
                              placeholder="e.g. Approved filter replacement, maintenance crew scheduled."
                              className="w-full p-2.5 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                              required
                            />

                            <div className="flex justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => setSelectedComplaintId(null)}
                                className="px-3 py-1 text-xs text-slate-400 border rounded-lg hover:bg-white"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={savingResolution}
                                className="px-4 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
                              >
                                {savingResolution ? 'Saving...' : 'Submit Grievance Action'}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Warden stats column (Sentiment audit + low stock items list) */}
          <div className="space-y-6">
            
            {/* AI Sentiment Analysis breakdown widget */}
            <div className="glass-premium rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">AI Student Sentiment Monitor</h3>
              </div>

              {sentimentStats.total === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No reviews registered today.</p>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                      <span>Positive Reviews</span>
                      <span className="font-mono text-emerald-500">{Math.round((sentimentStats.positive/sentimentStats.total)*100)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(sentimentStats.positive/sentimentStats.total)*100}%` }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                      <span>Neutral Feedback</span>
                      <span className="font-mono text-amber-500">{Math.round((sentimentStats.neutral/sentimentStats.total)*100)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-amber-400 h-full rounded-full" style={{ width: `${(sentimentStats.neutral/sentimentStats.total)*100}%` }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                      <span>Negative Complaints</span>
                      <span className="font-mono text-rose-500">{Math.round((sentimentStats.negative/sentimentStats.total)*100)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full" style={{ width: `${(sentimentStats.negative/sentimentStats.total)*100}%` }} />
                    </div>
                  </div>

                  <div className="border-t pt-3 mt-3 text-center text-xs dark:border-slate-800">
                    <button 
                      onClick={() => setActiveTab('feedback-sentiment')}
                      className="text-indigo-500 hover:underline font-bold text-xs"
                    >
                      Inspect AI Sentiment Report ➔
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Logistics Stock Shortages quick preview */}
            <div className="glass-premium rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">Critical Stock shortfalls</h3>
              </div>

              {inventory.filter(i => i.quantity <= i.minStock).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">All pantry commodities sufficient ✅</p>
              ) : (
                <div className="space-y-3">
                  {inventory
                    .filter(i => i.quantity <= i.minStock)
                    .map((item) => (
                      <div key={item.id} className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.name}</span>
                        <span className="text-xs font-mono font-bold text-rose-500">{item.quantity} {item.unit} left</span>
                      </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: DETAILED COMPLAINTS INBOX */}
      {activeTab === 'complaints-inbox' && (
        <div className="glass-premium rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
          <div className="flex justify-between items-center border-b pb-4 dark:border-slate-800">
            <div>
              <h3 className="font-black text-2xl text-slate-800 dark:text-slate-100">Student Complaints Resolution Inbox</h3>
              <p className="text-xs text-slate-400 mt-1">Review resolution history logs and action dates.</p>
            </div>
            <span className="text-xs bg-slate-100 px-3 py-1 rounded-xl text-slate-600 font-extrabold">{complaints.length} Total</span>
          </div>

          <div className="space-y-4">
            {complaints.map((comp) => (
              <div key={comp.id} className="p-5 bg-white dark:bg-slate-900 border rounded-3xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                      comp.priority === 'High' ? 'bg-rose-100 text-rose-800' :
                      comp.priority === 'Medium' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      AI Priority: {comp.priority}
                    </span>
                    <span className="text-slate-400 font-mono">Filer: {comp.studentName} (Room {comp.roomNo})</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-400">Status:</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold ${
                      comp.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                      comp.status === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {comp.status}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{comp.subject}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{comp.description}</p>
                </div>

                {comp.response ? (
                  <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-1">
                    <span className="text-[10px] font-bold text-emerald-600 block">Response Statement:</span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic">"{comp.response}"</p>
                    <span className="text-[9px] text-slate-400 block mt-1">Logged by: {comp.respondedBy} on {new Date(comp.respondedAt!).toLocaleString()}</span>
                  </div>
                ) : (
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setSelectedComplaintId(comp.id);
                        setResolutionStatus('Resolved');
                      }}
                      className="px-4 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 shadow-md transition"
                    >
                      Resolve Grievance
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: FEEDBACK SENTIMENT REPORT AUDIT */}
      {activeTab === 'feedback-sentiment' && (
        <div className="glass-premium rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
          <div>
            <h3 className="font-black text-2xl text-slate-800 dark:text-slate-100">AI Student Feedback Audit Log</h3>
            <p className="text-xs text-slate-400 mt-1">Inspect reviews categorized by NLP sentiment models.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feedback.map((item) => (
              <div key={item.id} className="p-4 bg-white dark:bg-slate-900 border rounded-2xl flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono text-slate-400">{item.date}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      item.sentiment === 'Positive' ? 'bg-emerald-100 text-emerald-800' :
                      item.sentiment === 'Negative' ? 'bg-rose-100 text-rose-800' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      Sentiment: {item.sentiment || 'Neutral'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    {[1,2,3,4,5].map((star) => (
                      <Star key={star} className={`w-3.5 h-3.5 ${star <= item.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                    ))}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 italic">"{item.review}"</p>
                </div>

                <div className="border-t pt-2.5 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
                  <span>Student: {item.studentName}</span>
                  <span className="capitalize font-bold bg-blue-50 px-2.5 py-0.5 rounded-full text-blue-600">{item.mealType}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ATTENDANCE LOGS LIST */}
      {activeTab === 'attendance-analytics' && (
        <div className="glass-premium rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
          <div>
            <h3 className="font-black text-2xl text-slate-800 dark:text-slate-100">Student Daily Check-in Register</h3>
            <p className="text-xs text-slate-400 mt-1">Standard listing of all student meal opt-ins.</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border dark:border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="p-4">Filer Name</th>
                  <th className="p-4">Room No</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Breakfast</th>
                  <th className="p-4">Lunch</th>
                  <th className="p-4">Snacks</th>
                  <th className="p-4">Dinner</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700 dark:text-slate-300">
                {attendance
                  .sort((a,b) => b.date.localeCompare(a.date))
                  .map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold">{rec.studentName}</td>
                      <td className="p-4 font-mono">{rec.roomNo || 'Not set'}</td>
                      <td className="p-4 font-mono">{rec.date}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold ${rec.breakfast ? 'text-emerald-500' : 'text-rose-400'}`}>
                          {rec.breakfast ? 'Opt-In' : 'Opt-Out'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold ${rec.lunch ? 'text-emerald-500' : 'text-rose-400'}`}>
                          {rec.lunch ? 'Opt-In' : 'Opt-Out'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold ${rec.snacks ? 'text-emerald-500' : 'text-rose-400'}`}>
                          {rec.snacks ? 'Opt-In' : 'Opt-Out'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold ${rec.dinner ? 'text-emerald-500' : 'text-rose-400'}`}>
                          {rec.dinner ? 'Opt-In' : 'Opt-Out'}
                        </span>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
