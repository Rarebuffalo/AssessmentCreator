"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MoreVertical, Trash2, Eye } from "lucide-react";
import { Assignment } from "@/types";

interface AssignmentCardProps {
  assignment: Assignment;
  onDelete: (id: string) => void;
}

const statusColors: Record<Assignment["status"], string> = {
  pending: "#F59E0B",
  generating: "#3B82F6",
  completed: "#10B981",
  failed: "#EF4444",
};

const statusLabels: Record<Assignment["status"], string> = {
  pending: "Pending",
  generating: "Generating...",
  completed: "Completed",
  failed: "Failed",
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateStr;
  }
}

export default function AssignmentCard({ assignment, onDelete }: AssignmentCardProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      className="animate-fade-in-up"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        padding: "20px 20px 16px",
        position: "relative",
        transition: "box-shadow 0.2s, transform 0.2s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <h3
          style={{
            fontWeight: 700,
            fontSize: 15,
            color: "#1A1A1A",
            lineHeight: 1.3,
            flex: 1,
            paddingRight: 8,
          }}
        >
          {assignment.title}
        </h3>

        {/* 3-dot menu */}
        <div ref={menuRef} style={{ position: "relative" }}>
          <button
            onClick={() => setOpen((o) => !o)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px 4px",
              borderRadius: 6,
              color: "#9CA3AF",
              display: "flex",
              alignItems: "center",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#F3F4F6";
              (e.currentTarget as HTMLButtonElement).style.color = "#374151";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "none";
              (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF";
            }}
          >
            <MoreVertical size={18} />
          </button>

          {open && (
            <div
              className="animate-slide-down"
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 4px)",
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: 10,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                minWidth: 160,
                zIndex: 50,
                overflow: "hidden",
              }}
            >
              {assignment.status === "completed" && (
                <Link href={`/assignments/${assignment._id}`} style={{ textDecoration: "none" }}>
                  <button
                    onClick={() => setOpen(false)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 14px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 13.5,
                      color: "#1A1A1A",
                      fontWeight: 500,
                      textAlign: "left",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLButtonElement).style.background = "#F9FAFB")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLButtonElement).style.background = "none")
                    }
                  >
                    <Eye size={15} />
                    View Assignment
                  </button>
                </Link>
              )}
              <button
                onClick={() => {
                  setOpen(false);
                  onDelete(assignment._id);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13.5,
                  color: "#EF4444",
                  fontWeight: 500,
                  textAlign: "left",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background = "#FEF2F2")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background = "none")
                }
              >
                <Trash2 size={15} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Subject + class tags */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        <span
          style={{
            fontSize: 11.5,
            padding: "2px 8px",
            borderRadius: 20,
            background: "#FFF7ED",
            color: "#E8541A",
            fontWeight: 500,
            border: "1px solid #FED7AA",
          }}
        >
          {assignment.subject}
        </span>
        {assignment.className && (
          <span
            style={{
              fontSize: 11.5,
              padding: "2px 8px",
              borderRadius: 20,
              background: "#F3F4F6",
              color: "#6B7280",
              fontWeight: 500,
            }}
          >
            Class {assignment.className}
          </span>
        )}
        {/* Status badge */}
        <span
          style={{
            fontSize: 11.5,
            padding: "2px 8px",
            borderRadius: 20,
            background: `${statusColors[assignment.status]}18`,
            color: statusColors[assignment.status],
            fontWeight: 600,
            marginLeft: "auto",
          }}
        >
          {statusLabels[assignment.status]}
        </span>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid #F3F4F6",
          paddingTop: 12,
        }}
      >
        <span style={{ fontSize: 12, color: "#9CA3AF" }}>
          <span style={{ color: "#6B7280", fontWeight: 500 }}>Assigned on : </span>
          {formatDate(assignment.createdAt)}
        </span>
        <span style={{ fontSize: 12, color: "#9CA3AF" }}>
          <span style={{ color: "#6B7280", fontWeight: 500 }}>Due : </span>
          {formatDate(assignment.dueDate)}
        </span>
      </div>
    </div>
  );
}
