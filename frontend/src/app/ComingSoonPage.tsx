"use client";

import AppLayout from "@/components/layout/AppLayout";
import { Sparkles } from "lucide-react";

export default function ComingSoonPage({ title }: { title: string }) {
  return (
    <AppLayout>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "70vh" }}>
        <div style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: 20,
          padding: "48px 40px",
          maxWidth: 480,
          width: "90%",
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
        }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "#FFF7ED",
            border: "1px solid #FED7AA",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}>
            <Sparkles size={24} color="#E8541A" />
          </div>
          <h2 style={{ fontWeight: 800, fontSize: 22, color: "#1A1A1A", marginBottom: 12 }}>
            {title}
          </h2>
          <p style={{ color: "#6B7280", fontSize: 14.5, lineHeight: 1.6, marginBottom: 20 }}>
            This feature is integrated into the core VedaAI platform and is coming soon to your workspace.
          </p>
          <span style={{
            display: "inline-block",
            fontSize: 12,
            fontWeight: 600,
            color: "#E8541A",
            background: "#FFF7ED",
            padding: "4px 12px",
            borderRadius: 100,
          }}>
            VedaAI Core Integration
          </span>
        </div>
      </div>
    </AppLayout>
  );
}
