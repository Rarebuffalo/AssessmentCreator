"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  FileText,
  Wrench,
  BookOpen,
  Settings,
  Sparkles,
  Plus,
} from "lucide-react";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "My Groups", href: "/groups", icon: Users },
  { label: "Assignments", href: "/assignments", icon: FileText },
  { label: "AI Teacher's Toolkit", href: "/toolkit", icon: Wrench },
  { label: "My Library", href: "/library", icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/assignments") return pathname.startsWith("/assignments");
    return pathname === href;
  };

  return (
    <aside
      style={{
        width: 220,
        minWidth: 220,
        background: "#FFFFFF",
        borderRight: "1px solid #E5E7EB",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 40,
        padding: "24px 16px",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
        {/* VedaAI logo icon */}
        <div
          style={{
            width: 34,
            height: 34,
            background: "#E8541A",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 16, fontStyle: "italic" }}>V</span>
        </div>
        <span style={{ fontWeight: 700, fontSize: 17, color: "#1A1A1A", letterSpacing: "-0.3px" }}>
          VedaAI
        </span>
      </div>

      {/* Create Assignment Button */}
      <Link href="/assignments/new" style={{ textDecoration: "none", marginBottom: 28 }}>
        <button
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "10px 16px",
            background: "#1A1A1A",
            border: "1.5px solid #E8541A",
            borderRadius: 100,
            color: "#FFFFFF",
            fontWeight: 600,
            fontSize: 13.5,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#2D2D2D";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#1A1A1A";
          }}
        >
          <Sparkles size={15} color="#E8541A" />
          Create Assignment
        </button>
      </Link>

      {/* Navigation */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} style={{ textDecoration: "none" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 8,
                  background: active ? "#F3F4F6" : "transparent",
                  color: active ? "#1A1A1A" : "#6B7280",
                  fontWeight: active ? 600 : 400,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLDivElement).style.background = "#F9FAFB";
                }}
                onMouseLeave={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLDivElement).style.background = "transparent";
                }}
              >
                <Icon size={17} />
                <span>{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 16 }}>
        {/* Settings */}
        <Link href="/settings" style={{ textDecoration: "none" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              borderRadius: 8,
              color: "#6B7280",
              fontSize: 14,
              cursor: "pointer",
              marginBottom: 12,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLDivElement).style.background = "#F9FAFB")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLDivElement).style.background = "transparent")
            }
          >
            <Settings size={17} />
            <span>Settings</span>
          </div>
        </Link>

        {/* User profile card */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            background: "#F9FAFB",
            borderRadius: 10,
            border: "1px solid #F3F4F6",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #E8541A, #FF8C42)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            D
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: 12.5,
                color: "#1A1A1A",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Delhi Public School
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#9CA3AF",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Bokaro Steel City
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
