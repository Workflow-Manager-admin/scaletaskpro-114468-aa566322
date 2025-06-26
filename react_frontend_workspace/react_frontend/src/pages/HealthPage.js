import React, { useEffect, useState } from "react";
import { apiRequest } from "../utils/api";

// PUBLIC_INTERFACE
export default function HealthPage() {
  /**
   * Shows backend/system health for diagnostics.
   */
  const [status, setStatus] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await apiRequest("/health", {}, false);
        setStatus(res);
      } catch (e) {
        setErr(e?.detail || "Backend unavailable");
      }
    }
    checkHealth();
  }, []);
  return (
    <div style={{ maxWidth: 460, margin: "2rem auto" }}>
      <h2>System Health</h2>
      {err ? <div className="form-error">{err}</div> :
        status ? (
          <pre style={{ padding: 12, background: "#fafbfc", borderRadius: 9 }}>
            {JSON.stringify(status, null, 2)}
          </pre>
        ) : <div>Checking...</div>}
    </div>
  );
}
