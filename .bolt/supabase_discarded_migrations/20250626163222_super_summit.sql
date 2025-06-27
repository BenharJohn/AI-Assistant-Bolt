/*
  # Fix RLS Policies for Public Access

  This migration updates the Row Level Security policies to allow public access
  for testing and demo purposes, since the application doesn't have authentication.

  ## Changes Made:
  1. Update tasks table policies to allow public access for all operations
  2. Update journal_entries table policies to allow public access  
  3. Update flashcards and flashcard_sets policies for public access

  ## Security Note:
  These policies allow anyone to read/write data. In production, you would want
  to implement proper user authentication and restrict access accordingly.
*/

-- Drop existing restrictive policies and create public access policies for tasks
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON tasks;
DROP POLICY IF EXISTS "Enable read access for all users" ON tasks;
DROP POLICY IF EXISTS "Allow public delete access" ON tasks;
DROP POLICY IF EXISTS "Allow public update access" ON tasks;

-- Create new public access policies for tasks
CREATE POLICY "Allow public insert access" ON tasks
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Allow public select access" ON tasks
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Allow public update access" ON tasks
  FOR UPDATE TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access" ON tasks
  FOR DELETE TO public
  USING (true);

-- Update journal_entries policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON journal_entries;
DROP POLICY IF EXISTS "Enable read access for all users" ON journal_entries;

CREATE POLICY "Allow public insert access" ON journal_entries
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Allow public select access" ON journal_entries
  FOR SELECT TO public
  USING (true);

-- Update flashcard_sets policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON flashcard_sets;
DROP POLICY IF EXISTS "Enable read access for all users" ON flashcard_sets;

CREATE POLICY "Allow public insert access" ON flashcard_sets
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Allow public select access" ON flashcard_sets
  FOR SELECT TO public
  USING (true);

-- Update flashcards policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON flashcards;
DROP POLICY IF EXISTS "Enable read access for all users" ON flashcards;

CREATE POLICY "Allow public insert access" ON flashcards
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Allow public select access" ON flashcards
  FOR SELECT TO public
  USING (true);