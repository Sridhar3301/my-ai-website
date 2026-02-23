import React, { useState, useEffect } from "react";
import { Activity, Flame, Timer, Footprints, Trophy, Award, Plus, Coins } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FitnessLog, LeaderboardEntry } from "../types";

export default function Fitness() {
  const [steps, setSteps] = useState(0);
  const [duration, setDuration] = useState(0);
  const [history, setHistory] = useState<FitnessLog[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLogging, setIsLogging] = useState(false);
  const [coinsAdded, setCoinsAdded] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [historyRes, leaderboardRes] = await Promise.all([
        fetch("/api/fitness/history"),
        fetch("/api/leaderboard"),
      ]);
      setHistory(await historyRes.json());
      setLeaderboard(await leaderboardRes.json());
    } catch (error) {
      console.error("Error fetching fitness data:", error);
    }
  };

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    const calories = Math.floor(steps * 0.04);
    try {
      const res = await fetch("/api/fitness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps, duration, calories }),
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
      setSteps(0);
      setDuration(0);
      setIsLogging(false);
      fetchData();
    } catch (error) {
      console.error("Error logging activity:", error);
      alert(error instanceof Error ? error.message : "Failed to log activity");
    }
  };

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Fitness Tracker</h2>
          <p className="text-slate-500">Keep moving to earn coins and climb the leaderboard.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-2xl flex items-center gap-2 border border-amber-100">
            <Award className="w-5 h-5" />
            <span className="font-bold">Your Balance: {leaderboard.find(e => e.name.includes("(You)"))?.points || 0} Coins</span>
          </div>
          <button
            onClick={() => setIsLogging(true)}
            className="bg-teal-600 text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            Log Activity
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-blue-50 border-blue-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
              <Footprints className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-blue-700 font-medium">Total Steps Today</p>
              <p className="text-3xl font-bold text-blue-900">
                {history[0]?.steps || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="card bg-orange-50 border-orange-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-orange-700 font-medium">Calories Burned</p>
              <p className="text-3xl font-bold text-orange-900">
                {history[0]?.calories || 0} kcal
              </p>
            </div>
          </div>
        </div>
        <div className="card bg-teal-50 border-teal-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center">
              <Timer className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-teal-700 font-medium">Active Minutes</p>
              <p className="text-3xl font-bold text-teal-900">
                {history[0]?.duration || 0} min
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* History Table */}
        <div className="lg:col-span-2 card">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Recent Activity</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-4 font-semibold text-slate-500">Date</th>
                  <th className="pb-4 font-semibold text-slate-500">Steps</th>
                  <th className="pb-4 font-semibold text-slate-500">Duration</th>
                  <th className="pb-4 font-semibold text-slate-500">Calories</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {history.map((log) => (
                  <tr key={log.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-4 text-slate-600">
                      {new Date(log.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 font-bold text-slate-900">{log.steps.toLocaleString()}</td>
                    <td className="py-4 text-slate-600">{log.duration} min</td>
                    <td className="py-4 text-slate-600">{log.calories} kcal</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="text-amber-500 w-6 h-6" />
            <h3 className="text-xl font-bold text-slate-900">Leaderboard</h3>
          </div>
          <div className="space-y-4">
            {leaderboard.map((entry, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-4">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    i === 0 ? "bg-amber-100 text-amber-600" : 
                    i === 1 ? "bg-slate-200 text-slate-600" : 
                    i === 2 ? "bg-orange-100 text-orange-600" : "bg-white text-slate-400"
                  }`}>
                    {i + 1}
                  </span>
                  <span className="font-semibold text-slate-800">{entry.name}</span>
                </div>
                <div className="flex items-center gap-1 text-indigo-600 font-bold">
                  <Award className="w-4 h-4" />
                  {entry.points}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Log Modal */}
      {isLogging && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
          >
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Log Activity</h3>
            <form onSubmit={handleLogActivity} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Steps Taken</label>
                <input
                  type="number"
                  required
                  value={steps || ""}
                  onChange={(e) => setSteps(parseInt(e.target.value) || 0)}
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Duration (minutes)</label>
                <input
                  type="number"
                  required
                  value={duration || ""}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsLogging(false)}
                  className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 rounded-2xl font-bold bg-teal-600 text-white shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all"
                >
                  Save Activity
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
