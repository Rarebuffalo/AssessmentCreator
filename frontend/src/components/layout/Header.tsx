"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, ChevronDown, LayoutGrid, ArrowLeft } from "lucide-react";

const breadcrumbs: Record<string, { label: string; showBack?: boolean }> = {
  "/assignments": { label: "Assignment" },
  "/assignments/new": { label: "Assignment", showBack: true },
};

function getBreadcrumb(pathname: string) {
  if (breadcrumbs[pathname]) return breadcrumbs[pathname];
  if (pathname.startsWith("/assignments/") && pathname !== "/assignments/new") {
    return { label: "Assignment", showBack: true };
  }
  return { label: "Assignment" };
}

export default function Header() {
  const pathname = usePathname();
  const { label, showBack } = getBreadcrumb(pathname);

  return (
    <header
      style={{
        height: 64,
        background: "#FFFFFF",
        borderBottom: "1px solid #E5E7EB",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Left: breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {showBack ? (
          <Link href="/assignments" style={{ textDecoration: "none" }}>
            <button
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                color: "#6B7280",
                padding: "4px 6px",
                borderRadius: 6,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = "#F3F4F6")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = "none")
              }
            >
              <ArrowLeft size={18} />
            </button>
          </Link>
        ) : null}
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#9CA3AF" }}>
          <LayoutGrid size={16} />
          <span style={{ fontSize: 14, color: "#6B7280" }}>{label}</span>
        </div>
      </div>

      {/* Right: bell + user */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Bell */}
        <button
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            position: "relative",
            display: "flex",
            alignItems: "center",
            padding: 4,
          }}
        >
          <Bell size={20} color="#6B7280" />
          {/* Notification dot */}
          <span
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              width: 8,
              height: 8,
              background: "#E8541A",
              borderRadius: "50%",
              border: "1.5px solid #fff",
            }}
          />
        </button>

        {/* User menu */}
        <button
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "4px 8px",
            borderRadius: 8,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = "#F3F4F6")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = "none")
          }
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #E8541A, #FF8C42)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            K
          </div>
          <span style={{ fontSize: 14, fontWeight: 500, color: "#1A1A1A" }}>Krishna Singh</span>
          <ChevronDown size={16} color="#9CA3AF" />
        </button>
      </div>
    </header>
  );
}
