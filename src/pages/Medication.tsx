import React, { useState, useEffect } from "react";
import { Pill, Clock, Plus, CheckCircle2, AlertCircle, Calendar, Trash2, Edit2, Save, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Medication } from "../types";

export default function MedicationPage() {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [newName, setNewName] = useState("");
  const [newFreq, setNewFreq] = useState("Daily");
  const [newTime, setNewTime] = useState("08:00");

  useEffect(() => {
    fetchMeds();
  }, []);

  const fetchMeds = async () => {
    try {
      const res = await fetch("/api/medications");
      setMeds(await res.json());
    } catch (error) {
      console.error("Error fetching medications:", error);
    }
  };

  const handleAddMed = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/medications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, frequency: newFreq, time: newTime }),
      });
      if (!res.ok) throw new Error("Failed to add medication");
      setNewName("");
      setIsAdding(false);
      fetchMeds();
    } catch (error) {
      console.error("Error adding medication:", error);
      alert("Failed to add medication");
    }
  };

  const handleUpdateMed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMed) return;
    try {
      const res = await fetch(`/api/medications/${editingMed.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, frequency: newFreq, time: newTime }),
      });
      if (!res.ok) throw new Error("Failed to update medication");
      setEditingMed(null);
      setNewName("");
      fetchMeds();
    } catch (error) {
      console.error("Error updating medication:", error);
      alert("Failed to update medication");
    }
  };

  const handleDeleteMed = async (id: number) => {
    if (!confirm("Are you sure you want to delete this medication?")) return;
    try {
      const res = await fetch(`/api/medications/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchMeds();
        alert("Medication deleted successfully.");
      } else {
        alert("Failed to delete medication.");
      }
    } catch (error) {
      console.error("Error deleting medication:", error);
      alert("An error occurred while deleting the medication.");
    }
  };

  const handleTakeMed = async (id: number) => {
    try {
      const res = await fetch("/api/medications/take", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to log medication");
      fetchMeds();
      alert("Medication logged! Great job staying compliant.");
    } catch (error) {
      console.error("Error taking medication:", error);
      alert("Failed to log medication");
    }
  };

  const startEditing = (med: Medication) => {
    setEditingMed(med);
    setNewName(med.name);
    setNewFreq(med.frequency);
    setNewTime(med.time);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Medication Reminders</h2>
          <p className="text-slate-500">Track your doses and stay on top of your health.</p>
        </div>
        <button
          onClick={() => { setIsAdding(true); setEditingMed(null); setNewName(""); }}
          className="bg-teal-600 text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Medication
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence>
            {meds.length === 0 ? (
              <div className="card text-center py-12 bg-slate-50 border-dashed border-2 border-slate-200">
                <Pill className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No medications added yet.</p>
              </div>
            ) : (
              meds.map((med) => {
                const lastTaken = med.last_taken ? new Date(med.last_taken) : null;
                const isTakenToday = lastTaken && lastTaken.toDateString() === new Date().toDateString();

                return (
                  <motion.div
                    key={med.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`card flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 ${
                      isTakenToday ? "border-l-emerald-500" : "border-l-teal-500"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                        isTakenToday ? "bg-emerald-50 text-emerald-600" : "bg-teal-50 text-teal-600"
                      }`}>
                        <Pill className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-slate-900">{med.name}</h4>
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {med.time}
                          </span>
                          {med.snoozed_until && (
                            <span className="flex items-center gap-1 text-amber-600 font-medium">
                              <Clock className="w-4 h-4" />
                              Snoozed: {med.snoozed_until}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {med.frequency}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditing(med)}
                          className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:text-teal-600 transition-all"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMed(med.id)}
                          className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-600 transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      
                      {isTakenToday ? (
                        <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-xl">
                          <CheckCircle2 className="w-5 h-5" />
                          Taken Today
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              const [h, m] = med.time.split(':');
                              const snoozeDate = new Date();
                              snoozeDate.setHours(parseInt(h));
                              snoozeDate.setMinutes(parseInt(m) + 15);
                              const timeStr = snoozeDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                              
                              try {
                                await fetch("/api/medications/snooze", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ id: med.id, until: timeStr }),
                                });
                                fetchMeds();
                                alert(`Snoozed for 15 minutes. New reminder at ${timeStr}`);
                              } catch (error) {
                                console.error("Error snoozing medication:", error);
                              }
                            }}
                            className="bg-slate-100 text-slate-600 font-bold px-4 py-3 rounded-xl hover:bg-slate-200 transition-all"
                          >
                            Snooze
                          </button>
                          <button
                            onClick={() => handleTakeMed(med.id)}
                            className="bg-teal-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-teal-700 transition-all shadow-md shadow-teal-600/10"
                          >
                            Mark as Taken
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <div className="card bg-indigo-50 border-indigo-100">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-indigo-600 w-6 h-6" />
              <h4 className="font-bold text-indigo-900">Compliance Alert</h4>
            </div>
            <p className="text-sm text-indigo-700 leading-relaxed">
              If you miss more than 3 doses in a row, we'll send a gentle reminder to your caregiver, Sarah.
            </p>
          </div>

          <div className="card">
            <h4 className="font-bold text-slate-900 mb-4">Upcoming Refills</h4>
            <div className="space-y-4">
              {meds.map(med => (
                <div key={med.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <span className="text-sm font-medium text-slate-700">{med.name}</span>
                  <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">Active</span>
                </div>
              ))}
              {meds.length === 0 && <p className="text-xs text-slate-400 italic">No refills tracked.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(isAdding || editingMed) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900">
                {editingMed ? "Edit Medication" : "Add Medication"}
              </h3>
              <button onClick={() => { setIsAdding(false); setEditingMed(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={editingMed ? handleUpdateMed : handleAddMed} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Medication Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Vitamin D"
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Frequency</label>
                  <select
                    value={newFreq}
                    onChange={(e) => setNewFreq(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>As Needed</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Time</label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => { setIsAdding(false); setEditingMed(null); }}
                  className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 rounded-2xl font-bold bg-teal-600 text-white shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {editingMed ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
