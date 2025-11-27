import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalyticsReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Email Service ---

export const generateEmailDraft = async (
  prompt: string, 
  enhance: boolean,
  context?: string
): Promise<string> => {
  const model = "gemini-2.5-flash";
  
  let userInstruction = prompt;
  if (enhance) {
    // We enhance the PROMPT itself first, to make sure the input to the generator is high quality
    userInstruction = `Refine this request into a detailed prompt for an AI writer. The goal is to produce a professional, high-stakes email. Original request: "${prompt}"`;
  }

  // The "Mega Prompt" structure for the Executive Persona
  const finalPrompt = `
    ROLE: You are a World-Class Executive Communications Director. You write emails that get results. Your tone is confident, clear, and empathetic.
    
    TASK: Write an email based on the following request:
    "${userInstruction}"
    ${context ? `ADDITIONAL CONTEXT: ${context}` : ''}

    STRICT OUTPUT RULES:
    1. **Structure**: 
       - Subject Line: Compelling and concise (max 7 words).
       - Opening: Warm, professional, and context-aware.
       - Body: Use specific details. If listing items, use BULLET POINTS for readability.
       - CTA: A clear, direct Call to Action (e.g., "Let's discuss on Tuesday at 2 PM").
       - Sign-off: Professional closing.

    2. **Anti-Hallucination**: 
       - Do NOT invent names, dates, or financial figures if they are not in the prompt. 
       - Use bracketed placeholders like [Name], [Date], [Company Name] if you are missing specific details.
       - Double-check the content for logical consistency.

    3. **Psychology**:
       - If the user asks for money/sales: Use persuasive, benefit-driven language.
       - If the user is apologizing: Be sincere, non-defensive, and solution-oriented.
       - If the user is following up: Be polite but persistent, adding value.

    Output ONLY the email content. Start with "Subject:".
  `;

  const response = await ai.models.generateContent({
    model,
    contents: finalPrompt,
    config: {
        systemInstruction: "You are an elite corporate communication AI. You despise fluff. You prioritize clarity, active voice, and result-oriented communication. You never hallucinate facts."
    }
  });

  return response.text || "";
};

export const enhanceUserPrompt = async (rawPrompt: string): Promise<string> => {
    const model = "gemini-2.5-flash";
    const response = await ai.models.generateContent({
        model,
        contents: `You are an expert Prompt Engineer. Rewrite the following user draft request into a structured, highly detailed prompt that will ensure a perfect AI generation.
        
        User Input: "${rawPrompt}"
        
        Technique to use:
        1. Assign a Persona (e.g., "Act as a Project Manager").
        2. Define the Goal clearly.
        3. Add Tone constraints (e.g., "Professional but urgent").
        4. Specify the Format.
        
        Return ONLY the enhanced prompt text.`
    });
    return response.text || rawPrompt;
}

// --- Analytics Service ---

export const analyzeSalesData = async (dataSample: string): Promise<AnalyticsReport> => {
  const model = "gemini-2.5-flash";

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      kpis: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            label: { type: Type.STRING },
            value: { type: Type.STRING },
            change: { type: Type.STRING },
            trend: { type: Type.STRING, enum: ['up', 'down', 'neutral'] }
          }
        }
      },
      dailySummary: { type: Type.STRING },
      weeklySummary: { type: Type.STRING },
      monthlySummary: { type: Type.STRING },
      strategicRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
      forecast: { type: Type.STRING, description: "A prediction for the next period based on current trends" },
      revenueTrend: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                date: { type: Type.STRING, description: "Short date format e.g., 'Jan 01'" },
                value: { type: Type.NUMBER, description: "Numeric value for the chart" }
            }
        },
        description: "Extract at least 5-10 data points representing revenue or sales volume over time from the data."
      },
      productDistribution: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                value: { type: Type.NUMBER }
            }
        },
        description: "Top 5 categories/products and their total value or count."
      },
      personnelAnalysis: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            performanceScore: { type: Type.NUMBER, description: "Score out of 100 based on relative performance" },
            revenueGenerated: { type: Type.STRING, description: "Formatted string e.g., '$50,000'" },
            salesCount: { type: Type.NUMBER },
            keyStrength: { type: Type.STRING },
            areaForImprovement: { type: Type.STRING },
            actionPlan: { type: Type.STRING, description: "One specific actionable step for this person to improve." }
          }
        }
      }
    },
    required: ["kpis", "dailySummary", "weeklySummary", "monthlySummary", "strategicRecommendations", "forecast", "revenueTrend", "productDistribution", "personnelAnalysis"]
  };

  const prompt = `Analyze the following dataset (CSV/JSON format).
  
  TASK:
  1. Identify Key Performance Indicators (KPIs).
  2. Generate executive summaries for Daily, Weekly, and Monthly views.
  3. Formulate 3-5 high-level Strategic Recommendations for the business.
  4. Forecast the next month's outlook.
  5. Extract data for a Revenue Trend Line Chart (Time vs Value). If dates are missing, simulate a trend based on row order.
  6. Extract data for a Product/Category Distribution Pie Chart.
  7. Analyze each salesperson's performance deeply, providing a score, revenue, and a specific action plan.
  
  CRITICAL RULE:
  - If the data is empty or unreadable, return a valid JSON object with empty arrays and "No Data" messages. DO NOT HALLUCINATE data that isn't there.
  
  Data Sample:
  ${dataSample.substring(0, 30000)} 
  `; 

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      systemInstruction: "You are a Chief Data Officer. You provide ruthless, high-level business intelligence. You do not just summarize; you find the 'So What?'. Prioritize accuracy."
    }
  });

  if (response.text) {
      try {
        // Robust cleanup: sometimes models wrap JSON in markdown blocks
        let cleanText = response.text.trim();
        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '');
        } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/^```/, '').replace(/```$/, '');
        }
        return JSON.parse(cleanText) as AnalyticsReport;
      } catch (e) {
        console.error("JSON Parse Error:", e);
        throw new Error("The AI analysis could not be processed. Please check your data file format.");
      }
  }
  throw new Error("Failed to generate analytics");
};

// --- Chat Service ---

export const chatWithDocument = async (
  history: { role: string; parts: { text: string }[] }[],
  message: string,
  documentContext: string
): Promise<string> => {
  const model = "gemini-2.5-flash";
  
  const chat = ai.chats.create({
    model,
    history: history,
    config: {
        systemInstruction: `You are a helpful assistant analyzing a specific document provided by the user. 
        
        RULES:
        1. Answer ONLY based on the provided document context.
        2. STRICTLY REFUSE to answer questions about software development, coding, or programming.
        3. STRICTLY REFUSE to discuss topics not found in the document.
        4. If the user asks for code, say "I cannot assist with software development tasks."
        
        DOCUMENT CONTEXT:
        ${documentContext.substring(0, 50000)}`
    }
  });

  const response = await chat.sendMessage({ message });
  return response.text || "I could not generate a response.";
};