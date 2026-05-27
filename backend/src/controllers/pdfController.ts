import { Request, Response } from 'express';
import puppeteer from 'puppeteer';
import fs from 'fs';
import Assignment from '../models/Assignment';

const buildPDFHTML = (assignment: {
  schoolName: string;
  subject: string;
  className: string;
  timeAllowed: number;
  totalMarks: number;
  sections: Array<{
    title: string;
    instruction: string;
    questions: Array<{
      question: string;
      difficulty: string;
      marks: number;
      answer?: string;
    }>;
  }>;
}): string => {
  const sectionsHTML = assignment.sections
    .map((section) => {
      const questionsHTML = section.questions
        .map(
          (q, index) => `
          <div class="question">
            <span class="question-num">${index + 1}.</span>
            <span class="difficulty-tag">[${q.difficulty}]</span>
            ${q.question}
            <span class="marks">[${q.marks} Marks]</span>
          </div>`
        )
        .join('');

      const answersHTML = section.questions
        .map(
          (q, index) => `
          <div class="answer">
            <strong>${index + 1}.</strong> ${q.answer || 'See solution manual'}
          </div>`
        )
        .join('');

      return `
        <div class="section">
          <h2 class="section-title">${section.title}</h2>
          <div class="section-type">${section.instruction}</div>
          <div class="questions">${questionsHTML}</div>
        </div>
        <div class="section answer-key">
          <h3>Answer Key:</h3>
          ${answersHTML}
        </div>`;
    })
    .join('<div class="page-break"></div>');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #000; padding: 40px; }
  .header { text-align: center; margin-bottom: 24px; }
  .header h1 { font-size: 18pt; font-weight: bold; }
  .header h2 { font-size: 13pt; font-weight: normal; margin-top: 4px; }
  .header h3 { font-size: 12pt; font-weight: normal; margin-top: 2px; }
  .meta { display: flex; justify-content: space-between; border-top: 2px solid #000; border-bottom: 1px solid #000; padding: 8px 0; margin-bottom: 16px; }
  .instructions { margin-bottom: 16px; font-weight: bold; }
  .student-fields { margin-bottom: 20px; line-height: 2; }
  .student-fields div { margin-bottom: 4px; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 14pt; font-weight: bold; text-align: center; margin-bottom: 10px; }
  .section-type { font-size: 11pt; font-style: italic; margin-bottom: 10px; }
  .question { margin: 8px 0; line-height: 1.6; }
  .question-num { margin-right: 6px; }
  .difficulty-tag { background: #f0f0f0; padding: 1px 6px; border-radius: 3px; font-size: 10pt; margin-right: 4px; }
  .marks { font-weight: bold; margin-left: 4px; }
  .answer-key h3 { font-size: 13pt; margin-bottom: 8px; }
  .answer { margin: 8px 0; line-height: 1.6; }
  .end { text-align: center; font-weight: bold; margin: 24px 0; }
  .page-break { page-break-after: always; }
</style>
</head>
<body>
  <div class="header">
    <h1>${assignment.schoolName}</h1>
    <h2>Subject: ${assignment.subject}</h2>
    <h3>Class: ${assignment.className}</h3>
  </div>
  <div class="meta">
    <span>Time Allowed: ${assignment.timeAllowed} minutes</span>
    <span>Maximum Marks: ${assignment.totalMarks}</span>
  </div>
  <p class="instructions">All questions are compulsory unless stated otherwise.</p>
  <div class="student-fields">
    <div>Name: <span style="display:inline-block;width:180px;border-bottom:1px solid #000;">&nbsp;</span></div>
    <div>Roll Number: <span style="display:inline-block;width:140px;border-bottom:1px solid #000;">&nbsp;</span></div>
    <div>Class: ${assignment.className} Section: <span style="display:inline-block;width:100px;border-bottom:1px solid #000;">&nbsp;</span></div>
  </div>
  ${sectionsHTML}
  <p class="end">End of Question Paper</p>
</body>
</html>`;
};

export const generatePDF = async (req: Request, res: Response): Promise<void> => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      res.status(404).json({ success: false, message: 'Assignment not found' });
      return;
    }

    if (assignment.status !== 'completed') {
      res.status(400).json({ success: false, message: 'Assignment not yet generated' });
      return;
    }

    const filename = `${assignment.title.replace(/\s+/g, '_')}_paper.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    if (assignment.pdfBuffer) {
      console.log(`Serving cached PDF for assignment: ${assignment._id}`);
      res.send(assignment.pdfBuffer);
      return;
    }

    const html = buildPDFHTML({
      schoolName: assignment.schoolName,
      subject: assignment.subject,
      className: assignment.className,
      timeAllowed: assignment.timeAllowed,
      totalMarks: assignment.totalMarks,
      sections: assignment.sections,
    });

    const localChromium = '/usr/bin/chromium';
    const executablePath = fs.existsSync(localChromium) ? localChromium : undefined;

    const browser = await puppeteer.launch({
      ...(executablePath ? { executablePath } : {}),
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
      printBackground: true,
    });

    await browser.close();

    // Cache the PDF buffer
    assignment.pdfBuffer = Buffer.from(pdfBuffer);
    await assignment.save();

    res.send(assignment.pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate PDF' });
  }
};
