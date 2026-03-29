import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function analyzeMarket(symbol: string, data: any[], model: string = "gemini-1.5-flash") {
  if (!ai) {
    console.warn("Gemini API Key não configurada. Pulando análise.");
    return null;
  }
  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Analise profissionalmente o ativo ${symbol} com base nos últimos 50 candlesticks: ${JSON.stringify(data.slice(-50))}. 
      REQUISITOS OBRIGATÓRIOS:
      1. Calcule e interprete o RSI (Índice de Força Relativa).
      2. Avalie a força da tendência com o ADX.
      3. Use o Aroon Up/Down para identificar o momento de tendência.
      4. Verifique o cruzamento e inclinação das Médias Móveis MA9 (Rápida), MA21 (Média) e MA55 (Lenta).
      
      Determine:
      - Tendência (ALTA, BAIXA, NEUTRO)
      - Probabilidade (0-100%)
      - Recomendação (COMPRA, VENDA, AGUARDAR)
      - Justificativa detalhada mencionando valores específicos dos indicadores acima.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            trend: { type: Type.STRING },
            probability: { type: Type.NUMBER },
            recommendation: { type: Type.STRING },
            reason: { type: Type.STRING },
            indicators: {
              type: Type.OBJECT,
              properties: {
                rsi: { type: Type.OBJECT, properties: { value: { type: Type.NUMBER }, status: { type: Type.STRING } } },
                adx: { type: Type.OBJECT, properties: { value: { type: Type.NUMBER }, intensity: { type: Type.STRING } } },
                aroon: { type: Type.OBJECT, properties: { up: { type: Type.NUMBER }, down: { type: Type.NUMBER }, intensity: { type: Type.STRING } } },
                ma: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, description: { type: Type.STRING } } },
              }
            }
          },
          required: ["trend", "probability", "recommendation", "reason", "indicators"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Erro na análise IA:", error);
    return null;
  }
}

let loggedTtsWarning = false;
export async function speakAnalysis(text: string, voiceName: string = "Kore") {
  if (!ai) {
    if (!loggedTtsWarning) {
      console.warn("TTS Gemini: API Key não configurada (Muda o console para silenciar avisos futuros).");
      loggedTtsWarning = true;
    }
    return;
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash", // Reverted to standard flash as custom tts models might be experimental
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO"],
// @ts-ignore
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      await audio.play();
    }
  } catch (error) {
    console.error("Erro no TTS:", error);
  }
}
