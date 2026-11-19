import { describe, expect, it } from "vitest";

import { filterTasks, getTaskStats, makeSampleTasks, type StudyTask } from "@/lib/study-tasks";

const today = "2026-11-19";
const tasks: StudyTask[] = [
  { id: "today", title: "Today task", subject: "Science", dueDate: today, priority: "High", completed: false, sample: false },
  { id: "later", title: "Later task", subject: "Math", dueDate: "2026-11-20", priority: "Low", completed: false, sample: false },
  { id: "done-today", title: "Finished today", subject: "English", dueDate: today, priority: "Medium", completed: true, sample: false },
  { id: "late", title: "Overdue task", subject: "History", dueDate: "2026-11-18", priority: "Medium", completed: false, sample: false },
];

describe("StudySprint task rules", () => {
  it("counts only unfinished tasks due today", () => {
    expect(getTaskStats(tasks, today).dueToday).toBe(1);
  });

  it("counts unfinished future tasks as upcoming", () => {
    expect(getTaskStats(tasks, today).upcoming).toBe(1);
  });

  it("counts completed tasks regardless of due date", () => {
    expect(getTaskStats(tasks, today).completed).toBe(1);
  });

  it("starts with five clearly identified sample tasks", () => {
    const samples = makeSampleTasks(today);

    expect(samples).toHaveLength(5);
    expect(samples.every((task) => task.sample)).toBe(true);
    expect(samples.filter((task) => task.completed)).toHaveLength(1);
  });

  it("filters to-do and completed tasks without changing the saved list", () => {
    expect(filterTasks(tasks, "incomplete", today).map((task) => task.id)).toEqual([
      "late",
      "today",
      "later",
    ]);
    expect(filterTasks(tasks, "completed", today).map((task) => task.id)).toEqual(["done-today"]);
    expect(tasks).toHaveLength(4);
  });
});