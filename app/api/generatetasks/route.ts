import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface TaskItem {
  title: string;
}

export async function POST(req: NextRequest) {
  try {
    // Get input from request
    const { input } = await req.json();
    console.log("Received input:", input);

    if (!input || typeof input !== 'string') {
      return NextResponse.json({ error: "Input is required and must be a string" }, { status: 400 });
    }

    // Step 1: Call OpenAI to generate tasks
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Update this to match your preferred model
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `
Generate tasks based on the user's input. Your response must be ONLY a JSON array of task objects.
Example response format:
[
  { "title": "First task" },
  { "title": "Second task" },
  { "title": "Third task" }
]
          `.trim(),
        },
        { role: "user", content: input },
      ],
    });

    // Get the raw response
    const rawResponse = completion.choices[0]?.message.content || "[]";
    console.log("Raw GPT output:", rawResponse);

    // Parse the response
    let steps: TaskItem[] = [];
    try {
      // Try to extract JSON array from the response
      const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : rawResponse;
      
      // Parse the JSON
      const parsedResponse = JSON.parse(jsonStr);
      
      // Validate the response format
      if (Array.isArray(parsedResponse)) {
        steps = parsedResponse.filter(item => 
          typeof item === 'object' && 
          item !== null && 
          'title' in item && 
          typeof item.title === 'string'
        );
      } 
      console.log("Parsed steps:", steps);
    } catch (err) {
      console.error("Failed to parse JSON:", err);
    }

    // Use default steps if none were generated
    if (steps.length === 0) {
      steps = [
        { title: "Review requirements" },
        { title: "Create initial draft" },
        { title: "Finalize implementation" }
      ];
      console.log("Using default steps");
    }

    // Step 2: Insert the Loop into Supabase
    const { data: loop, error: loopError } = await supabase
      .from("loopz")
      .insert([{ title: input, description: input, status: "open" }])
      .select()
      .single();

    if (loopError) {
      console.error("Loop insert error:", loopError);
      return NextResponse.json({ error: loopError?.message || "Loop creation failed" }, { status: 500 });
    }

    // Step 3: Insert the Steps into Supabase
    const stepPayload = steps.map((s) => ({
      loop_id: loop.id,
      title: s.title,
      completed: false,
    }));

    const { data: insertedSteps, error: stepError } = await supabase
      .from("steps")
      .insert(stepPayload)
      .select();

    if (stepError) {
      console.error("Step insert error:", stepError);
      return NextResponse.json({ error: stepError.message }, { status: 500 });
    }

    console.log("Steps inserted successfully");
    return NextResponse.json({ loopId: loop.id, steps: insertedSteps });
    
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" }, 
      { status: 500 }
    );
  }
}