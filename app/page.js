"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, FolderOpen, Trash2 } from "lucide-react";

// Local storage helpers
const STORAGE_KEYS = {
  projects: 'projects',
  project: (id) => `project:${id}`,
};

const uid = () => Math.random().toString(36).slice(2, 10);

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function listProjects() {
  return readJSON(STORAGE_KEYS.projects, []);
}

function saveProject(project) {
  project.updatedAt = Date.now();
  writeJSON(STORAGE_KEYS.project(project.id), project);
  const list = listProjects();
  const idx = list.findIndex((p) => p.id === project.id);
  const meta = { id: project.id, name: project.name, createdAt: project.createdAt, updatedAt: project.updatedAt };
  if (idx === -1) list.push(meta);
  else list[idx] = meta;
  writeJSON(STORAGE_KEYS.projects, list);
}

function createProject(name) {
  const id = uid();
  const ts = Date.now();
  const project = {
    id,
    name: name || 'Untitled',
    createdAt: ts,
    updatedAt: ts,
    characters: [],
    scenes: [],
    research: { notes: [], links: [], images: [] },
  };
  saveProject(project);
  return project;
}

function deleteProjectMeta(id) {
  const list = listProjects().filter((p) => p.id !== id);
  writeJSON(STORAGE_KEYS.projects, list);
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    setProjects(listProjects().sort((a, b) => b.updatedAt - a.updatedAt));
  }, []);

  function refresh() {
    setProjects(listProjects().sort((a, b) => b.updatedAt - a.updatedAt));
  }

  function onNewProject() {
    const name = prompt('Project name?') || 'Untitled';
    const proj = createProject(name);
    refresh();
    router.push(`/project/${proj.id}`);
  }

  const [deleteId, setDeleteId] = useState(null);
  function onDelete() {
    if (!deleteId) return;
    localStorage.removeItem(STORAGE_KEYS.project(deleteId));
    deleteProjectMeta(deleteId);
    setDeleteId(null);
    refresh();
  }

  return (
    <>
      <header className="app-header">
        <h1>Story Maker</h1>
        <div className="header-actions">
          <Button onClick={onNewProject}><Plus className="mr-2 h-4 w-4"/> New Project</Button>
        </div>
      </header>

      <main id="dashboardView" className="view">
        <section className="projects-grid">
          {projects.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle className="project-card-title">{p.name || 'Untitled'}</CardTitle>
                <CardDescription>Updated {timeAgo(p.updatedAt)}</CardDescription>
              </CardHeader>
              <CardFooter className="gap-2">
                <Button variant="secondary" onClick={() => router.push(`/project/${p.id}`)}>
                  <FolderOpen className="mr-2 h-4 w-4"/> Open
                </Button>
                <Button variant="destructive" onClick={() => setDeleteId(p.id)}>
                  <Trash2 className="mr-2 h-4 w-4"/> Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </section>
      </main>

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete project?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This removes the project from your browser storage. This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={onDelete}><Trash2 className="mr-2 h-4 w-4"/> Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
