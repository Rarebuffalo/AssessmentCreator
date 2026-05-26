"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import AssignmentCard from "@/components/assignments/AssignmentCard";
import EmptyState from "@/components/assignments/EmptyState";
import { useAssignmentStore } from "@/store/assignmentStore";
import { fetchAssignments, deleteAssignment } from "@/lib/api";
import { Assignment } from "@/types";

export default function AssignmentsPage() {
  const { assignments, setAssignments, removeAssignment, isLoading, setLoading } =
    useAssignmentStore();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAssignments();
      setAssignments(data.assignments);
    } catch (err) {
      console.error("Failed to load assignments:", err);
    } finally {
      setLoading(false);
    }
  }, [setAssignments, setLoading]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;
    try {
      await deleteAssignment(id);
      removeAssignment(id);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete assignment");
    }
  };

  const filtered = assignments.filter((a: Assignment) => {
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.subject.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterStatus === "all" || a.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <AppLayout>
      {/* Page heading */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          {/* Green dot like Figma */}
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#10B981",
              display: "inline-block",
            }}
          />
          <h1
            style={{
              fontWeight: 700,
              fontSize: 22,
              color: "#1A1A1A",
            }}
          >
            Assignments
          </h1>
        </div>
        <p style={{ fontSize: 13.5, color: "#9CA3AF", marginLeft: 20 }}>
          Manage and create assignments for your classes.
        </p>
      </div>

      {isLoading ? (
        // Skeleton loader
        <div>
          <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
            <div className="skeleton" style={{ height: 40, width: 140 }} />
            <div className="skeleton" style={{ height: 40, flex: 1, maxWidth: 320, marginLeft: "auto" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: 140, borderRadius: 12, animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      ) : assignments.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Filter / Search bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
            }}
          >
            {/* Filter By */}
            <div style={{ position: "relative" }}>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  background: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  fontSize: 13.5,
                  color: "#374151",
                  cursor: "pointer",
                  fontWeight: 500,
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.borderColor = "#D1D5DB")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.borderColor = "#E5E7EB")
                }
              >
                <SlidersHorizontal size={15} color="#9CA3AF" />
                Filter By
                {filterStatus !== "all" && (
                  <span
                    style={{
                      fontSize: 11,
                      background: "#E8541A",
                      color: "#fff",
                      borderRadius: 10,
                      padding: "1px 6px",
                    }}
                  >
                    1
                  </span>
                )}
              </button>
              {/* Simple status filter dropdown (could be expanded) */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="generating">Generating</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Search */}
            <div
              style={{
                marginLeft: "auto",
                position: "relative",
                maxWidth: 300,
                width: "100%",
              }}
            >
              <Search
                size={15}
                color="#9CA3AF"
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                type="text"
                placeholder="Search Assignment"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 14px 9px 36px",
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  fontSize: 13.5,
                  color: "#374151",
                  background: "#FFFFFF",
                  outline: "none",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) =>
                  ((e.currentTarget as HTMLInputElement).style.borderColor = "#E8541A")
                }
                onBlur={(e) =>
                  ((e.currentTarget as HTMLInputElement).style.borderColor = "#E5E7EB")
                }
              />
            </div>
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 0",
                color: "#9CA3AF",
                fontSize: 14,
              }}
            >
              No assignments match your search.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: 16,
                paddingBottom: 80, // space for floating button
              }}
            >
              {filtered.map((a: Assignment, i: number) => (
                <div
                  key={a._id}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <AssignmentCard assignment={a} onDelete={handleDelete} />
                </div>
              ))}
            </div>
          )}

          {/* Floating Create button (Figma bottom center) */}
          <div
            style={{
              position: "fixed",
              bottom: 32,
              left: "50%",
              transform: "translateX(calc(-50% + 110px))", // offset for sidebar
              zIndex: 30,
            }}
          >
            <Link href="/assignments/new" style={{ textDecoration: "none" }}>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "13px 28px",
                  background: "#1A1A1A",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 100,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#2D2D2D";
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 24px rgba(0,0,0,0.3)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#1A1A1A";
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.25)";
                }}
              >
                <Plus size={18} />
                Create Assignment
              </button>
            </Link>
          </div>
        </>
      )}
    </AppLayout>
  );
}
