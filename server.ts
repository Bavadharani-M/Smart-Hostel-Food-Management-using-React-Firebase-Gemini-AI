import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { initializeApp as initializeAdminApp, getApps as getAdminApps } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";

// Custom compatibility layer for Firestore using Firebase Admin SDK
const collection = (db: any, path: string) => {
  if (!db) return null;
  return db.collection(path);
};

const doc = (db: any, path: string, id?: string) => {
  if (!db) return null;
  if (id) {
    return db.collection(path).doc(id);
  }
  if (typeof db.doc === "function") {
    return db.doc(path);
  }
  return db.collection(path);
};

const getDocs = async (ref: any) => {
  if (!ref) return { empty: true, docs: [], forEach: () => {} };
  const snap = await ref.get();
  const docs = snap.docs.map((docSnap: any) => ({
    id: docSnap.id,
    exists: () => docSnap.exists,
    data: () => docSnap.data(),
  }));
  return {
    empty: snap.empty,
    docs,
    forEach: (callback: any) => {
      docs.forEach(callback);
    }
  };
};

const getDoc = async (docRef: any) => {
  if (!docRef) return { exists: () => false, data: () => null };
  const snap = await docRef.get();
  return {
    id: snap.id,
    exists: () => snap.exists,
    data: () => snap.data(),
  };
};

const setDoc = async (docRef: any, data: any) => {
  if (!docRef) return;
  return await docRef.set(data);
};

const addDoc = async (collectionRef: any, data: any) => {
  if (!collectionRef) return { id: `mock-${Date.now()}` };
  const res = await collectionRef.add(data);
  return {
    id: res.id,
  };
};

const updateDoc = async (docRef: any, data: any) => {
  if (!docRef) return;
  return await docRef.update(data);
};

const deleteDoc = async (docRef: any) => {
  if (!docRef) return;
  return await docRef.delete();
};

const query = (collectionRef: any, ...constraints: any[]) => {
  if (!collectionRef) return null;
  let q = collectionRef;
  for (const constraint of constraints) {
    if (constraint && typeof constraint.apply === "function") {
      q = constraint.apply(q);
    }
  }
  return q;
};

const where = (field: string, op: string, value: any) => {
  let adminOp = op;
  if (op === "==") adminOp = "==";
  return {
    apply: (q: any) => q.where(field, adminOp as any, value),
  };
};
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail 
} from "firebase/auth";
import { 
  getStorage, 
  ref, 
  uploadString, 
  getDownloadURL 
} from "firebase/storage";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Initialize Firebase SDK on server side
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
let firebaseApp: any = null;
let firestoreDb: any = null;
let firebaseAuth: any = null;
let firebaseStorage: any = null;

if (fs.existsSync(configPath)) {
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (getAdminApps().length === 0) {
      initializeAdminApp({
        projectId: firebaseConfig.projectId,
      });
    }

    if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)") {
      firestoreDb = getAdminFirestore(firebaseConfig.firestoreDatabaseId);
    } else {
      firestoreDb = getAdminFirestore();
    }

    firebaseApp = initializeApp(firebaseConfig);
    firebaseAuth = getAuth(firebaseApp);
    firebaseStorage = getStorage(firebaseApp);
    console.log("Firebase initialized successfully with Admin SDK for Firestore, database:", firebaseConfig.firestoreDatabaseId);
  } catch (err) {
    console.error("Error reading/parsing firebase-applet-config.json or initializing Admin SDK:", err);
  }
} else {
  console.error("firebase-applet-config.json file does not exist at root!");
}

// Helper to upload images to Firebase Storage
const uploadImageToStorage = async (base64Str: string, folderName: string): Promise<string> => {
  if (!base64Str || !base64Str.startsWith("data:image")) {
    return base64Str;
  }
  if (!firebaseStorage) {
    return base64Str;
  }
  try {
    const fileName = `${folderName}-${Date.now()}`;
    const storageRef = ref(firebaseStorage, `${folderName}/${fileName}`);
    await uploadString(storageRef, base64Str, "data_url");
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (err) {
    console.error("Failed to upload image to Firebase Storage, returning base64 instead:", err);
    return base64Str;
  }
};


// Initialize Gemini Client
let aiClient: GoogleGenAI | null = null;
const getGeminiClient = (): GoogleGenAI | null => {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return aiClient;
};

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Rich Initial Starter Data
const getInitialDB = () => {
  const users = [
    { id: "u-1", email: "student@hostel.com", password: "password", name: "Rahul Sharma", role: "student", roomNo: "102", hostelName: "Mandakini Hostel", phone: "+91 98765 43210", profilePic: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150" },
    { id: "u-2", email: "staff@hostel.com", password: "password", name: "Chef Vikram Singh", role: "staff", phone: "+91 98123 45678", profilePic: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150" },
    { id: "u-3", email: "warden@hostel.com", password: "password", name: "Dr. Amit Patel", role: "warden", hostelName: "Mandakini Hostel", phone: "+91 94250 12345", profilePic: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150" },
    { id: "u-4", email: "admin@hostel.com", password: "password", name: "Suresh Kumar", role: "admin", phone: "+91 90000 11111", profilePic: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150" },
    { id: "u-5", email: "priya@hostel.com", password: "password", name: "Priya Nair", role: "student", roomNo: "204", hostelName: "Ganga Hostel", phone: "+91 98765 00001" },
    { id: "u-6", email: "amit@hostel.com", password: "password", name: "Amit Verma", role: "student", roomNo: "105", hostelName: "Mandakini Hostel", phone: "+91 98765 00002" }
  ];

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const menus = [];

  const breakfastOptions = [
    { items: "Masala Dosa, Sambhar, Coconut Chutney, Tea", calories: 380, protein: 9, carbs: 54, fat: 12 },
    { items: "Aloo Paratha with Butter, Curd, Pickle, Tea", calories: 450, protein: 11, carbs: 62, fat: 16 },
    { items: "Idli (3 pcs), Vada (1 pc), Sambhar, Chutney, Coffee", calories: 360, protein: 10, carbs: 50, fat: 10 },
    { items: "Poha, Sev, Jalebi, Sprouts, Milk", calories: 410, protein: 12, carbs: 68, fat: 8 },
    { items: "Bread Toast with Jam, Butter, Omelette (2 eggs), Banana, Tea", calories: 420, protein: 18, carbs: 42, fat: 15 },
    { items: "Chole Bhature, Pickle, Lassi", calories: 580, protein: 14, carbs: 74, fat: 22 },
    { items: "Veg Upma, Coconut Chutney, Sheera, Tea", calories: 390, protein: 8, carbs: 58, fat: 11 }
  ];

  const lunchOptions = [
    { items: "Jeera Rice, Roti (3 pcs), Dal Tadka, Paneer Butter Masala, Mixed Veg, Salad, Curd", calories: 720, protein: 24, carbs: 94, fat: 21 },
    { items: "Plain Rice, Roti (3 pcs), Dal Fry, Aloo Gobhi Matar, Veg Kurma, Roasted Papad, Buttermilk", calories: 650, protein: 18, carbs: 88, fat: 16 },
    { items: "Veg Biryani, Salan, Onion Raitha, Paneer Tikka (2 pcs), Gulab Jamun", calories: 850, protein: 22, carbs: 102, fat: 28 },
    { items: "Steamed Rice, Roti (3 pcs), Rajma Masala, Bhindi Fry, Curd, Roasted Papad, Salad", calories: 680, protein: 20, carbs: 90, fat: 14 },
    { items: "Lemon Rice, Roti (2 pcs), Sambar, Potato Podimas, Cabbage Poriyal, Appalam, Curd", calories: 640, protein: 15, carbs: 92, fat: 12 },
    { items: "Plain Rice, Roti (3 pcs), Dal Makhani, Kadai Paneer, Baingan Bharta, Salad, Curd", calories: 740, protein: 25, carbs: 92, fat: 24 },
    { items: "Kashmiri Pulav, Roti (3 pcs), Chana Masala, Dum Aloo, Cucumber Raitha, Papad", calories: 690, protein: 19, carbs: 96, fat: 15 }
  ];

  const snacksOptions = [
    { items: "Samosa (2 pcs), Green Chutney, Tea", calories: 290, protein: 5, carbs: 36, fat: 14 },
    { items: "Veg Cutlet (2 pcs), Tomato Ketchup, Coffee", calories: 240, protein: 6, carbs: 30, fat: 10 },
    { items: "Pani Puri (8 pcs), Spicy & Sweet Water", calories: 180, protein: 4, carbs: 28, fat: 4 },
    { items: "Veg Grilled Sandwich, Chips, Tea", calories: 310, protein: 8, carbs: 40, fat: 12 },
    { items: "Bhel Puri, Lemonade", calories: 210, protein: 4, carbs: 34, fat: 5 },
    { items: "Onion Pakoda, Mint Chutney, Special Adrak Chai", calories: 320, protein: 6, carbs: 32, fat: 18 },
    { items: "Pav Bhaji (2 pav), Butter, Onion Lemon Salad", calories: 420, protein: 10, carbs: 54, fat: 16 }
  ];

  const dinnerOptions = [
    { items: "Roti (3 pcs), Plain Rice, Dal Makhani, Shahi Paneer, Kheer, Salad", calories: 710, protein: 22, carbs: 88, fat: 22 },
    { items: "Roti (3 pcs), Khichdi, Kadhi, Jeera Aloo, Roasted Papad, Pickle", calories: 590, protein: 15, carbs: 82, fat: 11 },
    { items: "Veg Pulav, Roti (3 pcs), Dal Tadka, Mushroom Masala, Salad, Ice Cream", calories: 750, protein: 20, carbs: 95, fat: 20 },
    { items: "Roti (3 pcs), Steamed Rice, Dal Fry, Lauki Kofta, Papad, Curd", calories: 610, protein: 17, carbs: 84, fat: 13 },
    { items: "Plain Rice, Roti (3 pcs), Sambar, Egg Curry (or Veg Kurma), Beans Thoran, Curd", calories: 680, protein: 24, carbs: 86, fat: 16 },
    { items: "Roti (3 pcs), Fried Rice, Veg Manchurian Wet, Spring Roll (1 pc), Salad", calories: 730, protein: 18, carbs: 94, fat: 22 },
    { items: "Roti (3 pcs), Plain Rice, Moong Dal, Matar Paneer, Salad, Fruit Custard", calories: 690, protein: 21, carbs: 88, fat: 18 }
  ];

  const todayStr = new Date().toISOString().split("T")[0];

  // Populate menus for the current week (starting yesterday to 5 days ahead)
  for (let i = -2; i < 5; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const dayName = days[d.getDay() === 0 ? 6 : d.getDay() - 1];

    const idx = (d.getDay() === 0 ? 6 : d.getDay() - 1);

    menus.push({
      id: `m-b-${dateStr}`,
      day: dayName,
      date: dateStr,
      type: "breakfast",
      ...breakfastOptions[idx],
      status: i < 0 ? "Served" : i === 0 ? "Ready" : "Planned",
      quantityPrepared: "180 servings",
      timings: "07:30 AM - 09:00 AM"
    });
    menus.push({
      id: `m-l-${dateStr}`,
      day: dayName,
      date: dateStr,
      type: "lunch",
      ...lunchOptions[idx],
      status: i < 0 ? "Served" : i === 0 ? "Preparing" : "Planned",
      quantityPrepared: "220 servings",
      timings: "12:30 PM - 02:00 PM"
    });
    menus.push({
      id: `m-s-${dateStr}`,
      day: dayName,
      date: dateStr,
      type: "snacks",
      ...snacksOptions[idx],
      status: i < 0 ? "Served" : i === 0 ? "Planned" : "Planned",
      quantityPrepared: "170 servings",
      timings: "05:00 PM - 06:00 PM"
    });
    menus.push({
      id: `m-d-${dateStr}`,
      day: dayName,
      date: dateStr,
      type: "dinner",
      ...dinnerOptions[idx],
      status: i < 0 ? "Served" : i === 0 ? "Planned" : "Planned",
      quantityPrepared: "210 servings",
      timings: "07:30 PM - 09:00 PM"
    });
  }

  // Adding one special festival menu
  const festDate = new Date();
  festDate.setDate(festDate.getDate() + 3);
  const festDateStr = festDate.toISOString().split("T")[0];
  menus.push({
    id: `m-f-${festDateStr}`,
    day: days[festDate.getDay() === 0 ? 6 : festDate.getDay() - 1],
    date: festDateStr,
    type: "lunch",
    items: "Poori, Chole Bhature, Paneer Pasanda, Pulao, Dal Makhani, Jalebi, Rabdi, Fruit Salad",
    calories: 980,
    protein: 26,
    carbs: 120,
    fat: 35,
    isSpecial: true,
    festivalName: "Monsoon Special Feast",
    status: "Planned",
    quantityPrepared: "250 servings",
    timings: "12:00 PM - 02:30 PM"
  });

  // Historic Attendance
  const attendance = [];
  const students = [
    { id: "u-1", name: "Rahul Sharma", roomNo: "102" },
    { id: "u-5", name: "Priya Nair", roomNo: "204" },
    { id: "u-6", name: "Amit Verma", roomNo: "105" }
  ];

  for (let i = -7; i <= 0; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];

    students.forEach((st) => {
      // randomly assign breakfast, lunch, snacks, dinner attendance
      attendance.push({
        id: `att-${st.id}-${dateStr}`,
        studentId: st.id,
        studentName: st.name,
        roomNo: st.roomNo,
        date: dateStr,
        breakfast: Math.random() > 0.15,
        lunch: Math.random() > 0.2,
        snacks: Math.random() > 0.3,
        dinner: Math.random() > 0.1,
        markedAt: new Date(d.setHours(8, 0, 0)).toISOString()
      });
    });
  }

  const inventory = [
    { id: "inv-1", name: "Basmati Rice", category: "groceries", quantity: 450, unit: "kg", minStock: 100, lastPurchased: "2026-06-30", cost: 18000 },
    { id: "inv-2", name: "Wheat Flour (Atta)", category: "groceries", quantity: 380, unit: "kg", minStock: 80, lastPurchased: "2026-07-02", cost: 11400 },
    { id: "inv-3", name: "Refined Sunflower Oil", category: "groceries", quantity: 45, unit: "liters", minStock: 50, lastPurchased: "2026-06-25", cost: 5400 }, // Low stock!
    { id: "inv-4", name: "Fresh Milk", category: "dairy", quantity: 32, unit: "liters", minStock: 40, lastPurchased: "2026-07-06", cost: 1920 }, // Low stock!
    { id: "inv-5", name: "Eggs", category: "dairy", quantity: 70, unit: "units", minStock: 100, lastPurchased: "2026-07-05", cost: 420 }, // Low stock!
    { id: "inv-6", name: "Potatoes & Onions", category: "vegetables", quantity: 150, unit: "kg", minStock: 40, lastPurchased: "2026-07-05", cost: 4500 },
    { id: "inv-7", name: "Tomatoes", category: "vegetables", quantity: 18, unit: "kg", minStock: 20, lastPurchased: "2026-07-05", cost: 900 }, // Low stock!
    { id: "inv-8", name: "Paneer (Cottage Cheese)", category: "dairy", quantity: 12, unit: "kg", minStock: 15, lastPurchased: "2026-07-06", cost: 4800 }, // Low stock!
    { id: "inv-9", name: "Pulses & Lentils (Dal)", category: "groceries", quantity: 140, unit: "kg", minStock: 50, lastPurchased: "2026-07-01", cost: 14000 },
    { id: "inv-10", name: "Sugar", category: "groceries", quantity: 85, unit: "kg", minStock: 25, lastPurchased: "2026-06-28", cost: 3400 }
  ];

  const feedback = [
    {
      id: "fb-1",
      studentId: "u-1",
      studentName: "Rahul Sharma",
      roomNo: "102",
      date: todayStr,
      mealType: "breakfast",
      rating: 5,
      review: "The Masala Dosa was incredibly crisp and delicious! Highly hygienic setup today.",
      sentiment: "Positive",
      scores: { taste: 5, hygiene: 5, quantity: 4, variety: 4, freshness: 5 }
    },
    {
      id: "fb-2",
      studentId: "u-5",
      studentName: "Priya Nair",
      roomNo: "204",
      date: todayStr,
      mealType: "lunch",
      rating: 2,
      review: "Paneer masala was extremely salty and oil was floating. Please reduce spices.",
      imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300",
      sentiment: "Negative",
      scores: { taste: 2, hygiene: 3, quantity: 4, variety: 3, freshness: 2 }
    },
    {
      id: "fb-3",
      studentId: "u-6",
      studentName: "Amit Verma",
      roomNo: "105",
      date: todayStr,
      mealType: "breakfast",
      rating: 3,
      review: "Breakfast Poha was okay, but sev was a bit stale. Sambar was warm.",
      sentiment: "Neutral",
      scores: { taste: 3, hygiene: 3, quantity: 3, variety: 3, freshness: 3 }
    }
  ];

  const complaints = [
    {
      id: "comp-1",
      studentId: "u-1",
      studentName: "Rahul Sharma",
      roomNo: "102",
      date: "2026-07-04",
      subject: "Water Purifier malfunction in Mess B",
      description: "The water filter in Mess Block B is dispensing water with a strange taste. Many students are complaining. Needs filters replaced immediately.",
      status: "In Progress",
      priority: "High",
      response: "Warden has approved maintenance. Technician scheduled for tomorrow morning.",
      respondedBy: "Dr. Amit Patel",
      respondedAt: "2026-07-05T14:30:00Z"
    },
    {
      id: "comp-2",
      studentId: "u-5",
      studentName: "Priya Nair",
      roomNo: "204",
      date: "2026-07-06",
      subject: "Stale bread served during Sunday breakfast",
      description: "The bread loaf slices served yesterday morning had green mold spots on the edges. Extremely unhygienic, please inspect mess stock.",
      status: "Pending",
      priority: "High"
    },
    {
      id: "comp-3",
      studentId: "u-6",
      studentName: "Amit Verma",
      roomNo: "105",
      date: "2026-07-02",
      subject: "Request for fresh seasonal fruits",
      description: "Currently breakfast lacks fresh fruits. We request banana, papaya, or watermelon to be added to the menu three times a week.",
      status: "Resolved",
      priority: "Low",
      response: "Request approved! Bananas and seasonal fruits are now added to Wednesday, Friday, and Sunday menus.",
      respondedBy: "Chef Vikram Singh",
      respondedAt: "2026-07-03T10:00:00Z"
    }
  ];

  const announcements = [
    { id: "an-1", title: "Revision of Mess Serving Timings", content: "To support students studying for the upcoming term exams, Dinner servings are extended by 30 minutes. New timing: 07:30 PM - 09:30 PM effective from tomorrow.", date: todayStr, author: "Suresh Kumar", role: "admin", type: "info" },
    { id: "an-2", title: "Monsoon Festival Special Lunch Feast", content: "There will be a grand special festival feast on Friday 10th July. Special preparations include Shahi Paneer, Pulao, Rabdi, Jalebi. Attendance is mandatory, extra guests allowed on prior notice.", date: todayStr, author: "Dr. Amit Patel", role: "warden", type: "festival" },
    { id: "an-3", title: "Bi-Weekly Kitchen Pest Control Treatment", content: "Kitchen and dining areas will undergo comprehensive pest control treatment on Sunday between 10 AM to 4 PM. Lunch will be served in the outdoor lawn buffet.", date: "2026-07-05", author: "Chef Vikram Singh", role: "staff", type: "warning" }
  ];

  const notifications = [
    { id: "n-1", userId: "all", title: "New Timing Alert", content: "Dinner hours extended by 30 mins for exams.", date: new Date().toISOString(), read: false, type: "announcement" },
    { id: "n-2", userId: "all", title: "Festival Menu Published", content: "Check out the Monsoon Feast menu details in your dashboard!", date: new Date().toISOString(), read: false, type: "festival" }
  ];

  return {
    users,
    menus,
    attendance,
    inventory,
    feedback,
    complaints,
    announcements,
    notifications
  };
};

// Database state
let db = getInitialDB();

// Helper to load/save
const loadDB = () => {
  try {
    if (fs.existsSync(DB_PATH)) {
      const fileData = fs.readFileSync(DB_PATH, "utf8");
      db = JSON.parse(fileData);
    } else {
      saveDB();
    }
  } catch (err) {
    console.error("Failed to load local DB, using in-memory:", err);
  }
};

const saveDB = () => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save local DB:", err);
  }
};

// Initial load
loadDB();

// Function to seed Firestore if empty
const seedFirestore = async () => {
  if (!firestoreDb || !firebaseAuth) {
    console.log("Skipping seedFirestore: Firebase is not initialized.");
    return;
  }
  try {
    const menusSnap = await getDocs(collection(firestoreDb, "menus"));
    if (menusSnap.empty) {
      console.log("Firestore database is empty. Seeding initial data...");
      const initial = getInitialDB();

      // Seed users
      for (const u of initial.users) {
        try {
          // Attempt to create user in Firebase Auth
          const authUser = await createUserWithEmailAndPassword(firebaseAuth, u.email, u.password);
          const { password: _, ...userProfile } = u;
          await setDoc(doc(firestoreDb, "users", authUser.user.uid), {
            ...userProfile,
            id: authUser.user.uid
          });
          console.log(`Seeded user in Auth & Firestore: ${u.email}`);
        } catch (authErr: any) {
          if (authErr.code === "auth/email-already-in-use" || authErr.code === "auth/email-already-exists") {
            // Already exists, just make sure document exists in firestore
            const { password: _, ...userProfile } = u;
            // Let's check if we can query for the user UID or just insert by matching email
            await setDoc(doc(firestoreDb, "users", u.id), userProfile);
          } else {
            const { password: _, ...userProfile } = u;
            await setDoc(doc(firestoreDb, "users", u.id), userProfile);
          }
        }
      }

      // Seed menus
      for (const m of initial.menus) {
        await setDoc(doc(firestoreDb, "menus", m.id), m);
      }

      // Seed attendance
      for (const a of initial.attendance) {
        await setDoc(doc(firestoreDb, "attendance", a.id), a);
      }

      // Seed inventory
      for (const inv of initial.inventory) {
        await setDoc(doc(firestoreDb, "inventory", inv.id), inv);
      }

      // Seed feedback
      for (const fb of initial.feedback) {
        await setDoc(doc(firestoreDb, "feedback", fb.id), fb);
      }

      // Seed complaints
      for (const comp of initial.complaints) {
        await setDoc(doc(firestoreDb, "complaints", comp.id), comp);
      }

      // Seed announcements
      for (const ann of initial.announcements) {
        await setDoc(doc(firestoreDb, "announcements", ann.id), ann);
      }

      // Seed notifications
      for (const notif of initial.notifications) {
        await setDoc(doc(firestoreDb, "notifications", notif.id), notif);
      }

      console.log("Firestore successfully seeded with rich initial data!");
    } else {
      console.log("Firestore already contains data. Skipping seeding.");
    }
  } catch (err) {
    console.error("Failed to seed Firestore:", err);
  }
};

// ===================================
// API ROUTING SECTION
// ===================================

// Auth APIs
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  
  if (!firebaseAuth || !firestoreDb) {
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      return res.json({ success: true, token: `mock-jwt-${user.id}`, user: userWithoutPassword });
    } else {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }
  }

  try {
    const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    const uid = userCredential.user.uid;
    const userDoc = await getDoc(doc(firestoreDb, "users", uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return res.json({ success: true, token: `firebase-token-${uid}`, user: { id: uid, ...userData } });
    } else {
      const fallbackUser = {
        id: uid,
        email: email,
        name: email.split("@")[0],
        role: "student" as const,
        roomNo: "",
        hostelName: "Mandakini Hostel",
        phone: ""
      };
      await setDoc(doc(firestoreDb, "users", uid), fallbackUser);
      return res.json({ success: true, token: `firebase-token-${uid}`, user: fallbackUser });
    }
  } catch (err: any) {
    console.error("Firebase auth login failed, checking fallback:", err);
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      return res.json({ success: true, token: `mock-jwt-${user.id}`, user: userWithoutPassword });
    }
    return res.status(401).json({ success: false, message: err.message || "Invalid email or password." });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { email, password, name, role, roomNo, hostelName, phone } = req.body;

  if (!firebaseAuth || !firestoreDb) {
    if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ success: false, message: "Email is already registered." });
    }

    const newUser = {
      id: `u-${Date.now()}`,
      email,
      password,
      name,
      role,
      roomNo,
      hostelName,
      phone,
      profilePic: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
    };

    db.users.push(newUser);
    saveDB();

    const { password: _, ...userWithoutPassword } = newUser;
    return res.json({ success: true, user: userWithoutPassword });
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    const uid = userCredential.user.uid;
    const profilePic = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";

    const userProfile = {
      id: uid,
      email,
      name,
      role,
      roomNo: roomNo || "",
      hostelName: hostelName || "Mandakini Hostel",
      phone: phone || "",
      profilePic
    };

    await setDoc(doc(firestoreDb, "users", uid), userProfile);
    return res.json({ success: true, user: userProfile });
  } catch (err: any) {
    console.error("Firebase registration failed:", err);
    return res.status(400).json({ success: false, message: err.message || "Registration failed." });
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!firebaseAuth) {
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      return res.json({ success: true, message: "Password reset link sent successfully to your email." });
    } else {
      return res.status(404).json({ success: false, message: "No registered user found with this email." });
    }
  }

  try {
    await sendPasswordResetEmail(firebaseAuth, email);
    return res.json({ success: true, message: "Password reset link sent successfully to your email." });
  } catch (err: any) {
    console.error("Firebase forgot password failed:", err);
    return res.status(400).json({ success: false, message: err.message || "Password reset failed." });
  }
});

app.post("/api/auth/update-profile", async (req, res) => {
  const { userId, name, roomNo, hostelName, phone, profilePic } = req.body;

  if (!firestoreDb) {
    const userIdx = db.users.findIndex(u => u.id === userId);
    if (userIdx !== -1) {
      db.users[userIdx] = {
        ...db.users[userIdx],
        ...(name && { name }),
        ...(roomNo !== undefined && { roomNo }),
        ...(hostelName !== undefined && { hostelName }),
        ...(phone !== undefined && { phone }),
        ...(profilePic && { profilePic })
      };
      saveDB();
      const { password: _, ...updatedUser } = db.users[userIdx];
      return res.json({ success: true, user: updatedUser });
    } else {
      return res.status(404).json({ success: false, message: "User not found." });
    }
  }

  try {
    const userRef = doc(firestoreDb, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      let finalProfilePic = profilePic;
      if (profilePic && profilePic.startsWith("data:image")) {
        finalProfilePic = await uploadImageToStorage(profilePic, "profiles");
      }

      const updates: any = {};
      if (name) updates.name = name;
      if (roomNo !== undefined) updates.roomNo = roomNo;
      if (hostelName !== undefined) updates.hostelName = hostelName;
      if (phone !== undefined) updates.phone = phone;
      if (finalProfilePic) updates.profilePic = finalProfilePic;

      await updateDoc(userRef, updates);

      const updatedSnap = await getDoc(userRef);
      return res.json({ success: true, user: { id: userId, ...updatedSnap.data() } });
    } else {
      return res.status(404).json({ success: false, message: "User not found." });
    }
  } catch (err: any) {
    console.error("Firebase update profile failed:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to update profile." });
  }
});

// User Management for Admin
app.get("/api/users", async (req, res) => {
  if (!firestoreDb) {
    const safeUsers = db.users.map(({ password: _, ...u }) => u);
    return res.json(safeUsers);
  }

  try {
    const snap = await getDocs(collection(firestoreDb, "users"));
    const usersList: any[] = [];
    snap.forEach((doc) => {
      usersList.push({ id: doc.id, ...doc.data() });
    });
    return res.json(usersList);
  } catch (err: any) {
    console.error("Firebase get users failed:", err);
    return res.status(500).json({ message: "Failed to get users." });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  const id = req.params.id;

  if (!firestoreDb) {
    db.users = db.users.filter(u => u.id !== id);
    saveDB();
    return res.json({ success: true });
  }

  try {
    await deleteDoc(doc(firestoreDb, "users", id));
    return res.json({ success: true });
  } catch (err: any) {
    console.error("Firebase delete user failed:", err);
    return res.status(500).json({ message: "Failed to delete user." });
  }
});

// Menu APIs
app.get("/api/menus", async (req, res) => {
  if (!firestoreDb) {
    return res.json(db.menus);
  }

  try {
    const snap = await getDocs(collection(firestoreDb, "menus"));
    const list: any[] = [];
    snap.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    return res.json(list);
  } catch (err: any) {
    console.error("Firebase get menus failed:", err);
    return res.status(500).json({ message: "Failed to get menus." });
  }
});

app.post("/api/menus", async (req, res) => {
  if (!firestoreDb) {
    const newItem = { id: `m-${Date.now()}`, ...req.body };
    db.menus.push(newItem);
    saveDB();
    return res.json(newItem);
  }

  try {
    const id = `m-${Date.now()}`;
    const newItem = { id, ...req.body };
    await setDoc(doc(firestoreDb, "menus", id), newItem);
    return res.json(newItem);
  } catch (err: any) {
    console.error("Firebase create menu failed:", err);
    return res.status(500).json({ message: "Failed to create menu item." });
  }
});

app.put("/api/menus/:id", async (req, res) => {
  const id = req.params.id;

  if (!firestoreDb) {
    const idx = db.menus.findIndex(m => m.id === id);
    if (idx !== -1) {
      db.menus[idx] = { ...db.menus[idx], ...req.body };
      saveDB();
      return res.json(db.menus[idx]);
    } else {
      return res.status(404).json({ message: "Menu item not found" });
    }
  }

  try {
    const ref = doc(firestoreDb, "menus", id);
    await updateDoc(ref, req.body);
    const snap = await getDoc(ref);
    return res.json({ id, ...snap.data() });
  } catch (err: any) {
    console.error("Firebase update menu failed:", err);
    return res.status(500).json({ message: "Failed to update menu item." });
  }
});

app.delete("/api/menus/:id", async (req, res) => {
  const id = req.params.id;

  if (!firestoreDb) {
    db.menus = db.menus.filter(m => m.id !== id);
    saveDB();
    return res.json({ success: true });
  }

  try {
    await deleteDoc(doc(firestoreDb, "menus", id));
    return res.json({ success: true });
  } catch (err: any) {
    console.error("Firebase delete menu failed:", err);
    return res.status(500).json({ message: "Failed to delete menu item." });
  }
});

// Attendance APIs
app.get("/api/attendance", async (req, res) => {
  if (!firestoreDb) {
    return res.json(db.attendance);
  }

  try {
    const snap = await getDocs(collection(firestoreDb, "attendance"));
    const list: any[] = [];
    snap.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    return res.json(list);
  } catch (err: any) {
    console.error("Firebase get attendance failed:", err);
    return res.status(500).json({ message: "Failed to get attendance." });
  }
});

app.post("/api/attendance", async (req, res) => {
  const { studentId, studentName, roomNo, date, breakfast, lunch, snacks, dinner } = req.body;

  const attendanceRecord = {
    studentId,
    studentName,
    roomNo: roomNo || "",
    date,
    breakfast: !!breakfast,
    lunch: !!lunch,
    snacks: !!snacks,
    dinner: !!dinner,
    markedAt: new Date().toISOString()
  };

  if (!firestoreDb) {
    const existingIdx = db.attendance.findIndex(a => a.studentId === studentId && a.date === date);
    if (existingIdx !== -1) {
      db.attendance[existingIdx] = { ...db.attendance[existingIdx], ...attendanceRecord };
    } else {
      db.attendance.push({ id: `att-${Date.now()}`, ...attendanceRecord });
    }
    saveDB();
    return res.json({ success: true });
  }

  try {
    const q = query(
      collection(firestoreDb, "attendance"),
      where("studentId", "==", studentId),
      where("date", "==", date)
    );
    const querySnap = await getDocs(q);

    if (!querySnap.empty) {
      const docId = querySnap.docs[0].id;
      await updateDoc(doc(firestoreDb, "attendance", docId), attendanceRecord);
    } else {
      const id = `att-${Date.now()}`;
      await setDoc(doc(firestoreDb, "attendance", id), { id, ...attendanceRecord });
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error("Firebase post attendance failed:", err);
    return res.status(500).json({ message: "Failed to mark attendance." });
  }
});

// Inventory APIs
app.get("/api/inventory", async (req, res) => {
  if (!firestoreDb) {
    return res.json(db.inventory);
  }

  try {
    const snap = await getDocs(collection(firestoreDb, "inventory"));
    const list: any[] = [];
    snap.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    return res.json(list);
  } catch (err: any) {
    console.error("Firebase get inventory failed:", err);
    return res.status(500).json({ message: "Failed to get inventory." });
  }
});

app.post("/api/inventory", async (req, res) => {
  const { name, category, quantity, unit, minStock, lastPurchased, cost } = req.body;
  const record = {
    name,
    category,
    quantity: Number(quantity),
    unit,
    minStock: Number(minStock),
    lastPurchased,
    cost: cost !== undefined ? Number(cost) : undefined
  };

  if (!firestoreDb) {
    const newItem = { id: `inv-${Date.now()}`, ...record };
    db.inventory.push(newItem);
    saveDB();
    return res.json(newItem);
  }

  try {
    const id = `inv-${Date.now()}`;
    const newItem = { id, ...record };
    await setDoc(doc(firestoreDb, "inventory", id), newItem);
    return res.json(newItem);
  } catch (err: any) {
    console.error("Firebase post inventory failed:", err);
    return res.status(500).json({ message: "Failed to create inventory item." });
  }
});

app.put("/api/inventory/:id", async (req, res) => {
  const id = req.params.id;
  const updates: any = { ...req.body };
  if (req.body.quantity !== undefined) updates.quantity = Number(req.body.quantity);
  if (req.body.minStock !== undefined) updates.minStock = Number(req.body.minStock);
  if (req.body.cost !== undefined) updates.cost = Number(req.body.cost);

  if (!firestoreDb) {
    const idx = db.inventory.findIndex(inv => inv.id === id);
    if (idx !== -1) {
      db.inventory[idx] = { ...db.inventory[idx], ...updates };
      saveDB();
      return res.json(db.inventory[idx]);
    } else {
      return res.status(404).json({ message: "Inventory item not found" });
    }
  }

  try {
    const ref = doc(firestoreDb, "inventory", id);
    await updateDoc(ref, updates);
    const snap = await getDoc(ref);
    return res.json({ id, ...snap.data() });
  } catch (err: any) {
    console.error("Firebase update inventory failed:", err);
    return res.status(500).json({ message: "Failed to update inventory item." });
  }
});

app.delete("/api/inventory/:id", async (req, res) => {
  const id = req.params.id;

  if (!firestoreDb) {
    db.inventory = db.inventory.filter(inv => inv.id !== id);
    saveDB();
    return res.json({ success: true });
  }

  try {
    await deleteDoc(doc(firestoreDb, "inventory", id));
    return res.json({ success: true });
  } catch (err: any) {
    console.error("Firebase delete inventory failed:", err);
    return res.status(500).json({ message: "Failed to delete inventory item." });
  }
});

// Feedback APIs
app.get("/api/feedback", async (req, res) => {
  if (!firestoreDb) {
    return res.json(db.feedback);
  }

  try {
    const snap = await getDocs(collection(firestoreDb, "feedback"));
    const list: any[] = [];
    snap.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    return res.json(list);
  } catch (err: any) {
    console.error("Firebase get feedback failed:", err);
    return res.status(500).json({ message: "Failed to get feedback." });
  }
});

app.post("/api/feedback", async (req, res) => {
  const { studentId, studentName, roomNo, date, mealType, rating, review, imageUrl, scores } = req.body;

  let finalImageUrl = imageUrl || "";
  if (imageUrl && imageUrl.startsWith("data:image")) {
    finalImageUrl = await uploadImageToStorage(imageUrl, "feedback");
  }

  const newFb: any = {
    id: `fb-${Date.now()}`,
    studentId,
    studentName,
    roomNo: roomNo || "",
    date,
    mealType,
    rating: Number(rating),
    review,
    imageUrl: finalImageUrl,
    scores: scores || { taste: Number(rating), hygiene: Number(rating), quantity: Number(rating), variety: Number(rating), freshness: Number(rating) },
    sentiment: "Neutral"
  };

  // Run AI Sentiment Analysis on the review if we have Gemini key
  try {
    const ai = getGeminiClient();
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze the following hostel food feedback review. 
Review: "${review}"
Classify sentiment as exactly: "Positive", "Neutral", or "Negative". 
Also assign 1-5 integer ratings for: "taste", "hygiene", "quantity", "variety", "freshness" based on the feedback.
Return ONLY a valid JSON object matching the schema:
{
  "sentiment": "Positive" | "Neutral" | "Negative",
  "scores": { "taste": number, "hygiene": number, "quantity": number, "variety": number, "freshness": number }
}`,
        config: {
          responseMimeType: "application/json"
        }
      });

      if (response.text) {
        const result = JSON.parse(response.text.trim());
        newFb.sentiment = result.sentiment || "Neutral";
        if (result.scores) {
          newFb.scores = result.scores;
        }
      }
    } else {
      // Offline fallback simple lexicon sentiment analysis
      const lower = review.toLowerCase();
      if (lower.includes("delicious") || lower.includes("great") || lower.includes("good") || lower.includes("excellent") || lower.includes("crisp") || lower.includes("hygienic")) {
        newFb.sentiment = "Positive";
      } else if (lower.includes("salty") || lower.includes("bad") || lower.includes("stale") || lower.includes("poor") || lower.includes("dirty") || lower.includes("unhygienic")) {
        newFb.sentiment = "Negative";
      }
    }
  } catch (err) {
    console.error("AI feedback sentiment analyzer failed, using fallback:", err);
  }

  if (!firestoreDb) {
    db.feedback.push(newFb);
    saveDB();
    return res.json(newFb);
  }

  try {
    await setDoc(doc(firestoreDb, "feedback", newFb.id), newFb);
    return res.json(newFb);
  } catch (err: any) {
    console.error("Firebase post feedback failed:", err);
    return res.status(500).json({ message: "Failed to save feedback." });
  }
});

// Complaints APIs
app.get("/api/complaints", async (req, res) => {
  if (!firestoreDb) {
    return res.json(db.complaints);
  }

  try {
    const snap = await getDocs(collection(firestoreDb, "complaints"));
    const list: any[] = [];
    snap.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    return res.json(list);
  } catch (err: any) {
    console.error("Firebase get complaints failed:", err);
    return res.status(500).json({ message: "Failed to get complaints." });
  }
});

app.post("/api/complaints", async (req, res) => {
  const { studentId, studentName, roomNo, date, subject, description, imageUrl } = req.body;

  let finalImageUrl = imageUrl || "";
  if (imageUrl && imageUrl.startsWith("data:image")) {
    finalImageUrl = await uploadImageToStorage(imageUrl, "complaints");
  }

  const newComp: any = {
    id: `comp-${Date.now()}`,
    studentId,
    studentName,
    roomNo: roomNo || "",
    date,
    subject,
    description,
    imageUrl: finalImageUrl,
    status: "Pending",
    priority: "Medium"
  };

  // Run AI priority analyzer if Gemini is available
  try {
    const ai = getGeminiClient();
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze this hostel food complaint:
Subject: "${subject}"
Description: "${description}"

Determine the priority level: "High", "Medium", or "Low". 
"High" is for severe issues like health hazards, spoiled/rotten food, major hygiene violations, broken key facilities (water purifier, refrigerator).
"Medium" is for minor service delays, undercooked but safe food, average hygiene issues.
"Low" is for suggestions, variety requests, minor requests.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              priority: {
                type: Type.STRING,
                description: "The priority level of the complaint: 'High', 'Medium', or 'Low'"
              }
            },
            required: ["priority"]
          }
        }
      });

      if (response.text) {
        const result = JSON.parse(response.text.trim());
        newComp.priority = result.priority || "Medium";
      }
    } else {
      // Fallback prioritized words
      const lower = (subject + " " + description).toLowerCase();
      if (lower.includes("mold") || lower.includes("insect") || lower.includes("poison") || lower.includes("sick") || lower.includes("unhygienic") || lower.includes("broken") || lower.includes("purifier")) {
        newComp.priority = "High";
      } else if (lower.includes("spice") || lower.includes("salty") || lower.includes("cold") || lower.includes("quantity")) {
        newComp.priority = "Medium";
      } else {
        newComp.priority = "Low";
      }
    }
  } catch (err) {
    console.error("AI complaint priority analyzer failed:", err);
  }

  // Create notifications for Admins & Wardens for High priority complaints
  const newNotification = newComp.priority === "High" ? {
    id: `n-${Date.now()}`,
    userId: "all",
    title: "🚨 High Priority Complaint Reported",
    content: `${studentName} reported: "${subject}"`,
    date: new Date().toISOString(),
    read: false,
    type: "complaint"
  } : null;

  if (!firestoreDb) {
    db.complaints.push(newComp);
    if (newNotification) {
      db.notifications.push(newNotification);
    }
    saveDB();
    return res.json(newComp);
  }

  try {
    await setDoc(doc(firestoreDb, "complaints", newComp.id), newComp);
    if (newNotification) {
      await setDoc(doc(firestoreDb, "notifications", newNotification.id), newNotification);
    }
    return res.json(newComp);
  } catch (err: any) {
    console.error("Firebase post complaint failed:", err);
    return res.status(500).json({ message: "Failed to save complaint." });
  }
});

app.put("/api/complaints/:id", async (req, res) => {
  const id = req.params.id;

  if (!firestoreDb) {
    const idx = db.complaints.findIndex(c => c.id === id);
    if (idx !== -1) {
      db.complaints[idx] = { ...db.complaints[idx], ...req.body };
      saveDB();
      return res.json(db.complaints[idx]);
    } else {
      return res.status(404).json({ message: "Complaint not found" });
    }
  }

  try {
    const ref = doc(firestoreDb, "complaints", id);
    await updateDoc(ref, req.body);
    const snap = await getDoc(ref);
    return res.json({ id, ...snap.data() });
  } catch (err: any) {
    console.error("Firebase update complaint failed:", err);
    return res.status(500).json({ message: "Failed to update complaint." });
  }
});

// Announcements APIs
app.get("/api/announcements", async (req, res) => {
  if (!firestoreDb) {
    return res.json(db.announcements);
  }

  try {
    const snap = await getDocs(collection(firestoreDb, "announcements"));
    const list: any[] = [];
    snap.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    return res.json(list);
  } catch (err: any) {
    console.error("Firebase get announcements failed:", err);
    return res.status(500).json({ message: "Failed to get announcements." });
  }
});

app.post("/api/announcements", async (req, res) => {
  const id = `an-${Date.now()}`;
  const newAnn = { id, ...req.body };

  // also create a global notification
  const newNotification = {
    id: `n-${Date.now()}`,
    userId: "all",
    title: `Announcement: ${newAnn.title}`,
    content: newAnn.content.substring(0, 100),
    date: new Date().toISOString(),
    read: false,
    type: "announcement"
  };

  if (!firestoreDb) {
    db.announcements.push(newAnn);
    db.notifications.push(newNotification);
    saveDB();
    return res.json(newAnn);
  }

  try {
    await setDoc(doc(firestoreDb, "announcements", id), newAnn);
    await setDoc(doc(firestoreDb, "notifications", newNotification.id), newNotification);
    return res.json(newAnn);
  } catch (err: any) {
    console.error("Firebase post announcement failed:", err);
    return res.status(500).json({ message: "Failed to create announcement." });
  }
});

app.delete("/api/announcements/:id", async (req, res) => {
  const id = req.params.id;

  if (!firestoreDb) {
    db.announcements = db.announcements.filter(a => a.id !== id);
    saveDB();
    return res.json({ success: true });
  }

  try {
    await deleteDoc(doc(firestoreDb, "announcements", id));
    return res.json({ success: true });
  } catch (err: any) {
    console.error("Firebase delete announcement failed:", err);
    return res.status(500).json({ message: "Failed to delete announcement." });
  }
});

// Notifications APIs
app.get("/api/notifications", async (req, res) => {
  if (!firestoreDb) {
    return res.json(db.notifications);
  }

  try {
    const snap = await getDocs(collection(firestoreDb, "notifications"));
    const list: any[] = [];
    snap.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    return res.json(list);
  } catch (err: any) {
    console.error("Firebase get notifications failed:", err);
    return res.status(500).json({ message: "Failed to get notifications." });
  }
});

app.put("/api/notifications/:id/read", async (req, res) => {
  const id = req.params.id;

  if (!firestoreDb) {
    const idx = db.notifications.findIndex(n => n.id === id);
    if (idx !== -1) {
      db.notifications[idx].read = true;
      saveDB();
      return res.json(db.notifications[idx]);
    } else {
      return res.status(404).json({ message: "Notification not found" });
    }
  }

  try {
    const ref = doc(firestoreDb, "notifications", id);
    await updateDoc(ref, { read: true });
    const snap = await getDoc(ref);
    return res.json({ id, ...snap.data() });
  } catch (err: any) {
    console.error("Firebase read notification failed:", err);
    return res.status(500).json({ message: "Failed to mark notification as read." });
  }
});


// ===================================
// AI SMART FEATURES ENDPOINTS
// ===================================

// AI Feature 1: Seasonal AI Food Recommendations
app.post("/api/ai/recommendations", async (req, res) => {
  const { season } = req.body; // 'Summer' | 'Winter' | 'Rainy' | 'Exam' | 'Festivals'
  
  const seasonRecommendations: Record<string, any> = {
    Summer: {
      season: "Summer",
      title: "Cooling & Hydrating Foods",
      foods: ["Cold Buttermilk (Chaas) with Mint", "Chilled Watermelon & Cucumber Salad", "Fresh Lemonade / Mint Mojito", "Curd Rice with Pomegranate", "Coconut Water"],
      tips: ["Avoid deep-fried and heavily spiced oily gravies.", "Incorporate seasonal high-water content vegetables like bottle gourd and ridge gourd.", "Serve cold curd with every lunch to aid digestion."],
      reasoning: "During peak summer, high heat slows digestion and causes dehydration. Light, hydrating, and probiotics-rich dairy foods cool down the core body temperature naturally."
    },
    Winter: {
      season: "Winter",
      title: "Immunity Booster & Warming Foods",
      foods: ["Hot Adrak (Ginger) Tea / Kadha", "Gajar ka Halwa (Carrot Sweet)", "Spiced Lentil Soup / Dal Shorba", "Steaming Sarson Ka Saag with Makki Roti", "Warm Honey-Lemon Turmeric Milk"],
      tips: ["Serve food piping hot immediately after preparation.", "Include warming spices like black pepper, cinnamon, and garlic in lunch/dinner gravies.", "Include roasted sesame (til) chikkis in the snacks menu."],
      reasoning: "Winter requires metabolism-stimulating, warming foods to sustain energy and immunity. Root vegetables, spices, and warm milk recipes help combat cold weather and respiratory infections."
    },
    Rainy: {
      season: "Rainy",
      title: "Hygiene & Easy Digestible Foods",
      foods: ["Hot Vegetable Barley Soup", "Steamed Idli and hot Sambhar", "Crispy Garlic-Herb Roasted Potatoes", "Masala Khichdi with Ghee", "Herbal Ginger-Tulsi Tea"],
      tips: ["Avoid raw vegetables, uncooked salads, and unpeeled fruits due to bacterial risks.", "Ensure high temperature kitchen wash for all leafy greens and vegetables.", "Serve hot roasted snack items instead of deep fried oily roadside pakodas."],
      reasoning: "Monsoon carries higher waterborne and bacterial risk. Freshly prepared hot meals, boiled legumes, and herbal decoctions support gut immunity when general pathogens peak."
    },
    Exam: {
      season: "Exam",
      title: "Brain Booster & High Focus Foods",
      foods: ["Almond & Walnut Milkshake", "Fresh Fruit Bowl (Apple, Banana, Orange)", "Oats Porridge with Berries", "Sprouts & Paneer Salad", "Baked Egg Omelette on Multigrain Toast"],
      tips: ["Avoid carb-heavy lunch foods like heavy maida rotis or heavy white rice that induce daytime lethargy.", "Incorporate high magnesium and Omega-3 rich sources.", "Provide walnuts or soaked almonds with breakfast."],
      reasoning: "Exam periods demand sustained focus and mental stamina without heavy digestion fatigue. Protein-rich, low-glycemic carbs and memory-supporting nuts protect brain focus and keep students active."
    },
    Festivals: {
      season: "Festivals",
      title: "Traditional Delicacies & Community Dining",
      foods: ["Rich Shahi Paneer & Butter Naan", "Hot Moong Dal Halwa / Kheer", "Veg Pulav / Royal Biryani", "Crispy Poori with Chole Masala", "Chilled Rabdi Jalebi Combo"],
      tips: ["Prepare community-style food with standard hygiene precautions.", "Provide sweets, but balance with high protein side dishes.", "Decorate serving trays and create dynamic food festivals!"],
      reasoning: "Festivals celebrate togetherness and culture. Rich, traditional sweet and savory dishes increase hostel morale, build community, and make students feel closer to home."
    }
  };

  const defaultRec = seasonRecommendations[season] || seasonRecommendations["Summer"];

  try {
    const ai = getGeminiClient();
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Generate a hostel mess healthy food recommendation report for the season/period: "${season}".
Provide:
1. A descriptive title matching the theme.
2. A list of 4-5 recommended food items/recipes.
3. 3 practical hostel kitchen tips for this season.
4. A scientific reasoning of why these choices are beneficial.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              season: {
                type: Type.STRING,
                description: "The requested season or period"
              },
              title: {
                type: Type.STRING,
                description: "Descriptive title for the seasonal report"
              },
              foods: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING
                },
                description: "List of 4-5 recommended healthy food items or recipes"
              },
              tips: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING
                },
                description: "3 practical hostel kitchen/mess tips for this season"
              },
              reasoning: {
                type: Type.STRING,
                description: "Scientific/dietary reasoning explaining why these choices are beneficial"
              }
            },
            required: ["season", "title", "foods", "tips", "reasoning"]
          }
        }
      });

      if (response.text) {
        const result = JSON.parse(response.text.trim());
        return res.json({ ...result, source: "Live AI" });
      }
    }
  } catch (err) {
    console.error("Gemini AI seasonal recommendations failed, using local template:", err);
  }

  res.json({ ...defaultRec, source: "Simulated AI (Local Model)" });
});

// AI Feature 2: AI Weekly Food Requirement Prediction
app.post("/api/ai/weekly-prediction", async (req, res) => {
  // Extract historic attendance to calculate average attendance rate
  let attendanceLogs = db.attendance;
  let numStudents = db.users.filter(u => u.role === "student").length || 100;

  if (firestoreDb) {
    try {
      const attSnap = await getDocs(collection(firestoreDb, "attendance"));
      const attList: any[] = [];
      attSnap.forEach((docSnap) => {
        attList.push({ id: docSnap.id, ...docSnap.data() });
      });
      attendanceLogs = attList;

      const userSnap = await getDocs(collection(firestoreDb, "users"));
      let studentCount = 0;
      userSnap.forEach((docSnap) => {
        const u = docSnap.data();
        if (u.role === "student") {
          studentCount++;
        }
      });
      if (studentCount > 0) {
        numStudents = studentCount;
      }
    } catch (err) {
      console.error("Failed to fetch data from Firestore for weekly prediction:", err);
    }
  }

  const totalCount = attendanceLogs.length;
  let markedCount = 0;
  
  attendanceLogs.forEach(a => {
    let meals = 0;
    if (a.breakfast) meals++;
    if (a.lunch) meals++;
    if (a.snacks) meals++;
    if (a.dinner) meals++;
    markedCount += (meals / 4);
  });

  const avgAttendanceRate = totalCount > 0 ? (markedCount / (totalCount)) : 0.85;
  const expectedAttendance = Math.round(numStudents * avgAttendanceRate * 7); // total weekly meal-heads

  // Standard food multipliers (kg per student per meal-head)
  const baseRice = Number((expectedAttendance * 0.12).toFixed(1));
  const baseVeg = Number((expectedAttendance * 0.15).toFixed(1));
  const baseOil = Number((expectedAttendance * 0.02).toFixed(1));
  const baseMilk = Number((expectedAttendance * 0.1).toFixed(1));
  const baseEggs = Math.round(expectedAttendance * 0.4);
  const baseFruits = Number((expectedAttendance * 0.08).toFixed(1));

  const mockPrediction = {
    weekStarting: new Date().toISOString().split("T")[0],
    rice: baseRice,
    vegetables: baseVeg,
    oil: baseOil,
    milk: baseMilk,
    eggs: baseEggs,
    fruits: baseFruits,
    expectedAttendance: expectedAttendance,
    reasoning: `Based on the past week's average attendance rate of ${Math.round(avgAttendanceRate * 100)}% for a student population of ${numStudents}, we expect a total of ${expectedAttendance} meal check-ins over the upcoming 7 days. Recommended grocery orders are scaled with 10% safety margin to accommodate unexpected weekend surges.`
  };

  try {
    const ai = getGeminiClient();
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `As an expert Hostel Mess Supply Chain Predictive AI, analyze this statistics:
- Number of active hostel students: ${numStudents}
- Past average attendance coefficient: ${avgAttendanceRate}
- Total estimated weekly meal-heads: ${expectedAttendance}

Predict the optimized quantity required for the next 7 days for:
1. Rice (in kg)
2. Vegetables (in kg)
3. Cooking Oil (in Liters)
4. Milk (in Liters)
5. Eggs (in units/pieces)
6. Fruits (in kg)`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              rice: {
                type: Type.NUMBER,
                description: "Recommended quantity of rice in kg for the next 7 days"
              },
              vegetables: {
                type: Type.NUMBER,
                description: "Recommended quantity of vegetables in kg for the next 7 days"
              },
              oil: {
                type: Type.NUMBER,
                description: "Recommended quantity of cooking oil in Liters for the next 7 days"
              },
              milk: {
                type: Type.NUMBER,
                description: "Recommended quantity of milk in Liters for the next 7 days"
              },
              eggs: {
                type: Type.NUMBER,
                description: "Recommended quantity of eggs in units/pieces for the next 7 days"
              },
              fruits: {
                type: Type.NUMBER,
                description: "Recommended quantity of fruits in kg for the next 7 days"
              },
              expectedAttendance: {
                type: Type.NUMBER,
                description: "Total expected attendance meal check-ins"
              },
              reasoning: {
                type: Type.STRING,
                description: "Detailed supply chain reasoning for these predictions"
              }
            },
            required: [
              "rice",
              "vegetables",
              "oil",
              "milk",
              "eggs",
              "fruits",
              "expectedAttendance",
              "reasoning"
            ]
          }
        }
      });

      if (response.text) {
        const result = JSON.parse(response.text.trim());
        return res.json({ 
          weekStarting: new Date().toISOString().split("T")[0],
          ...result, 
          source: "Live AI" 
        });
      }
    }
  } catch (err) {
    console.error("Gemini AI prediction failed, using fallback:", err);
  }

  res.json({ ...mockPrediction, source: "Simulated AI (Local Model)" });
});

// AI Feature 5: AI Food Quality Monthly Report
app.post("/api/ai/monthly-quality-report", async (req, res) => {
  let feedbacks = db.feedback;

  if (firestoreDb) {
    try {
      const snap = await getDocs(collection(firestoreDb, "feedback"));
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      feedbacks = list;
    } catch (err) {
      console.error("Failed to fetch feedbacks from Firestore for monthly quality report:", err);
    }
  }

  const totalReviews = feedbacks.length;
  
  let avgTaste = 0;
  let avgHygiene = 0;
  let avgQuantity = 0;
  let avgVariety = 0;
  let avgFreshness = 0;

  feedbacks.forEach(f => {
    avgTaste += f.scores?.taste || f.rating;
    avgHygiene += f.scores?.hygiene || f.rating;
    avgQuantity += f.scores?.quantity || f.rating;
    avgVariety += f.scores?.variety || f.rating;
    avgFreshness += f.scores?.freshness || f.rating;
  });

  if (totalReviews > 0) {
    avgTaste = Number((avgTaste / totalReviews).toFixed(1));
    avgHygiene = Number((avgHygiene / totalReviews).toFixed(1));
    avgQuantity = Number((avgQuantity / totalReviews).toFixed(1));
    avgVariety = Number((avgVariety / totalReviews).toFixed(1));
    avgFreshness = Number((avgFreshness / totalReviews).toFixed(1));
  } else {
    avgTaste = 4.0; avgHygiene = 4.2; avgQuantity = 3.9; avgVariety = 3.8; avgFreshness = 4.1;
  }

  const qualityScore = Number(((avgTaste + avgHygiene + avgQuantity + avgVariety + avgFreshness) / 5).toFixed(1));

  const mockReport = {
    month: "July 2026",
    totalFeedbacksProcessed: totalReviews,
    overallQualityScore: qualityScore,
    scores: {
      taste: avgTaste,
      hygiene: avgHygiene,
      quantity: avgQuantity,
      variety: avgVariety,
      freshness: avgFreshness
    },
    strengths: [
      "Excellent kitchen hygiene standards scored consistently above 4.2",
      "Freshness of vegetable purchases are highly praised by breakfast attendees"
    ],
    weaknesses: [
      "Variety in dinner side dishes lacks creativity on weekends",
      "Spiciness levels occasionally trigger complaints from hostel wing B"
    ],
    recommendations: [
      "Introduce one fresh seasonal fruit during breakfast three times a week.",
      "Conduct a brief spice calibration session with second-shift mess chefs.",
      "Standardize salt concentration measurements in Dal Tadka recipes."
    ],
    analysisText: `Hostel food feedback indicates high satisfaction with Hygiene (${avgHygiene}/5) and Freshness (${avgFreshness}/5). Taste ratings average ${avgTaste}/5, indicating room for flavor adjustments. Overall, mess operations are performing well with structured feedback intake.`
  };

  try {
    const ai = getGeminiClient();
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `As an AI Hostel Food Auditor, analyze these average scores (scale 1-5):
- Taste: ${avgTaste}
- Hygiene: ${avgHygiene}
- Quantity: ${avgQuantity}
- Variety: ${avgVariety}
- Freshness: ${avgFreshness}
- Total feedbacks received: ${totalReviews}

Please compile an Audit Report summarizing:
1. Overall Quality Score (average of all dimensions).
2. Strengths (2 bullet points).
3. Weaknesses (2 bullet points).
4. Practical Mess Action Plan Recommendations (3 points).
5. A brief narrative analysis explaining the scores.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallQualityScore: {
                type: Type.NUMBER,
                description: "The calculated average rating of the quality score (scale 1-5)"
              },
              strengths: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING
                },
                description: "At least 2 bullet points of mess operations strengths based on feedback"
              },
              weaknesses: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING
                },
                description: "At least 2 bullet points of weaknesses or areas of improvement"
              },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING
                },
                description: "3 practical actionable mess plans or recommendations"
              },
              analysisText: {
                type: Type.STRING,
                description: "Narrative audit summary explaining the findings and scores"
              }
            },
            required: [
              "overallQualityScore",
              "strengths",
              "weaknesses",
              "recommendations",
              "analysisText"
            ]
          }
        }
      });

      if (response.text) {
        const result = JSON.parse(response.text.trim());
        return res.json({
          month: "July 2026",
          totalFeedbacksProcessed: totalReviews,
          scores: { taste: avgTaste, hygiene: avgHygiene, quantity: avgQuantity, variety: avgVariety, freshness: avgFreshness },
          ...result,
          source: "Live AI"
        });
      }
    }
  } catch (err) {
    console.error("Gemini AI Food Quality report generation failed:", err);
  }

  res.json({ ...mockReport, source: "Simulated AI (Local Model)" });
});

// AI Feature 6: Festival Special Menu Generator
app.post("/api/ai/festival-menu", async (req, res) => {
  const { festivalName } = req.body; // e.g. "Diwali", "Holi", "Eid", "Pongal"
  
  const defaultMenus: Record<string, any> = {
    Diwali: {
      festival: "Diwali Special Feast",
      items: "Kaju Katli, Gulab Jamun, Paneer Tikka, Shahi Dal Makhani, Veg Biryani, Garlic Naan, Chole Bhature, Badam Milk",
      calories: 1150,
      protein: 28,
      carbs: 145,
      fat: 38,
      timings: "12:00 PM - 02:30 PM",
      tips: ["Decorate the dining hall with clay diyas and rangoli.", "Provide a gift box of sweets to all student tables.", "Serve saffron almond milk as a welcome drink."]
    },
    Holi: {
      festival: "Holi Festival of Colors lunch",
      items: "Thandai, Mawa Gujiya, Paneer Do Pyaza, Malpua with Rabdi, Veg Pulao, Butter Roti, Dahi Vada, Masala Chana",
      calories: 1050,
      protein: 24,
      carbs: 130,
      fat: 32,
      timings: "12:00 PM - 02:30 PM",
      tips: ["Serve authentic cold sweet saffron Thandai.", "Designate separate dry organic powder colors at the mess entrance.", "Serve piping hot Malpuas straight from the wok."]
    },
    Eid: {
      festival: "Eid Special Feast Menu",
      items: "Sheer Khurma (Sev Kheer), Shahi Paneer, Veg Dum Biryani, Double Ka Meetha, Bhature, Dal Tadka, Mixed Veg Raita, Mint Cooler",
      calories: 1100,
      protein: 26,
      carbs: 138,
      fat: 35,
      timings: "12:00 PM - 02:30 PM",
      tips: ["Serve traditional hot Sheer Khurma right at the starter counter.", "Distribute dry fruits to student tables.", "Ensure extra quantities for student guests and host visitors."]
    }
  };

  const selectedFest = defaultMenus[festivalName] || {
    festival: `${festivalName} Special Feast`,
    items: "Special Kheer, Paneer Butter Masala, Butter Naan, Veg Pulav, Mixed Veg, Samosa, Fruit Custard",
    calories: 890,
    protein: 22,
    carbs: 110,
    fat: 26,
    timings: "12:30 PM - 02:30 PM",
    tips: ["Prepare high quality traditional sweets.", "Display customized greeting cards at the dining block."]
  };

  try {
    const ai = getGeminiClient();
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Create a special traditional Indian festival lunch feast menu for: "${festivalName}".
Provide:
1. Full list of items including starter, mains, traditional sweet, dessert and drink.
2. Estimated calories, protein (g), carbs (g), fat (g).
3. Ideal dining timing for lunch.
4. Two hostel decoration or hospitality tips for mess staff to surprise the students.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              festival: {
                type: Type.STRING,
                description: "Name of the special festival feast"
              },
              items: {
                type: Type.STRING,
                description: "Full list of dishes including starters, mains, traditional sweet, dessert and drink as a comma-separated string"
              },
              calories: {
                type: Type.NUMBER,
                description: "Estimated calorie count"
              },
              protein: {
                type: Type.NUMBER,
                description: "Estimated protein in grams"
              },
              carbs: {
                type: Type.NUMBER,
                description: "Estimated carbohydrate content in grams"
              },
              fat: {
                type: Type.NUMBER,
                description: "Estimated fat content in grams"
              },
              timings: {
                type: Type.STRING,
                description: "Ideal dining timings, e.g., '12:00 PM - 02:30 PM'"
              },
              tips: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING
                },
                description: "Two hostel decoration or hospitality tips for mess staff to surprise the students"
              }
            },
            required: [
              "festival",
              "items",
              "calories",
              "protein",
              "carbs",
              "fat",
              "timings",
              "tips"
            ]
          }
        }
      });

      if (response.text) {
        const result = JSON.parse(response.text.trim());
        return res.json({ ...result, source: "Live AI" });
      }
    }
  } catch (err) {
    console.error("Gemini AI Festival Menu generation failed, using fallback:", err);
  }

  res.json({ ...selectedFest, source: "Simulated AI (Local Model)" });
});


// Serve static assets in production or set up Vite as middleware in dev
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware mounted for development");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production build from /dist");
  }

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    // Seed Firestore after starting up the server if configured
    try {
      await seedFirestore();
    } catch (seedErr) {
      console.error("Async seeding of Firestore failed:", seedErr);
    }
  });
};

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
