import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

/**
 * Calls Gemini to generate a personalized AI profile from the user's onboarding inputs.
 * Returns structured data: aheadScore, dna, roadmap, verifications, dailyGoal.
 */
export async function generateAIProfile(goal, skills, name, education) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are .ahead's AI engine. A user just completed onboarding. Analyze their profile and generate a structured JSON response.

User Profile:
- Name: ${name}
- Education / Current Role: ${education}
- Career Goal: ${goal}
- Self-declared skills (raw): ${skills}

Generate a STRICTLY VALID JSON object with this exact structure (no markdown, no extra text, just raw JSON):
{
  "aheadScore": <integer between 800 and 2500 based on skill depth and goal alignment>,
  "dna": [
    {
      "category": "<category name, e.g. 'Core Languages', 'Web Frameworks', 'Foundation'>",
      "skills": [
        { "name": "<skill name>", "level": <1-5 integer based on typical proficiency implied>, "verified": <true or false> }
      ]
    }
  ],
  "roadmap": [
    {
      "title": "<phase title relevant to their goal>",
      "status": "<'Completed' | 'In Progress' | 'Locked'>",
      "active": <true or false, only ONE phase should be active>,
      "resources": [
        { "name": "<resource name>", "type": "<'Documentation' | 'Interactive Course' | 'Book' | 'Project' | 'Video'>" }
      ]
    }
  ],
  "verifications": [
    { "id": 1, "name": "<a skill from their DNA that should be verified>", "type": "<'Core Skill' | 'Specialization'>", "reward": "+<number> pts" }
  ],
  "dailyGoal": "<one specific, actionable daily task aligned to their roadmap phase and goal>"
}

Rules:
- dna: Parse the raw skills string smartly. Group into 2-4 logical categories. Assess level 1-5 honestly. Mark commonly claimed skills as verified=false unless they are truly foundational (e.g. HTML=true).
- roadmap: Generate 4-5 phases specifically tailored to their goal "${goal}". First phase is Completed, second is In Progress (active:true), rest are Locked.
- verifications: Pick 1-2 skills from the DNA that need verification. 
- aheadScore: Base it on number of skills, their depth, and alignment with the goal. Range 800-2500.
- dailyGoal: Make it very specific, actionable, and relevant to their current roadmap phase.
- Return ONLY the raw JSON. No markdown fences. No explanation.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Strip markdown code fences if model adds them anyway
  const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();

  try {
    return JSON.parse(clean);
  } catch (e) {
    console.error('Gemini JSON parse error:', e, '\nRaw response:', text);
    throw new Error('AI returned an unexpected format. Please try again.');
  }
}

/**
 * Regenerates just the roadmap for a new goal, keeping existing DNA in context.
 */
export async function regenerateRoadmap(goal, skills, currentDNA) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const dnaString = currentDNA.map(g =>
    `${g.category}: ${g.skills.map(s => s.name).join(', ')}`
  ).join(' | ');

  const prompt = `You are .ahead's AI engine. A user has updated their career goal. Regenerate their learning roadmap.

New Goal: ${goal}
User's Skill DNA: ${dnaString}
User's raw skills: ${skills}

Generate a STRICTLY VALID JSON array of roadmap phases (no markdown, no extra text, just raw JSON array):
[
  {
    "title": "<phase title relevant to ${goal}>",
    "status": "<'Completed' | 'In Progress' | 'Locked'>",
    "active": <true or false, only ONE should be active>,
    "resources": [
      { "name": "<resource name>", "type": "<'Documentation' | 'Interactive Course' | 'Book' | 'Project' | 'Video'>" }
    ]
  }
]

Rules:
- Generate 4-5 phases specifically for goal: "${goal}"
- First phase = Completed (no resources needed), second = In Progress with active:true (2-3 resources), rest = Locked
- Resources should be real, well-known resources (e.g. "JavaScript.info", "CS50", "Designing Data-Intensive Applications")
- Return ONLY the raw JSON array. No markdown. No explanation.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();

  try {
    return JSON.parse(clean);
  } catch (e) {
    console.error('Gemini roadmap parse error:', e, '\nRaw:', text);
    throw new Error('AI returned an unexpected format. Please try again.');
  }
}
