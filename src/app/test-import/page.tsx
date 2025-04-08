import React from "react";
// import { Button } from "@/components/ui/button"; // Remove button import
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createBrowserClient } from "@/lib/supabase/client"; // Import using alias

// We are intentionally not using createBrowserClient in the component body
// to isolate if the import resolution itself is the problem.
// If this page fails to load, the import resolution failed.

export default function TestImportPage() {
  return (
    <div>
      <h1>Testing Import</h1>
      {/* <Button>Test Button</Button> */}
      <p>Attempting to import createBrowserClient...</p>
    </div>
  );
}
