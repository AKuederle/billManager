import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";

import "./index.css";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { DBProvider } from "./db/dbContext";

// Create a new router instance
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  basepath: import.meta.env.BASE_URL,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <DBProvider>
        <RouterProvider router={router} />
      </DBProvider>
    </StrictMode>,
  );
}
