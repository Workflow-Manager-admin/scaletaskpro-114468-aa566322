#!/bin/bash
cd /home/kavia/workspace/code-generation/scaletaskpro-114468-aa566322/react_frontend_workspace/react_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

