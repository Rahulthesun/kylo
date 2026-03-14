// electron/db/schema.ts
// Mirrors your exact Supabase schema: projects → tasks → subtasks
// Adds sync metadata columns to every syncable table

import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

// ─── Sync status type ────────────────────────────────────────────────────────
// pending   → written locally, not yet pushed
// synced    → confirmed by Supabase
// failed    → push attempted 5 times, gave up
export type SyncStatus = 'pending' | 'synced' | 'failed';

// ─── projects ────────────────────────────────────────────────────────────────
export const projects = sqliteTable('projects', {
  id:         text('id').primaryKey(),           // client-generated UUID
  userId:     text('user_id').notNull(),
  name:       text('name').notNull(),
  color:      text('color').notNull().default('#C8F135'),
  createdAt:  text('created_at').notNull(),
  updatedAt:  text('updated_at').notNull(),       // for conflict resolution
  deletedAt:  text('deleted_at'),                 // soft delete — never hard delete synced rows
  syncStatus: text('sync_status').notNull().default('pending'),
  syncError:  text('sync_error'),
}, (t) => ({
  userIdx: index('projects_user_idx').on(t.userId),
}));

// ─── tasks ───────────────────────────────────────────────────────────────────
export const tasks = sqliteTable('tasks', {
  id:               text('id').primaryKey(),
  userId:           text('user_id').notNull(),
  projectId:        text('project_id').notNull(),
  title:            text('title').notNull(),
  estimatedMinutes: integer('estimated_minutes').default(25),
  deadline:         text('deadline'),             // ISO date string
  important:        integer('important', { mode: 'boolean' }).default(false),
  done:             integer('done', { mode: 'boolean' }).default(false),
  createdAt:        text('created_at').notNull(),
  updatedAt:        text('updated_at').notNull(),
  deletedAt:        text('deleted_at'),
  syncStatus:       text('sync_status').notNull().default('pending'),
  syncError:        text('sync_error'),
}, (t) => ({
  userIdx:    index('tasks_user_idx').on(t.userId),
  projectIdx: index('tasks_project_idx').on(t.projectId),
}));

// ─── subtasks ─────────────────────────────────────────────────────────────────
export const subtasks = sqliteTable('subtasks', {
  id:         text('id').primaryKey(),
  taskId:     text('task_id').notNull(),
  title:      text('title').notNull(),
  done:       integer('done', { mode: 'boolean' }).default(false),
  createdAt:  text('created_at').notNull(),
  updatedAt:  text('updated_at').notNull(),
  deletedAt:  text('deleted_at'),
  syncStatus: text('sync_status').notNull().default('pending'),
  syncError:  text('sync_error'),
}, (t) => ({
  taskIdx: index('subtasks_task_idx').on(t.taskId),
}));

// ─── sync_queue ───────────────────────────────────────────────────────────────
// Decoupled from the data tables — this is the retry source of truth.
// One entry per operation. Processed in FIFO order.
export const syncQueue = sqliteTable('sync_queue', {
  id:          text('id').primaryKey(),
  entityType:  text('entity_type').notNull(), // 'project' | 'task' | 'subtask'
  entityId:    text('entity_id').notNull(),
  operation:   text('operation').notNull(),   // 'insert' | 'update' | 'delete'
  payload:     text('payload').notNull(),     // JSON snapshot at queue time
  attempts:    integer('attempts').default(0),
  lastAttempt: text('last_attempt'),
  status:      text('status').notNull().default('pending'), // 'pending' | 'failed'
  createdAt:   text('created_at').notNull(),
}, (t) => ({
  statusIdx: index('sync_queue_status_idx').on(t.status),
}));

// ─── meta ─────────────────────────────────────────────────────────────────────
// Stores app-wide key/value state: last pull timestamp, etc.
export const meta = sqliteTable('meta', {
  key:   text('key').primaryKey(),
  value: text('value').notNull(),
});