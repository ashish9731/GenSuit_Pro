import { GoogleGenerativeAI, Schema, SchemaType, GenerationConfig } from "@google/generative-ai";
import { AnalyticsReport } from "../types";

// Updated to use environment variable from Vite
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  console.error("Gemini API key is missing. Please set VITE_GEMINI_API_KEY in your .env.local file");
  throw new Error("Gemini API key is missing. Please set VITE_GEMINI_API_KEY in your .env.local file");
}
const ai = new GoogleGenerativeAI(apiKey);

// --- Email Service ---

export const generateEmailDraft = async (
  prompt: string, 
  enhance: boolean,
  context?: string
): Promise<string> => {
  try {
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    
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

    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    return response.text() || "Unable to generate email draft.";
  } catch (error) {
    console.error("Email generation error:", error);
    return "Sorry, I encountered an error while generating your email. Please try again.";
  }
};

export const enhanceUserPrompt = async (rawPrompt: string): Promise<string> => {
  try {
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const response = await model.generateContent(`You are an expert Prompt Engineer. Rewrite the following user draft request into a structured, highly detailed prompt that will ensure a perfect AI generation.
        
        User Input: "${rawPrompt}"
        
        Technique to use:
        1. Assign a Persona (e.g., "Act as a Project Manager").
        2. Define the Goal clearly.
        3. Add Tone constraints (e.g., "Professional but urgent").
        4. Specify the Format.
        
        Return ONLY the enhanced prompt text.`);
    const result = await response.response;
    return result.text() || rawPrompt;
  } catch (error) {
    console.error("Prompt enhancement error:", error);
    return rawPrompt;
  }
}

// --- Analytics Service ---

export const analyzeSalesData = async (dataSample: string): Promise<AnalyticsReport> => {
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

  const schema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
      kpis: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            label: { type: SchemaType.STRING },
            value: { type: SchemaType.STRING },
            change: { type: SchemaType.STRING },
            trend: { type: SchemaType.STRING, enum: ['up', 'down', 'neutral'] } as Schema
          }
        }
      },
      dailySummary: { type: SchemaType.STRING },
      weeklySummary: { type: SchemaType.STRING },
      monthlySummary: { type: SchemaType.STRING },
      strategicRecommendations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      forecast: { type: SchemaType.STRING, description: "A prediction for the next period based on current trends" },
      revenueTrend: {
        type: SchemaType.ARRAY,
        items: {
            type: SchemaType.OBJECT,
            properties: {
                date: { type: SchemaType.STRING, description: "Short date format e.g., 'Jan 01'" },
                value: { type: SchemaType.NUMBER, description: "Numeric value for the chart" }
            }
        },
        description: "Extract at least 5-10 data points representing revenue or sales volume over time from the data."
      },
      productDistribution: {
        type: SchemaType.ARRAY,
        items: {
            type: SchemaType.OBJECT,
            properties: {
                name: { type: SchemaType.STRING },
                value: { type: SchemaType.NUMBER }
            }
        },
        description: "Top 5 categories/products and their total value or count."
      },
      personnelAnalysis: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            name: { type: SchemaType.STRING },
            performanceScore: { type: SchemaType.NUMBER, description: "Score out of 100 based on relative performance" },
            revenueGenerated: { type: SchemaType.STRING, description: "Formatted string e.g., '$50,000'" },
            salesCount: { type: SchemaType.NUMBER },
            keyStrength: { type: SchemaType.STRING },
            areaForImprovement: { type: SchemaType.STRING },
            actionPlan: { type: SchemaType.STRING, description: "One specific actionable step for this person to improve." }
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

  const config: GenerationConfig = {
    responseMimeType: "application/json"
  };

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: config
  });
  
  const response = await result.response;
  console.log("Raw Gemini response:", response.text());
  
  if (response.text()) {
      try {
        // Robust cleanup: sometimes models wrap JSON in code blocks
        let cleanText = response.text().trim();
        console.log("Clean text before processing:", cleanText);
        
        if (cleanText.startsWith('```json')) {
          cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '');
        } else if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^``/, '').replace(/```$/, '');
        }
        
        console.log("Clean text after removing code blocks:", cleanText);
        const parsedData = JSON.parse(cleanText) as any;
        console.log("Parsed data:", parsedData);
        
        // Map the Gemini API response to the expected AnalyticsReport structure
        const safeData: AnalyticsReport = {
          kpis: Array.isArray(parsedData.kpis) ? parsedData.kpis : [],
          dailySummary: Array.isArray(parsedData.executive_summaries?.daily) && parsedData.executive_summaries.daily.length > 0 
            ? parsedData.executive_summaries.daily[0].summary 
            : "No data available",
          weeklySummary: Array.isArray(parsedData.executive_summaries?.weekly) && parsedData.executive_summaries.weekly.length > 0 
            ? parsedData.executive_summaries.weekly[0].summary 
            : "No data available",
          monthlySummary: Array.isArray(parsedData.executive_summaries?.monthly) && parsedData.executive_summaries.monthly.length > 0 
            ? parsedData.executive_summaries.monthly[0].summary 
            : "No data available",
          strategicRecommendations: Array.isArray(parsedData.strategic_recommendations) ? parsedData.strategic_recommendations : [],
          forecast: typeof parsedData.next_month_outlook === 'string' ? parsedData.next_month_outlook : "No forecast available",
          revenueTrend: Array.isArray(parsedData.revenue_trend_chart_data) ? parsedData.revenue_trend_chart_data : [],
          productDistribution: Array.isArray(parsedData.category_distribution_pie_chart_data) ? parsedData.category_distribution_pie_chart_data : [],
          personnelAnalysis: Array.isArray(parsedData.salesperson_performance) ? parsedData.salesperson_performance : []
        };
        
        console.log("Safe data being returned:", safeData);
        return safeData;
      } catch (e) {
        console.error("JSON Parse Error:", e);
        // Return a safe default structure when parsing fails
        return {
          kpis: [],
          dailySummary: "Unable to analyze data",
          weeklySummary: "Unable to analyze data",
          monthlySummary: "Unable to analyze data",
          strategicRecommendations: [],
          forecast: "Unable to generate forecast",
          revenueTrend: [],
          productDistribution: [],
          personnelAnalysis: []
        };
      }
  }
  // Return a safe default structure when no response text is available
  return {
    kpis: [],
    dailySummary: "No response from AI",
    weeklySummary: "No response from AI",
    monthlySummary: "No response from AI",
    strategicRecommendations: [],
    forecast: "No forecast available",
    revenueTrend: [],
    productDistribution: [],
    personnelAnalysis: []
  };
};

// --- Chat Service ---

export const chatWithDocument = async (
  history: { role: string; parts: { text: string }[] }[],
  message: string,
  documentContext: string
): Promise<string> => {
  try {
    // Pass system instruction when getting the model
    const model = ai.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `You are a helpful assistant analyzing a specific document provided by the user. 
          
          RULES:
          1. Answer ONLY based on the provided document context.
          2. STRICTLY REFUSE to answer questions about software development, coding, or programming.
          3. STRICTLY REFUSE to discuss topics not found in the document.
          4. If the user asks for code, say "I cannot assist with software development tasks."
          
          DOCUMENT CONTEXT:
          ${documentContext.substring(0, 50000)}`
    });
    
    const chat = model.startChat({
      history: history
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text() || "I could not generate a response.";
  } catch (error) {
    console.error("Chat error:", error);
    return "Sorry, I encountered an error while processing your request. Please try again.";
  }
};