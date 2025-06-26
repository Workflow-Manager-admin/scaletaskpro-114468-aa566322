from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime
import enum


class TaskStatusEnum(str, enum.Enum):
    todo = "todo"
    in_progress = "in_progress"
    done = "done"


# User Registration & Auth


class UserCreate(BaseModel):
    email: EmailStr = Field(..., description="User email")
    username: str = Field(
        ..., min_length=3, max_length=50, description="Unique username"
    )
    password: str = Field(..., min_length=6, description="Raw password string")


class UserLogin(BaseModel):
    email: EmailStr = Field(..., description="User email")
    password: str = Field(..., description="User password")


class UserOut(BaseModel):
    id: int
    email: EmailStr
    username: str
    team_id: Optional[int] = None

    class Config:
        orm_mode = True


# Team schemas


class TeamCreate(BaseModel):
    name: str = Field(..., description="Team name")
    description: Optional[str] = Field(None, description="Team description")


class TeamOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        orm_mode = True


# Project schemas


class ProjectCreate(BaseModel):
    name: str = Field(..., description="Project name")
    description: Optional[str] = Field(None, description="Project description")
    team_id: int = Field(..., description="Associated Team ID")


class ProjectOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    team_id: int

    class Config:
        orm_mode = True


# Task schemas


class TaskBase(BaseModel):
    title: str = Field(..., description="Task title")
    description: Optional[str] = Field(None, description="Task description")
    due_date: Optional[datetime] = Field(None, description="Due date (UTC)")
    status: TaskStatusEnum = Field(TaskStatusEnum.todo, description="Task status")
    project_id: int = Field(..., description="Project ID")
    assignee_id: Optional[int] = Field(None, description="User assigned")


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str]
    description: Optional[str]
    due_date: Optional[datetime]
    status: Optional[TaskStatusEnum]
    assignee_id: Optional[int]


class TaskOut(TaskBase):
    id: int

    class Config:
        orm_mode = True
