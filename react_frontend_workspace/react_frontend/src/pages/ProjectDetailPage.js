import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "../App.css";
import { apiRequest } from "../utils/api";
import { useSuccessMessage } from "../utils/SuccessMessageContext";

// PUBLIC_INTERFACE
export default function ProjectDetailPage() {
  /**
   * Page to show one project's details, its tasks, and members.
   */
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setErr("");
    async function fetchProjectAndTasks() {
      try {
        const p = await apiRequest(`/projects/${id}`);
        setProject(p.project || p);
        const t = await apiRequest(`/tasks?project_id=${id}`);
        setTasks(t.tasks || []);
      } catch (e) {
        setErr(e?.detail || "Failed to load project.");
      }
      setLoading(false);
    }
    fetchProjectAndTasks();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (err) return <div className="form-error">{err}</div>;
  if (!project) return <div>Not found</div>;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <h2>Project: {project.name}</h2>
      <div style={{ marginBottom: "1.2rem" }}>
        {/* Project description/etc. could go here */}
        <strong>ID:</strong> {project.id}
      </div>
      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <h3>Tasks</h3>
          <button className="btn" onClick={() => navigate("/tasks")}>All Tasks</button>
        </div>
        <ul className="dashboard-list">
          {tasks.map((task) => (
            <li key={task.id} className="dashboard-list-item">
              <Link to={`/tasks/${task.id}`}>{task.title}</Link>
              &nbsp;&nbsp;
              <span className={"task-status task-status-" + task.status}>{task.status}</span>
            </li>
          ))}
        </ul>
      </section>
      <div style={{ margin: "1.1rem 0" }}>
        <button className="btn" onClick={() => navigate("/projects")}>Back to Projects</button>
      </div>
    </div>
  );
}
