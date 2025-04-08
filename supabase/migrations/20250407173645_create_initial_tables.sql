-- Migration: create_initial_tables

-- 1. Create profiles table
-- Stores public user data. Linked to auth.users via id.
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at timestamp with time zone,
  username text UNIQUE,
  full_name text,
  avatar_url text,

  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Helper function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$;

-- Trigger to call handle_new_user when a user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Add indexes
CREATE INDEX profiles_username_idx ON public.profiles(username);


-- 2. Create loops table
-- Stores journal entries (loops) created by users.
CREATE TABLE public.loops (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone,
    content text NOT NULL,
    summary text,
    sentiment_score double precision -- Using double precision for float
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.loops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own loops." ON public.loops
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own loops." ON public.loops
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loops." ON public.loops
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own loops." ON public.loops
  FOR DELETE USING (auth.uid() = user_id);

-- Add indexes
CREATE INDEX loops_user_id_idx ON public.loops(user_id);
CREATE INDEX loops_created_at_idx ON public.loops(created_at DESC); -- For sorting by newest


-- 3. Create tasks table
-- Stores tasks generated from loops.
CREATE TABLE public.tasks (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    loop_id uuid NOT NULL REFERENCES public.loops(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    description text NOT NULL,
    is_completed boolean NOT NULL DEFAULT false,
    due_date timestamp with time zone
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tasks." ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks." ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks." ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks." ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Add indexes
CREATE INDEX tasks_user_id_idx ON public.tasks(user_id);
CREATE INDEX tasks_loop_id_idx ON public.tasks(loop_id);
CREATE INDEX tasks_is_completed_idx ON public.tasks(is_completed);
