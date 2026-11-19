export type TaskPriority = "High" | "Medium" | "Low";
export type TaskFilter = "all" | "incomplete" | "completed" | "today" | "upcoming";

export interface StudyTask {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  priority: TaskPriority;
  completed: boolean;
  sample: boolean;
}

export interface TaskStats {
  dueToday: number;
  upcoming: number;
  completed: number;
}

function shiftDate(date: string, amount: number): string {
  const shifted = new Date(`${date}T12:00:00`);
  shifted.setDate(shifted.getDate() + amount);
  return [shifted.getFullYear(), String(shifted.getMonth() + 1).padStart(2, "0"), String(shifted.getDate()).padStart(2, "0")].join("-");
}

export function getLocalDateString(date = new Date()): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

export function makeSampleTasks(today: string): StudyTask[] {
  return [
    {
      id: "sample-chemistry",
      title: "Finish reaction rates worksheet",
      subject: "Chemistry",
      dueDate: today,
      priority: "High",
      completed: false,
      sample: true,
    },
    {
      id: "sample-english",
      title: "Outline the book review",
      subject: "English",
      dueDate: today,
      priority: "Medium",
      completed: false,
      sample: true,
    },
    {
      id: "sample-physics",
      title: "Review motion and forces",
      subject: "Physics",
      dueDate: shiftDate(today, 1),
      priority: "High",
      completed: false,
      sample: true,
    },
    {
      id: "sample-history",
      title: "Complete source comparison notes",
      subject: "History",
      dueDate: shiftDate(today, 4),
      priority: "Low",
      completed: false,
      sample: true,
    },
    {
      id: "sample-biology",
      title: "Review cell biology flashcards",
      subject: "Biology",
      dueDate: shiftDate(today, -1),
      priority: "Medium",
      completed: true,
      sample: true,
    },
  ];
}

export function getTaskStats(tasks: StudyTask[], today: string): TaskStats {
  return {
    dueToday: tasks.filter((task) => !task.completed && task.dueDate === today).length,
    upcoming: tasks.filter((task) => !task.completed && task.dueDate > today).length,
    completed: tasks.filter((task) => task.completed).length,
  };
}

export function filterTasks(tasks: StudyTask[], filter: TaskFilter, today: string): StudyTask[] {
  const visible = tasks.filter((task) => {
    if (filter === "incomplete") return !task.completed;
    if (filter === "completed") return task.completed;
    if (filter === "today") return !task.completed && task.dueDate === today;
    if (filter === "upcoming") return !task.completed && task.dueDate > today;
    return true;
  });

  return [...visible].sort((a, b) => {
    if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
    return a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title);
  });
}

export function isStudyTask(value: unknown): value is StudyTask {
  if (typeof value !== "object" || value === null) return false;
  const task = value as Partial<StudyTask>;
  return (
    typeof task.id === "string" &&
    typeof task.title === "string" &&
    typeof task.subject === "string" &&
    typeof task.dueDate === "string" &&
    (task.priority === "High" || task.priority === "Medium" || task.priority === "Low") &&
    typeof task.completed === "boolean" &&
    typeof task.sample === "boolean"
  );
}