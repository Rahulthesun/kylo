export interface Project {
  id: string;
  user_id: string;
  name: string;
  created_at: string; // timestamptz
  color: string | null;
}

export interface Task {
  id: string;
  user_id: string;
  projectId: string;

  title: string;
  estimatedMinutes: number | null;
  deadline: string | null;
  important: boolean;
  done: boolean;
  isActive: boolean;
  subtasks: Subtask[];


  created_at: string; // timestamptz
}

export interface Subtask {
  id: string;
  task_id: string;

  title: string;
  done: boolean;

  created_at: string; // timestamptz
}



export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface ActiveTask extends Task {
  checklist: ChecklistItem[];
  startedAt: string;
}
