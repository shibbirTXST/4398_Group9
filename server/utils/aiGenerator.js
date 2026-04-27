import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateRoutineFromAI = async (surveyData) => {
  // Use Gemini to generate a routine based on the survey data
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json', // Strictly enforces JSON output
    }
  });

  // Construct the hidden System Prompt
  const prompt = `
    You are an expert habit and routine generation assistant. 
    Based on the following user survey, generate a realistic list of daily habits to help them achieve their goal.

    User Survey Data:
    - Routine Name: ${surveyData.routineName}
    - Primary Focus Area: ${surveyData.focusArea}
    - Preferred Time(s) of Day: ${surveyData.timesOfDay.join(', ')}
    - Exact Start Time: ${surveyData.startTime}
    - Total Time Commitment: ${surveyData.timeCommitment}
    - Difficulty Level: ${surveyData.difficulty}
    - Additional Details: ${surveyData.additionalDetails}

    Instructions:
    1. Generate realistic habits that fit within the "Total Time Commitment".
    2. The first habit's "reminderTime" MUST be exactly the "Exact Start Time" provided by the user.
    3. Space out the subsequent habits logically so the entire routine flows sequentially from that start time.
    4. Ensure the AM/PM formatting is strictly correct (e.g., if the user starts at 09:30 PM, do not accidentally drift into AM times unless crossing midnight).
    5. Format the reminderTime EXACTLY as "HH:MM AM/PM" (e.g., "07:30 AM", "05:00 PM").
    6. Provide the output as a flat JSON array of objects.

    JSON Schema Required:
    [
      { "title": "String", "reminderTime": "String" }
    ]
  `;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  // Parse the guaranteed JSON array
  return JSON.parse(responseText);
};