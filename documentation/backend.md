# Backend Implementation Details

The backend service runs on Node.js using TypeScript. It coordinates database persistence, task queueing, AI client operations, and print rendering.

## Database Schema (MongoDB / Mongoose)

The data model is centered around the `Assignment` collection. It contains both metadata (configuration inputs) and the final structured assessment content (sections, questions, answers).

### File Reference: `src/models/Assignment.ts`

```typescript
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
  sections: ISection[];
  totalQuestions: number;
  totalMarks: number;
  createdAt: Date;
  updatedAt: Date;
}
```

## API Router & Endpoints

All endpoints are registered under `/api/assignments` in `src/routes/assignmentRoutes.ts`.

### 1. `POST /api/assignments`
- **Purpose:** Initiates assignment generation.
- **Payload:** Accepts `multipart/form-data` to accommodate optional file attachments.
- **Handler:** `createAssignment` in `src/controllers/assignmentController.ts`.
- **Flow:**
  1. Computes total questions and sum marks.
  2. Stores initial record with status `pending`.
  3. Queues job to BullMQ `generation` queue using the generated `assignmentId` as job identifier.

### 2. `GET /api/assignments`
- **Purpose:** Fetches all assessments for dashboard presentation.
- **Optimization:** Excludes the large `sections` key using `.select('-sections')` projections to keep payload small.

### 3. `GET /api/assignments/:id`
- **Purpose:** Retrieves a single assessment detailing all generated questions and answer keys.

### 4. `DELETE /api/assignments/:id`
- **Purpose:** Deletes assignment record from database.

### 5. `GET /api/assignments/:id/pdf`
- **Purpose:** Compiles assignment questions into standard A4 PDF document.

---

## AI Generation Layer (`src/services/aiService.ts`)

The project uses the `@google/generative-ai` package to access the `gemini-2.5-flash` model. 

### JSON Mode Enforcement
To guarantee parseable outputs, the model config includes `responseMimeType: 'application/json'`. This instructs Gemini to output structured JSON matching the requested model format.

### Prompt Generation Construction
The system constructs a dry prompt outlining variables:
- Target Subject & Grade
- Overall Difficulty Profile
- List of custom sections to generate (Section A, Section B...) mapping custom count + marks configurations
- Optional context injection if reference document is provided.
- JSON structure constraints.

```typescript
const prompt = `You are an expert teacher creating a structured exam paper.
Generate a complete question paper in valid JSON format only...
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
}`;
```

### Parsing Validation & Normalization
If the raw response text contains stray characters, the system matches it with a regex fallback (`/\{[\s\S]*\}/`) to pull out the pure JSON block. 
Before returning, difficulty properties are checked and normalized to fall back to `Moderate` if they fail configuration schema specs.

---

## Print Layout & Rendering (`src/controllers/pdfController.ts`)

Instead of utilizing native PDF Canvas builders which are difficult to layout and style, PDF generation uses headless Chromium via Puppeteer.

### Flow
1. An HTML string representing the paper layout is compiled inline using standard styles.
2. Headless browser is launched:
   ```typescript
   const browser = await puppeteer.launch({
     executablePath: '/usr/bin/chromium',
     args: ['--no-sandbox', '--disable-setuid-sandbox'],
     headless: true,
   });
   ```
3. A new tab is instantiated, and content is injected using `page.setContent(html, { waitUntil: 'networkidle0' })`.
4. Page break margins and format specs are mapped:
   ```typescript
   const pdfBuffer = await page.pdf({
     format: 'A4',
     margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
     printBackground: true,
   });
   ```
5. Returns raw binary data to the client with `Content-Type: application/pdf` and `Content-Disposition: attachment`.

### Print CSS & Formatting Constraints
- Uses standard Serif fonts (`Times New Roman`) to match official exam layouts.
- Margins and student information blocks (Name, Roll Number, Section) are placed at the top page.
- Section breaks inject page-breaks using CSS configurations:
  ```css
  .page-break { page-break-after: always; }
  ```
- Answer keys are dynamically gathered and appended at the bottom of the page structure.
