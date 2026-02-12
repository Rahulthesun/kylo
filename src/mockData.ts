import { Project, Task, ChecklistItem } from './types';

export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Product Launch',
    color: '#3B82F6',
    isShared: true,
    taskCount: 5,
  },
  {
    id: '2',
    name: 'Personal Growth',
    color: '#8B5CF6',
    isShared: false,
    taskCount: 3,
  },
  {
    id: '3',
    name: 'Client Work',
    color: '#10B981',
    isShared: true,
    taskCount: 7,
  },
];

export const mockTasks: Task[] = [
  {
    id: 't1',
    projectId: '1',
    title: 'Design landing page mockups',
    estimatedMinutes: 90,
    isActive: false,
  },
  {
    id: 't2',
    projectId: '1',
    title: 'Write product copy',
    estimatedMinutes: 45,
    isActive: false,
  },
  {
    id: 't3',
    projectId: '1',
    title: 'Set up email sequences',
    estimatedMinutes: 60,
    isActive: false,
  },
  {
    id: 't4',
    projectId: '2',
    title: 'Morning meditation routine',
    estimatedMinutes: 25,
    isActive: false,
  },
  {
    id: 't5',
    projectId: '2',
    title: 'Read 30 pages',
    estimatedMinutes: 30,
    isActive: false,
  },
  {
    id: 't6',
    projectId: '3',
    title: 'Client onboarding call',
    estimatedMinutes: 60,
    isActive: false,
  },
];

export const generateMockChecklist = (taskTitle: string): ChecklistItem[] => {
  return [
    { id: 'c1', text: 'Review requirements and scope', completed: false },
    { id: 'c2', text: 'Gather necessary resources and tools', completed: false },
    { id: 'c3', text: 'Create initial draft or outline', completed: false },
    { id: 'c4', text: 'Refine and iterate on core elements', completed: false },
    { id: 'c5', text: 'Final review and quality check', completed: false },
  ];
};
