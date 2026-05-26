import { GoogleGenerativeAI } from '@google/generative-ai';
import { IQuestionTypeConfig } from '../models/Assignment';

interface GeneratedQuestion {
  question: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  marks: number;
  answer: string;
}

interface GeneratedSection {
  title: string;
  instruction: string;
  questionType: string;
  questions: GeneratedQuestion[];
}

interface GeneratedPaper {
  sections: GeneratedSection[];
}

const buildPrompt = (
  subject: string,
  className: string,
  questionTypes: IQuestionTypeConfig[],
  difficulty: string,
  additionalInstructions: string,
  uploadedFileName?: string,
  extractedText?: string
): string => {
  const sectionList = questionTypes
    .map((qt, index) => {
      const sectionLabel = String.fromCharCode(65 + index); // A, B, C...
      return `Section ${sectionLabel}: ${qt.count} ${qt.type} questions, ${qt.marks} marks each`;
    })
    .join('\n');

  let fileContext = '';
  if (uploadedFileName) {
    fileContext = `The teacher has uploaded a reference document named "${uploadedFileName}". Generate questions relevant to that context.`;
  }
  if (extractedText) {
    fileContext += `\nUse the following reference content uploaded by the teacher to generate relevant questions:\n"""\n${extractedText}\n"""`;
  }

  return `You are an expert teacher creating a structured exam paper.

Generate a complete question paper in valid JSON format only. Do not include any text outside the JSON.

Subject: ${subject}
Class/Grade: ${className}
Overall Difficulty: ${difficulty}
${fileContext}

Sections to generate:
${sectionList}

Additional Instructions: ${additionalInstructions || 'None'}

Return ONLY valid JSON matching this exact structure:
{
  "sections": [
    {
      "title": "Section A",
      "instruction": "Attempt all questions. Each question carries X marks.",
      "questionType": "Multiple Choice Questions",
      "questions": [
        {
          "question": "Full question text here?",
          "difficulty": "Easy",
          "marks": 2,
          "answer": "Complete answer here"
        }
      ]
    }
  ]
}

Rules:
- difficulty must be exactly one of: Easy, Moderate, Challenging
- Generate exactly the number of questions specified per section
- Each answer must be complete and accurate
- Questions must be appropriate for the subject and class level
- Do not include any explanation, markdown, or text outside the JSON object`;
};

export const generateQuestions = async (
  subject: string,
  className: string,
  questionTypes: IQuestionTypeConfig[],
  difficulty: string,
  additionalInstructions: string,
  uploadedFileName?: string,
  extractedText?: string
): Promise<GeneratedPaper> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    },
  });

  const prompt = buildPrompt(
    subject,
    className,
    questionTypes,
    difficulty,
    additionalInstructions,
    uploadedFileName,
    extractedText
  );

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  let parsed: GeneratedPaper;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    // Attempt to extract JSON from response if model added surrounding text
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI response did not return valid JSON');
    }
    parsed = JSON.parse(jsonMatch[0]);
  }

  if (!parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error('AI response missing sections array');
  }

  // Validate and normalize difficulty values
  parsed.sections = parsed.sections.map((section) => ({
    ...section,
    questions: section.questions.map((q) => ({
      ...q,
      difficulty: (['Easy', 'Moderate', 'Challenging'].includes(q.difficulty)
        ? q.difficulty
        : 'Moderate') as 'Easy' | 'Moderate' | 'Challenging',
    })),
  }));

  return parsed;
};
