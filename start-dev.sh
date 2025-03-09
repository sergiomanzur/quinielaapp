#!/bin/bash
echo "Starting development environment..."
echo "Starting backend server on port 3000..."
node api/index.js &
BACKEND_PID=$!

echo "Starting frontend server..."
npm run dev:frontend &
FRONTEND_PID=$!

# Handle proper shutdown
trap "kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM EXIT

# Wait for both processes
wait
