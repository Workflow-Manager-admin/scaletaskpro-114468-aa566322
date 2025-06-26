from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import schemas, models, database


router = APIRouter(
    prefix="/tasks",
    tags=["Tasks"]
)


# PUBLIC_INTERFACE
@router.post(
    "/",
    response_model=schemas.TaskOut,
    summary="Create task",
    description="Create a new task in a project"
)
def create_task(task: schemas.TaskCreate, db: Session = Depends(database.get_db)):
    project = db.query(models.Project).filter(models.Project.id == task.project_id).first()
    if not project:
        raise HTTPException(
            status_code=400, detail="Project does not exist"
        )
    db_task = models.Task(**task.dict())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


# PUBLIC_INTERFACE
@router.get(
    "/",
    response_model=list[schemas.TaskOut],
    summary="List tasks",
    description="List all tasks (optionally filter by project, status, or assignee)"
)
def list_tasks(
    project_id: int = None,
    assignee_id: int = None,
    task_status: schemas.TaskStatusEnum = None,
    db: Session = Depends(database.get_db)
):
    q = db.query(models.Task)
    if project_id:
        q = q.filter(models.Task.project_id == project_id)
    if assignee_id:
        q = q.filter(models.Task.assignee_id == assignee_id)
    if task_status:
        q = q.filter(models.Task.status == task_status)
    return q.all()


# PUBLIC_INTERFACE
@router.get(
    "/{task_id}",
    response_model=schemas.TaskOut,
    summary="Get task",
    description="Get a task by its ID"
)
def get_task(task_id: int, db: Session = Depends(database.get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=404, detail="Task not found"
        )
    return task


# PUBLIC_INTERFACE
@router.put(
    "/{task_id}",
    response_model=schemas.TaskOut,
    summary="Update task",
    description="Edit/update a task"
)
def update_task(task_id: int, task: schemas.TaskUpdate, db: Session = Depends(database.get_db)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(
            status_code=404, detail="Task not found"
        )
    for k, v in task.dict(exclude_unset=True).items():
        setattr(db_task, k, v)
    db.commit()
    db.refresh(db_task)
    return db_task


# PUBLIC_INTERFACE
@router.delete(
    "/{task_id}",
    response_model=dict,
    summary="Delete task",
    description="Delete a task by its ID"
)
def delete_task(task_id: int, db: Session = Depends(database.get_db)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(
            status_code=404, detail="Task not found"
        )
    db.delete(db_task)
    db.commit()
    return {"detail": f"Task {task_id} deleted"}
