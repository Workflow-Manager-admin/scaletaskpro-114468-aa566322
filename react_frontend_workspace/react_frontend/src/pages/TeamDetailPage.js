import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../App.css";
import { apiRequest } from "../utils/api";
import { useSuccessMessage } from "../utils/SuccessMessageContext";

// PUBLIC_INTERFACE
export default function TeamDetailPage() {
  /**
   * Page to show details and member list for a single team by id.
   */
  const { id } = useParams();
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    async function fetchTeam() {
      try {
        const tm = await apiRequest(`/teams/${id}`);
        setTeam(tm.team || tm);
        setMembers((tm.team && tm.team.members) || []);
      } catch (e) {
        setErr(e?.detail || "Failed to load team.");
      }
      setLoading(false);
    }
    fetchTeam();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (err) return <div className="form-error">{err}</div>;
  if (!team) return <div>Not found</div>;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h2>Team: {team.name}</h2>
      <div style={{ marginBottom: 16 }}>
        <strong>ID:</strong> {team.id}
      </div>
      <section className="dashboard-section">
        <h3>Members</h3>
        <ul className="dashboard-list">
          {members.length ? members.map((mem) => (
            <li key={mem.id || mem}>{mem.email || mem.username || mem.id || mem}</li>
          )) : <li>No members listed.</li>}
        </ul>
      </section>
      <div style={{ margin: "1.1rem 0" }}>
        <button className="btn" onClick={() => navigate("/teams")}>Back to Teams</button>
      </div>
    </div>
  );
}
