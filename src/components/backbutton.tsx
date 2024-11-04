import { Button } from "@/components/ui/button";
import { Link, useLocation } from "@tanstack/react-router";
import { HomeIcon } from "lucide-react";

export function BackButton({homeRoute}: {homeRoute?: string}) {
    const location = useLocation();

    const isIndexRoute = location.pathname === homeRoute;

    if (isIndexRoute) {
        return null;
    }

    return (
        <Button
            variant="default"
            size="icon"
            className="rounded-full w-10 h-10"
            asChild
        >
            <Link to={homeRoute}>
                <HomeIcon className="h-10 w-10" />
            </Link>
        </Button>
    );
}