// electron/sync/worker.ts

import { BrowserWindow } from 'electron'
import { createClient } from '@supabase/supabase-js'
import {
  getPendingQueueEntries,
  markQueueEntryDone,
  markQueueEntryFailed,
  getPendingCount,
  getMetaValue,
  setMetaValue,
} from '../db/store'
import { getDb } from '../db/client'
import { projects, tasks, subtasks } from '../db/schema'
import { eq } from 'drizzle-orm'

// ─── Lazy Supabase client ─────────────────────────────────────────────────────
// Never instantiate at module load time — env vars aren't ready yet.
let _supabase: ReturnType<typeof createClient> | null = null

function getSupabase() {
  if (_supabase) return _supabase
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('[SyncWorker] Missing Supabase credentials in environment')
  _supabase = createClient(url, key)
  return _supabase
}

// ─── Table maps ───────────────────────────────────────────────────────────────

const SUPABASE_TABLE: Record<string, string> = {
  project: 'projects',
  task: 'tasks',
  subtask: 'subtasks',
}

const LOCAL_TABLE: Record<string, any> = {
  project: projects,
  task: tasks,
  subtask: subtasks,
}

// ─── Worker ───────────────────────────────────────────────────────────────────

export class SyncWorker {
  private timer: NodeJS.Timeout | null = null
  private running = false
  private window: BrowserWindow | null = null

  init(win: BrowserWindow) {
    this.window = win
    this.timer = setInterval(() => this.runCycle(), 30_000)
    this.runCycle()
  }

  async runCycle() {
    const online = await this.checkOnline()
    if (this.running || !online) return
    this.running = true

    try {
      await this.pushPending()
      await this.pullFromServer()
    } catch (err) {
      console.error('[SyncWorker] Cycle error:', err)
    } finally {
      this.running = false
      this.notifyRenderer()
    }
  }

  private async checkOnline(): Promise<boolean> {
    try {
      await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000),
      })
      return true
    } catch {
      return false
    }
  }

  private async pushPending() {
    const entries = getPendingQueueEntries(20)
    if (entries.length === 0) return

    const supabase = getSupabase()
    console.log(`[SyncWorker] Pushing ${entries.length} pending entries`)

    for (const entry of entries) {
      const table = SUPABASE_TABLE[entry.entityType]
      if (!table) continue

      const payload = JSON.parse(entry.payload)
      const { syncStatus: _ss, syncError: _se, ...rest } = payload
      const supabasePayload = toSnakeCase(rest)

      try {
        if (entry.operation === 'delete') {
          await supabase
            .from(table)
            .update({
              deleted_at: supabasePayload.deleted_at,
              updated_at: supabasePayload.updated_at,
            })
            .eq('id', entry.entityId)
        } else {
          await supabase
            .from(table)
            .upsert(supabasePayload, { onConflict: 'id' })
        }

        markQueueEntryDone(entry.id)
        this.markEntitySynced(entry.entityType, entry.entityId)
      } catch (err: any) {
        const attempts = (entry.attempts ?? 0) + 1
        console.error(`[SyncWorker] Failed entry ${entry.id} (attempt ${attempts}):`, err.message)
        markQueueEntryFailed(entry.id, err.message, attempts)
      }
    }
  }

  private markEntitySynced(entityType: string, entityId: string) {
    const db = getDb()
    const table = LOCAL_TABLE[entityType]
    if (!table) return
    db.update(table)
      .set({ syncStatus: 'synced', syncError: null })
      .where(eq(table.id, entityId))
      .run()
  }

  private async pullFromServer() {
    const supabase = getSupabase()
    const session = await supabase.auth.getSession()
    const userId = session.data.session?.user?.id
    if (!userId) return

    const lastPull = getMetaValue('last_pull_at') ?? '1970-01-01T00:00:00.000Z'
    const pullStart = new Date().toISOString()
    const db = getDb()

    // ── Pull projects ──────────────────────────────────────────────────────────
    const { data: serverProjects } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', lastPull)

    for (const row of serverProjects ?? []) {
      const local = {
        id:         row.id,
        userId:     row.user_id,
        name:       row.name,
        color:      row.color ?? '#C8F135',
        createdAt:  row.created_at,
        updatedAt:  row.updated_at,
        deletedAt:  row.deleted_at ?? null,
        syncStatus: 'synced' as const,
        syncError:  null,
      }
      db.insert(projects)
        .values(local)
        .onConflictDoUpdate({ target: projects.id, set: local })
        .run()
    }

    // ── Pull tasks ─────────────────────────────────────────────────────────────
    const { data: serverTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', lastPull)

    for (const row of serverTasks ?? []) {
      const local = {
        id:               row.id,
        userId:           row.user_id,
        projectId:        row.project_id,
        title:            row.title,
        estimatedMinutes: row.estimated_minutes ?? 25,
        deadline:         row.deadline ?? null,
        important:        row.important ?? false,
        done:             row.done ?? false,
        createdAt:        row.created_at,
        updatedAt:        row.updated_at,
        deletedAt:        row.deleted_at ?? null,
        syncStatus:       'synced' as const,
        syncError:        null,
      }
      db.insert(tasks)
        .values(local)
        .onConflictDoUpdate({ target: tasks.id, set: local })
        .run()
    }

    // ── Pull subtasks ──────────────────────────────────────────────────────────
    const taskIds = (serverTasks ?? []).map((t: any) => t.id)
    if (taskIds.length > 0) {
      const { data: serverSubtasks } = await supabase
        .from('subtasks')
        .select('*')
        .in('task_id', taskIds)
        .gt('updated_at', lastPull)

      for (const row of serverSubtasks ?? []) {
        const local = {
          id:         row.id,
          taskId:     row.task_id,
          title:      row.title,
          done:       row.done ?? false,
          createdAt:  row.created_at,
          updatedAt:  row.updated_at,
          deletedAt:  row.deleted_at ?? null,
          syncStatus: 'synced' as const,
          syncError:  null,
        }
        db.insert(subtasks)
          .values(local)
          .onConflictDoUpdate({ target: subtasks.id, set: local })
          .run()
      }
    }

    setMetaValue('last_pull_at', pullStart)
  }

  private notifyRenderer() {
    if (!this.window || this.window.isDestroyed()) return
    const pending = getPendingCount()
    this.window.webContents.send('sync:status', { pending })
  }

  destroy() {
    if (this.timer) clearInterval(this.timer)
  }
}

function toSnakeCase(obj: Record<string, any>): Record<string, any> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`),
      v,
    ])
  )
}

export const syncWorker = new SyncWorker()