export type UserRole = 'student' | 'staff' | 'warden' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  roomNo?: string;
  hostelName?: string;
  phone?: string;
  profilePic?: string;
}

export interface MenuItem {
  id: string;
  day: string; // 'Monday', 'Tuesday', etc.
  date: string; // 'YYYY-MM-DD'
  type: 'breakfast' | 'lunch' | 'snacks' | 'dinner';
  items: string; // Comma separated items
  calories: number;
  protein: number; // in g
  carbs: number; // in g
  fat: number; // in g
  isSpecial?: boolean;
  festivalName?: string;
  status?: 'Planned' | 'Preparing' | 'Ready' | 'Served'; // Preparation status
  quantityPrepared?: string; // e.g. "200 servings"
  timings?: string; // e.g. "07:30 AM - 09:00 AM"
}

export interface Attendance {
  id: string;
  studentId: string;
  studentName: string;
  roomNo?: string;
  date: string; // 'YYYY-MM-DD'
  breakfast: boolean;
  lunch: boolean;
  snacks: boolean;
  dinner: boolean;
  markedAt: string; // ISO date string
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'groceries' | 'vegetables' | 'dairy' | 'others';
  quantity: number; // Numeric quantity
  unit: string; // 'kg', 'liters', 'packets', 'units'
  minStock: number; // Low stock alert threshold
  lastPurchased: string; // 'YYYY-MM-DD'
  cost?: number; // Total cost of last purchase
}

export interface Feedback {
  id: string;
  studentId: string;
  studentName: string;
  roomNo?: string;
  date: string; // 'YYYY-MM-DD'
  mealType: 'breakfast' | 'lunch' | 'snacks' | 'dinner';
  rating: number; // 1-5 star rating
  review: string;
  imageUrl?: string;
  sentiment?: 'Positive' | 'Neutral' | 'Negative';
  scores?: {
    taste: number;
    hygiene: number;
    quantity: number;
    variety: number;
    freshness: number;
  };
}

export interface Complaint {
  id: string;
  studentId: string;
  studentName: string;
  roomNo?: string;
  date: string; // 'YYYY-MM-DD'
  subject: string;
  description: string;
  imageUrl?: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  priority: 'High' | 'Medium' | 'Low';
  response?: string;
  respondedBy?: string;
  respondedAt?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string; // 'YYYY-MM-DD'
  author: string;
  role: UserRole;
  type: 'info' | 'warning' | 'festival' | 'holiday';
}

export interface Notification {
  id: string;
  userId: string; // 'all' or specific userId
  title: string;
  content: string;
  date: string; // ISO string
  read: boolean;
  type: 'menu' | 'festival' | 'complaint' | 'inventory' | 'announcement';
}

export interface AIRecommendation {
  id: string;
  season: 'Summer' | 'Winter' | 'Rainy' | 'Exam' | 'Festivals';
  title: string;
  foods: string[];
  tips: string[];
  reasoning: string;
}

export interface AIWeeklyPrediction {
  weekStarting: string;
  rice: number; // in kg
  vegetables: number; // in kg
  oil: number; // in liters
  milk: number; // in liters
  eggs: number; // in count
  fruits: number; // in kg
  expectedAttendance: number;
  reasoning: string;
}
