import React, { useState, useEffect, useRef } from "react";
import { Send, User, Bot, AlertCircle, Heart, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";
import { getChatbotResponse } from "../services/gemini";

export default function MentalHealth() {
  const [mood, setMood] = useState(3);
  const [notes, setNotes] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>([
    { role: "bot", text: "Hi! I'm VitalityBot. How are you feeling today? I'm here to listen and help you manage your stress or work-life balance." }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [alertStatus, setAlertStatus] = useState<"none" | "triggered" | "responded">("none");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleMoodSubmit = async () => {
    try {
      const res = await fetch("/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: mood, notes }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.alertTriggered) {
        setAlertStatus("triggered");
      }
      setNotes("");
      alert("Mood logged successfully! Your advisor advice will be updated on the dashboard.");
    } catch (error) {
      console.error("Error logging mood:", error);
      alert(error instanceof Error ? error.message : "Failed to log mood");
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setInputValue("");
    setIsTyping(true);

    try {
      const userRes = await fetch("/api/user");
      const userData = await userRes.json();
      const conditions = JSON.parse(userData.medical_conditions || "[]");

      const history = messages.map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      }));
      const botResponse = await getChatbotResponse(userMessage, history, conditions);
      setMessages(prev => [...prev, { role: "bot", text: botResponse || "I'm here for you." }]);
    } catch (error) {
      console.error("Chatbot error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleBuddyRespond = async () => {
    try {
      await fetch("/api/buddy/respond", { method: "POST" });
      setAlertStatus("responded");
    } catch (error) {
      console.error("Error responding to buddy alert:", error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      {/* Left Side: Mood Tracker & Alerts */}
      <div className="space-y-8">
        <div className="card">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Daily Mood Check-in</h3>
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between text-sm font-medium text-slate-500">
                <span>Very Low</span>
                <span>Neutral</span>
                <span>Excellent</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={mood || 3}
                onChange={(e) => setMood(parseInt(e.target.value) || 3)}
                className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <div className="flex justify-between px-1">
                {[1, 2, 3, 4, 5].map((val) => (
                  <span key={val} className={`text-2xl transition-transform ${mood === val ? 'scale-150' : 'opacity-30'}`}>
                    {val === 1 ? '😢' : val === 2 ? '😕' : val === 3 ? '😐' : val === 4 ? '🙂' : '😊'}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">What's on your mind?</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes about your day..."
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all h-32 resize-none"
              />
            </div>

            <button
              onClick={handleMoodSubmit}
              className="w-full bg-teal-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all active:scale-[0.98]"
            >
              Log Mood
            </button>
          </div>
        </div>

        {/* Buddy Alert Section */}
        <AnimatePresence>
          {alertStatus !== "none" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`p-6 rounded-3xl border-2 flex items-start gap-4 ${
                alertStatus === "triggered" 
                  ? "bg-rose-50 border-rose-100 text-rose-800" 
                  : "bg-emerald-50 border-emerald-100 text-emerald-800"
              }`}
            >
              <div className={`p-3 rounded-2xl ${alertStatus === "triggered" ? "bg-rose-100" : "bg-emerald-100"}`}>
                {alertStatus === "triggered" ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-lg">
                  {alertStatus === "triggered" ? "Buddy Alert Triggered" : "Support Received!"}
                </h4>
                <p className="text-sm opacity-90 mt-1">
                  {alertStatus === "triggered" 
                    ? "You've been feeling low for a few days. We've notified Sarah to check in on you." 
                    : "Sarah responded to your alert! You both earned 5 empathy points."}
                </p>
                {alertStatus === "triggered" && (
                  <button
                    onClick={handleBuddyRespond}
                    className="mt-4 bg-white text-rose-600 font-bold px-6 py-2 rounded-xl border border-rose-200 hover:bg-rose-50 transition-all"
                  >
                    Simulate Buddy Response
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="card bg-indigo-50 border-indigo-100">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="text-indigo-600 w-6 h-6" />
            <h4 className="font-bold text-indigo-900">Incentivized Empathy</h4>
          </div>
          <p className="text-sm text-indigo-700 leading-relaxed">
            When your friends respond to your low-mood alerts, they earn points. This helps build a stronger support network for everyone.
          </p>
        </div>
      </div>

      {/* Right Side: Chatbot */}
      <div className="card flex flex-col h-[600px] lg:h-auto">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-4">
          <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">VitalityBot</h3>
            <p className="text-xs text-emerald-500 font-medium flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Online & Listening
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl ${
                msg.role === "user" 
                  ? "bg-teal-600 text-white rounded-tr-none" 
                  : "bg-slate-100 text-slate-800 rounded-tl-none"
              }`}>
                <div className="prose prose-sm max-w-none prose-p:leading-relaxed">
                  <Markdown>{msg.text}</Markdown>
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none"
          />
          <button
            onClick={handleSendMessage}
            className="bg-teal-600 text-white p-3 rounded-xl hover:bg-teal-700 transition-all active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
