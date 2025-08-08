"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Focus, PanelLeft, Plus, Trash2 } from "lucide-react";

// Storage helpers (client-only usage)
const STORAGE_KEYS = { projects: 'projects', project: (id) => `project:${id}` };
const uid = () => Math.random().toString(36).slice(2, 10);
const readJSON = (key, fallback) => {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
};
const writeJSON = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const saveProjectMeta = (project) => {
  const list = readJSON(STORAGE_KEYS.projects, []);
  const idx = list.findIndex((p) => p.id === project.id);
  const meta = { id: project.id, name: project.name, createdAt: project.createdAt, updatedAt: project.updatedAt };
  if (idx === -1) list.push(meta); else list[idx] = meta;
  writeJSON(STORAGE_KEYS.projects, list);
};

function saveProject(project) {
  project.updatedAt = Date.now();
  writeJSON(STORAGE_KEYS.project(project.id), project);
  saveProjectMeta(project);
}

export default function ProjectPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [project, setProject] = useState(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState(null);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [mainTab, setMainTab] = useState('draft');
  const [sidebarTab, setSidebarTab] = useState('characters');

  useEffect(() => {
    if (!id) return;
    const proj = readJSON(STORAGE_KEYS.project(id), null);
    if (!proj) {
      router.replace('/');
      return;
    }
    setProject(proj);
  }, [id, router]);

  useEffect(() => {
    document.body.classList.toggle('focus-mode', focusMode);
    return () => document.body.classList.remove('focus-mode');
  }, [focusMode]);

  const updateProject = (updater) => {
    setProject((prev) => {
      if (!prev) return prev;
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveProject(next);
      return { ...next };
    });
  };

  useEffect(() => {
    const onReq = (e) => setConfirm(e.detail);
    document.addEventListener('request-delete', onReq);
    return () => document.removeEventListener('request-delete', onReq);
  }, []);

  if (!project) return null;

  const [confirm, setConfirm] = useState(null); // { type: 'scene'|'character', id, title }

  return (
    <main id="projectView" className="view">
      <div className="project-topbar">
        <Button variant="ghost" onClick={() => router.push('/')}> <ArrowLeft className="mr-2 h-4 w-4"/> All Projects</Button>
        <div className="project-title-wrap">
          <Input className="project-title" value={project.name || ''} onChange={(e) => updateProject({ ...project, name: e.target.value || 'Untitled' })} placeholder="Untitled Project" />
        </div>
        <div className="topbar-actions">
          <Button variant="ghost" onClick={() => setFocusMode((v) => !v)}><Focus className="mr-2 h-4 w-4"/> Focus Mode</Button>
          <Button variant="ghost" onClick={() => setSidebarHidden((v) => !v)}><PanelLeft className="mr-2 h-4 w-4"/> Toggle Sidebar</Button>
        </div>
      </div>

      <div className="workspace">
        {!sidebarHidden && (
          <Sidebar
            tab={sidebarTab}
            setTab={setSidebarTab}
            project={project}
            onProjectChange={updateProject}
            selectedCharacterId={selectedCharacterId}
            onSelectCharacter={setSelectedCharacterId}
          />
        )}

        <MainPane
          tab={mainTab}
          setTab={setMainTab}
          project={project}
          onProjectChange={updateProject}
        />

        {!sidebarHidden && (
          <DetailPane
            project={project}
            onProjectChange={updateProject}
            selectedCharacterId={selectedCharacterId}
            onSelectCharacter={setSelectedCharacterId}
            onConfirmDelete={(payload) => setConfirm(payload)}
          />
        )}
      </div>

      {/* Global confirm dialog for deletes */}
      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {confirm?.type}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              if (!confirm) return;
              if (confirm.type === 'scene') {
                const scenes = project.scenes.filter((s) => s.id !== confirm.id);
                updateProject({ ...project, scenes });
              } else if (confirm.type === 'character') {
                const characters = project.characters.filter((c) => c.id !== confirm.id);
                updateProject({ ...project, characters });
                if (selectedCharacterId === confirm.id) setSelectedCharacterId(null);
              }
              setConfirm(null);
            }}><Trash2 className="mr-2 h-4 w-4"/> Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Sidebar({ tab, setTab, project, onProjectChange, selectedCharacterId, onSelectCharacter }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger className="flex-1" value="characters">Characters</TabsTrigger>
            <TabsTrigger className="flex-1" value="research">Research</TabsTrigger>
          </TabsList>
          <TabsContent value="characters">
            <div className="list-header mt-2">
              <h3>Characters</h3>
              <Button size="sm" variant="secondary" onClick={() => {
                const ch = { id: uid(), name: 'New Character', age: '', appearance: '', flaws: '', goals: '', arc: '', imageIds: [] };
                onProjectChange({ ...project, characters: [...project.characters, ch] });
                onSelectCharacter(ch.id);
              }}><Plus className="mr-1.5 h-4 w-4"/> Add</Button>
            </div>
            <ScrollArea className="h-[calc(100vh-220px)] pr-2">
              <ul className="item-list">
                {project.characters.map((ch) => (
                  <li key={ch.id} className="character-item" onClick={() => onSelectCharacter(ch.id)}>
                    <span className="name">{ch.name || 'Unnamed'}</span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="research">
            <Research project={project} onProjectChange={onProjectChange} />
          </TabsContent>
        </Tabs>
      </div>
    </aside>
  );
}

function Research({ project, onProjectChange }) {
  const fileRef = useRef(null);
  const [link, setLink] = useState('');

  function addNote() {
    onProjectChange({ ...project, research: { ...project.research, notes: [...project.research.notes, { id: uid(), text: 'New note' }] } });
  }

  function updateNote(id, text) {
    onProjectChange({ ...project, research: { ...project.research, notes: project.research.notes.map((n) => n.id === id ? { ...n, text } : n) } });
  }

  function deleteNote(id) {
    onProjectChange({ ...project, research: { ...project.research, notes: project.research.notes.filter((n) => n.id !== id) } });
  }

  function addLink() {
    const url = (link || '').trim();
    if (!url) return;
    onProjectChange({ ...project, research: { ...project.research, links: [...project.research.links, { id: uid(), url }] } });
    setLink('');
  }

  async function onFilesChange(e) {
    const files = Array.from(e.target.files || []);
    const imgs = [...project.research.images];
    for (const f of files) {
      const dataUrl = await fileToDataURL(f);
      imgs.push({ id: uid(), name: f.name, dataUrl });
    }
    onProjectChange({ ...project, research: { ...project.research, images: imgs } });
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="research-sections">
      <div className="research-block">
        <h4>Notes</h4>
        <Button size="sm" variant="secondary" onClick={addNote}>+ Note</Button>
        <ul className="item-list">
          {project.research.notes.map((n) => (
            <li key={n.id}>
              <div contentEditable suppressContentEditableWarning className="note-text" onInput={(e) => updateNote(n.id, e.currentTarget.textContent || '')}>{n.text}</div>
              <div className="row justify-end mt-1.5">
                <Button size="sm" variant="destructive" onClick={() => deleteNote(n.id)}>Delete</Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="research-block">
        <h4>Links</h4>
        <div className="row">
          <Input placeholder="https://example.com" value={link} onChange={(e) => setLink(e.target.value)} />
          <Button size="sm" variant="secondary" onClick={addLink}>Add</Button>
        </div>
        <ul className="item-list">
          {project.research.links.map((l) => (
            <li key={l.id}>
              <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <a href={l.url} target="_blank" rel="noopener noreferrer">{l.url}</a>
                <Button size="sm" variant="destructive" onClick={() => onProjectChange({ ...project, research: { ...project.research, links: project.research.links.filter((x) => x.id !== l.id) } })}>Delete</Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="research-block">
        <h4>Images</h4>
        <input type="file" accept="image/*" multiple ref={fileRef} onChange={onFilesChange} />
        <div className="images-grid">
          {project.research.images.map((img) => (
            <div
              key={img.id}
              className="image-thumb"
              style={{ backgroundImage: `url(${img.dataUrl})` }}
              draggable
              title="Drag onto a scene or character to attach"
              onDragStart={(e) => {
                e.dataTransfer.setData('text/x-image-id', img.id);
                e.dataTransfer.effectAllowed = 'copy';
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MainPane({ tab, setTab, project, onProjectChange }) {
  return (
    <section className="main-pane">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="corkboard">Corkboard</TabsTrigger>
        </TabsList>
        <TabsContent value="draft">
          <DraftView project={project} onProjectChange={onProjectChange} />
        </TabsContent>
        <TabsContent value="corkboard">
          <CorkboardView project={project} onProjectChange={onProjectChange} />
        </TabsContent>
      </Tabs>
    </section>
  );
}

function DraftView({ project, onProjectChange }) {
  function addScene() {
    const scenes = [...project.scenes, { id: uid(), title: 'New Scene', text: '<p></p>', imageIds: [] }];
    onProjectChange({ ...project, scenes });
  }

  function updateScene(sceneId, changes) {
    const scenes = project.scenes.map((s) => (s.id === sceneId ? { ...s, ...changes } : s));
    onProjectChange({ ...project, scenes });
  }

  function deleteScene(sceneId) {
    if (!confirm('Delete scene?')) return;
    const scenes = project.scenes.filter((s) => s.id !== sceneId);
    onProjectChange({ ...project, scenes });
  }

  function reorderScene(draggedId, targetId) {
    const arr = [...project.scenes];
    const from = arr.findIndex((s) => s.id === draggedId);
    const to = arr.findIndex((s) => s.id === targetId);
    if (from === -1 || to === -1) return;
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    onProjectChange({ ...project, scenes: arr });
  }

  return (
    <div id="draftPanel" className="main-panel active">
      <div className="list-header">
        <h3>Scenes</h3>
        <Button size="sm" variant="secondary" onClick={addScene}><Plus className="mr-1.5 h-4 w-4"/> Scene</Button>
      </div>
      <div className="scenes-draft">
        {project.scenes.map((scene) => (
          <div
            key={scene.id}
            className="scene-block"
            draggable
            onDragStart={(e) => { e.dataTransfer.setData('text/x-scene-id', scene.id); e.dataTransfer.effectAllowed = 'move'; }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const draggedId = e.dataTransfer.getData('text/x-scene-id');
              if (draggedId && draggedId !== scene.id) reorderScene(draggedId, scene.id);
            }}
          >
            <div className="scene-header">
              <Input className="scene-title" value={scene.title || ''} onChange={(e) => updateScene(scene.id, { title: e.target.value })} placeholder="Scene title" />
              <Button variant="destructive" size="sm" className="delete-scene" onClick={(e) => {
                // delegate to global confirm dialog via custom event
                const ev = new CustomEvent('request-delete', { detail: { type: 'scene', id: scene.id, title: scene.title } });
                document.dispatchEvent(ev);
              }}><Trash2 className="h-4 w-4"/></Button>
            </div>
            <div
              className="scene-editor"
              contentEditable
              suppressContentEditableWarning
              spellCheck
              dangerouslySetInnerHTML={{ __html: scene.text || '' }}
              onInput={(e) => updateScene(scene.id, { text: e.currentTarget.innerHTML })}
            />
            <Droppable accepts="image" onDropValue={(imageId) => {
              const imageIds = scene.imageIds || [];
              if (!imageIds.includes(imageId)) imageIds.push(imageId);
              updateScene(scene.id, { imageIds: [...imageIds] });
            }}>
              <AttachedImages project={project} imageIds={scene.imageIds || []} />
            </Droppable>
          </div>
        ))}
      </div>
    </div>
  );
}

function CorkboardView({ project, onProjectChange }) {
  function reorderScene(draggedId, targetId) {
    const arr = [...project.scenes];
    const from = arr.findIndex((s) => s.id === draggedId);
    const to = arr.findIndex((s) => s.id === targetId);
    if (from === -1 || to === -1) return;
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    onProjectChange({ ...project, scenes: arr });
  }

  function updateScene(sceneId, changes) {
    const scenes = project.scenes.map((s) => (s.id === sceneId ? { ...s, ...changes } : s));
    onProjectChange({ ...project, scenes });
  }

  return (
    <div id="corkboardPanel" className="main-panel active">
      <div className="list-header"><h3>Corkboard</h3></div>
      <div className="corkboard" aria-label="Drag to reorder scenes">
        {project.scenes.map((scene) => (
          <Droppable key={scene.id} accepts="image" onDropValue={(imageId) => {
            const imageIds = scene.imageIds || [];
            if (!imageIds.includes(imageId)) imageIds.push(imageId);
            updateScene(scene.id, { imageIds: [...imageIds] });
          }}>
            <div
              className="scene-card"
              draggable
              onDragStart={(e) => { e.dataTransfer.setData('text/x-scene-id', scene.id); e.dataTransfer.effectAllowed = 'move'; }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const draggedId = e.dataTransfer.getData('text/x-scene-id');
                if (draggedId && draggedId !== scene.id) reorderScene(draggedId, scene.id);
              }}
            >
              <div
                className="scene-card-title"
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => updateScene(scene.id, { title: e.currentTarget.textContent || '' })}
              >{scene.title || 'Untitled Scene'}</div>
              <div className="scene-card-meta">{countWords(stripHtml(scene.text || ''))} words</div>
            </div>
          </Droppable>
        ))}
      </div>
    </div>
  );
}

function DetailPane({ project, onProjectChange, selectedCharacterId, onSelectCharacter, onConfirmDelete }) {
  const ch = useMemo(() => project.characters.find((c) => c.id === selectedCharacterId) || null, [project, selectedCharacterId]);
  if (!ch) return <aside className="detail-pane"/>;
  return (
    <aside className="detail-pane">
      <div id="characterDetail" className="detail-panel" data-droptarget="character">
        <div className="detail-header">
          <h3>Character</h3>
          <Button variant="destructive" size="sm" onClick={() => onConfirmDelete({ type: 'character', id: ch.id, title: ch.name })}>Delete</Button>
        </div>
        <div className="detail-body">
          <div className="form-grid">
            <label>Name<Input value={ch.name || ''} onChange={(e) => patchCharacter(project, onProjectChange, ch.id, { name: e.target.value })} /></label>
            <label>Age<Input type="number" min="0" value={ch.age || ''} onChange={(e) => patchCharacter(project, onProjectChange, ch.id, { age: e.target.value })} /></label>
            <label>Appearance<Textarea value={ch.appearance || ''} onChange={(e) => patchCharacter(project, onProjectChange, ch.id, { appearance: e.target.value })} /></label>
            <label>Flaws<Textarea value={ch.flaws || ''} onChange={(e) => patchCharacter(project, onProjectChange, ch.id, { flaws: e.target.value })} /></label>
            <label>Goals<Textarea value={ch.goals || ''} onChange={(e) => patchCharacter(project, onProjectChange, ch.id, { goals: e.target.value })} /></label>
            <label>Arc<Textarea value={ch.arc || ''} onChange={(e) => patchCharacter(project, onProjectChange, ch.id, { arc: e.target.value })} /></label>
          </div>
          <div>
            <h4>Attached Images</h4>
            <Droppable accepts="image" onDropValue={(imageId) => {
              const imageIds = ch.imageIds || [];
              if (!imageIds.includes(imageId)) imageIds.push(imageId);
              patchCharacter(project, onProjectChange, ch.id, { imageIds: [...imageIds] });
            }}>
              <div className="images-row">
                <AttachedImages project={project} imageIds={ch.imageIds || []} />
              </div>
            </Droppable>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Droppable({ accepts, onDropValue, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onDragOver = (e) => {
      const types = e.dataTransfer?.types || [];
      const hasImage = Array.from(types).includes('text/x-image-id');
      if (accepts === 'image' && hasImage) { e.preventDefault(); el.classList.add('dragover'); }
    };
    const onLeave = () => el.classList.remove('dragover');
    const onDrop = (e) => {
      el.classList.remove('dragover');
      const id = e.dataTransfer.getData('text/x-image-id');
      if (id) onDropValue(id);
    };
    el.addEventListener('dragover', onDragOver);
    el.addEventListener('dragleave', onLeave);
    el.addEventListener('drop', onDrop);
    return () => {
      el.removeEventListener('dragover', onDragOver);
      el.removeEventListener('dragleave', onLeave);
      el.removeEventListener('drop', onDrop);
    };
  }, [accepts, onDropValue]);
  return <div ref={ref} className="droppable">{children}</div>;
}

function AttachedImages({ project, imageIds }) {
  const imgs = project.research.images;
  return (
    <>
      {(imageIds || []).map((id) => {
        const img = imgs.find((i) => i.id === id);
        if (!img) return null;
        return <div key={id} className="image-thumb" style={{ backgroundImage: `url(${img.dataUrl})` }} />;
      })}
    </>
  );
}

function patchCharacter(project, onProjectChange, id, changes) {
  const characters = project.characters.map((c) => (c.id === id ? { ...c, ...changes } : c));
  onProjectChange({ ...project, characters });
}

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html; return div.textContent || div.innerText || '';
}
function countWords(text) { return (text.trim().match(/\b\w+\b/g) || []).length; }
function fileToDataURL(file) {
  return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file); });
}
