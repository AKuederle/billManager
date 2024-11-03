import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = createRootRoute({
    component: () => (<>
        <div className="container mx-auto p-4 max-w-md">

       <Outlet />
        </div>
        <TanStackRouterDevtools />
        </>

    ),
})