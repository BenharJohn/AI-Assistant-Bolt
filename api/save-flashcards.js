// File: /api/save-flashcards.js
import { createClient } from '@supabase/supabase-js';

export default async (req, context) => {
  // 1. Ensure this is a POST request
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    // 2. Get the topic and the array of flashcards from the request
    const { topic, flashcards } = await req.json();

    if (!topic || !flashcards || !Array.isArray(flashcards) || flashcards.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid topic or flashcards data provided' }), { status: 400 });
    }

    // 3. Connect to Supabase using your secure server-side keys
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("FATAL: Supabase environment variables not set for save-flashcards.");
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Create a new "set" in the flashcard_sets table
    const { data: setData, error: setError } = await supabase
      .from('flashcard_sets')
      .insert({ topic: topic })
      .select('id')
      .single();

    if (setError || !setData) {
      console.error("Error creating flashcard set:", setError);
      throw new Error("Could not create the flashcard set.");
    }

    const setId = setData.id;

    // 5. Add the `set_id` to each flashcard
    const flashcardsToInsert = flashcards.map(card => ({
      question: card.question,
      answer: card.answer,
      set_id: setId
    }));

    // 6. Insert all the new flashcards into the flashcards table
    const { error: cardsError } = await supabase.from('flashcards').insert(flashcardsToInsert);

    if (cardsError) {
      console.error("Error inserting flashcards:", cardsError);
      throw new Error("Could not save the flashcards to the set.");
    }

    // 7. Send back a success message
    return new Response(JSON.stringify({ success: true, message: `Flashcard set "${topic}" saved successfully!` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Critical error in save-flashcards function:", error.message);
    return new Response(JSON.stringify({ error: 'An error occurred while saving the flashcards.' }), { status: 500 });
  }
};

export const config = {
  path: "/api/save-flashcards",
};
