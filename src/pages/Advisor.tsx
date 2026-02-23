import React, { useState, useEffect } from "react";
import { UserCircle, Award, CreditCard, MessageSquare, ShieldCheck, Zap } from "lucide-react";
import { motion } from "motion/react";
import { User } from "../types";

export default function Advisor() {
  const [user, setUser] = useState<User | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    fetch("/api/user")
      .then(res => res.json())
      .then(data => setUser(data));
  }, []);

  const handleRedeem = () => {
    if ((user?.coins || 0) < 1000) {
      alert("You need 1,000 coins to redeem a consultation. Keep logging your activities!");
      return;
    }
    alert("Consultation redeemed! Our advisor will contact you shortly.");
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-slate-900">Medical Advisor Portal</h2>
        <p className="text-slate-500">Get professional support through your hard-earned coins or direct access.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Loyalty Path */}
        <div className="card border-2 border-amber-100 bg-amber-50/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <Award className="w-12 h-12 text-amber-200" />
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-amber-900 mb-2">The Loyalty Path</h3>
            <p className="text-amber-700 mb-8">Redeem your consistency for professional care.</p>
            
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-amber-100 mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-slate-500">Your Progress</span>
                <span className="text-sm font-bold text-amber-600">{user?.coins} / 1000 Coins</span>
              </div>
              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(((user?.coins || 0) / 1000) * 100, 100)}%` }}
                  className="h-full bg-amber-500"
                />
              </div>
              <p className="text-xs text-slate-400 mt-4 text-center">
                Earn coins by logging mood, steps, and medications daily.
              </p>
            </div>

            <button
              onClick={handleRedeem}
              disabled={(user?.coins || 0) < 1000}
              className={`w-full py-4 rounded-2xl font-bold transition-all shadow-lg ${
                (user?.coins || 0) >= 1000 
                  ? "bg-amber-500 text-white shadow-amber-500/20 hover:bg-amber-600" 
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              Redeem Consultation
            </button>
          </div>
        </div>

        {/* Direct Path */}
        <div className="card border-2 border-indigo-100 bg-indigo-50/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <Zap className="w-12 h-12 text-indigo-200" />
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-indigo-900 mb-2">The Direct Path</h3>
            <p className="text-indigo-700 mb-8">Immediate support when you need it most.</p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-indigo-100">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Verified Professionals</p>
                  <p className="text-xs text-slate-500">All advisors are certified medical experts.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-indigo-100">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">24/7 Availability</p>
                  <p className="text-xs text-slate-500">Connect with someone in under 5 minutes.</p>
                </div>
              </div>
            </div>

            <button
              className="w-full py-4 rounded-2xl font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Pay for Immediate Support
            </button>
          </div>
        </div>
      </div>

      <div className="card bg-slate-900 text-white p-8 md:p-12 text-center relative overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">Emergency Support</h3>
          <p className="text-slate-400 mb-8 leading-relaxed">
            If you are in an immediate crisis or emergency state, please do not wait for an advisor. Contact your local emergency services or a crisis helpline immediately.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="tel:988" className="bg-white text-slate-900 px-8 py-3 rounded-xl font-bold hover:bg-slate-100 transition-all">
              Call Crisis Hotline (988)
            </a>
            <button className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold border border-slate-700 hover:bg-slate-700 transition-all">
              Find Local Helplines
            </button>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500 rounded-full blur-[120px]" />
        </div>
      </div>
    </div>
  );
}
