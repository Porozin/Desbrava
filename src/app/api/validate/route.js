import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req) {
  try {
    const { missaoDescricao, provaTexto } = await req.json();

    if (!missaoDescricao || !provaTexto) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const prompt = `Você é um mestre sábio de um RPG e avaliador de missões de Desbravadores. 
A missão proposta era: '${missaoDescricao}'. 
O aventureiro entregou o seguinte relatório: '${provaTexto}'. 
Avalie se o relatório faz sentido e demonstra que ele cumpriu a missão (ainda que de forma simples, seja compreensivo mas não aceite lixo). 
Responda ESTRITAMENTE com a palavra 'APROVADO' se a prova for válida, ou 'REPROVADO' se for um texto sem sentido, ofensivo, ou que fuja totalmente do tema. Não adicione pontuação ou justificativa na resposta, apenas APROVADO ou REPROVADO.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const textoIA = response.text.trim().toUpperCase();
    
    // Fallback caso a IA fale algo a mais, vamos checar se contém a palavra
    const isAprovado = textoIA.includes('APROVADO') && !textoIA.includes('REPROVADO');

    return NextResponse.json({ 
      resultado: isAprovado ? 'APROVADO' : 'REPROVADO',
      rawText: textoIA 
    });

  } catch (error) {
    console.error("AI Validation Error:", error);
    return NextResponse.json({ error: "Falha na validação mágica" }, { status: 500 });
  }
}
