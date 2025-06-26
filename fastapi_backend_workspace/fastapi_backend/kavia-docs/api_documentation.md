# Task Manager Backend API Documentation

## Overview

This documentation describes the implemented REST API endpoints of the Task Manager FastAPI backend: routes, HTTP methods, request and response schemas, authentication, and health check. The backend handles user authentication, projects, teams, tasks, status updates, and exposes utility endpoints.

All schema definitions are based on the Pydantic models in `schemas.py`.

---

## Authentication

**Note:** This project does not implement JWT or token-based authentication yet as per the current code (it simply returns user info upon successful login/register). All endpoints described here are accessible by default.

### Register New User

- **Endpoint:** `POST /auth/register`
- **Description:** Register a new user.
- **Request Body:** [`UserCreate`](#usermodels)
- **Response:** [`UserOut`](#usermodels)
- **Sample Request:**
    ```json
    {
      "email": "user@example.com",
      "username": "username",
      "password": "mypassword"
    }
    ```

---

### User Login

- **Endpoint:** `POST /auth/login`
- **Description:** Log in as a user.
- **Request Body:** [`UserLogin`](#usermodels)
- **Response:** [`UserOut`](#usermodels)
- **Sample Request:**
    ```json
    {
      "email": "user@example.com",
      "password": "mypassword"
    }
    ```

---

## Teams

### Create Team

- **Endpoint:** `POST /teams/`
- **Description:** Create a new team.
- **Request Body:** [`TeamCreate`](#teammodels)
- **Response:** [`TeamOut`](#teammodels)

### List All Teams

- **Endpoint:** `GET /teams/`
- **Description:** Retrieve all teams.
- **Response:** `List[TeamOut]`

### Get Team by ID

- **Endpoint:** `GET /teams/{team_id}`
- **Description:** Retrieve a team by its ID.
- **Response:** [`TeamOut`](#teammodels)

---

## Projects

### Create Project

- **Endpoint:** `POST /projects/`
- **Description:** Create a new project within a team.
- **Request Body:** [`ProjectCreate`](#projectmodels)
- **Response:** [`ProjectOut`](#projectmodels)

### List Projects

- **Endpoint:** `GET /projects/`
- **Description:** List all projects. Optional filtering by `team_id`.
- **Query Parameters:**  
    - `team_id` (optional): `int` (show only projects of the given team)
- **Response:** `List[ProjectOut]`

### Get Project by ID

- **Endpoint:** `GET /projects/{project_id}`
- **Description:** Retrieve a specific project by its ID.
- **Response:** [`ProjectOut`](#projectmodels)

---

## Tasks

### Create Task

- **Endpoint:** `POST /tasks/`
- **Description:** Create a new task within a project.
- **Request Body:** [`TaskCreate`](#taskmodels)
- **Response:** [`TaskOut`](#taskmodels)

### List Tasks

- **Endpoint:** `GET /tasks/`
- **Description:** List all tasks.
- **Query Parameters (Optional):**
    - `project_id`: `int`
    - `assignee_id`: `int`
    - `task_status`: `TaskStatusEnum` (`todo`, `in_progress`, or `done`)
- **Response:** `List[TaskOut]`

### Get Task by ID

- **Endpoint:** `GET /tasks/{task_id}`
- **Description:** Retrieve task by its ID.
- **Response:** [`TaskOut`](#taskmodels)

### Update Task

- **Endpoint:** `PUT /tasks/{task_id}`
- **Description:** Update/edit a task.
- **Request Body:** [`TaskUpdate`](#taskmodels)
- **Response:** [`TaskOut`](#taskmodels)

### Delete Task

- **Endpoint:** `DELETE /tasks/{task_id}`
- **Description:** Delete a task.
- **Response:**  
    ```json
    { "detail": "Task <id> deleted" }
    ```

---

## Health and Miscellaneous

### API and Database Health

- **Endpoint:** `GET /`
- **Description:** Returns health status of the API and DB connection.
- **Response:**  
    ```json
    { "status": "ok", "db_status": "ok" }
    ```
    or
    ```json
    { "status": "ok", "db_status": "unhealthy" }
    ```

### Database Connectivity Check

- **Endpoint:** `GET /health/db`
- **Description:** Check DB connectivity.
- **Response:**
    - Success: `{ "status": "ok" }`
    - Failure: `{ "status": "error", "detail": "<error>" }`

---

# Schemas

## <a name="usermodels"></a>User Schemas

### UserCreate
```json
{
  "email": "user@example.com",
  "username": "johnsmith",
  "password": "rawpassword"
}
```

### UserLogin
```json
{
  "email": "user@example.com",
  "password": "rawpassword"
}
```

### UserOut
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johnsmith",
  "team_id": 2
}
```

---

## <a name="teammodels"></a>Team Schemas

### TeamCreate
```json
{
  "name": "Team name",
  "description": "Description (optional)"
}
```
### TeamOut
```json
{
  "id": 1,
  "name": "Engineering",
  "description": "Engineering team"
}
```

---

## <a name="projectmodels"></a>Project Schemas

### ProjectCreate
```json
{
  "name": "Project X",
  "description": "Project description (optional)",
  "team_id": 1
}
```
### ProjectOut
```json
{
  "id": 1,
  "name": "Project X",
  "description": "Description",
  "team_id": 2
}
```

---

## <a name="taskmodels"></a>Task Schemas

#### `TaskStatusEnum` Values:
  - `"todo"`
  - `"in_progress"`
  - `"done"`

### TaskBase
```json
{
  "title": "Task title",
  "description": "Optional description",
  "due_date": "2024-06-18T18:00:00",
  "status": "todo",
  "project_id": 5,
  "assignee_id": 3
}
```
### TaskCreate
Identical to `TaskBase`.

### TaskUpdate (Partial, all fields optional)
```json
{
  "title": "Optional new title",
  "description": "Optional new description",
  "due_date": "2024-06-20T16:00:00",
  "status": "in_progress",
  "assignee_id": 4
}
```
### TaskOut
Extends `TaskBase` plus:
```json
{
  "id": 11,
  "title": "Do something important",
  "description": "This is the main thing",
  "due_date": "2024-06-20T16:00:00",
  "status": "done",
  "project_id": 5,
  "assignee_id": 3
}
```

---

# Authentication Notes

- **Current Implementation:** Registration and login do NOT use access tokens—only standard sessionless responses returning user info.
- **Security:** When implementing production-level security, consider adding JWT/auth token protection for all endpoints except registration/login/health.

---

# Error Responses

Standard error responses are in the form:
```json
{ "detail": "<error-message>" }
```
with appropriate HTTP status code (400, 401, 404, etc.).

---

# Change Log

_Last updated: 2024-06-18_

Documentation generated directly from the FastAPI backend, version 1.0.0.
