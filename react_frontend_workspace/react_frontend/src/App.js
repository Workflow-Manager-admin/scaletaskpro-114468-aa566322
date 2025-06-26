import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { SuccessMessageProvider, SuccessMessageBanner, useSuccessMessage } from "./utils/SuccessMessageContext";

/**
 * --- Auth context for managing user session and protected routes ---
 */
const AuthContext = React.createContext();

/**
 * Helper to parse JWT payload (for exp field, not full validation).
 */
function parseJwt(token) {
  if (!token) return null;
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded;
  } catch {
    return null;
  }
}

/**
 * PUBLIC_INTERFACE
 * AuthProvider: Handles login/logout, session restoration (localStorage), expiry detection, 
 * and propagates changes/revalidation for all children.
 */
function AuthProvider({ children }) {
  // Initial check
  function getInitialAuth() {
    try {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");
      if (!storedToken || !storedUser) return { user: null, token: null };
      // Check expiry (JWT standard "exp")
      const decoded = parseJwt(storedToken);
      if (decoded?.exp && Date.now() / 1000 > decoded.exp) {
        // token expired, nuke and return null
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return { user: null, token: null };
      }
      return { user: JSON.parse(storedUser), token: storedToken };
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      return { user: null, token: null };
    }
  }

  // Store both user and token
  const [user, setUser] = useState(() => getInitialAuth().user);
  const [token, setToken] = useState(() => getInitialAuth().token);
  // For session expiry: show global session expired state/modal/route jump
  const [sessionExpired, setSessionExpired] = useState(false);

  // Listen to localStorage changes (manual multi-tab logout/session sync)
  useEffect(() => {
    function handleStorage(e) {
      if (e.key === "token" || e.key === "user") {
        // Side effect: force re-check
        const updated = getInitialAuth();
        setUser(updated.user);
        setToken(updated.token);
        if (!updated.user) setSessionExpired(false);
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Session refresh/expiry polling (optional: can use more sophisticated idle detection or backend)
  useEffect(() => {
    let interval = null;
    if (token) {
      interval = setInterval(() => {
        const decoded = parseJwt(token);
        if (decoded?.exp && Date.now() / 1000 > decoded.exp) {
          // Session expired, nuke everything
          logout(true);
        }
      }, 10000); // check every 10s
    }
    return () => interval && clearInterval(interval);
  }, [token]); // depend on token changes

  // PUBLIC_INTERFACE
  // Login: save user+token, go to dashboard, clear expired state
  const login = (data, navigate = null) => {
    try {
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
    } catch {}
    // Set state in synchronous batch before navigation for correct redirect/guard
    setUser(data.user);
    setToken(data.access_token);
    setSessionExpired(false);

    // Ensure that navigation only happens after React state updates are flushed
    if (navigate) {
      // Use setTimeout to push navigation to next event loop tick to guarantee rerender/redirect order
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 0);
    }
  };
  // Logout or session nuke (sessionExpired true => session expired, otherwise real logout)
  const logout = useCallback(
    (expired = false) => {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } catch {}
      setUser(null);
      setToken(null);
      setSessionExpired(expired === true);
    },
    []
  );

  // Helper: on access to protected route with user/token missing, clear session and flag as expired
  const invalidateSession = useCallback(() => {
    logout(true);
  }, [logout]);

  // To allow fallback/session restore: on mount, restore if possible
  useEffect(() => {
    // On page reload or mount, restore localStorage data (if not invalid)
    const initial = getInitialAuth();
    if (user == null && initial.user) {
      setUser(initial.user);
      setToken(initial.token);
    }
    // If session expired set sessionExpired true
    if (!initial.token && !initial.user && user) {
      setSessionExpired(true);
      setUser(null);
      setToken(null);
    }
  }, []); // only run at mount

  // Expose isAuthenticated (user+token)
  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        login,
        logout,
        invalidateSession,
        sessionExpired,
        setSessionExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * PUBLIC_INTERFACE
 * useAuth(): returns { user, token, isAuthenticated, login, logout, invalidateSession, sessionExpired }
 */
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
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess } = useSuccessMessage();

  // Utility for session expired message
  useEffect(() => {
    if (location.state?.sessionExpired) {
      setError("Session expired. Please log in again.");
      logout(false); // clear any partial state but don't mark as expired
    }
    // On entering login, clear any stale partial data
    // eslint-disable-next-line
  }, []);

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
  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await apiRequest(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
          headers: { "Content-Type": "application/json" },
        },
        false
      );
      // login(data, navigate) will set session and redirect
      login(data, navigate);
      showSuccess("Login successful. Welcome!");
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
            onClick={() => {
              setError("");
              navigate("/register");
            }}
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
  const { showSuccess } = useSuccessMessage();

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
      await apiRequest(
        "/auth/register",
        {
          method: "POST",
          body: JSON.stringify({ username, email, password }),
          headers: { "Content-Type": "application/json" }
        },
        false
      );
      showSuccess("Registration successful! Logging you in...");
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
      login(data, navigate);
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
            onClick={() => {
              setError("");
              navigate("/login");
            }}
          >
            Login
          </span>
        </p>
        {error ? <div className="form-error">{error}</div> : null}
      </form>
    </section>
  );
}

/* Duplicate RegisterPage removed; see above for single up-to-date RegisterPage function. */

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

/**
 * PUBLIC_INTERFACE
 * ProtectedRoute: Wraps a protected route, enforces authentication & redirect.
 * On session expiration, will log out everywhere and redirect to login with a message.
 */
function ProtectedRoute({ children }) {
  const { user, token, isAuthenticated, sessionExpired, setSessionExpired, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Avoid interfering with /login or /register routes by not redirecting if already there
    const pathname = location.pathname;
    const onAuthPage = pathname === "/login" || pathname === "/register";
    if (!isAuthenticated && !onAuthPage) {
      // Only show session expired notice if it's a real expiry (set by AuthProvider)
      if (sessionExpired) {
        navigate("/login", { replace: true, state: { sessionExpired: true } });
        setSessionExpired(false);
      } else {
        navigate("/login", { replace: true, state: { from: location } });
      }
    }
    setChecking(false);
    // eslint-disable-next-line
  }, [isAuthenticated, sessionExpired, location.pathname]);

  if (checking) return null;

  return isAuthenticated ? children : null;
}

// --- Projects CRUD page/component ---
function ProjectsPage() {
  // CRUD logic, list, add, delete, edit
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const { showSuccess } = useSuccessMessage();

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
        showSuccess("Project updated.");
      } else {
        await apiRequest("/projects", {
          method: "POST",
          body: JSON.stringify(project),
        });
        showSuccess("Project created.");
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
        showSuccess("Project deleted.");
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
  const { showSuccess } = useSuccessMessage();

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
        showSuccess("Team updated.");
      } else {
        await apiRequest("/teams", {
          method: "POST",
          body: JSON.stringify(team),
        });
        showSuccess("Team created.");
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
        showSuccess("Team deleted.");
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
  const { showSuccess } = useSuccessMessage();

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
        showSuccess("Task updated.");
      } else {
        await apiRequest("/tasks", {
          method: "POST",
          body: JSON.stringify(task),
        });
        showSuccess("Task created.");
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
        showSuccess("Task deleted.");
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
      showSuccess("Status updated.");
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
  const navigate = useNavigate();
  const location = useLocation();
  // When user logs out, redirect to /login
  const { showSuccess } = useSuccessMessage();
  const handleLogout = () => {
    logout(false);
    navigate("/login", { replace: true });
    setTimeout(() => showSuccess("Logged out successfully."), 200);
  };
  // Dismiss success message on route change
  const { clearSuccess } = useSuccessMessage();
  React.useEffect(() => {
    clearSuccess();
    // eslint-disable-next-line
  }, [location.pathname]);
  return (
    <div className="app-shell">
      <Navbar onLogout={handleLogout} />
      <SuccessMessageBanner />
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
/**
 * Simple error boundary that displays a user-friendly message and a "Back to Dashboard" button.
 */
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error?.message || String(error) };
  }

  componentDidCatch(error, info) {
    // Optionally: log to backend here
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="form-error" style={{ margin: "3rem", maxWidth: 500 }}>
          <div>Oops! Something went wrong in the app.</div>
          <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
            {this.state.errorMsg}
          </div>
          <Link className="btn accent" style={{ marginTop: 28 }} to="/dashboard">
            Back to Dashboard
          </Link>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SuccessMessageProvider>
          <Router>
            <AppErrorBoundary>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
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
                          <Route path="*" element={
                            <div className="form-error" style={{ margin: "2rem" }}>
                              <div>Page not found.</div>
                              <Link className="btn accent" style={{ marginTop: 15 }} to="/dashboard">Dashboard</Link>
                            </div>
                          } />
                        </Routes>
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </AppErrorBoundary>
          </Router>
        </SuccessMessageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
