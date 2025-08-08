# Story Maker (MVP) — Next.js

A minimal story planning and writing app built with Next.js (App Router). Data is stored locally in your browser via `localStorage`.

## Features (Phase 1 MVP)
- Project dashboard: create, open, delete story projects.
- Minimalist workspace: writing-focused editor with optional Focus Mode.
- Characters (Story Bible): add profiles with fields and attach images.
- Visual outline (Corkboard): drag-and-drop scene cards to reorder.
- Draft view: scenes render as editable blocks; reordering stays in sync with corkboard.
- Research hub: notes, links, and images stored per project; drag images onto scenes or characters to link them visually.
- Local persistence: data is saved to `localStorage` in your browser.

## Getting Started (Next.js)
- Install dependencies: `npm install`
- Dev server: `npm run dev` then open `http://localhost:3000`
- Build: `npm run build`
- Start production server: `npm start`

## Key UI Areas
- Dashboard: shows all projects as cards.
- Workspace:
  - Left sidebar: Characters and Research tabs (toggleable).
  - Main pane tabs: Draft (scenes) and Corkboard (cards) views.
  - Right detail pane: character profile editor.

## Focus Mode
- Click “Focus Mode” to blur the interface and emphasize the active paragraph you’re editing.
- The current paragraph in the scene editor is highlighted; others dim.

## Scenes and Sync
- Draft view: each scene has a title and a rich text area.
- Corkboard: drag cards to reorder; the Draft scenes update immediately.
- You can also drag scene blocks within Draft to reorder.

## Research Linking
- Upload images under Research → Images.
- Drag an image thumbnail from Research onto a scene card, a scene’s “Attached Images” row, or the character detail’s “Attached Images” row.

## Data Model
- Projects are stored under `project:<id>` in `localStorage`.
- Images are stored as data URLs inside the project. Avoid very large images to keep storage under browser limits.

## Known Limitations
- No authentication or cloud sync in this MVP.
- Images are embedded as data URLs; large libraries may exceed storage.
- No export/import yet.

## Next Ideas
- Export/import projects (JSON, Markdown/Docx/PDF).
- Global search, tags, and filters.
- Scene statuses, color labels, and metadata.
- Autosave indicators and per-field undo history.
- Optional backend with multi-device sync.

---
Tech: Next.js 14 (App Router), React 18, Tailwind CSS, shadcn/ui.

### Styling
- Tailwind configured via `tailwind.config.js` and `postcss.config.js`.
- shadcn/ui components live in `components/ui/*` and use CSS variables defined in `app/globals.css`.
