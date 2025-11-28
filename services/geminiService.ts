import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";
import { AnalyticsReport } from "../types";

// Check for API key presence to prevent crashes
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
    console.warn("Gemini API Key is missing. App functions relying on AI will fail.");
}

const ai = new GoogleGenerativeAI(apiKey || 'DUMMY_KEY_FOR_BUILD');

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
  
  RESPONSE FORMAT:
  Please return a JSON object with the following structure:
  {
    "kpis": [
      { "label": "string", "value": "string or number", "change": "string", "trend": "up|down|neutral" }
    ],
    "dailySummary": "string",
    "weeklySummary": "string",
    "monthlySummary": "string",
    "strategicRecommendations": ["string"],
    "forecast": "string",
    "revenueTrend": [
      { "date": "string", "value": number }
    ],
    "productDistribution": [
      { "name": "string", "value": number }
    ],
    "personnelAnalysis": [
      {
        "name": "string",
        "performanceScore": number,
        "revenueGenerated": "string",
        "salesCount": number,
        "keyStrength": "string",
        "areaForImprovement": "string",
        "actionPlan": "string"
      }
    ]
  }
  
  CRITICAL RULES:
  - Return ONLY valid JSON in the exact format specified above.
  - If the data is empty or unreadable, return a valid JSON object with empty arrays and "No Data" messages.
  - DO NOT HALLUCINATE data that isn't there.
  - DO NOT include any markdown formatting or code block wrappers.
  
  Data Sample:
  ${dataSample.substring(0, 30000)} 
  `; 

  const config = {
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
        // Handle both the expected structure and potential variations from the AI
        const safeData: AnalyticsReport = {
          kpis: Array.isArray(parsedData.kpis) ? parsedData.kpis.map((kpi: any) => {
            // Format the value properly
            let formattedValue: string | number = 'N/A';
            if (kpi.value !== undefined) {
              if (typeof kpi.value === 'number') {
                // Format numbers with proper localization
                if (Number.isInteger(kpi.value)) {
                  formattedValue = kpi.value.toLocaleString();
                } else {
                  formattedValue = kpi.value.toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  });
                }
              } else {
                formattedValue = kpi.value;
              }
            }
            
            return {
              label: kpi.label || kpi.name || 'Unknown KPI',
              value: formattedValue,
              change: kpi.change || kpi.unit || '',
              trend: kpi.trend || 'neutral'
            };
          }) : [],
          dailySummary: parsedData.dailySummary || parsedData.daily_summary || parsedData.daily || "No data available",
          weeklySummary: parsedData.weeklySummary || parsedData.weekly_summary || parsedData.weekly || "No data available",
          monthlySummary: parsedData.monthlySummary || parsedData.monthly_summary || parsedData.monthly || "No data available",
          strategicRecommendations: Array.isArray(parsedData.strategicRecommendations) ? parsedData.strategicRecommendations : 
                                 Array.isArray(parsedData.strategic_recommendations) ? parsedData.strategic_recommendations : [],
          forecast: parsedData.forecast || parsedData.next_month_outlook || "No forecast available",
          revenueTrend: Array.isArray(parsedData.revenueTrend) ? parsedData.revenueTrend : 
                       Array.isArray(parsedData.revenue_trend) ? parsedData.revenue_trend : 
                       Array.isArray(parsedData.revenue_trend_chart_data) ? parsedData.revenue_trend_chart_data.map((item: any) => ({
                         date: item.date || item.time || '',
                         value: item.value || 0
                       })) : [],
          productDistribution: Array.isArray(parsedData.productDistribution) ? parsedData.productDistribution : 
                              Array.isArray(parsedData.product_distribution) ? parsedData.product_distribution : 
                              Array.isArray(parsedData.category_distribution_pie_chart_data) ? parsedData.category_distribution_pie_chart_data.map((item: any) => ({
                                name: item.name || item.category || 'Unknown',
                                value: item.value || 0
                              })) : [],
          personnelAnalysis: Array.isArray(parsedData.personnelAnalysis) ? parsedData.personnelAnalysis : 
                            Array.isArray(parsedData.personnel_analysis) ? parsedData.personnel_analysis : 
                            Array.isArray(parsedData.salesperson_performance) ? parsedData.salesperson_performance.map((person: any) => ({
                              name: person.name || person.id || 'Unknown',
                              performanceScore: person.performanceScore !== undefined ? person.performanceScore : 
                                              person.performance_score !== undefined ? person.performance_score : 50,
                              revenueGenerated: person.revenueGenerated || person.revenue_generated || person.total_net_weight?.toLocaleString() || "0",
                              salesCount: person.salesCount !== undefined ? person.salesCount : 
                                         person.sales_count !== undefined ? person.sales_count : 1,
                              keyStrength: person.keyStrength || person.key_strength || "Consistent performance",
                              areaForImprovement: person.areaForImprovement || person.area_for_improvement || "Maintain current performance",
                              actionPlan: person.actionPlan || person.action_plan || "Continue current practices"
                            })) : []
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
          5. If the user asks for KPIs or metrics, analyze the data to provide meaningful insights.
          6. When asked to create KPIs, identify key metrics from the data such as totals, averages, maximums, minimums, and trends.
          
          DOCUMENT CONTEXT:
          ${documentContext.substring(0, 50000)}`
    });
    
    // Enhance KPI requests with specific instructions
    let enhancedMessage = message;
    if (message.toLowerCase().includes('kpi') || message.toLowerCase().includes('key performance indicator') || 
        message.toLowerCase().includes('metric') || message.toLowerCase().includes('create kpi')) {
      enhancedMessage = `Based on the document data, please create relevant KPIs (Key Performance Indicators) that would be valuable for business analysis. 
      
      When creating KPIs, consider:
      1. Total values (sums) for numerical columns
      2. Average values for numerical columns
      3. Maximum and minimum values
      4. Count of records
      5. Trends over time if date information is available
      6. Category distributions if categorical data exists
      
      Format your response clearly with labels and values.
      
      User request: ${message}`;
    }
    
    const chat = model.startChat({
      history: history
    });

    const result = await chat.sendMessage(enhancedMessage);
    const response = await result.response;
    return response.text() || "I could not generate a response.";
  } catch (error) {
    console.error("Chat error:", error);
    return "Sorry, I encountered an error while processing your request. Please try again.";
  }
};