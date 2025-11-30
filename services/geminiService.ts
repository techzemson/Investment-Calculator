import { GoogleGenAI } from "@google/genai";
import { CalculationResult, CalculatorMode, InvestmentInputs } from "../types";

const SYSTEM_INSTRUCTION = `
You are a world-class senior financial advisor. Your role is to analyze investment calculation data and provide a concise, actionable, and smart summary.
Focus on:
1. Wealth creation potential.
2. The impact of inflation.
3. Tax efficiency.
4. Risk factors associated with the selected investment type.
5. 2-3 specific, actionable tips to improve the outcome.

Keep the tone professional yet encouraging. Avoid generic disclaimers where possible, but ensure advice is sound.
Format the output as a JSON object with keys: "summary", "recommendations" (array of strings), "riskAssessment".
`;

export const analyzeInvestment = async (
  mode: CalculatorMode,
  inputs: InvestmentInputs,
  results: CalculationResult
): Promise<any> => {
  if (!process.env.API_KEY) {
    console.warn("API Key missing");
    return {
      summary: "API Key not configured. Please add your Gemini API Key to enable AI insights.",
      recommendations: ["Configure API Key", "Consult a financial advisor"],
      riskAssessment: "Unknown"
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      Analyze this investment scenario:
      Type: ${mode}
      Inputs: ${JSON.stringify(inputs)}
      Results: ${JSON.stringify({
        invested: results.totalInvested,
        final: results.finalValue,
        profit: results.totalInterest,
        postTax: results.postTaxValue
      })}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      summary: "Could not generate AI analysis at this time.",
      recommendations: ["Check your internet connection", "Try again later"],
      riskAssessment: "Unavailable"
    };
  }
};