CREATE TABLE public.study_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  due_date DATE NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('High','Medium','Low')),
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_tasks TO authenticated;
GRANT ALL ON public.study_tasks TO service_role;
ALTER TABLE public.study_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own tasks select" ON public.study_tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own tasks insert" ON public.study_tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own tasks update" ON public.study_tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own tasks delete" ON public.study_tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX study_tasks_user_idx ON public.study_tasks(user_id, due_date);