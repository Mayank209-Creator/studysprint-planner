import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownWideNarrow,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCheck,
  Circle,
  Clock3,
  Compass,
  GraduationCap,
  ListTodo,
  Plus,
  Sparkles,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AuthScreen } from "@/components/AuthScreen";
import { useSessionUser } from "@/hooks/use-session";
import { createTask, fetchTasks, removeTask, updateTask } from "@/lib/task-store";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  filterTasks,
  getLocalDateString,
  getTaskStats,
  type StudyTask,
  type TaskFilter,
  type TaskPriority,
} from "@/lib/study-tasks";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StudySprint — your study planner" },
      { name: "description", content: "Plan study tasks, see today's deadlines, and celebrate the work you've finished." },
      { property: "og:title", content: "StudySprint — your study planner" },
      { property: "og:description", content: "Plan study tasks, see today's deadlines, and celebrate the work you've finished." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudySprintGate,
});

const navigation: { filter: TaskFilter; label: string; icon: typeof ListTodo }[] = [
  { filter: "all", label: "All tasks", icon: ListTodo },
  { filter: "incomplete", label: "To-do", icon: Circle },
  { filter: "today", label: "Due today", icon: CalendarDays },
  { filter: "upcoming", label: "Upcoming", icon: Clock3 },
  { filter: "completed", label: "Completed", icon: CheckCheck },
];

const emptyForm = (today: string) => ({
  title: "",
  subject: "",
  dueDate: today,
  priority: "Medium" as TaskPriority,
});

function StudySprintGate() {
  const { user, loading } = useSessionUser();
  if (loading) return <div className="app-shell grid min-h-screen place-items-center text-sm text-muted-foreground">Loading StudySprint…</div>;
  if (!user) return <AuthScreen />;
  return <StudySprint key={user.id} email={user.email ?? ""} />;
}

function StudySprint({ email }: { email: string }) {
  const today = getLocalDateString();
  const queryClient = useQueryClient();
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<StudyTask | null>(null);
  const [form, setForm] = useState(() => emptyForm(today));

  useEffect(() => {
    fetchTasks().then(setTasks).catch(() => toast.error("Couldn't load your tasks. Please refresh."));
  }, []);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
  }

  const stats = useMemo(() => getTaskStats(tasks, today), [tasks, today]);
  const visibleTasks = useMemo(() => filterTasks(tasks, filter, today), [tasks, filter, today]);
  const completedCount = stats.completed;
  const completionPercent = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);
  const dateLabel = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  function openNewTask() {
    setEditingTask(null);
    setForm(emptyForm(today));
    setDialogOpen(true);
  }

  function openEditTask(task: StudyTask) {
    setEditingTask(task);
    setForm({ title: task.title, subject: task.subject, dueDate: task.dueDate, priority: task.priority });
    setDialogOpen(true);
  }

  async function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = form.title.trim();
    const subject = form.subject.trim();
    if (!title || !subject || !form.dueDate) return;
    try {
      if (editingTask) {
        await updateTask(editingTask.id, { title, subject, dueDate: form.dueDate, priority: form.priority });
        setTasks((current) => current.map((task) => task.id === editingTask.id
          ? { ...task, title, subject, dueDate: form.dueDate, priority: form.priority }
          : task));
        toast.success("Your task was updated.");
      } else {
        const created = await createTask({ title, subject, dueDate: form.dueDate, priority: form.priority });
        setTasks((current) => [created, ...current]);
        toast.success("Task added to your study list.");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Couldn't save the task. Please try again.");
    }
  }

  async function toggleTask(task: StudyTask) {
    try {
      await updateTask(task.id, { completed: !task.completed });
      setTasks((current) => current.map((item) => item.id === task.id ? { ...item, completed: !item.completed } : item));
      toast.success(task.completed ? "Task moved back to your to-do list." : "Nice work — task completed!");
    } catch {
      toast.error("Couldn't update the task.");
    }
  }

  async function deleteTask(task: StudyTask) {
    try {
      await removeTask(task.id);
      setTasks((current) => current.filter((item) => item.id !== task.id));
      toast.success("Task deleted.");
    } catch {
      toast.error("Couldn't delete the task.");
    }
  }

  const filterTitle = navigation.find((item) => item.filter === filter)?.label ?? "All tasks";

  return (
    <div className="app-shell min-h-screen lg:grid lg:grid-cols-[252px_minmax(0,1fr)]">
      <aside className="flex flex-col bg-sidebar px-5 py-5 text-sidebar-foreground lg:sticky lg:top-0 lg:h-screen lg:px-6 lg:py-7">
        <a href="#home" onClick={() => setFilter("all")} className="flex w-fit items-center gap-3 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring" aria-label="StudySprint home">
          <span className="grid size-10 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <GraduationCap size={22} strokeWidth={2.2} />
          </span>
          <span>
            <span className="display-font block text-xl leading-6">StudySprint</span>
            <span className="text-xs text-sidebar-foreground/65">your study space</span>
          </span>
        </a>

        <div className="mt-9 hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/55 lg:block">Your workspace</div>
        <nav aria-label="Task filters" className="-mx-1 mt-5 flex gap-1 overflow-x-auto pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:pb-0">
          {navigation.map(({ filter: itemFilter, label, icon: Icon }) => {
            const selected = filter === itemFilter;
            const count = itemFilter === "today" ? stats.dueToday : itemFilter === "upcoming" ? stats.upcoming : itemFilter === "completed" ? stats.completed : undefined;
            return (
              <Button
                key={itemFilter}
                variant="ghost"
                onClick={() => setFilter(itemFilter)}
                aria-current={selected ? "page" : undefined}
                className={`h-10 shrink-0 justify-start gap-3 px-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:w-full ${selected ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/75"}`}
              >
                <Icon size={17} strokeWidth={1.8} />
                <span className="text-sm">{label}</span>
                {count !== undefined && <span className="ml-auto text-xs tabular-nums opacity-70">{count}</span>}
              </Button>
            );
          })}
        </nav>

        <div className="mt-6 hidden rounded-md border border-sidebar-border bg-sidebar-accent/60 p-4 lg:mt-auto lg:block">
          <span className="flex items-center gap-2 text-sm font-medium"><Sparkles size={15} className="text-sidebar-primary" /> Small steps count</span>
          <p className="mt-2 text-xs leading-5 text-sidebar-foreground/70">Every checked-off task is a little win. Keep your pace, not perfection.</p>
        </div>
        <div className="mt-5 hidden items-center gap-2 text-xs text-sidebar-foreground/50 lg:flex">
          <span className="size-2 rounded-full bg-sidebar-primary" /> Synced to your account
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-xs text-sidebar-foreground/70" title={email}>{email}</span>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"><LogOut size={15} /> Sign out</Button>
        </div>
      </aside>

      <main id="home" className="min-w-0 px-5 pb-12 pt-7 sm:px-8 lg:px-12 lg:pt-10 xl:px-16">
        <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Compass size={16} /> <span>{dateLabel}</span>
            <span className="ml-1 rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]">Your planner</span>
          </div>
          <Button onClick={openNewTask} className="h-10 rounded-md px-4 shadow-sm" aria-label="Add task">
            <Plus size={17} /> <span>Add a task</span>
          </Button>
        </header>

        <div className="mx-auto max-w-6xl">
          <section aria-labelledby="welcome-title" className="pt-8 sm:pt-10">
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium text-primary"><BookOpen size={16} /> A fresh page, a clear plan</p>
                <h1 id="welcome-title" className="display-font mt-3 max-w-2xl text-4xl leading-[1.08] text-brand-ink sm:text-5xl">A little progress<br className="hidden sm:block" /> goes a long way.</h1>
                <p className="mt-3 text-sm text-muted-foreground">One task at a time. You’ve got this.</p>
              </div>
              <div className="mb-1 flex items-center gap-3 rounded-md border border-border/80 bg-card/75 px-4 py-3">
                <div className="grid size-10 place-items-center rounded-full bg-secondary text-primary"><Target size={19} /></div>
                <div>
                  <div className="text-sm font-semibold tabular-nums">{completionPercent}% complete</div>
                  <div className="text-xs text-muted-foreground">of your study list</div>
                </div>
              </div>
            </div>
          </section>

          <section aria-label="Task overview" className="mt-9 grid grid-cols-1 overflow-hidden rounded-md border border-border/80 bg-card/75 sm:grid-cols-3">
            <StatCard icon={CalendarDays} label="Due today" value={stats.dueToday} detail="tasks to tackle today" tone="coral" onClick={() => setFilter("today")} />
            <StatCard icon={ArrowUpRight} label="Coming up" value={stats.upcoming} detail="on your horizon" tone="green" onClick={() => setFilter("upcoming")} />
            <StatCard icon={CheckCheck} label="Completed" value={stats.completed} detail="little wins so far" tone="yellow" onClick={() => setFilter("completed")} />
          </section>

          <section aria-labelledby="task-list-title" className="mt-10">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-muted-foreground"><ArrowDownWideNarrow size={14} /> Your focus list</div>
                <h2 id="task-list-title" className="display-font mt-2 text-3xl text-brand-ink">{filterTitle}</h2>
              </div>
              <span className="text-xs text-muted-foreground">{visibleTasks.length} {visibleTasks.length === 1 ? "task" : "tasks"}</span>
            </div>

            {visibleTasks.length > 0 ? (
              <ul className="divide-y divide-border/80" aria-label={filterTitle}>
                {visibleTasks.map((task, index) => (
                  <TaskRow key={task.id} task={task} index={index} today={today} onToggle={toggleTask} onEdit={openEditTask} onDelete={deleteTask} />
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center px-6 py-14 text-center">
                <span className="grid size-14 place-items-center rounded-full bg-secondary text-primary"><Check size={24} /></span>
                <h3 className="display-font mt-4 text-2xl text-brand-ink">All caught up.</h3>
                <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">There’s nothing in this view just yet. Add a task when you’re ready for your next small win.</p>
                <Button onClick={openNewTask} variant="outline" className="mt-5"><Plus size={16} /> Add a task</Button>
              </div>
            )}
          </section>

          <footer className="mt-9 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Sparkles size={13} /> Your tasks are saved in this browser.
          </footer>
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="display-font text-2xl">{editingTask ? "Edit your task" : "A new study task"}</DialogTitle>
            <DialogDescription>Give your next study session a clear starting point.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveTask} className="mt-1 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="task-title">Task</Label>
              <Input id="task-title" autoFocus required maxLength={100} placeholder="e.g. Finish lab report" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-subject">Subject</Label>
              <Input id="task-subject" required maxLength={40} placeholder="e.g. Biology" value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="task-due-date">Due date</Label>
                <Input id="task-due-date" type="date" required value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task-priority">Priority</Label>
                <Select value={form.priority} onValueChange={(value) => setForm((current) => ({ ...current, priority: value as TaskPriority }))}>
                  <SelectTrigger id="task-priority" aria-label="Priority"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-1 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}><X size={15} /> Cancel</Button>
              <Button type="submit"><Check size={16} /> {editingTask ? "Save changes" : "Add task"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, detail, tone, onClick }: {
  icon: typeof CalendarDays;
  label: string;
  value: number;
  detail: string;
  tone: "coral" | "green" | "yellow";
  onClick: () => void;
}) {
  const toneClass = tone === "coral" ? "text-priority-high bg-priority-high/10" : tone === "green" ? "text-priority-low bg-priority-low/10" : "text-priority-medium bg-priority-medium/10";
  return (
    <button type="button" onClick={onClick} className="group flex min-h-28 items-center gap-4 px-5 py-5 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-6 [&+button]:border-t [&+button]:border-border/80 sm:[&+button]:border-l sm:[&+button]:border-t-0">
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${toneClass}`}><Icon size={19} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-muted-foreground">{label}</span>
        <span className="mt-0.5 block text-2xl font-semibold leading-7 tabular-nums">{value}</span>
        <span className="block truncate text-xs text-muted-foreground">{detail}</span>
      </span>
      <ArrowUpRight size={16} className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

function TaskRow({ task, index, today, onToggle, onEdit, onDelete }: {
  task: StudyTask;
  index: number;
  today: string;
  onToggle: (task: StudyTask) => void;
  onEdit: (task: StudyTask) => void;
  onDelete: (task: StudyTask) => void;
}) {
  const dueLabel = task.dueDate === today
    ? "Today"
    : new Date(`${task.dueDate}T12:00:00`).toLocaleDateString("en", { month: "short", day: "numeric" });
  const priorityClass = task.priority === "High" ? "text-priority-high" : task.priority === "Medium" ? "text-priority-medium" : "text-priority-low";

  return (
    <li style={{ animationDelay: `${Math.min(index, 6) * 35}ms` }} className="task-row flex min-w-0 items-center gap-3 py-4 sm:gap-4">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={task.completed ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`}
        title={task.completed ? "Mark incomplete" : "Mark complete"}
        onClick={() => onToggle(task)}
        className={`size-9 shrink-0 rounded-full ${task.completed ? "bg-primary text-primary-foreground hover:bg-primary/85 hover:text-primary-foreground" : "text-muted-foreground hover:text-primary"}`}
      >
        {task.completed ? <Check size={17} /> : <Circle size={20} strokeWidth={1.5} />}
      </Button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={`max-w-full break-words text-sm font-medium sm:text-base ${task.completed ? "text-muted-foreground line-through decoration-border" : "text-foreground"}`}>{task.title}</span>
          {task.sample && <span className="rounded-full border border-border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">Sample</span>}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><BookOpen size={12} />{task.subject}</span>
          <span aria-hidden="true" className="text-border">·</span>
          <span className={`flex items-center gap-1 ${task.dueDate < today && !task.completed ? "text-priority-high" : ""}`}><CalendarDays size={12} />{task.dueDate < today && !task.completed ? "Overdue" : dueLabel}</span>
          <span aria-hidden="true" className="text-border">·</span>
          <span className={`flex items-center gap-1 ${priorityClass}`}><span aria-hidden="true" className="size-1.5 rounded-full bg-current" />{task.priority}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <Button type="button" variant="ghost" size="icon" onClick={() => onEdit(task)} aria-label={`Edit ${task.title}`} title="Edit task" className="size-9 text-muted-foreground"><BookOpen size={15} /></Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => onDelete(task)} aria-label={`Delete ${task.title}`} title="Delete task" className="size-9 text-muted-foreground hover:text-destructive"><Trash2 size={15} /></Button>
      </div>
    </li>
  );
}