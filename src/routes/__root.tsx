import { BackButton } from '@/components/backbutton'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = createRootRoute({
    component: () => (<>
        <div className="container mx-auto p-4 max-w-md">
            <Outlet />
            <div className="py-5 flex justify-center">
                <BackButton homeRoute="/bills" />
            </div>
        </div>
        {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
    ),
})