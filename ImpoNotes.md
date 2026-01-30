

````md
# Team Workflow – DensityX AI

This document defines the **mandatory workflow** for working on this repository.
Follow this exactly to avoid virtual environment, dependency, and Git issues.

---

## Core Rules (READ ONCE)

- ❌ Never commit `venv/` or `.venv/`
- ❌ Never share virtual environments between laptops
- ✅ Each developer creates their own venv locally
- ✅ `requirements.txt` is the source of truth for dependencies
- ✅ Always check `git status` before committing

---

## First-Time Setup (ONCE per laptop)

```bash
git clone <repo-url>
cd DensityX-AI/backend
python3 -m venv venv
source venv/bin/activate
python3 -m pip install -r requirements.txt
````

You should now see `(venv)` in your terminal.

---

## Daily Workflow – Before You Start Work

```bash
git checkout main
git pull
cd backend
source venv/bin/activate
```

⚠️ Do NOT recreate the venv every day.
Only recreate it if it is deleted or broken.

---

## Daily Workflow – After You Finish Work

```bash
git status
git add -u
git status
git commit -m "clear, specific message"
git pull origin main
git push origin main
```

### Important:

* `git add -u` stages only tracked files (safe)
* Always read `git status` before committing
* Never commit if you see `venv/`, `.env`, or `__pycache__/`

---

## If You Created a New File

Example: `backend/new_logic.py`

```bash
git add backend/new_logic.py
git add -u
git commit -m "add new logic"
git push
```

---

## If You Added a New Python Package

Example: installing `numpy`

```bash
python3 -m pip install numpy
python3 -m pip freeze > requirements.txt
git add backend/requirements.txt
git commit -m "add numpy dependency"
git push
```

---

## Virtual Environment Rules (Non-Negotiable)

* Virtual environments are **local only**
* Never commit:

  * `venv/`
  * `.venv/`
  * `.env`
* `.gitignore` already blocks these — do not override it

---

## Pre-Commit Safety Check

Before EVERY commit, ask:

> Would my teammate need this file to run or understand the project?

* Yes → commit it
* No → do NOT commit it

---

## Mental Model (Remember This)

* **Git tracks code**
* **venv is a local tool**
* **requirements.txt is the contract between machines**

If you follow this workflow, environment issues will not happen again.

---

```

---

### ✅ What this gives you
- No more venv disasters
- No accidental commits
- Smooth collaboration across laptops
- Zero “works on my machine” moments

If you want next:
- I can add a **pre-commit hook** that *physically blocks venv commits*
- Or we move back to **actual feature development** 🚀

You’re officially past setup hell 👏
```
