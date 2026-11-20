import { supabase } from "@/integrations/supabase/client";
import type { TablesUpdate } from "@/integrations/supabase/types";
import type { StudyTask, TaskPriority } from "@/lib/study-tasks";

type Row = { id: string; title: string; subject: string; due_date: string; priority: string; completed: boolean };

const toTask = (r: Row): StudyTask => ({
  id: r.id, title: r.title, subject: r.subject, dueDate: r.due_date,
  priority: r.priority as TaskPriority, completed: r.completed, sample: false,
});

export async function fetchTasks(): Promise<StudyTask[]> {
  const { data, error } = await supabase.from("study_tasks").select("id,title,subject,due_date,priority,completed").order("due_date");
  if (error) throw error;
  return (data ?? []).map(toTask);
}

export async function createTask(t: { title: string; subject: string; dueDate: string; priority: TaskPriority }) {
  const { data, error } = await supabase.from("study_tasks")
    .insert({ title: t.title, subject: t.subject, due_date: t.dueDate, priority: t.priority })
    .select("id,title,subject,due_date,priority,completed").single();
  if (error) throw error;
  return toTask(data);
}

export async function updateTask(id: string, patch: Partial<{ title: string; subject: string; dueDate: string; priority: TaskPriority; completed: boolean }>) {
  const row: TablesUpdate<"study_tasks"> = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.subject !== undefined) row.subject = patch.subject;
  if (patch.dueDate !== undefined) row.due_date = patch.dueDate;
  if (patch.priority !== undefined) row.priority = patch.priority;
  if (patch.completed !== undefined) row.completed = patch.completed;
  const { error } = await supabase.from("study_tasks").update(row).eq("id", id);
  if (error) throw error;
}

export async function removeTask(id: string) {
  const { error } = await supabase.from("study_tasks").delete().eq("id", id);
  if (error) throw error;
}
