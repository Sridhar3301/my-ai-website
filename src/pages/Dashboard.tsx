import React, { useEffect, useState } from "react";
import { Activity, Brain, Pill, TrendingUp, Award, MessageCircle, Flame, Phone, Coins } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { User, MoodLog, FitnessLog, Medication } from "../types";
import { getHealthAdvice } from "../services/gemini";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [moodHistory, setMoodHistory] = useState<MoodLog[]>([]);
  const [fitnessHistory, setFitnessHistory] = useState<FitnessLog[]>([]);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [advice, setAdvice] = useState<string>("Loading your personalized advice...");
  const [coinsAdded, setCoinsAdded] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, moodRes, fitnessRes, medsRes] = await Promise.all([
          fetch("/api/user"),
          fetch("/api/mood/history"),
          fetch("/api/fitness/history"),
          fetch("/api/medications"),
        ]);

        const userData = await userRes.json();
        const moodData = await moodRes.json(); // Latest is at [0]
        const fitnessData = await fitnessRes.json();
        const medsData = await medsRes.json();

        // Get AI Advice using latest data before reversing for chart
        const latestMood = moodData[0]?.rating || 3;
        const latestSteps = fitnessData[0]?.steps || 0;
        const medNames = medsData.map((m: Medication) => m.name);
        const conditions = JSON.parse(userData.medical_conditions || "[]");
        
        setUser(userData);
        setMoodHistory([...moodData].reverse());
        setFitnessHistory([...fitnessData].reverse());
        setMeds(medsData);

        const aiAdvice = await getHealthAdvice(latestMood, latestSteps, medNames, conditions);
        setAdvice(aiAdvice || "Keep up the good work!");
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();
  }, []);

  const handleLogSteps = async () => {
    const steps = prompt("Enter steps taken:");
    if (!steps) return;
    
    try {
      const res = await fetch("/api/fitness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps: parseInt(steps), duration: 30, calories: 150 }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.coinsAdded > 0) {
        setCoinsAdded(data.coinsAdded);
        setTimeout(() => setCoinsAdded(null), 3000);
      }
      // Refresh user data to show new coins
      const userRes = await fetch("/api/user");
      setUser(await userRes.json());
    } catch (error) {
      console.error("Error logging steps:", error);
      alert(error instanceof Error ? error.message : "Failed to log steps");
    }
  };

  const chartData = moodHistory.map((m, i) => ({
    date: new Date(m.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    mood: m.rating,
    steps: fitnessHistory[i]?.steps || 0,
  }));

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {coinsAdded && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 right-8 z-[200] bg-amber-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-amber-400"
          >
            <div className="bg-white/20 p-2 rounded-full">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-lg">+{coinsAdded} Coins Added!</p>
              <p className="text-sm opacity-90">Great job staying active!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Welcome back, {user?.name}!</h2>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-slate-500">Here's your health summary for today.</p>
            <div className="flex items-center gap-1 text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
              <Flame className="w-4 h-4 fill-current" />
              <span className="text-xs font-bold">{user?.streak || 0} Day Streak</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="tel:+919908855019"
            className="bg-rose-50 text-rose-600 px-4 py-2 rounded-2xl flex items-center gap-2 border border-rose-100 font-bold hover:bg-rose-100 transition-all"
          >
            <Phone className="w-4 h-4" />
            Helpline
          </a>
          <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-2xl flex items-center gap-2 border border-amber-100">
            <Award className="w-5 h-5" />
            <span className="font-bold">{user?.coins} Coins</span>
          </div>
        </div>
      </header>

      {/* AI Advice Card */}
      <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-3xl p-8 text-white shadow-xl shadow-teal-200/50 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-6 h-6" />
            <span className="font-semibold uppercase tracking-wider text-sm opacity-90">Vitality Advisor</span>
          </div>
          <p className="text-xl md:text-2xl font-medium leading-relaxed max-w-3xl">
            "{advice}"
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Current Mood</p>
            <p className="text-2xl font-bold text-slate-900">{moodHistory[moodHistory.length - 1]?.rating || 0}/5</p>
          </div>
        </div>
        <button 
          onClick={handleLogSteps}
          className="card flex items-center gap-4 hover:bg-slate-50 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Steps Today</p>
            <p className="text-2xl font-bold text-slate-900">{fitnessHistory[fitnessHistory.length - 1]?.steps || 0}</p>
          </div>
        </button>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Medications</p>
            <p className="text-2xl font-bold text-slate-900">{meds.length} Active</p>
          </div>
        </div>
      </div>

      {/* Correlation Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Mood & Activity Correlation</h3>
            <p className="text-sm text-slate-500">See how your physical activity affects your mental state.</p>
          </div>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Area yAxisId="left" type="monotone" dataKey="mood" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorMood)" name="Mood (1-5)" />
              <Line yAxisId="right" type="monotone" dataKey="steps" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} name="Steps" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
