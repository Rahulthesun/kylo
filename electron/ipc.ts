// electron/ipc.ts
// Registers all IPC handlers in the main process.
// The renderer calls window.kylo.* (defined in preload.ts) which maps to these.

import { ipcMain } from 'electron';
import * as store from './db/store';
import { syncWorker } from './sync/worker';

export function registerIpcHandlers() {

  // ── Projects ────────────────────────────────────────────────────────────────

  ipcMain.handle('projects:list', (_e, userId: string) => {
    return store.getProjects(userId);
  });

  ipcMain.handle('projects:create', (_e, userId: string, input: { name: string; color?: string }) => {
    return store.createProject(userId, input);
  });

  ipcMain.handle('projects:update', (_e, id: string, input: { name?: string; color?: string }) => {
    return store.updateProject(id, input);
  });

  ipcMain.handle('projects:delete', (_e, id: string) => {
    return store.deleteProject(id);
  });

  // ── Tasks ────────────────────────────────────────────────────────────────────

  ipcMain.handle('tasks:list', (_e, userId: string) => {
    return store.getTasks(userId);
  });

  ipcMain.handle('tasks:create', (_e, userId: string, projectId: string, input: {
    title: string;
    estimatedMinutes?: number;
    deadline?: string;
    important?: boolean;
  }) => {
    return store.createTask(userId, projectId, input);
  });

  ipcMain.handle('tasks:update', (_e, id: string, input: {
    title?: string;
    done?: boolean;
    important?: boolean;
    estimatedMinutes?: number;
    deadline?: string;
  }) => {
    return store.updateTask(id, input);
  });

  ipcMain.handle('tasks:delete', (_e, id: string) => {
    return store.deleteTask(id);
  });

  // ── Subtasks ─────────────────────────────────────────────────────────────────

  ipcMain.handle('subtasks:create', (_e, taskId: string, title: string) => {
    return store.createSubtask(taskId, title);
  });

  ipcMain.handle('subtasks:update', (_e, id: string, input: { title?: string; done?: boolean }) => {
    return store.updateSubtask(id, input);
  });

  ipcMain.handle('subtasks:delete', (_e, id: string) => {
    return store.deleteSubtask(id);
  });

  // ── Sync ──────────────────────────────────────────────────────────────────────

  ipcMain.handle('sync:trigger', () => {
    syncWorker.runCycle();
  });

  ipcMain.handle('sync:pending-count', () => {
    return store.getPendingCount();
  });
}