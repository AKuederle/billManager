import { BackButton } from "@/components/backbutton";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="container mx-auto max-w-md p-4">
        <Outlet />
        <div className="flex justify-center py-5">
          <BackButton homeRoute="/bills" />
        </div>
      </div>
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  ),
});
