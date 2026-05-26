"use client";

import { useEffect, useState, use } from "react";
import { Download, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useAssignmentStore } from "@/store/assignmentStore";
import { fetchAssignmentById, getPdfUrl, regenerateAssignment } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";
import { Assignment } from "@/types";
import GenerationModal from "@/components/ui/GenerationModal";

type Stage = "queued" | "generating" | "formatting" | "completed" | "failed";

const difficultyColors: Record<string, string> = {
  Easy: "#10B981",
  Moderate: "#F59E0B",
  Challenging: "#EF4444",
};

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch { return s; }
}

export default function AssignmentViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { currentAssignment, setCurrentAssignment } = useAssignmentStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollingActive, setPollingActive] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("queued");
  const [statusMessage, setStatusMessage] = useState("");

  const loadAssignment = async () => {
    try {
      const data = await fetchAssignmentById(id);
      setCurrentAssignment(data.assignment);
      if (data.assignment.status === "pending" || data.assignment.status === "generating") {
        setPollingActive(true);
      } else {
        setPollingActive(false);
        if (data.assignment.status === "completed") {
          setStage("completed");
          setStatusMessage("Question paper generated successfully");
        } else if (data.assignment.status === "failed") {
          setStage("failed");
          setStatusMessage(data.assignment.errorMessage || "Generation failed");
        }
      }
    } catch (err) {
      setError("Failed to load assignment");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useSocket({
    assignmentId: id,
    onProgress: (data) => {
      setStatusMessage(data.message);
      if (data.status === "generating") setStage("generating");
      else if (data.status === "formatting") setStage("formatting");
    },
    onCompleted: async (data) => {
      setStage("completed");
      setStatusMessage(data.message);
      setPollingActive(false);
      await loadAssignment();
    },
    onFailed: async (data) => {
      setStage("failed");
      setStatusMessage(data.message);
      setPollingActive(false);
      await loadAssignment();
    },
  });

  // Poll as fallback if WebSocket missed
  useEffect(() => {
    loadAssignment();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!pollingActive) return;
    const interval = setInterval(loadAssignment, 4000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollingActive]);

  const assignment = currentAssignment?._id === id ? currentAssignment : null;

  useEffect(() => {
    if (assignment && (assignment.status === "pending" || assignment.status === "generating") && !modalOpen) {
      setModalOpen(true);
      setStage(assignment.status === "generating" ? "generating" : "queued");
      setStatusMessage(assignment.status === "generating" ? "AI is generating your question paper..." : "Your assignment is queued for generation.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment?.status]);

  const handleDownloadPDF = () => {
    window.open(getPdfUrl(id), "_blank");
  };

  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    if (!confirm("Are you sure you want to regenerate this question paper? This will overwrite the current questions.")) {
      return;
    }
    setIsRegenerating(true);
    setStage("queued");
    setStatusMessage("Your assignment is queued for regeneration.");
    setModalOpen(true);
    try {
      const res = await regenerateAssignment(id);
      if (res.success) {
        if (assignment) {
          setCurrentAssignment({
            ...assignment,
            status: "pending",
            sections: [],
          });
        }
        setPollingActive(true);
      } else {
        setModalOpen(false);
        alert("Failed to queue regeneration: " + res.message);
      }
    } catch (err) {
      console.error(err);
      setModalOpen(false);
      alert("Failed to connect to backend for regeneration");
    } finally {
      setIsRegenerating(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
          <div style={{ textAlign: "center" }}>
            <Loader2 size={36} color="#E8541A" className="animate-spin" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "#6B7280", fontSize: 14 }}>Loading assignment...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !assignment) {
    return (
      <AppLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
          <div style={{ textAlign: "center" }}>
            <AlertCircle size={40} color="#EF4444" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "#1A1A1A", fontWeight: 600, marginBottom: 8 }}>Assignment not found</p>
            <p style={{ color: "#6B7280", fontSize: 14 }}>{error}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Still generating
  if (assignment.status === "pending" || assignment.status === "generating") {
    return (
      <AppLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #FFF7ED, #FEE2D5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              border: "2px solid #FED7AA",
            }}>
              <Loader2 size={32} color="#E8541A" className="animate-spin" />
            </div>
            <h2 style={{ fontWeight: 700, fontSize: 20, color: "#1A1A1A", marginBottom: 10 }}>
              {assignment.status === "generating" ? "Generating Question Paper..." : "Queued for Generation"}
            </h2>
            <p style={{ color: "#6B7280", fontSize: 14, maxWidth: 300 }}>
              The AI is working on your question paper. This usually takes 15–30 seconds.
            </p>
            <div style={{
              width: 200,
              height: 4,
              background: "#E5E7EB",
              borderRadius: 100,
              margin: "20px auto 0",
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                width: "60%",
                background: "#E8541A",
                borderRadius: 100,
                animation: "shimmer 1.5s infinite",
              }} />
            </div>
          </div>
        </div>
        <GenerationModal
          isOpen={modalOpen}
          statusMessage={statusMessage}
          stage={stage}
          onClose={() => setModalOpen(false)}
          onViewResult={() => setModalOpen(false)}
        />
      </AppLayout>
    );
  }

  // Failed
  if (assignment.status === "failed") {
    return (
      <AppLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
          <div style={{ textAlign: "center" }}>
            <AlertCircle size={40} color="#EF4444" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "#1A1A1A", fontWeight: 600, marginBottom: 8 }}>Generation Failed</p>
            <p style={{ color: "#6B7280", fontSize: 14 }}>{assignment.errorMessage || "An error occurred during generation"}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Dark top banner (Figma) */}
      <div
        style={{
          background: "#1A1A1A",
          borderRadius: 12,
          padding: "20px 28px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
        }}
        className="animate-fade-in"
      >
        <p style={{ color: "#E5E7EB", fontSize: 14, lineHeight: 1.6, flex: 1 }}>
          <span style={{ color: "#E8541A", fontWeight: 600 }}>Done. </span>
          Here are customized Question Papers for your {assignment.subject} {assignment.className} classes.
          Download as PDF to print and distribute to your students.
        </p>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              background: "transparent",
              border: "1.5px solid #4B5563",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13.5,
              color: "#E5E7EB",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#2D2D2D";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            }}
          >
            <RefreshCw size={15} className={isRegenerating ? "animate-spin" : ""} style={{ color: "#E8541A" }} />
            Regenerate
          </button>
          <button
            onClick={handleDownloadPDF}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              background: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13.5,
              color: "#1A1A1A",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#F3F4F6";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#FFFFFF";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            }}
          >
            <Download size={16} />
            Download as PDF
          </button>
        </div>
      </div>

      {/* Question Paper Card */}
      <div
        className="animate-fade-in-up"
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: 16,
          padding: "40px 48px",
          maxWidth: 800,
          margin: "0 auto",
          fontFamily: "'Times New Roman', Times, serif",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1 style={{ fontWeight: 700, fontSize: 20, color: "#1A1A1A", marginBottom: 4 }}>
            {assignment.schoolName}
          </h1>
          <p style={{ fontSize: 14, color: "#374151", marginBottom: 2 }}>
            Subject: {assignment.subject}
          </p>
          <p style={{ fontSize: 14, color: "#374151" }}>
            Class: {assignment.className}
          </p>
        </div>

        {/* Meta row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "2px solid #1A1A1A",
            borderBottom: "1px solid #D1D5DB",
            padding: "10px 0",
            marginBottom: 20,
            fontSize: 13.5,
          }}
        >
          <span>Time Allowed: {assignment.timeAllowed} minutes</span>
          <span>Maximum Marks: {assignment.totalMarks}</span>
        </div>

        {/* Instructions */}
        <p style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 16 }}>
          All questions are compulsory unless stated otherwise.
        </p>

        {/* Student fields */}
        <div style={{ marginBottom: 28, lineHeight: 2.2, fontSize: 13.5 }}>
          <div>Name: <span style={{ display: "inline-block", width: 200, borderBottom: "1px solid #1A1A1A" }}>&nbsp;</span></div>
          <div>Roll Number: <span style={{ display: "inline-block", width: 160, borderBottom: "1px solid #1A1A1A" }}>&nbsp;</span></div>
          <div>Class: {assignment.className} &nbsp; Section: <span style={{ display: "inline-block", width: 100, borderBottom: "1px solid #1A1A1A" }}>&nbsp;</span></div>
        </div>

        {/* Sections */}
        {assignment.sections.map((section, sIdx) => (
          <div key={sIdx} style={{ marginBottom: 32 }}>
            {/* Section title */}
            <h2 style={{ fontWeight: 700, fontSize: 16, textAlign: "center", marginBottom: 6 }}>
              {section.title}
            </h2>
            <p style={{ fontStyle: "italic", fontSize: 13, color: "#6B7280", marginBottom: 12, textAlign: "center" }}>
              {section.instruction}
            </p>

            {/* Questions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {section.questions.map((q, qIdx) => (
                <div
                  key={qIdx}
                  style={{
                    display: "flex",
                    gap: 8,
                    fontSize: 13.5,
                    lineHeight: 1.65,
                    padding: "4px 0",
                  }}
                >
                  <span style={{ fontWeight: 600, flexShrink: 0, minWidth: 22 }}>
                    {qIdx + 1}.
                  </span>
                  <div style={{ flex: 1 }}>
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: 11,
                        padding: "1px 7px",
                        borderRadius: 4,
                        background: `${difficultyColors[q.difficulty] || "#6B7280"}15`,
                        color: difficultyColors[q.difficulty] || "#6B7280",
                        fontWeight: 600,
                        marginRight: 6,
                        fontFamily: "inherit",
                      }}
                    >
                      [{q.difficulty}]
                    </span>
                    {q.question}
                    <span style={{ fontWeight: 700, marginLeft: 8, color: "#374151", fontSize: 13 }}>
                      [{q.marks} Mark{q.marks > 1 ? "s" : ""}]
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Answer Key */}
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px dashed #E5E7EB" }}>
              <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Answer Key:</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {section.questions.map((q, qIdx) => (
                  <div key={qIdx} style={{ fontSize: 13, lineHeight: 1.6, display: "flex", gap: 8 }}>
                    <span style={{ fontWeight: 700, flexShrink: 0 }}>{qIdx + 1}.</span>
                    <span style={{ color: "#374151" }}>{q.answer || "See solution manual"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* End */}
        <p style={{ textAlign: "center", fontWeight: 700, fontSize: 14, marginTop: 32, borderTop: "1px solid #E5E7EB", paddingTop: 20 }}>
          End of Question Paper
        </p>

        {/* Summary */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: 32,
          marginTop: 20,
          fontFamily: "'Inter', sans-serif",
        }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: "#E8541A" }}>{assignment.totalQuestions}</p>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Total Questions</p>
          </div>
          <div style={{ width: 1, background: "#E5E7EB" }} />
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: "#1A1A1A" }}>{assignment.totalMarks}</p>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Total Marks</p>
          </div>
          <div style={{ width: 1, background: "#E5E7EB" }} />
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: "#374151" }}>{assignment.sections.length}</p>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Sections</p>
          </div>
        </div>
      </div>
      <GenerationModal
        isOpen={modalOpen}
        statusMessage={statusMessage}
        stage={stage}
        onClose={() => setModalOpen(false)}
        onViewResult={() => setModalOpen(false)}
      />
    </AppLayout>
  );
}
