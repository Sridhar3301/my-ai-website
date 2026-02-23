import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getHealthAdvice(mood: number, steps: number, meds: string[], conditions: string[] = []) {
  const model = "gemini-3-flash-preview";
  const prompt = `
    You are a supportive health advisor for the VitalityHub app.
    User's current state:
    - Mood: ${mood}/5
    - Steps today: ${steps}
    - Medications: ${meds.join(", ") || "None"}
    - Medical Conditions: ${conditions.join(", ") || "None"}

    Provide a brief (2-3 sentences), empathetic health advice based on this data. 
    MANDATORY REQUIREMENT: You MUST prioritize the user's medical conditions in your advice. 
    - If the user has Heart Disease or BP: You MUST recommend heart-safe, low-impact exercises (like walking) and mention sodium/stress management.
    - If the user has Diabetes: You MUST mention blood sugar stability through consistent light activity.
    - If the user has Thyroid: You MUST suggest energy-conserving or balancing activities.
    - If the user has Anxiety/Depression: You MUST suggest mindfulness, breathing, or gentle movement.
    
    If no specific conditions are present, follow these general rules:
    - If mood is low (1-2), suggest a specific relief activity (breathing, journaling).
    - If steps are low (<3000), encourage a short walk.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Keep going! You're doing great. Remember to take deep breaths and stay hydrated.";
  }
}

export async function getChatbotResponse(message: string, history: { role: string, parts: { text: string }[] }[], conditions: string[] = []) {
  const model = "gemini-3-flash-preview";
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: message }] },
      config: {
        systemInstruction: `You are VitalityBot, a friendly and empathetic health assistant. 
        Ask about sleep, stress, and work. Suggest relief activities if the user feels down.
        User's Medical History: ${conditions.join(", ") || "None"}.
        CRITICAL: When recommending exercises, you MUST ALWAYS check the user's medical history first. 
        - If they have Heart Disease/BP: ONLY suggest low-impact activities like slow walking or stretching.
        - If they have Diabetes: Emphasize regular, moderate activity.
        - If they have Thyroid: Suggest listening to their body's energy levels.
        - If they have Anxiety/Depression: Suggest mindfulness-based movements.
        NEVER suggest high-intensity workouts if the user has heart conditions or high BP.`,
      }
    });
    return response.text;
  } catch (error) {
    return "I'm here for you. How are you feeling today?";
  }
}
