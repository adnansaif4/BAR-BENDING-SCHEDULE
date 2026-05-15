import type { Project } from "@/types/bbs";
const KEY = "indian-bbs-generator-projects";
export function loadProjects(): Project[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as Project[]; } catch { return []; }
}
export function saveProject(project: Project): Project[] {
  const projects = loadProjects().filter((item) => item.id !== project.id);
  const next = [project, ...projects].slice(0, 50);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
export function duplicateProject(project: Project): Project {
  const now = new Date().toISOString();
  return { ...project, id: crypto.randomUUID(), projectName: `${project.projectName} copy`, createdAt: now, updatedAt: now };
}
