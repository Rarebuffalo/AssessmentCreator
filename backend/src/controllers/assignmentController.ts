import { Request, Response } from 'express';
import { PDFParse } from 'pdf-parse';
import Assignment from '../models/Assignment';
import generationQueue from '../queues/generationQueue';

export const createAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      subject,
      className,
      schoolName,
      timeAllowed,
      dueDate,
      questionTypes,
      difficulty,
      additionalInstructions,
    } = req.body;

    const uploadedFileName = (req.file as Express.Multer.File | undefined)?.originalname;

    let extractedText = '';
    if (req.file) {
      try {
        if (req.file.mimetype === 'text/plain') {
          extractedText = req.file.buffer.toString('utf-8');
        } else if (req.file.mimetype === 'application/pdf') {
          const parser = new PDFParse({ data: req.file.buffer });
          const pdfData = await parser.getText();
          extractedText = pdfData.text || '';
        }
      } catch (err) {
        console.error('File text extraction error:', err);
      }
    }

    let parsedQuestionTypes = questionTypes;
    if (typeof questionTypes === 'string') {
      try {
        parsedQuestionTypes = JSON.parse(questionTypes);
      } catch (error) {
        res.status(400).json({ success: false, message: 'Invalid questionTypes format' });
        return;
      }
    }

    if (!Array.isArray(parsedQuestionTypes)) {
      res.status(400).json({ success: false, message: 'questionTypes must be an array' });
      return;
    }

    const totalQuestions = parsedQuestionTypes.reduce(
      (sum: number, qt: { count: number }) => sum + qt.count,
      0
    );
    const totalMarks = parsedQuestionTypes.reduce(
      (sum: number, qt: { count: number; marks: number }) => sum + qt.count * qt.marks,
      0
    );

    const assignment = new Assignment({
      title: title || `${subject} Assessment`,
      subject,
      className: className || '',
      schoolName: schoolName || 'Delhi Public School',
      timeAllowed: timeAllowed ? parseInt(String(timeAllowed)) : 60,
      dueDate,
      questionTypes: parsedQuestionTypes,
      difficulty: difficulty || 'Mixed',
      additionalInstructions: additionalInstructions || '',
      uploadedFileName,
      extractedText,
      status: 'pending',
      totalQuestions,
      totalMarks,
    });

    await assignment.save();

    await generationQueue.add(
      'generate-questions',
      { assignmentId: assignment._id.toString() },
      { jobId: assignment._id.toString() }
    );

    res.status(201).json({
      success: true,
      assignmentId: assignment._id,
      message: 'Assignment created and queued for generation',
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ success: false, message: 'Failed to create assignment' });
  }
};

export const getAssignments = async (_req: Request, res: Response): Promise<void> => {
  try {
    const assignments = await Assignment.find()
      .select('-sections')
      .sort({ createdAt: -1 });
    res.json({ success: true, assignments });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch assignments' });
  }
};

export const getAssignmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      res.status(404).json({ success: false, message: 'Assignment not found' });
      return;
    }
    res.json({ success: true, assignment });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch assignment' });
  }
};

export const deleteAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) {
      res.status(404).json({ success: false, message: 'Assignment not found' });
      return;
    }
    res.json({ success: true, message: 'Assignment deleted' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete assignment' });
  }
};

export const regenerateAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      res.status(404).json({ success: false, message: 'Assignment not found' });
      return;
    }

    assignment.status = 'pending';
    assignment.sections = [];
    assignment.errorMessage = undefined;
    (assignment as any).pdfBuffer = undefined;

    await assignment.save();

    // Remove existing job from queue if it exists to allow regeneration
    try {
      const existingJob = await generationQueue.getJob(assignment._id.toString());
      if (existingJob) {
        await existingJob.remove();
        console.log(`Removed existing job ${assignment._id} from queue for regeneration`);
      }
    } catch (queueErr) {
      console.warn('Failed to remove existing job from queue:', queueErr);
    }

    await generationQueue.add(
      'generate-questions',
      { assignmentId: assignment._id.toString() },
      { jobId: assignment._id.toString() }
    );

    res.json({
      success: true,
      message: 'Assignment queued for regeneration',
    });
  } catch (error) {
    console.error('Regenerate assignment error:', error);
    res.status(500).json({ success: false, message: 'Failed to regenerate assignment' });
  }
};
