// src/hooks/useLocalStore.ts

import { useState, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'

// Declare window.kylo shape inline — no cross-boundary import needed
declare global {
  interface Window {
    kylo: {
      projects: {
        list: (userId: string) => Promise<any[]>
        create: (userId: string, input: { name: string; color?: string }) => Promise<any>
        update: (id: string, input: { name?: string; color?: string }) => Promise<void>
        delete: (id: string) => Promise<void>
      }
      tasks: {
        list: (userId: string) => Promise<any[]>
        create: (userId: string, projectId: string, input: {
          title: string
          estimatedMinutes?: number
          deadline?: string
          important?: boolean
        }) => Promise<any>
        update: (id: string, input: {
          title?: string
          done?: boolean
          important?: boolean
          estimatedMinutes?: number
          deadline?: string
        }) => Promise<void>
        delete: (id: string) => Promise<void>
      }
      subtasks: {
        create: (taskId: string, title: string) => Promise<any>
        update: (id: string, input: { title?: string; done?: boolean }) => Promise<void>
        delete: (id: string) => Promise<void>
      }
      sync: {
        trigger: () => Promise<void>
        pendingCount: () => Promise<number>
        onStatus: (callback: (status: { pending: number }) => void) => () => void
      }
    }
  }
}

export function useLocalStore(user: User) {
  const [tasks, setTasks] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [syncPending, setSyncPending] = useState(0)

  const fetchAll = useCallback(async () => {
    if (!user?.id) return

    let projs = await window.kylo.projects.list(user.id)

    if (projs.length === 0) {
      const inbox = await window.kylo.projects.create(user.id, { name: 'Inbox', color: '#C8F135' })
      projs = [inbox]
    }

    setProjects(projs)
    setSelectedProjectId((prev) => prev ?? projs[0]?.id ?? null)

    const allTasks = await window.kylo.tasks.list(user.id)
    setTasks(allTasks)
  }, [user?.id])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    const unsubscribe = window.kylo.sync.onStatus(({ pending }: { pending: number }) => {
      setSyncPending(pending)
      if (pending === 0) fetchAll()
    })
    return unsubscribe
  }, [fetchAll])

  const addProject = useCallback(async (input: { name: string; color: string }) => {
    if (!user?.id) return
    const proj = await window.kylo.projects.create(user.id, input)
    setProjects((prev) => [proj, ...prev])
    setSelectedProjectId(proj.id)
  }, [user?.id])

  const addTask = useCallback(async (input: {
    title: string
    estimated_minutes?: number
    deadline?: string
    important?: boolean
  }) => {
    if (!selectedProjectId || !user?.id) return
    const task = await window.kylo.tasks.create(user.id, selectedProjectId, {
      title: input.title,
      estimatedMinutes: input.estimated_minutes,
      deadline: input.deadline,
      important: input.important,
    })
    setTasks((prev) => [task, ...prev])
  }, [user?.id, selectedProjectId])

  const toggleTaskDone = useCallback(async (taskId: string, currentDone: boolean) => {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, done: !currentDone } : t))
    await window.kylo.tasks.update(taskId, { done: !currentDone })
  }, [])

  const toggleImportant = useCallback(async (taskId: string, current: boolean) => {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, important: !current } : t))
    await window.kylo.tasks.update(taskId, { important: !current })
  }, [])

  const deleteTask = useCallback(async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    await window.kylo.tasks.delete(taskId)
  }, [])

  const addSubtask = useCallback(async (taskId: string, title: string) => {
    const subtask = await window.kylo.subtasks.create(taskId, title)
    setTasks((prev) => prev.map((t) =>
      t.id === taskId ? { ...t, subtasks: [...(t.subtasks ?? []), subtask] } : t
    ))
  }, [])

  const toggleSubtaskDone = useCallback(async (taskId: string, subtaskId: string, current: boolean) => {
    setTasks((prev) => prev.map((t) =>
      t.id !== taskId ? t : {
        ...t,
        subtasks: t.subtasks?.map((st: any) => st.id === subtaskId ? { ...st, done: !current } : st),
      }
    ))
    await window.kylo.subtasks.update(subtaskId, { done: !current })
  }, [])

  const deleteSubtask = useCallback(async (taskId: string, subtaskId: string) => {
    setTasks((prev) => prev.map((t) =>
      t.id !== taskId ? t : { ...t, subtasks: t.subtasks?.filter((st: any) => st.id !== subtaskId) }
    ))
    await window.kylo.subtasks.delete(subtaskId)
  }, [])

  const filteredTasks = selectedProjectId
    ? tasks.filter((t) => t.project_id === selectedProjectId)
    : tasks

  return {
    tasks,
    projects,
    filteredTasks,
    selectedProjectId,
    setSelectedProjectId,
    syncPending,
    addProject,
    addTask,
    toggleTaskDone,
    toggleImportant,
    deleteTask,
    addSubtask,
    toggleSubtaskDone,
    deleteSubtask,
  }
}