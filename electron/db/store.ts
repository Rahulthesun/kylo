// electron/db/store.ts

import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import { getDb } from './client';
import { projects, tasks, subtasks, syncQueue, meta } from './schema';
import type { SyncStatus } from './schema';

function uuid(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export function getProjects(userId: string) {
  const db = getDb();
  return db
    .select()
    .from(projects)
    .where(and(eq(projects.userId, userId), isNull(projects.deletedAt)))
    .orderBy(desc(projects.createdAt))
    .all();
}

export function createProject(userId: string, input: { name: string; color?: string }) {
  const db = getDb();
  const project = {
    id: uuid(),
    userId,
    name: input.name,
    color: input.color ?? '#C8F135',
    createdAt: now(),
    updatedAt: now(),
    deletedAt: null as string | null,
    syncStatus: 'pending' as SyncStatus,
    syncError: null as string | null,
  };

  db.transaction((tx) => {
    tx.insert(projects).values(project).run();
    tx.insert(syncQueue).values({
      id: uuid(),
      entityType: 'project',
      entityId: project.id,
      operation: 'insert',
      payload: JSON.stringify(project),
      createdAt: now(),
    }).run();
  });

  return project;
}

export function updateProject(id: string, input: Partial<{ name: string; color: string }>) {
  const db = getDb();
  const updated = { ...input, updatedAt: now(), syncStatus: 'pending' as SyncStatus };

  db.transaction((tx) => {
    tx.update(projects).set(updated).where(eq(projects.id, id)).run();
    const row = tx.select().from(projects).where(eq(projects.id, id)).get();
    if (row) {
      tx.insert(syncQueue).values({
        id: uuid(),
        entityType: 'project',
        entityId: id,
        operation: 'update',
        payload: JSON.stringify(row),
        createdAt: now(),
      }).run();
    }
  });
}

export function deleteProject(id: string) {
  const db = getDb();
  const ts = now();

  db.transaction((tx) => {
    tx.update(projects)
      .set({ deletedAt: ts, updatedAt: ts, syncStatus: 'pending' })
      .where(eq(projects.id, id))
      .run();
    tx.update(tasks)
      .set({ deletedAt: ts, updatedAt: ts, syncStatus: 'pending' })
      .where(eq(tasks.projectId, id))
      .run();
    tx.insert(syncQueue).values({
      id: uuid(),
      entityType: 'project',
      entityId: id,
      operation: 'delete',
      payload: JSON.stringify({ id, deletedAt: ts }),
      createdAt: now(),
    }).run();
  });
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export function getTasks(userId: string) {
  const db = getDb();

  const allTasks = db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), isNull(tasks.deletedAt)))
    .orderBy(desc(tasks.createdAt))
    .all();

  const allSubtasks = db
    .select()
    .from(subtasks)
    .where(isNull(subtasks.deletedAt))
    .all();

  return allTasks.map((task) => ({
    ...task,
    // snake_case aliases so existing React components don't break
    project_id: task.projectId,
    user_id: task.userId,
    estimated_minutes: task.estimatedMinutes,
    subtasks: allSubtasks
      .filter((st) => st.taskId === task.id)
      .map((st) => ({ ...st, task_id: st.taskId })),
  }));
}

export function createTask(
  userId: string,
  projectId: string,
  input: {
    title: string;
    estimatedMinutes?: number;
    deadline?: string;
    important?: boolean;
  }
) {
  const db = getDb();
  const task = {
    id: uuid(),
    userId,
    projectId,
    title: input.title,
    estimatedMinutes: input.estimatedMinutes ?? 25,
    deadline: input.deadline ?? null as string | null,
    important: input.important ?? false,
    done: false,
    createdAt: now(),
    updatedAt: now(),
    deletedAt: null as string | null,
    syncStatus: 'pending' as SyncStatus,
    syncError: null as string | null,
  };

  db.transaction((tx) => {
    tx.insert(tasks).values(task).run();
    tx.insert(syncQueue).values({
      id: uuid(),
      entityType: 'task',
      entityId: task.id,
      operation: 'insert',
      payload: JSON.stringify(task),
      createdAt: now(),
    }).run();
  });

  return {
    ...task,
    project_id: task.projectId,
    user_id: task.userId,
    estimated_minutes: task.estimatedMinutes,
    subtasks: [] as any[],
  };
}

export function updateTask(
  id: string,
  input: Partial<{
    title: string;
    done: boolean;
    important: boolean;
    estimatedMinutes: number;
    deadline: string;
  }>
) {
  const db = getDb();
  const updated = { ...input, updatedAt: now(), syncStatus: 'pending' as SyncStatus };

  db.transaction((tx) => {
    tx.update(tasks).set(updated).where(eq(tasks.id, id)).run();
    const row = tx.select().from(tasks).where(eq(tasks.id, id)).get();
    if (row) {
      tx.insert(syncQueue).values({
        id: uuid(),
        entityType: 'task',
        entityId: id,
        operation: 'update',
        payload: JSON.stringify(row),
        createdAt: now(),
      }).run();
    }
  });
}

export function deleteTask(id: string) {
  const db = getDb();
  const ts = now();

  db.transaction((tx) => {
    tx.update(tasks)
      .set({ deletedAt: ts, updatedAt: ts, syncStatus: 'pending' })
      .where(eq(tasks.id, id))
      .run();
    tx.update(subtasks)
      .set({ deletedAt: ts, updatedAt: ts, syncStatus: 'pending' })
      .where(eq(subtasks.taskId, id))
      .run();
    tx.insert(syncQueue).values({
      id: uuid(),
      entityType: 'task',
      entityId: id,
      operation: 'delete',
      payload: JSON.stringify({ id, deletedAt: ts }),
      createdAt: now(),
    }).run();
  });
}

// ─── Subtasks ─────────────────────────────────────────────────────────────────

export function createSubtask(taskId: string, title: string) {
  const db = getDb();
  const subtask = {
    id: uuid(),
    taskId,
    title,
    done: false,
    createdAt: now(),
    updatedAt: now(),
    deletedAt: null as string | null,
    syncStatus: 'pending' as SyncStatus,
    syncError: null as string | null,
  };

  db.transaction((tx) => {
    tx.insert(subtasks).values(subtask).run();
    tx.insert(syncQueue).values({
      id: uuid(),
      entityType: 'subtask',
      entityId: subtask.id,
      operation: 'insert',
      payload: JSON.stringify(subtask),
      createdAt: now(),
    }).run();
  });

  return { ...subtask, task_id: subtask.taskId };
}

export function updateSubtask(id: string, input: Partial<{ title: string; done: boolean }>) {
  const db = getDb();
  const updated = { ...input, updatedAt: now(), syncStatus: 'pending' as SyncStatus };

  db.transaction((tx) => {
    tx.update(subtasks).set(updated).where(eq(subtasks.id, id)).run();
    const row = tx.select().from(subtasks).where(eq(subtasks.id, id)).get();
    if (row) {
      tx.insert(syncQueue).values({
        id: uuid(),
        entityType: 'subtask',
        entityId: id,
        operation: 'update',
        payload: JSON.stringify(row),
        createdAt: now(),
      }).run();
    }
  });
}

export function deleteSubtask(id: string) {
  const db = getDb();
  const ts = now();

  db.transaction((tx) => {
    tx.update(subtasks)
      .set({ deletedAt: ts, updatedAt: ts, syncStatus: 'pending' })
      .where(eq(subtasks.id, id))
      .run();
    tx.insert(syncQueue).values({
      id: uuid(),
      entityType: 'subtask',
      entityId: id,
      operation: 'delete',
      payload: JSON.stringify({ id, deletedAt: ts }),
      createdAt: now(),
    }).run();
  });
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

export function getMetaValue(key: string): string | null {
  const db = getDb();
  const row = db.select().from(meta).where(eq(meta.key, key)).get();
  return row?.value ?? null;
}

export function setMetaValue(key: string, value: string) {
  const db = getDb();
  db.insert(meta)
    .values({ key, value })
    .onConflictDoUpdate({ target: meta.key, set: { value } })
    .run();
}

// ─── Sync queue ───────────────────────────────────────────────────────────────

export function getPendingQueueEntries(limit = 20) {
  const db = getDb();
  return db
    .select()
    .from(syncQueue)
    .where(eq(syncQueue.status, 'pending'))
    .orderBy(syncQueue.createdAt)
    .limit(limit)
    .all();
}

export function markQueueEntryDone(id: string) {
  const db = getDb();
  db.delete(syncQueue).where(eq(syncQueue.id, id)).run();
}

export function markQueueEntryFailed(id: string, _error: string, attempts: number) {
  const db = getDb();
  db.update(syncQueue)
    .set({
      status: attempts >= 5 ? 'failed' : 'pending',
      attempts,
      lastAttempt: now(),
    })
    .where(eq(syncQueue.id, id))
    .run();
}

export function getPendingCount(): number {
  const db = getDb();
  const result = db
    .select({ count: sql<number>`count(*)` })
    .from(syncQueue)
    .where(eq(syncQueue.status, 'pending'))
    .get();
  return result?.count ?? 0;
}