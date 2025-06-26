import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../App.css";
import { apiRequest } from "../utils/api";
import { useSuccessMessage } from "../utils/SuccessMessageContext";

// PUBLIC_INTERFACE
export default function TaskDetailPage() {
  /**
   * Shows detailed info and actions for a single task by id.
   * Allows inline editing, status update, and delete.
   */
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { showSuccess } = useSuccessMessage();

  useEffect(() => {
    async function fetchTask() {
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest(`/tasks/${id}`);
        setTask(data.task || data);
        setInput(data.task || data);
      } catch (e) {
        setError(e?.detail || "Failed to load task.");
      }
      setLoading(false);
    }
    fetchTask();
  }, [id]);

  function handleInput(e) {
    setInput({ ...input, [e.target.name]: e.target.value });
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    try {
      await apiRequest(`/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      });
      setEditing(false);
      setTask(input);
      showSuccess("Task updated.");
    } catch (e) {
      setError(e?.detail || "Update failed");
    }
  }

  async function handleDelete() {
    if (window.confirm("Delete this task?")) {
      try {
        await apiRequest(`/tasks/${id}`, { method: "DELETE" });
        showSuccess("Task deleted.");
        navigate("/tasks");
      } catch (e) {
        setError(e?.detail || "Delete failed");
      }
    }
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="form-error">{error}</div>;
  if (!task) return <div>Not found.</div>;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h2>Task Details</h2>
      {editing ? (
        <form className="modal-content" onSubmit={handleSave} style={{ padding: "1.1rem" }}>
          <label>
            Title
            <input
              required
              name="title"
              value={input.title || ""}
              onChange={handleInput}
            />
          </label>
          <label>
            Description
            <textarea
              name="description"
              rows={3}
              value={input.description || ""}
              onChange={handleInput}
            />
          </label>
          <label>
            Status
            <select
              name="status"
              value={input.status || "todo"}
              onChange={handleInput}
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </label>
          <div className="modal-actions">
            <button className="btn accent" type="submit">
              Save
            </button>
            <button type="button" className="btn" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div style={{ marginBottom: "1.2rem" }}>
          <div style={{ fontSize: 23, fontWeight: 600 }}>{task.title}</div>
          <div style={{ color: "#666", marginBottom: 10 }}>{task.description}</div>
          <span className={"task-status task-status-" + task.status}>
            {task.status}
          </span>
          <div style={{ margin: "1rem 0" }}>
            <button className="btn" onClick={() => setEditing(true)}>Edit</button>
            <button className="btn danger" onClick={handleDelete}>Delete</button>
            <button className="btn" style={{ marginLeft: 13 }} onClick={() => navigate("/tasks")}>Back to Tasks</button>
          </div>
        </div>
      )}
    </div>
  );
}
