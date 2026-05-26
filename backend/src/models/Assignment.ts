import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion {
  question: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  marks: number;
  answer?: string;
}

export interface ISection {
  title: string;
  instruction: string;
  questionType: string;
  questions: IQuestion[];
}

export interface IQuestionTypeConfig {
  type: string;
  count: number;
  marks: number;
}

export interface IAssignment extends Document {
  title: string;
  subject: string;
  className: string;
  schoolName: string;
  timeAllowed: number;
  dueDate: string;
  questionTypes: IQuestionTypeConfig[];
  difficulty: 'Easy' | 'Moderate' | 'Challenging' | 'Mixed';
  additionalInstructions: string;
  uploadedFileName?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  errorMessage?: string;
  pdfBuffer?: Buffer;
  extractedText?: string;
  sections: ISection[];
  totalQuestions: number;
  totalMarks: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  question: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Moderate', 'Challenging'], required: true },
  marks: { type: Number, required: true },
  answer: { type: String },
});

const SectionSchema = new Schema<ISection>({
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  questionType: { type: String, required: true },
  questions: [QuestionSchema],
});

const QuestionTypeConfigSchema = new Schema<IQuestionTypeConfig>({
  type: { type: String, required: true },
  count: { type: Number, required: true, min: 1 },
  marks: { type: Number, required: true, min: 1 },
});

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    className: { type: String, default: '' },
    schoolName: { type: String, default: 'Delhi Public School' },
    timeAllowed: { type: Number, default: 60 },
    dueDate: { type: String, required: true },
    questionTypes: [QuestionTypeConfigSchema],
    difficulty: {
      type: String,
      enum: ['Easy', 'Moderate', 'Challenging', 'Mixed'],
      default: 'Mixed',
    },
    additionalInstructions: { type: String, default: '' },
    uploadedFileName: { type: String },
    status: {
      type: String,
      enum: ['pending', 'generating', 'completed', 'failed'],
      default: 'pending',
    },
    errorMessage: { type: String },
    pdfBuffer: { type: Schema.Types.Buffer },
    extractedText: { type: String, default: '' },
    sections: [SectionSchema],
    totalQuestions: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
export default Assignment;
