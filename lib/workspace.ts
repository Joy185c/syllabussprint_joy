// Workspace ID management — no auth, scoped by browser localStorage
const WORKSPACE_KEY = 'syllabus_sprint_workspace_id';

export function getWorkspaceId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(WORKSPACE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(WORKSPACE_KEY, id);
  }
  return id;
}

export function clearWorkspace(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(WORKSPACE_KEY);
}

export function resetWorkspace(): string {
  clearWorkspace();
  return getWorkspaceId();
}
