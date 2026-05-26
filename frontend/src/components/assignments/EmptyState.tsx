"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

export default function EmptyState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        textAlign: "center",
      }}
      className="animate-fade-in-up"
    >
      {/* Illustration */}
      <div style={{ marginBottom: 32, position: "relative" }}>
        <svg
          width="180"
          height="160"
          viewBox="0 0 180 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background circle */}
          <ellipse cx="90" cy="130" rx="70" ry="20" fill="#E5E7EB" opacity="0.4" />
          {/* Document */}
          <rect x="50" y="20" width="80" height="100" rx="8" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="2" />
          <rect x="60" y="36" width="40" height="4" rx="2" fill="#E5E7EB" />
          <rect x="60" y="46" width="52" height="4" rx="2" fill="#E5E7EB" />
          <rect x="60" y="56" width="36" height="4" rx="2" fill="#E5E7EB" />
          {/* Magnifier */}
          <circle cx="105" cy="95" r="28" fill="#EDE9FE" stroke="#C4B5FD" strokeWidth="2.5" />
          <circle cx="105" cy="95" r="20" fill="#F5F3FF" />
          {/* X in circle */}
          <line x1="97" y1="87" x2="113" y2="103" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
          <line x1="113" y1="87" x2="97" y2="103" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
          {/* Magnifier handle */}
          <line x1="126" y1="116" x2="140" y2="130" stroke="#C4B5FD" strokeWidth="3.5" strokeLinecap="round" />
          {/* Sparkles */}
          <path d="M44 60 L46 54 L48 60 L54 62 L48 64 L46 70 L44 64 L38 62 Z" fill="#E8541A" opacity="0.6" />
          <circle cx="150" cy="50" r="4" fill="#6366F1" opacity="0.5" />
          <circle cx="35" cy="100" r="3" fill="#06B6D4" opacity="0.4" />
        </svg>
      </div>

      <h2
        style={{
          fontWeight: 700,
          fontSize: 20,
          color: "#1A1A1A",
          marginBottom: 10,
        }}
      >
        No assignments yet
      </h2>
      <p
        style={{
          fontSize: 14,
          color: "#6B7280",
          maxWidth: 380,
          lineHeight: 1.6,
          marginBottom: 28,
        }}
      >
        Create your first assignment to start collecting and grading student
        submissions. You can set up rubrics, define marking criteria, and let AI
        assist with grading.
      </p>

      <Link href="/assignments/new" style={{ textDecoration: "none" }}>
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 24px",
            background: "#1A1A1A",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 100,
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#2D2D2D";
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 4px 16px rgba(0,0,0,0.2)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#1A1A1A";
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
          }}
        >
          <Plus size={18} />
          Create Your First Assignment
        </button>
      </Link>
    </div>
  );
}
