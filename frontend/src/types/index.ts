// Shared TypeScript types for the frontend

export interface QuestionTypeConfig {
  type: string;
  count: number;
  marks: number;
}

export interface Question {
  question: string;
  difficulty: "Easy" | "Moderate" | "Challenging";
  marks: number;
  answer?: string;
}

export interface Section {
  title: string;
  instruction: string;
  questionType: string;
  questions: Question[];
}

export type AssignmentStatus = "pending" | "generating" | "completed" | "failed";
export type Difficulty = "Easy" | "Moderate" | "Challenging" | "Mixed";

export interface Assignment {
  _id: string;
  title: string;
  subject: string;
  className: string;
  schoolName: string;
  timeAllowed: number;
  dueDate: string;
  questionTypes: QuestionTypeConfig[];
  difficulty: Difficulty;
  additionalInstructions: string;
  uploadedFileName?: string;
  status: AssignmentStatus;
  errorMessage?: string;
  sections: Section[];
  totalQuestions: number;
  totalMarks: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssignmentPayload {
  title?: string;
  subject: string;
  className: string;
  schoolName: string;
  timeAllowed: number;
  dueDate: string;
  questionTypes: QuestionTypeConfig[];
  difficulty: Difficulty;
  additionalInstructions: string;
}

export interface JobProgressEvent {
  status: string;
  message: string;
}

export interface JobCompletedEvent {
  status: "completed";
  assignmentId: string;
  message: string;
}

export interface JobFailedEvent {
  status: "failed";
  message: string;
}
