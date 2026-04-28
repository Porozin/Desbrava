import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateDungeonIntro(vocation: string) {
  try {
    const prompt = `You are a dungeon master for a game called Desbrava. 
    The player is a ${vocation}. Write a 1-sentence epic but fun greeting in Portuguese 
    about entering a mysterious dungeon filled with Bible-themed challenges and Club 
    of Pathfinders (Desbravadores) lore. Keep it under 20 words.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Um novo desafio começa nas profundezas!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Um novo desafio começa nas profundezas!";
  }
}

export async function generateEnemyTaunt(enemyName: string) {
  try {
    const prompt = `The player is fighting a ${enemyName} in a lighthearted RPG. 
    Write a very short (1 phrase) funny/epic taunt in Portuguese that this enemy would say.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Você não passará!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Você não passará!";
  }
}
