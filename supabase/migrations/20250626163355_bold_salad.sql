/*
  # Fix RLS Policies for Public Access

  1. Remove all existing policies
  2. Create new public access policies
  3. Apply to all tables (tasks, journal_entries, flashcard_sets, flashcards)
*/

-- Function to safely drop policies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all existing policies on tasks table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'tasks' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON tasks', policy_record.policyname);
    END LOOP;

    -- Drop all existing policies on journal_entries table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'journal_entries' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON journal_entries', policy_record.policyname);
    END LOOP;

    -- Drop all existing policies on flashcard_sets table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'flashcard_sets' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON flashcard_sets', policy_record.policyname);
    END LOOP;

    -- Drop all existing policies on flashcards table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'flashcards' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON flashcards', policy_record.policyname);
    END LOOP;
END $$;

-- Create comprehensive public access policies for tasks
CREATE POLICY "tasks_public_insert_policy" ON tasks
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "tasks_public_select_policy" ON tasks
  FOR SELECT TO public
  USING (true);

CREATE POLICY "tasks_public_update_policy" ON tasks
  FOR UPDATE TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "tasks_public_delete_policy" ON tasks
  FOR DELETE TO public
  USING (true);

-- Create public access policies for journal_entries
CREATE POLICY "journal_entries_public_insert_policy" ON journal_entries
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "journal_entries_public_select_policy" ON journal_entries
  FOR SELECT TO public
  USING (true);

CREATE POLICY "journal_entries_public_update_policy" ON journal_entries
  FOR UPDATE TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "journal_entries_public_delete_policy" ON journal_entries
  FOR DELETE TO public
  USING (true);

-- Create public access policies for flashcard_sets
CREATE POLICY "flashcard_sets_public_insert_policy" ON flashcard_sets
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "flashcard_sets_public_select_policy" ON flashcard_sets
  FOR SELECT TO public
  USING (true);

CREATE POLICY "flashcard_sets_public_update_policy" ON flashcard_sets
  FOR UPDATE TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "flashcard_sets_public_delete_policy" ON flashcard_sets
  FOR DELETE TO public
  USING (true);

-- Create public access policies for flashcards
CREATE POLICY "flashcards_public_insert_policy" ON flashcards
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "flashcards_public_select_policy" ON flashcards
  FOR SELECT TO public
  USING (true);

CREATE POLICY "flashcards_public_update_policy" ON flashcards
  FOR UPDATE TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "flashcards_public_delete_policy" ON flashcards
  FOR DELETE TO public
  USING (true);