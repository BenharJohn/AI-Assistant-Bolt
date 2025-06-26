/*
  # Fix Auto-Increment ID Fields

  1. Updates
    - Add auto-increment sequences to all table ID fields
    - Ensure ID fields have proper default values
    - Fix primary key constraints

  2. Security
    - Maintains existing RLS policies
*/

-- Fix tasks table ID to be auto-incrementing
DO $$
BEGIN
  -- Create sequence if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'tasks_id_seq') THEN
    CREATE SEQUENCE tasks_id_seq;
  END IF;
  
  -- Set the sequence as default for id column
  ALTER TABLE tasks ALTER COLUMN id SET DEFAULT nextval('tasks_id_seq');
  
  -- Set sequence ownership
  ALTER SEQUENCE tasks_id_seq OWNED BY tasks.id;
  
  -- Update sequence to start from current max value + 1
  PERFORM setval('tasks_id_seq', COALESCE((SELECT MAX(id) FROM tasks), 0) + 1);
END $$;

-- Fix journal_entries table ID to be auto-incrementing  
DO $$
BEGIN
  -- Create sequence if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'journal_entries_id_seq') THEN
    CREATE SEQUENCE journal_entries_id_seq;
  END IF;
  
  -- Set the sequence as default for id column
  ALTER TABLE journal_entries ALTER COLUMN id SET DEFAULT nextval('journal_entries_id_seq');
  
  -- Set sequence ownership
  ALTER SEQUENCE journal_entries_id_seq OWNED BY journal_entries.id;
  
  -- Update sequence to start from current max value + 1
  PERFORM setval('journal_entries_id_seq', COALESCE((SELECT MAX(id) FROM journal_entries), 0) + 1);
END $$;

-- Fix flashcard_sets table ID to be auto-incrementing
DO $$
BEGIN
  -- Create sequence if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'flashcard_sets_id_seq') THEN
    CREATE SEQUENCE flashcard_sets_id_seq;
  END IF;
  
  -- Set the sequence as default for id column
  ALTER TABLE flashcard_sets ALTER COLUMN id SET DEFAULT nextval('flashcard_sets_id_seq');
  
  -- Set sequence ownership
  ALTER SEQUENCE flashcard_sets_id_seq OWNED BY flashcard_sets.id;
  
  -- Update sequence to start from current max value + 1
  PERFORM setval('flashcard_sets_id_seq', COALESCE((SELECT MAX(id) FROM flashcard_sets), 0) + 1);
END $$;

-- Fix flashcards table ID to be auto-incrementing
DO $$
BEGIN
  -- Create sequence if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'flashcards_id_seq') THEN
    CREATE SEQUENCE flashcards_id_seq;
  END IF;
  
  -- Set the sequence as default for id column
  ALTER TABLE flashcards ALTER COLUMN id SET DEFAULT nextval('flashcards_id_seq');
  
  -- Set sequence ownership
  ALTER SEQUENCE flashcards_id_seq OWNED BY flashcards.id;
  
  -- Update sequence to start from current max value + 1
  PERFORM setval('flashcards_id_seq', COALESCE((SELECT MAX(id) FROM flashcards), 0) + 1);
END $$;