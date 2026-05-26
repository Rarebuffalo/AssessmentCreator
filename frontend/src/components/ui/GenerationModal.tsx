"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader2, Sparkles } from "lucide-react";

type Stage = "queued" | "generating" | "formatting" | "completed" | "failed";

interface GenerationModalProps {
  isOpen: boolean;
  statusMessage: string;
  stage: Stage;
  onClose: () => void;
  onViewResult: () => void;
}

const stageConfig: Record<Stage, { label: string; icon: React.ReactNode; color: string }> = {
  queued: {
    label: "Queued for generation",
    icon: <Loader2 size={22} className="animate-spin" style={{ color: "#6B7280" }} />,
    color: "#6B7280",
  },
  generating: {
    label: "AI is generating your question paper...",
    icon: <Sparkles size={22} style={{ color: "#E8541A" }} />,
    color: "#E8541A",
  },
  formatting: {
    label: "Formatting and structuring output...",
    icon: <Loader2 size={22} className="animate-spin" style={{ color: "#6366F1" }} />,
    color: "#6366F1",
  },
  completed: {
    label: "Question paper generated successfully!",
    icon: <CheckCircle size={22} style={{ color: "#10B981" }} />,
    color: "#10B981",
  },
  failed: {
    label: "Generation failed. Please try again.",
    icon: <XCircle size={22} style={{ color: "#EF4444" }} />,
    color: "#EF4444",
  },
};

const stageProgress: Record<Stage, number> = {
  queued: 5,
  generating: 40,
  formatting: 80,
  completed: 100,
  failed: 0,
};

export default function GenerationModal({
  isOpen,
  statusMessage,
  stage,
  onClose,
  onViewResult,
}: GenerationModalProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (stage === "generating" || stage === "formatting" || stage === "queued") {
      const interval = setInterval(() => {
        setDots((d) => (d.length >= 3 ? "" : d + "."));
      }, 500);
      return () => clearInterval(interval);
    }
    setDots("");
  }, [stage]);

  if (!isOpen) return null;

  const config = stageConfig[stage];
  const progress = stageProgress[stage];
  const isFinished = stage === "completed" || stage === "failed";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        backdropFilter: "blur(4px)",
      }}
      className="animate-fade-in"
    >
      <div
        className="animate-fade-in-up"
        style={{
          background: "#FFFFFF",
          borderRadius: 20,
          padding: "40px 48px",
          maxWidth: 460,
          width: "90%",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 70,
            height: 70,
            borderRadius: "50%",
            background: `${config.color}12`,
            border: `2px solid ${config.color}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          {config.icon}
        </div>

        <h2
          style={{
            fontWeight: 700,
            fontSize: 20,
            color: "#1A1A1A",
            marginBottom: 10,
          }}
        >
          {stage === "completed"
            ? "Paper Ready!"
            : stage === "failed"
            ? "Generation Failed"
            : `Generating${dots}`}
        </h2>

        <p
          style={{
            fontSize: 14,
            color: "#6B7280",
            marginBottom: 28,
            lineHeight: 1.6,
          }}
        >
          {statusMessage || config.label}
        </p>

        {/* Progress bar */}
        {!isFinished && (
          <div
            style={{
              width: "100%",
              height: 6,
              background: "#F3F4F6",
              borderRadius: 100,
              overflow: "hidden",
              marginBottom: 32,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: config.color,
                borderRadius: 100,
                transition: "width 0.6s ease",
              }}
            />
          </div>
        )}

        {/* Steps */}
        {!isFinished && (
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 24 }}>
            {(["queued", "generating", "formatting"] as Stage[]).map((s) => {
              const stageOrder = { queued: 0, generating: 1, formatting: 2, completed: 3, failed: -1 };
              const currentOrder = stageOrder[stage] ?? 0;
              const thisOrder = stageOrder[s] ?? 0;
              const isDone = thisOrder < currentOrder;
              const isCurrent = s === stage;
              return (
                <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: isDone
                        ? "#10B981"
                        : isCurrent
                        ? config.color
                        : "#E5E7EB",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 10,
                      color: isCurrent ? config.color : isDone ? "#10B981" : "#D1D5DB",
                      fontWeight: isCurrent ? 600 : 400,
                      textTransform: "capitalize",
                    }}
                  >
                    {s}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          {stage === "completed" && (
            <button
              onClick={onViewResult}
              style={{
                padding: "11px 28px",
                background: "#1A1A1A",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 100,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = "#2D2D2D")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = "#1A1A1A")
              }
            >
              View Question Paper
            </button>
          )}
          {stage === "failed" && (
            <button
              onClick={onClose}
              style={{
                padding: "11px 28px",
                background: "#EF4444",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 100,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Close & Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
