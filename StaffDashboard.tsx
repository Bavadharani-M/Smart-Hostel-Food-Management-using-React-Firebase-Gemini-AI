import React, { useState, useEffect } from 'react';
import { 
  Utensils, 
  Package, 
  Clock, 
  Plus, 
  TrendingUp, 
  AlertTriangle, 
  PlusCircle, 
  Upload, 
  Trash2, 
  Edit3, 
  Coffee, 
  CheckCircle 
} from 'lucide-react';
import { MenuItem, InventoryItem } from '../types';

interface StaffDashboardProps {
  userId: string;
  userName: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  triggerNotification: (title: string, content: string) => void;
}

export default function StaffDashboard({
  userId,
  userName,
  activeTab,
  setActiveTab,
  triggerNotification
}: StaffDashboardProps) {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  
  // Menu form
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [mealItems, setMealItems] = useState('');
  const [mealCalories, setMealCalories] = useState(400);
  const [mealProtein, setMealProtein] = useState(15);
  const [mealCarbs, setMealCarbs] = useState(60);
  const [mealFat, setMealFat] = useState(10);
  const [mealStatus, setMealStatus] = useState<'Planned' | 'Preparing' | 'Ready' | 'Served'>('Planned');
  const [mealQty, setMealQty] = useState('200 servings');
  const [mealTimings, setMealTimings] = useState('07:30 AM - 09:00 AM');

  // Inventory form
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'groceries' | 'vegetables' | 'dairy' | 'others'>('groceries');
  const [newItemQty, setNewItemQty] = useState(100);
  const [newItemUnit, setNewItemUnit] = useState('kg');
  const [newItemMinStock, setNewItemMinStock] = useState(25);
  const [newItemCost, setNewItemCost] = useState(3000);
  const [addingStock, setAddingStock] = useState(false);

  // Fetch data
  const fetchData = async () => {
    try {
      const [resMenus, resInv] = await Promise.all([
        fetch('/api/menus').then(r => r.ok ? r.json() : []),
        fetch('/api/inventory').then(r => r.ok ? r.json() : [])
      ]);
      const safeMenus = Array.isArray(resMenus) ? resMenus : [];
      const safeInv = Array.isArray(resInv) ? resInv : [];

      setMenus(safeMenus);
      setInventory(safeInv);

      // Check for low stock on fetch
      const lowStockItems = safeInv.filter((item: InventoryItem) => item.quantity <= item.minStock);
      if (lowStockItems.length > 0) {
        triggerNotification(
          '⚠️ Low Stock Alert!', 
          `${lowStockItems.length} ingredients are running low on stock. Please replenishment soon.`
        );
      }
    } catch (err) {
      console.error("Error fetching staff data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  // Handle Edit Menu
  const startEditingMeal = (meal: MenuItem) => {
    setEditingMealId(meal.id);
    setMealItems(meal.items);
    setMealCalories(meal.calories);
    setMealProtein(meal.protein);
    setMealCarbs(meal.carbs);
    setMealFat(meal.fat);
    setMealStatus(meal.status || 'Planned');
    setMealQty(meal.quantityPrepared || '200 servings');
    setMealTimings(meal.timings || '07:30 AM - 09:00 AM');
  };

  const handleUpdateMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMealId) return;
    try {
      const res = await fetch(`/api/menus/${editingMealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: mealItems,
          calories: Number(mealCalories),
          protein: Number(mealProtein),
          carbs: Number(mealCarbs),
          fat: Number(mealFat),
          status: mealStatus,
          quantityPrepared: mealQty,
          timings: mealTimings
        })
      });
      if (res.ok) {
        triggerNotification('Menu Updated 🍳', 'The meal status and nutrient variables have been updated.');
        setEditingMealId(null);
        fetchData();
      }
    } catch (err) {
      console.error("Error updating menu item:", err);
    }
  };

  // Add Inventory Stock Purchase
  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    setAddingStock(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItemName,
          category: newItemCategory,
          quantity: Number(newItemQty),
          unit: newItemUnit,
          minStock: Number(newItemMinStock),
          cost: Number(newItemCost),
          lastPurchased: new Date().toISOString().split('T')[0]
        })
      });
      if (res.ok) {
        triggerNotification('Inventory Updated 📦', `Added fresh supply of ${newItemName}.`);
        setNewItemName('');
        setNewItemQty(100);
        setNewItemCost(3000);
        fetchData();
      }
    } catch (err) {
      console.error("Error adding grocery supply:", err);
    } finally {
      setAddingStock(false);
    }
  };

  // Increment stock level directly
  const handleQuickAddQty = async (itemId: string, increment: number) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;
    try {
      const res = await fetch(`/api/inventory/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: item.quantity + increment,
          lastPurchased: new Date().toISOString().split('T')[0]
        })
      });
      if (res.ok) {
        triggerNotification('Stock Incremented 📈', `Added +${increment} ${item.unit} to ${item.name}.`);
        fetchData();
      }
    } catch (err) {
      console.error("Error updating stock quantity:", err);
    }
  };

  // Filter Today's Menu
  const getTodayMeals = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    return menus.filter(m => m.date === todayStr);
  };

  const todayMeals = getTodayMeals();
  const lowStockList = inventory.filter(i => i.quantity <= i.minStock);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 animate-in fade-in duration-300">
      
      {/* Upper info card */}
      <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-blue-600 rounded-3xl text-white p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="bg-white/20 text-white font-semibold text-xs px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md">
              Mess Kitchen portal
            </span>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              Hello, Chef {userName.split(' ').pop() || userName}!
            </h2>
            <p className="text-sm text-teal-100 max-w-xl">
              Advance cooking preparation states, monitor stock thresholds, and register newly purchased vegetables easily.
            </p>
          </div>
          
          {lowStockList.length > 0 && (
            <div className="bg-rose-500/20 border border-rose-400/30 p-3.5 rounded-2xl flex items-center space-x-3 backdrop-blur-md shrink-0 animate-pulse">
              <AlertTriangle className="w-6 h-6 text-rose-300" />
              <div className="text-xs">
                <p className="font-extrabold text-rose-100">Low Stock Alert</p>
                <p className="text-rose-200 mt-0.5">{lowStockList.length} items running low!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Today's preparation board (Left col-span-2) */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="glass-premium rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center space-x-2">
                  <Utensils className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Live Kitchen Prep Board</h3>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl">Today's Active Servings</span>
              </div>

              {todayMeals.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-10">No meals planned for today yet.</p>
              ) : (
                <div className="space-y-4">
                  {todayMeals.map((meal) => {
                    const isEditing = editingMealId === meal.id;
                    return (
                      <div 
                        key={meal.id} 
                        className={`p-4 rounded-2xl border transition ${
                          isEditing 
                            ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10' 
                            : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                        }`}
                      >
                        {!isEditing ? (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-500 shrink-0 capitalize text-xs font-extrabold">
                                  {meal.type}
                                </span>
                                <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                                  {meal.items}
                                </h4>
                              </div>
                              <div className="flex flex-wrap gap-4 text-[11px] text-slate-400 font-mono">
                                <span>⏲️ {meal.timings || '07:30 AM - 09:00 AM'}</span>
                                <span>🍽️ {meal.quantityPrepared || '200 serves'}</span>
                                <span>🔥 {meal.calories || 400} Kcal</span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3 self-end sm:self-center">
                              <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                                meal.status === 'Ready' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' :
                                meal.status === 'Preparing' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' :
                                meal.status === 'Served' ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' :
                                'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                              }`}>
                                {meal.status || 'Planned'}
                              </span>

                              <button 
                                onClick={() => startEditingMeal(meal)}
                                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                                title="Edit Items / Prep Status"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Edit Meal Inline form
                          <form onSubmit={handleUpdateMenu} className="space-y-4">
                            <div className="flex justify-between items-center border-b pb-2 dark:border-slate-800 mb-2">
                              <span className="text-xs font-extrabold uppercase text-emerald-600">Editing {meal.type} details</span>
                              <div className="flex space-x-2">
                                <button 
                                  type="button" 
                                  onClick={() => setEditingMealId(null)}
                                  className="text-xs text-slate-400 px-2.5 py-1 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800"
                                >
                                  Cancel
                                </button>
                                <button 
                                  type="submit" 
                                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-lg"
                                >
                                  Save Changes
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="sm:col-span-3">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Prepare Foods Items</label>
                                <input
                                  type="text"
                                  value={mealItems}
                                  onChange={(e) => setMealItems(e.target.value)}
                                  className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                                  required
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Timings</label>
                                <input
                                  type="text"
                                  value={mealTimings}
                                  onChange={(e) => setMealTimings(e.target.value)}
                                  className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs font-mono"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Planned Servings</label>
                                <input
                                  type="text"
                                  value={mealQty}
                                  onChange={(e) => setMealQty(e.target.value)}
                                  className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs font-mono"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Preparation State</label>
                                <select
                                  value={mealStatus}
                                  onChange={(e) => setMealStatus(e.target.value as any)}
                                  className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs font-bold"
                                >
                                  <option value="Planned">Planned</option>
                                  <option value="Preparing">Preparing</option>
                                  <option value="Ready">Ready</option>
                                  <option value="Served">Served</option>
                                </select>
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Calories (Kcal)</label>
                                <input
                                  type="number"
                                  value={mealCalories}
                                  onChange={(e) => setMealCalories(Number(e.target.value))}
                                  className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Protein (g)</label>
                                <input
                                  type="number"
                                  value={mealProtein}
                                  onChange={(e) => setMealProtein(Number(e.target.value))}
                                  className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Carbs (g)</label>
                                <input
                                  type="number"
                                  value={mealCarbs}
                                  onChange={(e) => setMealCarbs(Number(e.target.value))}
                                  className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                                />
                              </div>
                            </div>
                          </form>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Serving Timings Reference list */}
            <div className="glass-premium rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Standard Kitchen Timings Reference</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-extrabold">Breakfast</span>
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-100 mt-1">07:30 - 09:00 AM</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-extrabold">Lunch Hour</span>
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-100 mt-1">12:30 - 02:00 PM</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-extrabold">Snack Tea</span>
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-100 mt-1">05:00 - 06:00 PM</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-extrabold">Dinner Time</span>
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-100 mt-1">07:30 - 09:30 PM</p>
                </div>
              </div>
            </div>

          </div>

          {/* Low Stock Items Tracker & Simple Grocery Addition form (Right col) */}
          <div className="space-y-6">
            
            {/* Purchase logs / Add Stock item form */}
            <div className="glass-premium rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 mb-4">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">Record Stock Purchase</h3>
              </div>

              <form onSubmit={handleAddStock} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Item Name</label>
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g. Fresh Tomatoes"
                    className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                    <select
                      value={newItemCategory}
                      onChange={(e) => setNewItemCategory(e.target.value as any)}
                      className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                    >
                      <option value="groceries">Groceries</option>
                      <option value="vegetables">Vegetables</option>
                      <option value="dairy">Dairy</option>
                      <option value="others">Others</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Quantity</label>
                    <input
                      type="number"
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(Number(e.target.value))}
                      className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Unit</label>
                    <input
                      type="text"
                      value={newItemUnit}
                      onChange={(e) => setNewItemUnit(e.target.value)}
                      placeholder="kg, liters, pcs"
                      className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Min Stock limit</label>
                    <input
                      type="number"
                      value={newItemMinStock}
                      onChange={(e) => setNewItemMinStock(Number(e.target.value))}
                      className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Purchased Cost (₹)</label>
                  <input
                    type="number"
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(Number(e.target.value))}
                    className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={addingStock}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50"
                >
                  {addingStock ? 'Recording...' : 'Record Purchase & Add Stock'}
                </button>
              </form>
            </div>

            {/* Low stock indicators list */}
            <div className="glass-premium rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-sm">Low Stock Monitor</span>
                <span className="text-[10px] font-mono text-rose-500 font-extrabold bg-rose-50 px-2 py-0.5 rounded-full">{lowStockList.length} critical</span>
              </div>

              {lowStockList.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">All stocks are above minimal levels ✅</p>
              ) : (
                <div className="space-y-3">
                  {lowStockList.map((item) => (
                    <div key={item.id} className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-center justify-between gap-2 text-xs">
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100">{item.name}</h4>
                        <div className="flex space-x-2 text-[10px] text-rose-400 font-mono mt-0.5">
                          <span>Current: {item.quantity} {item.unit}</span>
                          <span>Min: {item.minStock} {item.unit}</span>
                        </div>
                      </div>

                      {/* Quick restock button */}
                      <button
                        onClick={() => handleQuickAddQty(item.id, 50)}
                        className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white font-black text-[10px] rounded-lg shadow-sm transition"
                      >
                        +50 Quick
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* INVENTORY LIST TAB VIEW */}
      {activeTab === 'inventory' && (
        <div className="glass-premium rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-2xl text-slate-800 dark:text-slate-100">Ingredient Stock Master Ledger</h3>
              <p className="text-xs text-slate-400 mt-1">Review current volumes and historical order values.</p>
            </div>
            
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 shadow-md"
            >
              Add New Commodity
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventory.map((item) => {
              const isLow = item.quantity <= item.minStock;
              return (
                <div key={item.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-start justify-between">
                  <div>
                    <span className="text-[9px] font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                      {item.category}
                    </span>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 mt-1.5">{item.name}</h4>
                    <p className="text-xs text-slate-400 font-mono mt-1">Last purchased: {item.lastPurchased}</p>
                    
                    <div className="flex items-center space-x-4 mt-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Current Stock</span>
                        <span className={`text-base font-extrabold font-mono ${isLow ? 'text-rose-500' : 'text-slate-800 dark:text-slate-100'}`}>
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Min stock alert</span>
                        <span className="text-xs font-bold font-mono text-slate-500">{item.minStock} {item.unit}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 items-end">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isLow ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {isLow ? 'LOW STOCK' : 'NORMAL'}
                    </span>
                    <div className="flex gap-1.5 pt-2">
                      <button 
                        onClick={() => handleQuickAddQty(item.id, 10)}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[10px] font-bold rounded-lg"
                      >
                        +10
                      </button>
                      <button 
                        onClick={() => handleQuickAddQty(item.id, 100)}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[10px] font-bold rounded-lg"
                      >
                        +100
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
