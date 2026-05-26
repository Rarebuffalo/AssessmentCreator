import {
  Assignment,
  CreateAssignmentPayload,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  const data = await res.json().catch(() => ({ message: "Unknown error" }));

  if (!res.ok) {
    throw new ApiError(res.status, data.message || "Request failed");
  }

  return data;
}

// ---------- Assignments ----------

export async function fetchAssignments(): Promise<{
  success: boolean;
  assignments: Assignment[];
}> {
  return request("/assignments");
}

export async function fetchAssignmentById(id: string): Promise<{
  success: boolean;
  assignment: Assignment;
}> {
  return request(`/assignments/${id}`);
}

export async function createAssignment(
  payload: CreateAssignmentPayload,
  file?: File
): Promise<{ success: boolean; assignmentId: string; message: string }> {
  const formData = new FormData();

  // Append all fields
  Object.entries(payload).forEach(([key, value]) => {
    if (key === "questionTypes") {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
  });

  if (file) {
    formData.append("file", file);
  }

  const res = await fetch(`${API_BASE}/assignments`, {
    method: "POST",
    body: formData,
    // Do NOT set Content-Type here – let browser set multipart boundary
  });

  const data = await res.json().catch(() => ({ message: "Unknown error" }));
  if (!res.ok) {
    throw new ApiError(res.status, data.message || "Failed to create assignment");
  }
  return data;
}

export async function deleteAssignment(id: string): Promise<{
  success: boolean;
  message: string;
}> {
  return request(`/assignments/${id}`, { method: "DELETE" });
}

export async function regenerateAssignment(id: string): Promise<{
  success: boolean;
  message: string;
}> {
  return request(`/assignments/${id}/regenerate`, { method: "POST" });
}

export function getPdfUrl(id: string): string {
  return `${API_BASE}/assignments/${id}/pdf`;
}
