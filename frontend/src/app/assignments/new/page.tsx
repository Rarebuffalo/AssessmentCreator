"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  X,
  Plus,
  Minus,
  ChevronDown,
  Mic,
  Calendar,
  ArrowLeft,
  ArrowRight,
  FileText,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import GenerationModal from "@/components/ui/GenerationModal";
import { useSocket } from "@/hooks/useSocket";
import { createAssignment } from "@/lib/api";
import { QuestionTypeConfig, Difficulty } from "@/types";

const QUESTION_TYPES = [
  "Multiple Choice Questions",
  "Short Questions",
  "Long Answer Questions",
  "Diagram/Graph-Based Questions",
  "Numerical Problems",
  "Fill in the Blanks",
  "True/False Questions",
  "Case-Based Questions",
];

const DIFFICULTY_OPTIONS: Difficulty[] = ["Easy", "Moderate", "Challenging", "Mixed"];

const SUBJECTS = [
  "Mathematics",
  "Science",
  "English",
  "Social Studies",
  "Hindi",
  "Physics",
  "Chemistry",
  "Biology",
  "History",
  "Geography",
  "Computer Science",
  "Economics",
];

interface FormData {
  title: string;
  subject: string;
  className: string;
  schoolName: string;
  timeAllowed: number;
  dueDate: string;
  difficulty: Difficulty;
  additionalInstructions: string;
  questionTypes: QuestionTypeConfig[];
}

type Stage = "queued" | "generating" | "formatting" | "completed" | "failed";

export default function CreateAssignmentPage() {
  const router = useRouter();

  // Step 1: Assignment Details, Step 2: Questions & File
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    title: "",
    subject: "",
    className: "",
    schoolName: "Delhi Public School",
    timeAllowed: 60,
    dueDate: "",
    difficulty: "Mixed",
    additionalInstructions: "",
    questionTypes: [
      { type: "Multiple Choice Questions", count: 4, marks: 1 },
    ],
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generation modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [generatedId, setGeneratedId] = useState("");
  const [stage, setStage] = useState<Stage>("queued");
  const [statusMessage, setStatusMessage] = useState("Your assignment is queued for generation.");

  useSocket({
    assignmentId: generatedId,
    onProgress: (data) => {
      setStatusMessage(data.message);
      if (data.status === "generating") setStage("generating");
      else if (data.status === "formatting") setStage("formatting");
    },
    onCompleted: (data) => {
      setStage("completed");
      setStatusMessage(data.message);
    },
    onFailed: (data) => {
      setStage("failed");
      setStatusMessage(data.message);
    },
  });

  // ---- Validation ----
  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!form.subject.trim()) e.subject = "Subject is required";
    if (!form.className.trim()) e.className = "Class is required";
    if (!form.schoolName.trim()) e.schoolName = "School name is required";
    if (form.timeAllowed < 10) e.timeAllowed = "Minimum 10 minutes";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!form.dueDate) e.dueDate = "Due date is required";
    if (form.questionTypes.length === 0)
      e.questionTypes = "Add at least one question type";
    for (const qt of form.questionTypes) {
      if (qt.count < 1) {
        e.questionTypes = "All question counts must be at least 1";
        break;
      }
      if (qt.marks < 1) {
        e.questionTypes = "All marks must be at least 1";
        break;
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ---- File upload ----
  const handleFileDrop = useCallback((file: File) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf", "text/plain"];
    if (!allowed.includes(file.type)) {
      alert("Invalid file type. Allowed: JPEG, PNG, PDF, TXT");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("File must be under 10MB");
      return;
    }
    setUploadedFile(file);
  }, []);

  // ---- Question type helpers ----
  const addQuestionType = () => {
    setForm((f) => ({
      ...f,
      questionTypes: [
        ...f.questionTypes,
        { type: "Short Questions", count: 3, marks: 2 },
      ],
    }));
  };

  const removeQuestionType = (idx: number) => {
    setForm((f) => ({
      ...f,
      questionTypes: f.questionTypes.filter((_, i) => i !== idx),
    }));
  };

  const updateQuestionType = (
    idx: number,
    field: keyof QuestionTypeConfig,
    value: string | number
  ) => {
    setForm((f) => ({
      ...f,
      questionTypes: f.questionTypes.map((qt, i) =>
        i === idx ? { ...qt, [field]: value } : qt
      ),
    }));
  };

  const increment = (idx: number, field: "count" | "marks") => {
    updateQuestionType(idx, field, (form.questionTypes[idx][field] as number) + 1);
  };

  const decrement = (idx: number, field: "count" | "marks") => {
    const current = form.questionTypes[idx][field] as number;
    if (current > 1) updateQuestionType(idx, field, current - 1);
  };

  const totalQuestions = form.questionTypes.reduce((s, qt) => s + qt.count, 0);
  const totalMarks = form.questionTypes.reduce((s, qt) => s + qt.count * qt.marks, 0);

  // ---- Submit ----
  const handleSubmit = async () => {
    if (!validateStep2()) return;
    setIsSubmitting(true);
    setModalOpen(true);
    setStage("queued");
    setStatusMessage("Your assignment is queued for generation.");

    try {
      const payload = {
        title: form.title || `${form.subject} Assessment`,
        subject: form.subject,
        className: form.className,
        schoolName: form.schoolName,
        timeAllowed: form.timeAllowed,
        dueDate: form.dueDate,
        questionTypes: form.questionTypes,
        difficulty: form.difficulty,
        additionalInstructions: form.additionalInstructions,
      };

      const result = await createAssignment(payload, uploadedFile || undefined);
      setGeneratedId(result.assignmentId);
    } catch (err) {
      console.error("Submit error:", err);
      setStage("failed");
      setStatusMessage("Failed to create assignment. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = (hasError?: boolean) => ({
    width: "100%",
    padding: "10px 14px",
    border: `1px solid ${hasError ? "#EF4444" : "#E5E7EB"}`,
    borderRadius: 8,
    fontSize: 14,
    color: "#1A1A1A",
    background: "#FFFFFF",
    outline: "none",
    transition: "border-color 0.15s",
    fontFamily: "inherit",
  });

  const labelStyle = {
    display: "block",
    fontWeight: 600,
    fontSize: 13.5,
    color: "#374151",
    marginBottom: 6,
  };

  return (
    <AppLayout>
      {/* Page heading */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
          <h1 style={{ fontWeight: 700, fontSize: 22, color: "#1A1A1A" }}>Create Assignment</h1>
        </div>
        <p style={{ fontSize: 13.5, color: "#9CA3AF", marginLeft: 20 }}>
          Set up a new assignment for your students
        </p>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: "100%",
          height: 5,
          background: "#E5E7EB",
          borderRadius: 100,
          marginBottom: 28,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: step === 1 ? "50%" : "100%",
            background: "#1A1A1A",
            borderRadius: 100,
            transition: "width 0.4s ease",
          }}
        />
      </div>

      {/* White card */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: 16,
          padding: "32px 36px",
          maxWidth: 720,
          marginBottom: 32,
        }}
      >
        {step === 1 ? (
          <>
            <h2 style={{ fontWeight: 700, fontSize: 18, color: "#1A1A1A", marginBottom: 4 }}>
              Assignment Details
            </h2>
            <p style={{ fontSize: 13.5, color: "#9CA3AF", marginBottom: 28 }}>
              Basic information about your assignment
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Title */}
              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>Assignment Title <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. Mid-Term Science Assessment"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  style={inputStyle()}
                  onFocus={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = "#E8541A")}
                  onBlur={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = "#E5E7EB")}
                />
              </div>

              {/* Subject */}
              <div>
                <label style={labelStyle}>Subject *</label>
                <div style={{ position: "relative" }}>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    style={{ ...inputStyle(!!errors.subject), appearance: "none", paddingRight: 36, cursor: "pointer" }}
                    onFocus={(e) => ((e.currentTarget as HTMLSelectElement).style.borderColor = "#E8541A")}
                    onBlur={(e) => ((e.currentTarget as HTMLSelectElement).style.borderColor = errors.subject ? "#EF4444" : "#E5E7EB")}
                  >
                    <option value="">Select subject...</option>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} color="#9CA3AF" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                </div>
                {errors.subject && <p style={{ color: "#EF4444", fontSize: 12, marginTop: 4 }}>{errors.subject}</p>}
              </div>

              {/* Class */}
              <div>
                <label style={labelStyle}>Class / Grade *</label>
                <input
                  type="text"
                  placeholder="e.g. 8th, Grade 10, Class XII"
                  value={form.className}
                  onChange={(e) => setForm((f) => ({ ...f, className: e.target.value }))}
                  style={inputStyle(!!errors.className)}
                  onFocus={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = "#E8541A")}
                  onBlur={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = errors.className ? "#EF4444" : "#E5E7EB")}
                />
                {errors.className && <p style={{ color: "#EF4444", fontSize: 12, marginTop: 4 }}>{errors.className}</p>}
              </div>

              {/* School */}
              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>School Name *</label>
                <input
                  type="text"
                  value={form.schoolName}
                  onChange={(e) => setForm((f) => ({ ...f, schoolName: e.target.value }))}
                  style={inputStyle(!!errors.schoolName)}
                  onFocus={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = "#E8541A")}
                  onBlur={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = errors.schoolName ? "#EF4444" : "#E5E7EB")}
                />
                {errors.schoolName && <p style={{ color: "#EF4444", fontSize: 12, marginTop: 4 }}>{errors.schoolName}</p>}
              </div>

              {/* Time Allowed */}
              <div>
                <label style={labelStyle}>Time Allowed (minutes)</label>
                <input
                  type="number"
                  min={10}
                  max={240}
                  value={form.timeAllowed}
                  onChange={(e) => setForm((f) => ({ ...f, timeAllowed: parseInt(e.target.value) || 60 }))}
                  style={inputStyle(!!errors.timeAllowed)}
                  onFocus={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = "#E8541A")}
                  onBlur={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = errors.timeAllowed ? "#EF4444" : "#E5E7EB")}
                />
                {errors.timeAllowed && <p style={{ color: "#EF4444", fontSize: 12, marginTop: 4 }}>{errors.timeAllowed}</p>}
              </div>

              {/* Difficulty */}
              <div>
                <label style={labelStyle}>Overall Difficulty</label>
                <div style={{ position: "relative" }}>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value as Difficulty }))}
                    style={{ ...inputStyle(), appearance: "none", paddingRight: 36, cursor: "pointer" }}
                    onFocus={(e) => ((e.currentTarget as HTMLSelectElement).style.borderColor = "#E8541A")}
                    onBlur={(e) => ((e.currentTarget as HTMLSelectElement).style.borderColor = "#E5E7EB")}
                  >
                    {DIFFICULTY_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} color="#9CA3AF" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 style={{ fontWeight: 700, fontSize: 18, color: "#1A1A1A", marginBottom: 4 }}>
              Assignment Details
            </h2>
            <p style={{ fontSize: 13.5, color: "#9CA3AF", marginBottom: 24 }}>
              Add questions and upload reference material
            </p>

            {/* File upload zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFileDrop(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? "#E8541A" : "#D1D5DB"}`,
                borderRadius: 12,
                padding: "32px 20px",
                textAlign: "center",
                cursor: "pointer",
                background: dragOver ? "#FFF7ED" : "#FAFAFA",
                transition: "all 0.2s",
                marginBottom: 8,
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.txt"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileDrop(file);
                }}
              />

              {uploadedFile ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <FileText size={22} color="#E8541A" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>
                    {uploadedFile.name}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setUploadedFile(null); }}
                    style={{
                      background: "#F3F4F6",
                      border: "none",
                      borderRadius: "50%",
                      width: 24,
                      height: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <X size={14} color="#6B7280" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload size={28} color="#9CA3AF" style={{ marginBottom: 10 }} />
                  <p style={{ fontWeight: 600, fontSize: 14, color: "#374151", marginBottom: 4 }}>
                    Choose a file or drag &amp; drop it here
                  </p>
                  <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 14 }}>JPEG, PNG, PDF, TXT · up to 10MB</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    style={{
                      padding: "7px 20px",
                      background: "#FFFFFF",
                      border: "1px solid #D1D5DB",
                      borderRadius: 8,
                      fontSize: 13.5,
                      fontWeight: 500,
                      color: "#374151",
                      cursor: "pointer",
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = "#E8541A")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = "#D1D5DB")}
                  >
                    Browse Files
                  </button>
                </>
              )}
            </div>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 24, textAlign: "center" }}>
              Upload images of your preferred document/image
            </p>

            {/* Due Date */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Due Date *</label>
              <div style={{ position: "relative" }}>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  style={{ ...inputStyle(!!errors.dueDate), paddingRight: 40, colorScheme: "light" }}
                  min={new Date().toISOString().split("T")[0]}
                  onFocus={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = "#E8541A")}
                  onBlur={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = errors.dueDate ? "#EF4444" : "#E5E7EB")}
                />
                <Calendar size={16} color="#9CA3AF" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              </div>
              {errors.dueDate && <p style={{ color: "#EF4444", fontSize: 12, marginTop: 4 }}>{errors.dueDate}</p>}
            </div>

            {/* Question Types Table */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 120px 100px", gap: 10, marginBottom: 10, padding: "0 4px" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Question Type</span>
                <span />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", textAlign: "center" }}>No. of Questions</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", textAlign: "center" }}>Marks</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {form.questionTypes.map((qt, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto 120px 100px",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    {/* Dropdown */}
                    <div style={{ position: "relative" }}>
                      <select
                        value={qt.type}
                        onChange={(e) => updateQuestionType(idx, "type", e.target.value)}
                        style={{ ...inputStyle(), appearance: "none", paddingRight: 32, cursor: "pointer", fontSize: 13 }}
                      >
                        {QUESTION_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} color="#9CA3AF" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeQuestionType(idx)}
                      disabled={form.questionTypes.length === 1}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: form.questionTypes.length === 1 ? "not-allowed" : "pointer",
                        color: form.questionTypes.length === 1 ? "#D1D5DB" : "#9CA3AF",
                        display: "flex",
                        alignItems: "center",
                        padding: 4,
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        if (form.questionTypes.length > 1)
                          (e.currentTarget as HTMLButtonElement).style.color = "#EF4444";
                      }}
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.color = form.questionTypes.length === 1 ? "#D1D5DB" : "#9CA3AF")
                      }
                    >
                      <X size={16} />
                    </button>

                    {/* Count stepper */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                      <button onClick={() => decrement(idx, "count")} style={stepperBtn}>
                        <Minus size={14} />
                      </button>
                      <span style={{ fontWeight: 700, fontSize: 15, minWidth: 24, textAlign: "center" }}>
                        {qt.count}
                      </span>
                      <button onClick={() => increment(idx, "count")} style={stepperBtn}>
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Marks stepper */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                      <button onClick={() => decrement(idx, "marks")} style={stepperBtn}>
                        <Minus size={14} />
                      </button>
                      <span style={{ fontWeight: 700, fontSize: 15, minWidth: 24, textAlign: "center" }}>
                        {qt.marks}
                      </span>
                      <button onClick={() => increment(idx, "marks")} style={stepperBtn}>
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {errors.questionTypes && (
                <p style={{ color: "#EF4444", fontSize: 12, marginTop: 8 }}>{errors.questionTypes}</p>
              )}
            </div>

            {/* Add Question Type */}
            <button
              onClick={addQuestionType}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#1A1A1A",
                border: "none",
                borderRadius: 100,
                color: "#FFFFFF",
                fontWeight: 600,
                fontSize: 13.5,
                padding: "8px 16px 8px 10px",
                cursor: "pointer",
                marginTop: 12,
                marginBottom: 16,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#2D2D2D")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#1A1A1A")}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Plus size={14} />
              </div>
              Add Question Type
            </button>

            {/* Totals */}
            <div style={{ textAlign: "right", marginBottom: 24 }}>
              <p style={{ fontSize: 13.5, color: "#374151", marginBottom: 3 }}>
                <span style={{ fontWeight: 600 }}>Total Questions : </span>{totalQuestions}
              </p>
              <p style={{ fontSize: 13.5, color: "#374151" }}>
                <span style={{ fontWeight: 600 }}>Total Marks : </span>{totalMarks}
              </p>
            </div>

            {/* Additional Instructions */}
            <div>
              <label style={labelStyle}>Additional Information <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(For better output)</span></label>
              <div style={{ position: "relative" }}>
                <textarea
                  placeholder="e.g Generate a question paper for 3 hour exam duration..."
                  value={form.additionalInstructions}
                  onChange={(e) => setForm((f) => ({ ...f, additionalInstructions: e.target.value }))}
                  rows={4}
                  style={{
                    ...inputStyle(),
                    resize: "vertical",
                    paddingRight: 44,
                    minHeight: 100,
                  }}
                  onFocus={(e) => ((e.currentTarget as HTMLTextAreaElement).style.borderColor = "#E8541A")}
                  onBlur={(e) => ((e.currentTarget as HTMLTextAreaElement).style.borderColor = "#E5E7EB")}
                />
                <Mic size={18} color="#9CA3AF" style={{ position: "absolute", right: 12, bottom: 12 }} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Navigation buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", maxWidth: 720 }}>
        <button
          onClick={() => (step === 1 ? router.push("/assignments") : setStep(1))}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 24px",
            background: "#FFFFFF",
            border: "1.5px solid #E5E7EB",
            borderRadius: 100,
            fontSize: 14,
            fontWeight: 600,
            color: "#374151",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = "#D1D5DB")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = "#E5E7EB")}
        >
          <ArrowLeft size={16} />
          Previous
        </button>

        {step === 1 ? (
          <button
            onClick={() => { if (validateStep1()) setStep(2); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "11px 28px",
              background: "#1A1A1A",
              border: "none",
              borderRadius: 100,
              fontSize: 14,
              fontWeight: 600,
              color: "#FFFFFF",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#2D2D2D")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#1A1A1A")}
          >
            Next
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "11px 28px",
              background: isSubmitting ? "#9CA3AF" : "#1A1A1A",
              border: "none",
              borderRadius: 100,
              fontSize: 14,
              fontWeight: 600,
              color: "#FFFFFF",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting)
                (e.currentTarget as HTMLButtonElement).style.background = "#2D2D2D";
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting)
                (e.currentTarget as HTMLButtonElement).style.background = "#1A1A1A";
            }}
          >
            {isSubmitting ? "Creating..." : "Generate Paper"}
            <ArrowRight size={16} />
          </button>
        )}
      </div>

      {/* Generation Modal */}
      <GenerationModal
        isOpen={modalOpen}
        statusMessage={statusMessage}
        stage={stage}
        onClose={() => {
          setModalOpen(false);
          router.push("/assignments");
        }}
        onViewResult={() => {
          setModalOpen(false);
          router.push(`/assignments/${generatedId}`);
        }}
      />
    </AppLayout>
  );
}

const stepperBtn: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: "50%",
  border: "1.5px solid #E5E7EB",
  background: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "#374151",
  flexShrink: 0,
  transition: "border-color 0.15s, background 0.15s",
};
