import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Brain, Activity, Pill, UserCircle, Menu, X, Flame, Bell, BellRing } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { User, Medication } from "../types";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/mental-health", icon: Brain, label: "Mental Health" },
  { path: "/fitness", icon: Activity, label: "Fitness" },
  { path: "/medication", icon: Pill, label: "Medication" },
  { path: "/advisor", icon: UserCircle, label: "Advisor" },
  { path: "/profile", icon: UserCircle, label: "Profile" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<{ id: string, title: string, body: string }[]>([]);
  const [istTime, setIstTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setIstTime(new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Kolkata',
        hour12: false
      }).format(now));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch("/api/user");
      const data = await res.json();
      setUser(data);
    };
    fetchUser();
    const interval = setInterval(fetchUser, 30000); // Update streak/coins periodically
    return () => clearInterval(interval);
  }, []);

  // Medication Alarm Logic
  useEffect(() => {
    const checkMeds = async () => {
      try {
        const res = await fetch("/api/medications");
        const meds: Medication[] = await res.json();
        const now = new Date();
        
        // Use IST (Asia/Kolkata) for medication reminders
        const currentTime = new Intl.DateTimeFormat('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Kolkata',
          hour12: false
        }).format(now);

        meds.forEach(med => {
          const isTimeMatch = med.time === currentTime || med.snoozed_until === currentTime;
          
          if (isTimeMatch) {
            const lastTaken = med.last_taken ? new Date(med.last_taken) : null;
            const isTakenToday = lastTaken && lastTaken.toDateString() === now.toDateString();
            
            if (!isTakenToday) {
              const id = `med-${med.id}-${currentTime}`;
              if (!notifications.find(n => n.id === id)) {
                setNotifications(prev => [...prev, {
                  id,
                  title: "Medication Reminder",
                  body: `It's time to take your ${med.name}.${med.snoozed_until === currentTime ? ' (Snoozed)' : ''}`
                }]);
              }
            }
          }
        });
      } catch (error) {
        console.error("Error checking medications:", error);
      }
    };

    const interval = setInterval(checkMeds, 60000);
    checkMeds();
    return () => clearInterval(interval);
  }, [notifications]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
            <Activity className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">VitalityHub</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">IST: {istTime}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-teal-600 text-white shadow-md shadow-teal-600/20" 
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
              <img src="https://picsum.photos/seed/user/100/100" alt="User" referrerPolicy="no-referrer" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{user?.name || "User"}</p>
              <div className="flex items-center gap-1 text-orange-500">
                <Flame className="w-3 h-3 fill-current" />
                <span className="text-xs font-bold">{user?.streak || 0} Day Streak</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
            <Activity className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">VitalityHub</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">IST: {istTime}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-orange-500 mr-2">
            <Flame className="w-4 h-4 fill-current" />
            <span className="text-sm font-bold">{user?.streak || 0}</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Notifications Overlay */}
      <div className="fixed top-4 right-4 z-[100] space-y-2 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="bg-white rounded-2xl p-4 shadow-2xl border-l-4 border-teal-500 pointer-events-auto flex items-start gap-3"
            >
              <div className="bg-teal-50 p-2 rounded-xl text-teal-600">
                <BellRing className="w-5 h-5 animate-bounce" />
              </div>
              <div className="flex-1">
                <h5 className="font-bold text-slate-900 text-sm">{n.title}</h5>
                <p className="text-xs text-slate-500 mt-1">{n.body}</p>
              </div>
              <button 
                onClick={() => setNotifications(prev => prev.filter(item => item.id !== n.id))}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-0 top-[65px] bg-white z-40 p-6 flex flex-col"
          >
            <nav className="space-y-4">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl",
                      isActive ? "bg-teal-600 text-white" : "bg-slate-50 text-slate-600"
                    )}
                  >
                    <item.icon className="w-6 h-6" />
                    <span className="text-lg font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
