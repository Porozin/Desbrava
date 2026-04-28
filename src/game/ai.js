import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function generateDungeonIntro(displayName) {
  try {
    const prompt = `Você é um narrador de RPG épico mas divertido. O caçador ${displayName} está entrando em uma masmorra misteriosa dos Desbravadores. Escreva uma saudação de 1 frase (máximo 15 palavras) em português.`;
    const result = await model.generateContent(prompt);
    return result.response.text() || "As sombras se agitam... Boa sorte, caçador!";
  } catch (e) {
    console.error("AI Error:", e);
    return "Um novo desafio começa nas profundezas!";
  }
}

export async function generateEnemyTaunt(enemyName) {
  try {
    const prompt = `Escreva uma provocação curta (máximo 6 palavras) que um monstro chamado "${enemyName}" diria para um jogador em um combate de RPG. Seja criativo e sarcástico. Em português.`;
    const result = await model.generateContent(prompt);
    return result.response.text() || "Você não passará!";
  } catch (e) {
    console.error("AI Error:", e);
    return "Prepare-se para cair!";
  }
}
