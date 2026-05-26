import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import redisConnection from '../config/redis';
import Assignment from '../models/Assignment';
import { generateQuestions } from '../services/aiService';
import { emitToAssignment } from '../websocket/socket';
import connectDB from '../config/db';

connectDB();

interface GenerationJobData {
  assignmentId: string;
}

const worker = new Worker<GenerationJobData>(
  'generation',
  async (job: Job<GenerationJobData>) => {
    const { assignmentId } = job.data;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      throw new Error(`Assignment ${assignmentId} not found`);
    }

    // Update status to generating
    assignment.status = 'generating';
    await assignment.save();

    emitToAssignment(assignmentId, 'job:progress', {
      status: 'generating',
      message: 'AI is generating your question paper...',
    });

    await job.updateProgress(10);

    const generatedPaper = await generateQuestions(
      assignment.subject,
      assignment.className,
      assignment.questionTypes,
      assignment.difficulty,
      assignment.additionalInstructions,
      assignment.uploadedFileName,
      assignment.extractedText
    );

    await job.updateProgress(80);

    emitToAssignment(assignmentId, 'job:progress', {
      status: 'formatting',
      message: 'Formatting question paper...',
    });

    // Map generated sections back to assignment
    assignment.sections = generatedPaper.sections.map((section) => ({
      title: section.title,
      instruction: section.instruction,
      questionType: section.questionType,
      questions: section.questions.map((q) => ({
        question: q.question,
        difficulty: q.difficulty,
        marks: q.marks,
        answer: q.answer,
      })),
    }));

    assignment.status = 'completed';
    await assignment.save();

    await job.updateProgress(100);

    emitToAssignment(assignmentId, 'job:completed', {
      status: 'completed',
      assignmentId,
      message: 'Question paper generated successfully',
    });

    return { assignmentId, status: 'completed' };
  },
  {
    connection: redisConnection,
    concurrency: 3,
  }
);

worker.on('active', (job) => {
  console.log(`Job ${job.id} started for assignment ${job.data.assignmentId}`);
});

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed for assignment ${job.data.assignmentId}`);
});

worker.on('failed', async (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
  if (job) {
    const { assignmentId } = job.data;
    await Assignment.findByIdAndUpdate(assignmentId, {
      status: 'failed',
      errorMessage: err.message,
    });
    emitToAssignment(assignmentId, 'job:failed', {
      status: 'failed',
      message: 'Question generation failed. Please try again.',
    });
  }
});

console.log('Generation worker started');

export default worker;
