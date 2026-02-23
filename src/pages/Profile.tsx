import React, { useState, useEffect } from "react";
import { User as UserIcon, Save, Heart, Shield, Scale, Ruler, Target, Users, Trash2, Plus } from "lucide-react";
import { motion } from "motion/react";
import { User, Friend } from "../types";

const COMMON_CONDITIONS = ["Thyroid", "Diabetic", "BP", "Depression", "Anxiety", "Heart Disease"];

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [newFriendName, setNewFriendName] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    weight: "",
    height: "",
    health_goals: "",
    buddy_name: "",
    buddy_contact: "",
    medical_conditions: [] as string[]
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [userRes, friendsRes] = await Promise.all([
      fetch("/api/user"),
      fetch("/api/friends")
    ]);
    
    const userData = await userRes.json();
    const friendsData = await friendsRes.json();
    
    setUser(userData);
    setFriends(friendsData);
    
    setFormData({
      name: userData.name || "",
      age: userData.age?.toString() || "",
      weight: userData.weight?.toString() || "",
      height: userData.height?.toString() || "",
      health_goals: userData.health_goals || "",
      buddy_name: userData.buddy_name || "",
      buddy_contact: userData.buddy_contact || "",
      medical_conditions: JSON.parse(userData.medical_conditions || "[]")
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          age: parseInt(formData.age) || null,
          weight: parseFloat(formData.weight) || null,
          height: parseFloat(formData.height) || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      alert("Profile updated successfully!");
      fetchData();
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleCondition = (condition: string) => {
    setFormData(prev => ({
      ...prev,
      medical_conditions: prev.medical_conditions.includes(condition)
        ? prev.medical_conditions.filter(c => c !== condition)
        : [...prev.medical_conditions, condition]
    }));
  };

  const handleAddFriend = async () => {
    if (!newFriendName.trim()) return;
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFriendName }),
      });
      if (!res.ok) throw new Error("Failed to add friend");
      setNewFriendName("");
      fetchData();
    } catch (error) {
      console.error("Error adding friend:", error);
      alert("Failed to add friend");
    }
  };

  const handleDeleteFriend = async (id: number) => {
    try {
      await fetch(`/api/friends/${id}`, { method: "DELETE" });
      fetchData();
    } catch (error) {
      console.error("Error deleting friend:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex items-center gap-4">
        <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center">
          <UserIcon className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Your Profile</h2>
          <p className="text-slate-500">Manage your personal health details and support network.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Details */}
          <div className="card space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="text-rose-500 w-5 h-5" />
              <h3 className="text-xl font-bold text-slate-900">Personal Details</h3>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Display Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                  <Shield className="w-4 h-4" /> Age
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                  <Scale className="w-4 h-4" /> Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                <Ruler className="w-4 h-4" /> Height (cm)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Medical Conditions */}
          <div className="card space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="text-rose-600 w-5 h-5" />
              <h3 className="text-xl font-bold text-slate-900">Medical Conditions</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {COMMON_CONDITIONS.map(condition => (
                <button
                  key={condition}
                  type="button"
                  onClick={() => handleToggleCondition(condition)}
                  className={`p-3 rounded-xl text-sm font-medium border transition-all ${
                    formData.medical_conditions.includes(condition)
                      ? "bg-rose-50 border-rose-200 text-rose-700 shadow-sm"
                      : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {condition}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-teal-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {isSaving ? "Saving..." : "Save Profile Changes"}
          </button>
        </form>

        <div className="space-y-8">
          {/* Friends Management */}
          <div className="card space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="text-indigo-500 w-5 h-5" />
              <h3 className="text-xl font-bold text-slate-900">Friends</h3>
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newFriendName}
                onChange={(e) => setNewFriendName(e.target.value)}
                placeholder="Friend's name..."
                className="flex-1 p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                onClick={handleAddFriend}
                className="bg-teal-600 text-white p-3 rounded-xl hover:bg-teal-700 transition-all"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {friends.map(friend => (
                <div key={friend.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-800">{friend.name}</span>
                  <button
                    onClick={() => handleDeleteFriend(friend.id)}
                    className="text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {friends.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-4 italic">No friends added yet.</p>
              )}
            </div>
          </div>

          {/* Goals & Support */}
          <div className="card space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Target className="text-indigo-500 w-5 h-5" />
              <h3 className="text-xl font-bold text-slate-900">Health Goals</h3>
            </div>
            <textarea
              value={formData.health_goals}
              onChange={(e) => setFormData({ ...formData, health_goals: e.target.value })}
              placeholder="What are you working towards? (e.g. Better sleep, 10k steps daily...)"
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500 h-32 resize-none"
            />
          </div>

          <div className="card space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="text-teal-500 w-5 h-5" />
              <h3 className="text-xl font-bold text-slate-900">Buddy Contact</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Buddy Name</label>
                <input
                  type="text"
                  value={formData.buddy_name}
                  onChange={(e) => setFormData({ ...formData, buddy_name: e.target.value })}
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Buddy Email/Contact</label>
                <input
                  type="text"
                  value={formData.buddy_contact}
                  onChange={(e) => setFormData({ ...formData, buddy_contact: e.target.value })}
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
