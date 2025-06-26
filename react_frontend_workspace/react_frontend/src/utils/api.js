export const API_BASE = "https://vscode-internal-079-beta.beta01.cloud.kavia.ai:3001";

// PUBLIC_INTERFACE
export async function apiRequest(path, options = {}, withAuth = true) {
  /**
   * Helper function for backend API requests (with token if authenticated)
   * - Handles fetch failures, non-2XX responses, bad/missing JSON, and returns user-friendly error object.
   */
  let token, headers, resp, json, text;
  try {
    token = localStorage.getItem("token");
    headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (withAuth && token) headers["Authorization"] = `Bearer ${token}`;
    resp = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch (networkError) {
    // Network issues/fetch outright fails
    throw { detail: "Network error. Please check your connection." };
  }

  // Parse JSON (fallbacks for empty/malformed/HTML)
  try {
    text = await resp.text();
    json = text ? JSON.parse(text) : {};
  } catch {
    // Bad JSON: Provide fallback error or empty object
    json = {};
  }

  if (!resp.ok) {
    // Try to provide friendlier API or generic error status
    if (json && (json.detail || json.message)) {
      throw { detail: json.detail || json.message };
    }
    throw { detail: `Server error (${resp.status})` };
  }
  // If still no data, show warning rather than crash
  if (!json || typeof json !== "object") {
    throw { detail: "Invalid response from server." };
  }
  return json;
}
