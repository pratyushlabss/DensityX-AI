#!/usr/bin/env python
"""Wrapper to run uvicorn from backend directory."""
import sys
import os

# Set up path
backend_dir = "/Users/pratyush/git/DensityX-AI/backend"
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Change to backend directory
os.chdir(backend_dir)

# Run uvicorn
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False
    )
