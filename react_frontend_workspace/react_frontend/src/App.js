import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  Link,
} from "react-router-dom";
import "./App.css";
import TaskDetailPage from "./pages/TaskDetailPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import TeamDetailPage from "./pages/TeamDetailPage";
import HealthPage from "./pages/HealthPage";
import { apiRequest } from "./utils/api";



// --- Auth context for managing user session ---
const AuthContext = React.createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(
    () => JSON.parse(localStorage.getItem("user")) || null
  );

  // PUBLIC_INTERFACE
  const login = (data, navigate = null) => {
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    // If navigation is provided (new session), redirect after login
    if (navigate) {
      navigate("/dashboard", { replace: true });
    }
  };
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  return React.useContext(AuthContext);
}

// --- Theme context for light/dark mode per minimalism spec ---
const ThemeContext = React.createContext();

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
function useTheme() {
  return React.useContext(ThemeContext);
}

// --- Minimal Navbar & Sidebar responsive components ---
function Navbar({ onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  return (
    <nav className="navbar">
      <div className="logo">ScaleTaskPro</div>
      <div className="spacer" />
      {user ? (
        <>
          <span className="user">{user.email || user.username}</span>
          <button className="navbar-btn secondary" onClick={onLogout}>
            Logout
          </button>
        </>
      ) : null}
      <button className="navbar-btn" onClick={toggleTheme}>
        {theme === "light" ? "🌙" : "☀️"}
      </button>
    </nav>
  );
}

function Sidebar({ items = [], current }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        {items.map((item) => (
          <Link
            key={item.id}
            to={item.id}
            className={
              "sidebar-item" +
              (current === item.id ? " sidebar-item-active" : "")
            }
            tabIndex={0}
            style={{ textDecoration: "none" }}
          >
            {item.name}
          </Link>
        ))}
      </div>
    </aside>
  );
}

// --- Login and Registration Pages ---
function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  // Utility to format validation/server errors as a readable string/JSX
  function formatError(err) {
    if (!err) return "";
    if (typeof err === "string") return err;
    if (Array.isArray(err)) {
      // FastAPI validation error: array of objects with loc/msg/type
      return (
        <ul style={{ margin: 0, paddingLeft: '1.2em' }}>
          {err.map((item, i) => (
            <li key={i}>
              {item?.msg ? `${item.msg}` : JSON.stringify(item)}
              {item?.loc ? (
                <span style={{ color: '#888', marginLeft: 4 }}>
                  [{item.loc.join(".")}]
                </span>
              ) : ""}
            </li>
          ))}
        </ul>
      );
    }
    if (typeof err === "object") {
      if (err.detail) {
        if (typeof err.detail === "string") return err.detail;
        if (Array.isArray(err.detail)) return formatError(err.detail);
        // Might be an object
        return JSON.stringify(err.detail);
      }
      // FastAPI validation error at root level
      if (err.msg && err.loc) return `${err.msg} (${err.loc.join(",")})`;
      return JSON.stringify(err);
    }
    return String(err);
  }

  // PUBLIC_INTERFACE
  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    try {
      // API: POST /auth/login expects { "email": ..., "password": ... }
      const data = await apiRequest(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
          headers: { "Content-Type": "application/json" },
        },
        false
      );
      // Use login with navigation so redirect happens after user state is set
      login(data, navigate); // stores token and user, does redirect
    } catch (err) {
      setError(formatError(err) || "Login failed.");
    }
  }

  return (
    <section className="auth-form">
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <label>
          Email
          <input
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
          />
        </label>
        <button className="btn accent" type="submit">
          Login
        </button>
        <p>
          New here?{" "}
          <span
            className="auth-form-link"
            onClick={() => navigate("/register")}
          >
            Create account
          </span>
        </p>
        {error ? <div className="form-error">{error}</div> : null}
      </form>
    </section>
  );
}

function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  // Utility to format errors (reuse from LoginPage)
  function formatError(err) {
    if (!err) return "";
    if (typeof err === "string") return err;
    if (Array.isArray(err)) {
      return (
        <ul style={{ margin: 0, paddingLeft: '1.2em' }}>
          {err.map((item, i) => (
            <li key={i}>
              {item?.msg ? `${item.msg}` : JSON.stringify(item)}
              {item?.loc ? (
                <span style={{ color: '#888', marginLeft: 4 }}>
                  [{item.loc.join(".")}]
                </span>
              ) : ""}
            </li>
          ))}
        </ul>
      );
    }
    if (typeof err === "object") {
      if (err.detail) {
        if (typeof err.detail === "string") return err.detail;
        if (Array.isArray(err.detail)) return formatError(err.detail);
        return JSON.stringify(err.detail);
      }
      if (err.msg && err.loc) return `${err.msg} (${err.loc.join(",")})`;
      return JSON.stringify(err);
    }
    return String(err);
  }

  // PUBLIC_INTERFACE
  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    try {
      // API: POST /auth/register expects { username, email, password }
      await apiRequest(
        "/auth/register",
        {
          method: "POST",
          body: JSON.stringify({ username, email, password }),
          headers: { "Content-Type": "application/json" }
        },
        false
      );
      // On success, auto-login using email/password:
      const data = await apiRequest(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
          headers: { "Content-Type": "application/json" }
        },
        false
      );
      login(data);
      navigate("/dashboard");
    } catch (err) {
      setError(formatError(err) || "Registration failed.");
    }
  }
  return (
    <section className="auth-form">
      <h1>Register</h1>
      <form onSubmit={handleRegister}>
        <label>
          Username
          <input
            required
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            type="text"
            autoComplete="username"
          />
        </label>
        <label>
          Email
          <input
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
          />
        </label>
        <button className="btn accent" type="submit">
          Register
        </button>
        <p>
          Have an account?{" "}
          <span
            className="auth-form-link"
            onClick={() => navigate("/login")}
          >
            Login
          </span>
        </p>
        {error ? <div className="form-error">{error}</div> : null}
      </form>
    </section>
  );
}

// --- Dashboard Page (displays projects, tasks, teams summary) ---
function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  // fetch list of projects, teams, and recent tasks
  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [proj, tms, tsks] = await Promise.all([
          apiRequest("/projects"),
          apiRequest("/teams"),
          apiRequest("/tasks?limit=5"),
        ]);
        setProjects(proj.projects || []);
        setTeams(tms.teams || []);
        setTasks(tsks.tasks || []);
      } catch (e) {
        setErr(e?.detail || "Error loading dashboard.");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Dashboard</h1>
      {loading && <div>Loading...</div>}
      {err && <div className="form-error">{err}</div>}

      {/* Projects summary */}
      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>Projects</h2>
          <button
            className="btn accent"
            onClick={() => navigate("/projects")}
          >
            View All
          </button>
        </div>
        <ul className="dashboard-list">
          {projects.slice(0, 3).map((proj) => (
            <li key={proj.id} className="dashboard-list-item">
              <span>{proj.name}</span>
            </li>
          ))}
        </ul>
      </section>
      {/* Teams summary */}
      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>Teams</h2>
          <button
            className="btn accent"
            onClick={() => navigate("/teams")}
          >
            View All
          </button>
        </div>
        <ul className="dashboard-list">
          {teams.slice(0, 3).map((team) => (
            <li key={team.id} className="dashboard-list-item">
              <span>{team.name}</span>
            </li>
          ))}
        </ul>
      </section>
      {/* Tasks summary */}
      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>Recent Tasks</h2>
          <button
            className="btn accent"
            onClick={() => navigate("/tasks")}
          >
            View All
          </button>
        </div>
        <ul className="dashboard-list">
          {tasks.map((task) => (
            <li key={task.id} className="dashboard-list-item">
              <span>{task.title}</span> &nbsp;·&nbsp;
              <span className={"task-status task-status-" + task.status}>
                {task.status}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// --- Protected Route Wrapper ---
function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// --- Projects CRUD page/component ---
function ProjectsPage() {
  // CRUD logic, list, add, delete, edit
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line
  }, []);
  async function fetchProjects() {
    setLoading(true);
    setErr("");
    try {
      const data = await apiRequest("/projects");
      setProjects(data.projects || []);
    } catch (e) {
      setErr(e?.detail || "Failed to load projects.");
    }
    setLoading(false);
  }

  async function handleSave(project) {
    try {
      if (project.id) {
        // update
        await apiRequest(`/projects/${project.id}`, {
          method: "PUT",
          body: JSON.stringify(project),
        });
      } else {
        await apiRequest("/projects", {
          method: "POST",
          body: JSON.stringify(project),
        });
      }
      setShowModal(false);
      setEditProject(null);
      fetchProjects();
    } catch (e) {
      setErr(e?.detail || "Failed to save project.");
    }
  }

  async function handleDelete(proj) {
    if (
      // Minimal prompt UI
      window.confirm(`Delete project "${proj.name}"? This cannot be undone.`)
    ) {
      try {
        await apiRequest(`/projects/${proj.id}`, { method: "DELETE" });
        fetchProjects();
      } catch (e) {
        setErr(e?.detail || "Delete failed.");
      }
    }
  }

  return (
    <div className="page-main">
      <div className="list-header">
        <h2>Projects</h2>
        <button
          className="btn accent"
          onClick={() => {
            setEditProject(null);
            setShowModal(true);
          }}
        >
          + New Project
        </button>
      </div>
      {loading && <p>Loading...</p>}
      {err && <div className="form-error">{err}</div>}
      <ul className="crud-list">
        {projects.map((proj) => (
          <li key={proj.id} className="crud-list-item">
            <span>{proj.name}</span>
            <div>
              <button
                className="btn"
                onClick={() => {
                  setEditProject(proj);
                  setShowModal(true);
                }}
              >
                Edit
              </button>
              <button
                className="btn danger"
                onClick={() => handleDelete(proj)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      {showModal && (
        <ProjectModal
          initial={editProject}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
function ProjectModal({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial?.name || "");
  return (
    <div className="modal">
      <form
        className="modal-content"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ ...initial, name });
        }}
      >
        <h3>{initial ? "Edit Project" : "New Project"}</h3>
        <label>
          Name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <div className="modal-actions">
          <button className="btn accent" type="submit">
            Save
          </button>
          <button className="btn" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// --- Teams CRUD page/component ---
function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editTeam, setEditTeam] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
    // eslint-disable-next-line
  }, []);
  async function fetchTeams() {
    setLoading(true);
    setErr("");
    try {
      const data = await apiRequest("/teams");
      setTeams(data.teams || []);
    } catch (e) {
      setErr(e?.detail || "Failed to load teams.");
    }
    setLoading(false);
  }

  async function handleSave(team) {
    try {
      if (team.id) {
        // update
        await apiRequest(`/teams/${team.id}`, {
          method: "PUT",
          body: JSON.stringify(team),
        });
      } else {
        await apiRequest("/teams", {
          method: "POST",
          body: JSON.stringify(team),
        });
      }
      setShowModal(false);
      setEditTeam(null);
      fetchTeams();
    } catch (e) {
      setErr(e?.detail || "Failed to save team.");
    }
  }

  async function handleDelete(team) {
    if (
      window.confirm(
        `Delete team "${team.name}"? This cannot be undone.`
      )
    ) {
      try {
        await apiRequest(`/teams/${team.id}`, { method: "DELETE" });
        fetchTeams();
      } catch (e) {
        setErr(e?.detail || "Delete failed.");
      }
    }
  }

  return (
    <div className="page-main">
      <div className="list-header">
        <h2>Teams</h2>
        <button
          className="btn accent"
          onClick={() => {
            setEditTeam(null);
            setShowModal(true);
          }}
        >
          + New Team
        </button>
      </div>
      {loading && <p>Loading...</p>}
      {err && <div className="form-error">{err}</div>}
      <ul className="crud-list">
        {teams.map((team) => (
          <li key={team.id} className="crud-list-item">
            <span>{team.name}</span>
            <div>
              <button
                className="btn"
                onClick={() => {
                  setEditTeam(team);
                  setShowModal(true);
                }}
              >
                Edit
              </button>
              <button
                className="btn danger"
                onClick={() => handleDelete(team)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      {showModal && (
        <TeamModal
          initial={editTeam}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
function TeamModal({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial?.name || "");
  return (
    <div className="modal">
      <form
        className="modal-content"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ ...initial, name });
        }}
      >
        <h3>{initial ? "Edit Team" : "New Team"}</h3>
        <label>
          Name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <div className="modal-actions">
          <button className="btn accent" type="submit">
            Save
          </button>
          <button className="btn" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// --- Tasks CRUD and status page (with filtering, inline status updates) ---
function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line
  }, []);
  async function fetchTasks() {
    setLoading(true);
    setErr("");
    try {
      const data = await apiRequest("/tasks");
      setTasks(data.tasks || []);
    } catch (e) {
      setErr(e?.detail || "Failed to load tasks.");
    }
    setLoading(false);
  }

  async function handleSave(task) {
    try {
      if (task.id) {
        // update
        await apiRequest(`/tasks/${task.id}`, {
          method: "PUT",
          body: JSON.stringify(task),
        });
      } else {
        await apiRequest("/tasks", {
          method: "POST",
          body: JSON.stringify(task),
        });
      }
      setShowModal(false);
      setEditTask(null);
      fetchTasks();
    } catch (e) {
      setErr(e?.detail || "Failed to save task.");
    }
  }

  async function handleDelete(task) {
    if (
      window.confirm(
        `Delete task "${task.title}"? This cannot be undone.`
      )
    ) {
      try {
        await apiRequest(`/tasks/${task.id}`, { method: "DELETE" });
        fetchTasks();
      } catch (e) {
        setErr(e?.detail || "Delete failed.");
      }
    }
  }

  async function handleStatusChange(task, status) {
    try {
      await apiRequest(`/tasks/${task.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      fetchTasks();
    } catch (e) {
      setErr(e?.detail || "Status update failed.");
    }
  }

  return (
    <div className="page-main">
      <div className="list-header">
        <h2>Tasks</h2>
        <button
          className="btn accent"
          onClick={() => {
            setEditTask(null);
            setShowModal(true);
          }}
        >
          + New Task
        </button>
      </div>
      {loading && <p>Loading...</p>}
      {err && <div className="form-error">{err}</div>}
      <ul className="crud-list">
        {tasks.map((task) => (
          <li key={task.id} className="crud-list-item">
            <span>{task.title}</span>
            <span className={"task-status task-status-" + task.status}>
              {task.status}
            </span>
            <div>
              {/* Minimal inline status update */}
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(task, e.target.value)}
              >
                <option>todo</option>
                <option>in_progress</option>
                <option>done</option>
              </select>
              <button
                className="btn"
                onClick={() => {
                  setEditTask(task);
                  setShowModal(true);
                }}
              >
                Edit
              </button>
              <button
                className="btn danger"
                onClick={() => handleDelete(task)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      {showModal && (
        <TaskModal
          initial={editTask}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
function TaskModal({ initial, onSave, onClose }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [status, setStatus] = useState(initial?.status || "todo");
  return (
    <div className="modal">
      <form
        className="modal-content"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ ...initial, title, description, status });
        }}
      >
        <h3>{initial ? "Edit Task" : "New Task"}</h3>
        <label>
          Title
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          Description
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label>
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
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
          <button className="btn" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// --- Main App Layout ---
function AppLayout({ children }) {
  const { logout, user } = useAuth();
  const location = useLocation();
  return (
    <div className="app-shell">
      <Navbar onLogout={logout} />
      <div className="app-content">
        <Sidebar
          items={[
            { id: "/dashboard", name: "Dashboard" },
            { id: "/tasks", name: "Tasks" },
            { id: "/projects", name: "Projects" },
            { id: "/teams", name: "Teams" },
            { id: "/health", name: "Health" }
          ]}
          current={location.pathname}
        />
        <main className="main">{children}</main>
      </div>
    </div>
  );
}

// --- App Router ---
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/*"
              element={
                <RequireAuth>
                  <AppLayout>
                    <Routes>
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/projects" element={<ProjectsPage />} />
                      <Route path="/projects/:id" element={<ProjectDetailPage />} />
                      <Route path="/teams" element={<TeamsPage />} />
                      <Route path="/teams/:id" element={<TeamDetailPage />} />
                      <Route path="/tasks" element={<TasksPage />} />
                      <Route path="/tasks/:id" element={<TaskDetailPage />} />
                      <Route path="/health" element={<HealthPage />} />
                      <Route path="/" element={<Navigate to="/dashboard" />} />
                    </Routes>
                  </AppLayout>
                </RequireAuth>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
