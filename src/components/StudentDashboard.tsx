import React, { useState, useEffect } from 'react';
import { 
  Utensils, 
  Calendar as CalendarIcon, 
  CheckSquare, 
  Sparkles, 
  ShieldAlert, 
  Coffee, 
  Plus, 
  Star, 
  Camera, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  Download, 
  RefreshCw 
} from 'lucide-react';
import { MenuItem, Attendance, Feedback, Complaint, Announcement, AIRecommendation } from '../types';

interface StudentDashboardProps {
  userId: string;
  userName: string;
  roomNo?: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  triggerNotification: (title: string, content: string) => void;
}

export default function StudentDashboard({
  userId,
  userName,
  roomNo,
  activeTab,
  setActiveTab,
  triggerNotification
}: StudentDashboardProps) {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  // Local Forms State
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [todayAttendance, setTodayAttendance] = useState({
    breakfast: true,
    lunch: true,
    snacks: true,
    dinner: true
  });
  const [markingAtt, setMarkingAtt] = useState(false);

  // Feedback Form State
  const [fbMealType, setFbMealType] = useState<'breakfast' | 'lunch' | 'snacks' | 'dinner'>('lunch');
  const [fbRating, setFbRating] = useState<number>(5);
  const [fbReview, setFbReview] = useState('');
  const [fbScores, setFbScores] = useState({ taste: 5, hygiene: 5, quantity: 5, variety: 5, freshness: 5 });
  const [fbImage, setFbImage] = useState<string | null>(null);
  const [submittingFb, setSubmittingFb] = useState(false);

  // Complaint Form State
  const [compSubject, setCompSubject] = useState('');
  const [compDesc, setCompDesc] = useState('');
  const [compImage, setCompImage] = useState<string | null>(null);
  const [submittingComp, setSubmittingComp] = useState(false);

  // AI Seasonal Recommendation widget
  const [selectedSeason, setSelectedSeason] = useState<'Summer' | 'Winter' | 'Rainy' | 'Exam' | 'Festivals'>('Summer');
  const [aiRec, setAiRec] = useState<AIRecommendation | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Monthly View range filter
  const [monthlyFilter, setMonthlyFilter] = useState<'all' | 'special'>('all');

  // Fetch all basic data on mount
  const fetchData = async () => {
    try {
      const [resMenus, resAtt, resFb, resComp, resAnn] = await Promise.all([
        fetch('/api/menus').then(r => r.ok ? r.json() : []),
        fetch('/api/attendance').then(r => r.ok ? r.json() : []),
        fetch('/api/feedback').then(r => r.ok ? r.json() : []),
        fetch('/api/complaints').then(r => r.ok ? r.json() : []),
        fetch('/api/announcements').then(r => r.ok ? r.json() : []),
      ]);

      const safeMenus = Array.isArray(resMenus) ? resMenus : [];
      const safeAtt = Array.isArray(resAtt) ? resAtt : [];
      const safeFb = Array.isArray(resFb) ? resFb : [];
      const safeComp = Array.isArray(resComp) ? resComp : [];
      const safeAnn = Array.isArray(resAnn) ? resAnn : [];

      setMenus(safeMenus);
      setAttendance(safeAtt);
      setFeedback(safeFb);
      setComplaints(safeComp);
      setAnnouncements(safeAnn);

      // Extract today's attendance for current user
      const todayStr = new Date().toISOString().split('T')[0];
      const todayAttRecord = safeAtt.find((a: Attendance) => a.studentId === userId && a.date === todayStr);
      if (todayAttRecord) {
        setTodayAttendance({
          breakfast: todayAttRecord.breakfast,
          lunch: todayAttRecord.lunch,
          snacks: todayAttRecord.snacks,
          dinner: todayAttRecord.dinner
        });
      }
    } catch (err) {
      console.error("Error fetching student dashboard data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  // Fetch AI Recommendations based on selected season
  const fetchAIRecommendations = async (season: string) => {
    setLoadingAI(true);
    try {
      const res = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ season })
      });
      const data = await res.json();
      setAiRec(data);
    } catch (err) {
      console.error("Failed to load seasonal AI suggestions:", err);
    } finally {
      setLoadingAI(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ai-recs') {
      fetchAIRecommendations(selectedSeason);
    }
  }, [selectedSeason, activeTab]);

  // Handle Mark Attendance Submit
  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setMarkingAtt(true);
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: userId,
          studentName: userName,
          roomNo,
          date: selectedDate,
          ...todayAttendance
        })
      });
      const data = await response.json();
      if (data.success) {
        triggerNotification('Attendance Saved ✅', `Your food attendance for ${selectedDate} has been updated.`);
        fetchData();
      }
    } catch (err) {
      console.error("Error saving attendance:", err);
    } finally {
      setMarkingAtt(false);
    }
  };

  // Convert uploaded image to base64 string
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isComplaint: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isComplaint) {
          setCompImage(reader.result as string);
        } else {
          setFbImage(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Feedback
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbReview.trim()) return;
    setSubmittingFb(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: userId,
          studentName: userName,
          roomNo,
          date: new Date().toISOString().split('T')[0],
          mealType: fbMealType,
          rating: fbRating,
          review: fbReview,
          imageUrl: fbImage,
          scores: fbScores
        })
      });
      const data = await res.json();
      if (data) {
        triggerNotification('Feedback Analyzed 🤖', `AI Classified sentiment as ${data.sentiment}. Quality score generated.`);
        setFbReview('');
        setFbImage(null);
        fetchData();
      }
    } catch (err) {
      console.error("Error submitting food feedback:", err);
    } finally {
      setSubmittingFb(false);
    }
  };

  // Submit Complaint
  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compSubject.trim() || !compDesc.trim()) return;
    setSubmittingComp(true);
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: userId,
          studentName: userName,
          roomNo,
          date: new Date().toISOString().split('T')[0],
          subject: compSubject,
          description: compDesc,
          imageUrl: compImage
        })
      });
      const data = await res.json();
      if (data) {
        triggerNotification('Complaint Filed 🚨', `AI categorized threat severity as: ${data.priority}. Warden notified.`);
        setCompSubject('');
        setCompDesc('');
        setCompImage(null);
        fetchData();
      }
    } catch (err) {
      console.error("Error submitting complaint:", err);
    } finally {
      setSubmittingComp(false);
    }
  };

  const getTodayMeals = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    return menus.filter(m => m.date === todayStr);
  };

  const todayMeals = getTodayMeals();

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-emerald-500 rounded-3xl text-white p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl" />
        
        <div className="relative z-10 space-y-2">
          <span className="bg-white/20 text-white font-semibold text-xs px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md">
            Student Board
          </span>
          <h2 className="text-2xl md:text-4xl font-black tracking-tight">
            Welcome back, {userName}!
          </h2>
          <p className="text-sm text-blue-100 max-w-xl">
            Opt-in/out of daily meals, review weekly nutrients, submit AI feedback, and receive seasonal dietary plans instantly.
          </p>
          <div className="flex items-center space-x-6 pt-3 text-xs text-blue-50 font-mono">
            <span><strong>Room No:</strong> {roomNo || 'Not Assigned'}</span>
            <span><strong>Status:</strong> Active Resident</span>
          </div>
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Today's Menu (Left / col-span-2) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Today's Meals Cards */}
            <div className="glass-premium rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2.5">
                  <Utensils className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Today's Meals Menu</h3>
                </div>
                <span className="text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full font-mono font-bold">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                </span>
              </div>

              {todayMeals.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Menu not published by Mess Staff yet for today.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {todayMeals.map((meal) => {
                    const isBreakfast = meal.type === 'breakfast';
                    const isLunch = meal.type === 'lunch';
                    const isSnacks = meal.type === 'snacks';
                    
                    return (
                      <div 
                        key={meal.id} 
                        className={`p-4 rounded-2xl border transition duration-200 ${
                          meal.isSpecial 
                            ? 'bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border-emerald-500/30 dark:border-emerald-500/10 shadow-sm' 
                            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:shadow-md'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                              <Coffee className="w-4 h-4" />
                            </span>
                            <span className="font-bold text-sm capitalize">{meal.type}</span>
                          </div>
                          
                          {/* Preparation Status */}
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            meal.status === 'Ready' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' :
                            meal.status === 'Preparing' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' :
                            meal.status === 'Served' ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300'
                          }`}>
                            {meal.status || 'Planned'}
                          </span>
                        </div>

                        {meal.isSpecial && (
                          <span className="inline-block text-[10px] bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-full mb-2">
                            ⭐ Special: {meal.festivalName || 'Feast'}
                          </span>
                        )}

                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium min-h-[40px] mb-3 leading-relaxed">
                          {meal.items}
                        </p>

                        <div className="border-t pt-2.5 dark:border-slate-800 flex justify-between items-center text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          <span>⏱️ {meal.timings || 'Standard hours'}</span>
                          <span>🔥 {meal.calories || 300} kcal</span>
                        </div>
                        
                        <div className="flex gap-2 mt-2 pt-1 text-[9px] font-mono justify-end text-slate-400">
                          <span>P: {meal.protein || 10}g</span>
                          <span>C: {meal.carbs || 45}g</span>
                          <span>F: {meal.fat || 8}g</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* AI Seasonal recommendations highlights widget */}
            <div className="bg-gradient-to-br from-indigo-900 to-blue-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute bottom-0 right-0 -mr-10 -mb-10 w-44 h-44 bg-blue-500/20 rounded-full blur-xl" />
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1.5 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-xs uppercase tracking-wider text-amber-300">Seasonal AI Nutrition Coach</span>
                  </div>
                  <h4 className="font-extrabold text-xl text-white">Need a dynamic healthy diet recommendation?</h4>
                  <p className="text-xs text-indigo-200 max-w-md">
                    Our AI models analyze seasons, weather patterns, and final exams to recommend cooling or high-focus meals.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab('ai-recs')}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold rounded-xl text-xs transition duration-200 shrink-0 shadow-md"
                >
                  Consult AI Coach
                </button>
              </div>
            </div>

            {/* Submit Food Quality Feedback Form */}
            <div className="glass-premium rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 mb-4">
                <Star className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Submit Food Feedback (Analyzed by AI)</h3>
              </div>

              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Meal Selection */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Meal Category</label>
                    <select
                      value={fbMealType}
                      onChange={(e) => setFbMealType(e.target.value as any)}
                      className="w-full mt-1 p-2.5 bg-white/50 dark:bg-slate-900 border rounded-xl text-sm"
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="snacks">Snacks</option>
                      <option value="dinner">Dinner</option>
                    </select>
                  </div>

                  {/* Rating selection (Stars) */}
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Overall Satisfaction Rating</label>
                    <div className="flex items-center space-x-2 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFbRating(star)}
                          className="focus:outline-none"
                        >
                          <Star className={`w-7 h-7 ${star <= fbRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-700'}`} />
                        </button>
                      ))}
                      <span className="text-sm font-semibold text-slate-500 font-mono ml-2">({fbRating}/5 stars)</span>
                    </div>
                  </div>
                </div>

                {/* Star quality metrics sliders */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl">
                  {Object.keys(fbScores).map((key) => {
                    const metricKey = key as keyof typeof fbScores;
                    return (
                      <div key={metricKey} className="text-center">
                        <span className="text-[10px] capitalize font-bold text-slate-500 block mb-1">{metricKey}</span>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={fbScores[metricKey]}
                          onChange={(e) => setFbScores({ ...fbScores, [metricKey]: Number(e.target.value) })}
                          className="w-full accent-blue-600 cursor-pointer h-1 bg-slate-200 rounded-lg appearance-none"
                        />
                        <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300">{fbScores[metricKey]}/5</span>
                      </div>
                    );
                  })}
                </div>

                {/* Review written input */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Detailed Student Review</label>
                  <textarea
                    value={fbReview}
                    onChange={(e) => setFbReview(e.target.value)}
                    placeholder="Describe taste, hygiene, quantity or freshness... Our AI sentiment engine will analyze review automatically."
                    rows={3}
                    className="w-full mt-1 p-3 bg-white/50 dark:bg-slate-900 border rounded-2xl text-sm"
                    required
                  />
                </div>

                {/* Upload food images if food quality is poor */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 border border-dashed rounded-2xl bg-white/30 border-slate-200 dark:border-slate-800">
                  <div className="flex items-center space-x-2.5 text-xs text-slate-500">
                    <Camera className="w-4 h-4 text-slate-400" />
                    <span>Upload image to alert warden if quality is poor</span>
                  </div>
                  <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, false)}
                      className="hidden"
                      id="food-img-input"
                    />
                    <label 
                      htmlFor="food-img-input"
                      className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold rounded-xl text-xs cursor-pointer text-slate-700 dark:text-slate-300"
                    >
                      Choose File
                    </label>
                    {fbImage && (
                      <span className="text-[10px] text-emerald-500 font-mono">Photo Attached (Base64)</span>
                    )}
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingFb}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-bold rounded-xl text-xs hover:from-blue-700 hover:to-emerald-600 shadow-md transition disabled:opacity-50"
                  >
                    {submittingFb ? 'Analyzing & Submitting...' : 'Analyze & Submit Feedback'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right sidebar column (Opt-in attendance panel + Announcements) */}
          <div className="space-y-6">
            
            {/* Mark Attendance Option */}
            <div className="glass-premium rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 mb-3">
                <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Hostel Food Attendance</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Mark your meals for today to help cook optimization and reduce kitchen waste.
              </p>

              <form onSubmit={handleMarkAttendance} className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                    <span className="text-xs font-semibold capitalize">Breakfast</span>
                    <input
                      type="checkbox"
                      checked={todayAttendance.breakfast}
                      onChange={(e) => setTodayAttendance({ ...todayAttendance, breakfast: e.target.checked })}
                      className="w-4.5 h-4.5 accent-blue-600 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                    <span className="text-xs font-semibold capitalize">Lunch</span>
                    <input
                      type="checkbox"
                      checked={todayAttendance.lunch}
                      onChange={(e) => setTodayAttendance({ ...todayAttendance, lunch: e.target.checked })}
                      className="w-4.5 h-4.5 accent-blue-600 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                    <span className="text-xs font-semibold capitalize">Snacks</span>
                    <input
                      type="checkbox"
                      checked={todayAttendance.snacks}
                      onChange={(e) => setTodayAttendance({ ...todayAttendance, snacks: e.target.checked })}
                      className="w-4.5 h-4.5 accent-blue-600 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                    <span className="text-xs font-semibold capitalize">Dinner</span>
                    <input
                      type="checkbox"
                      checked={todayAttendance.dinner}
                      onChange={(e) => setTodayAttendance({ ...todayAttendance, dinner: e.target.checked })}
                      className="w-4.5 h-4.5 accent-blue-600 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="p-1 text-xs bg-white dark:bg-slate-900 border rounded-lg text-slate-600 dark:text-slate-300 flex-1 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={markingAtt}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition disabled:opacity-50 shadow-md"
                  >
                    {markingAtt ? 'Saving...' : 'Save Options'}
                  </button>
                </div>
              </form>
            </div>

            {/* Official Announcements Widget */}
            <div className="glass-premium rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 mb-4">
                <AlertCircle className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">Announcements Feed</h3>
              </div>

              {announcements.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No recent office announcements</p>
              ) : (
                <div className="space-y-3.5">
                  {announcements.map((ann) => (
                    <div 
                      key={ann.id} 
                      className={`p-3 rounded-2xl border ${
                        ann.type === 'festival' ? 'bg-emerald-500/5 border-emerald-500/20' :
                        ann.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20' :
                        'bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          ann.type === 'festival' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' :
                          ann.type === 'warning' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                        }`}>
                          {ann.type}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{ann.date}</span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">{ann.title}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                        {ann.content}
                      </p>
                      <span className="text-[9px] text-slate-400 block mt-1.5 font-semibold">
                        — {ann.author} ({ann.role})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* TABS 2: WEEKLY MENU CALENDAR */}
      {activeTab === 'menu' && (
        <div className="glass-premium rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-2xl text-slate-800 dark:text-slate-100">Hostel Weekly & Monthly Food Planner</h3>
              <p className="text-xs text-slate-400 mt-1">
                Browse detailed ingredients list, and check standard caloric allocations.
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <select
                value={monthlyFilter}
                onChange={(e: any) => setMonthlyFilter(e.target.value)}
                className="p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs text-slate-600 dark:text-slate-300 font-bold"
              >
                <option value="all">Show All Planned Meals</option>
                <option value="special">Show Festival Specials Only</option>
              </select>
              
              <button 
                onClick={() => window.print()}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs rounded-xl transition"
              >
                <Download className="w-4.5 h-4.5" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* Menus List Grid representation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {menus
              .filter(m => monthlyFilter === 'all' || m.isSpecial)
              .sort((a,b) => a.date.localeCompare(b.date))
              .map((item) => (
                <div 
                  key={item.id} 
                  className={`p-4 rounded-2xl border transition duration-200 ${
                    item.isSpecial 
                      ? 'bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border-emerald-500/40 dark:border-emerald-500/20 shadow-md' 
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-slate-400 font-mono block">{item.date} ({item.day})</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full">
                      {item.type}
                    </span>
                  </div>
                  
                  {item.isSpecial && (
                    <span className="inline-block text-[10px] bg-emerald-500 text-white font-bold px-2.5 py-0.5 rounded-full mb-2">
                      🎉 Festival: {item.festivalName}
                    </span>
                  )}

                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-2 leading-relaxed">
                    {item.items}
                  </h4>

                  <div className="border-t pt-2 mt-3 dark:border-slate-800 flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    <span>🔥 {item.calories || 400} Kcal</span>
                    <span>⏱️ {item.timings || 'Meal Hour'}</span>
                  </div>

                  <div className="flex gap-2 mt-2 pt-1 text-[9px] font-mono justify-end text-slate-400">
                    <span>P: {item.protein}g</span>
                    <span>C: {item.carbs}g</span>
                    <span>F: {item.fat}g</span>
                  </div>
                </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE HISTORY */}
      {activeTab === 'attendance' && (
        <div className="glass-premium rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
          <div>
            <h3 className="font-black text-2xl text-slate-800 dark:text-slate-100">Personal Attendance History Logs</h3>
            <p className="text-xs text-slate-400 mt-1">
              Verify your meal trackings and check-in times.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border dark:border-slate-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="p-4">Date Logged</th>
                  <th className="p-4">Breakfast</th>
                  <th className="p-4">Lunch</th>
                  <th className="p-4">Snacks</th>
                  <th className="p-4">Dinner</th>
                  <th className="p-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs text-slate-700 dark:text-slate-300">
                {attendance
                  .filter(a => a.studentId === userId)
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                      <td className="p-4 font-mono font-bold text-slate-900 dark:text-slate-100">{rec.date}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold ${rec.breakfast ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'}`}>
                          {rec.breakfast ? 'ATTENDED' : 'OPTED-OUT'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold ${rec.lunch ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'}`}>
                          {rec.lunch ? 'ATTENDED' : 'OPTED-OUT'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold ${rec.snacks ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'}`}>
                          {rec.snacks ? 'ATTENDED' : 'OPTED-OUT'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold ${rec.dinner ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'}`}>
                          {rec.dinner ? 'ATTENDED' : 'OPTED-OUT'}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-400">
                        {new Date(rec.markedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AI SEASONAL FOOD RECOMMENDATIONS */}
      {activeTab === 'ai-recs' && (
        <div className="glass-premium rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-6 h-6 text-indigo-500 animate-pulse" />
                <h3 className="font-black text-2xl text-slate-800 dark:text-slate-100">AI Seasonal Nutrition & Diet Planner</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Consult real-time Gemini AI models for customized dietary recommendations by seasons, weather, or exams.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {(['Summer', 'Winter', 'Rainy', 'Exam', 'Festivals'] as const).map((season) => (
                <button
                  key={season}
                  onClick={() => setSelectedSeason(season)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition shadow-sm ${
                    selectedSeason === season
                      ? 'bg-gradient-to-r from-blue-600 to-emerald-500 text-white'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {season}
                </button>
              ))}
            </div>
          </div>

          {loadingAI ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
              <p className="text-sm text-slate-400 font-mono">Consulting Gemini-3.5-flash...</p>
            </div>
          ) : aiRec ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-300">
              {/* Left col - Summary details */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Title and Reasoning */}
                <div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50/30 dark:from-indigo-950/20 dark:to-slate-950 border rounded-3xl">
                  <h4 className="text-lg font-black bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-blue-300 uppercase tracking-wide">
                    {aiRec.title}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                    {aiRec.reasoning}
                  </p>
                </div>

                {/* Practical Kitchen Tips list */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Hostel Kitchen Guidelines</span>
                  <div className="grid grid-cols-1 gap-3">
                    {aiRec.tips.map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 border rounded-2xl">
                        <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 shrink-0 font-bold font-mono text-xs">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-normal">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right col - Foods items list */}
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Recommended Recipes / Ingredients</span>
                <div className="space-y-2.5">
                  {aiRec.foods.map((food, idx) => (
                    <div 
                      key={idx} 
                      className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/5 to-blue-500/5 border border-emerald-500/20 dark:border-emerald-500/10 hover:shadow-sm transition"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{food}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm">
              Failed to load AI Recommendations. Try clicking another season.
            </div>
          )}
        </div>
      )}

      {/* TAB 5: COMPLAINTS REGISTER */}
      {activeTab === 'complaints' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Create Complaint Form (Left col-span-1) */}
          <div className="glass-premium rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 h-fit space-y-4">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Report Food Complaint</h3>
            </div>
            <p className="text-xs text-slate-400">
              Issues regarding spoiled food, hygiene violations, or utility failures are analyzed immediately.
            </p>

            <form onSubmit={handleSubmitComplaint} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Complaint Subject</label>
                <input
                  type="text"
                  value={compSubject}
                  onChange={(e) => setCompSubject(e.target.value)}
                  placeholder="e.g. Mold found on bread slices"
                  className="w-full mt-1 p-2.5 bg-white/50 dark:bg-slate-900 border rounded-xl text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Details & Description</label>
                <textarea
                  value={compDesc}
                  onChange={(e) => setCompDesc(e.target.value)}
                  placeholder="Provide precise details... Our AI threat model automatically gauges priority level."
                  rows={4}
                  className="w-full mt-1 p-3 bg-white/50 dark:bg-slate-900 border rounded-2xl text-sm"
                  required
                />
              </div>

              {/* Upload image for poor quality food */}
              <div className="flex flex-col gap-2 p-3 border border-dashed rounded-2xl bg-white/30 border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400">Attach a proof image for verification:</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, true)}
                  className="hidden"
                  id="comp-img-input"
                />
                <div className="flex justify-between items-center mt-1">
                  <label 
                    htmlFor="comp-img-input"
                    className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold rounded-xl text-xs cursor-pointer text-slate-700 dark:text-slate-300"
                  >
                    Select Proof Image
                  </label>
                  {compImage && (
                    <span className="text-[10px] text-emerald-500 font-mono">Proof Uploaded (Base64)</span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingComp}
                className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50"
              >
                {submittingComp ? 'Analyzing Threat Priority...' : 'File AI Categorized Complaint'}
              </button>
            </form>
          </div>

          {/* Active Complaints Tracker (Right col-span-2) */}
          <div className="lg:col-span-2 glass-premium rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Filer Complaints Registry</h3>
              <p className="text-xs text-slate-400 mt-1">
                AI assesses complaints on priority. Wardens respond with status alerts.
              </p>
            </div>

            {complaints.filter(c => c.studentId === userId).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">You have not reported any food complaints yet.</p>
            ) : (
              <div className="space-y-4">
                {complaints
                  .filter(c => c.studentId === userId)
                  .sort((a,b) => b.date.localeCompare(a.date))
                  .map((comp) => (
                    <div key={comp.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2 dark:border-slate-800">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            comp.priority === 'High' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300' :
                            comp.priority === 'Medium' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                          }`}>
                            AI Priority: {comp.priority}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{comp.date}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-bold text-slate-400">Status:</span>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                            comp.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' :
                            comp.status === 'In Progress' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' :
                            'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {comp.status}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{comp.subject}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">{comp.description}</p>
                      </div>

                      {comp.imageUrl && (
                        <div className="mt-2">
                          <span className="text-[10px] text-slate-400 block mb-1">Attached proof image:</span>
                          <img 
                            src={comp.imageUrl} 
                            alt="Complaint proof" 
                            className="max-h-32 rounded-lg object-cover border dark:border-slate-800"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      {comp.response ? (
                        <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-1">
                          <span className="text-[10px] font-bold text-emerald-600 block">Warden Reply:</span>
                          <p className="text-xs text-slate-600 dark:text-slate-300 italic">"{comp.response}"</p>
                          <span className="text-[9px] text-slate-400 block">Responded by: {comp.respondedBy}</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">
                          ⌛ Pending warden review response...
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
