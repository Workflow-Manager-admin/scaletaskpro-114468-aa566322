#!/bin/bash
cd /home/kavia/workspace/code-generation/scaletaskpro-114468-aa566322/fastapi_backend_workspace/fastapi_backend
source venv/bin/activate
flake8 .
LINT_EXIT_CODE=$?
if [ $LINT_EXIT_CODE -ne 0 ]; then
  exit 1
fi

