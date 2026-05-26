import { Router } from 'express';
import multer from 'multer';
import {
  createAssignment,
  getAssignments,
  getAssignmentById,
  deleteAssignment,
  regenerateAssignment,
} from '../controllers/assignmentController';
import { generatePDF } from '../controllers/pdfController';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: JPEG, PNG, PDF, TXT'));
    }
  },
});

router.post('/', upload.single('file'), createAssignment);
router.get('/', getAssignments);
router.get('/:id', getAssignmentById);
router.delete('/:id', deleteAssignment);
router.post('/:id/regenerate', regenerateAssignment);
router.get('/:id/pdf', generatePDF);

export default router;
