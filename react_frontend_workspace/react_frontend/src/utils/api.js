export const API_BASE = "https://vscode-internal-079-beta.beta01.cloud.kavia.ai:3001";

// PUBLIC_INTERFACE
export async function apiRequest(path, options = {}, withAuth = true) {
  /** Helper function for backend API requests (with token if authenticated) */
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (withAuth && token) headers["Authorization"] = `Bearer ${token}`;
  const resp = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw data || { detail: "Unknown error" };
  }
  return data;
}
