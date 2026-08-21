export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
const TOKEN_KEY = "moment.accessToken";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (response.status === 204) return undefined as T;

  const body = await response.json().catch(() => undefined);

  if (!response.ok) {
    const message =
      (body && typeof body.message === "string" && body.message) ||
      (body && Array.isArray(body.message) && body.message.join(", ")) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message);
  }

  return body as T;
}

export function upload<T>(
  path: string,
  file: File,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}${path}`);
    const token = getToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    const abort = () => xhr.abort();
    signal?.addEventListener("abort", abort, { once: true });

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    });
    xhr.addEventListener("load", () => {
      signal?.removeEventListener("abort", abort);
      const body = JSON.parse(xhr.responseText || "null") as { message?: string | string[] } | T | null;
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body as T);
        return;
      }
      const message =
        body && typeof body === "object" && "message" in body
          ? Array.isArray(body.message)
            ? body.message.join(", ")
            : body.message
          : `Upload failed with status ${xhr.status}`;
      reject(new ApiError(xhr.status, message || "Upload failed"));
    });
    xhr.addEventListener("error", () => {
      signal?.removeEventListener("abort", abort);
      reject(new ApiError(0, "The upload could not reach the server"));
    });
    xhr.addEventListener("abort", () => {
      signal?.removeEventListener("abort", abort);
      reject(new DOMException("Upload cancelled", "AbortError"));
    });

    const formData = new FormData();
    formData.append("file", file, file.name);
    xhr.send(formData);
  });
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data !== undefined ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PATCH", body: data !== undefined ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "DELETE", body: data !== undefined ? JSON.stringify(data) : undefined }),
};
