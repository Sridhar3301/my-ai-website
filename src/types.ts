export interface User {
  id: number;
  name: string;
  coins: number;
  buddy_name: string;
  buddy_contact: string;
  last_advisor_consult?: string;
  streak: number;
  last_active_date?: string;
  age?: number;
  weight?: number;
  height?: number;
  health_goals?: string;
  medical_conditions: string; // JSON string
}

export interface Friend {
  id: number;
  name: string;
  score: number;
}

export interface MoodLog {
  id: number;
  rating: number;
  notes: string;
  created_at: string;
}

export interface FitnessLog {
  id: number;
  steps: number;
  duration: number;
  calories: number;
  created_at: string;
}

export interface Medication {
  id: number;
  name: string;
  frequency: string;
  time: string;
  last_taken?: string;
  snoozed_until?: string;
}

export interface LeaderboardEntry {
  name: string;
  points: number;
}
