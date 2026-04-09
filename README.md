# Ajna Command Grid

[![CI](https://github.com/t0683323-dot/ajna-projects/actions/workflows/ci.yml/badge.svg)](https://github.com/t0683323-dot/ajna-projects/actions/workflows/ci.yml)


A public-facing, OGame-inspired strategy dashboard that looks like a lightweight browser game while presenting generalized planning guidance.

## Controls
- `Enter` or click to start
- `Up/Down` select structure
- `Enter` upgrade selected
- `I` toggle advisor guidance
- `R` pull resources (collect a 10-second production burst; 10 s cooldown)
- `G` push build (spend resources to halve the current build queue timer)
- `P` pause/resume
- `F` fullscreen toggle

## Running
Serve the folder with any static file server:

```bash
python3 -m http.server 5173
```

Then open `http://localhost:5173` in a browser.
