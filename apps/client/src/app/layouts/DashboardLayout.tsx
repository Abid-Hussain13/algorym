import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
    AnimatedSidebar,
    AnimatedSidebarContent,
    AnimatedSidebarFooter,
    AnimatedSidebarGroup,
    AnimatedSidebarGroupContent,
    AnimatedSidebarHeader,
    AnimatedSidebarInset,
    AnimatedSidebarMenu,
    AnimatedSidebarMenuButton,
    AnimatedSidebarMenuItem,
    AnimatedSidebarProvider,
    AnimatedSidebarRail,
    AnimatedSidebarTrigger,
} from "@/components/motion/animated-sidebar";
import { selectUser, logoutThunk } from "@/stores/auth-slice";
import type { AppDispatch } from "@/stores/store";

const navIcons: Record<string, string> = {
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
    terminal: "M4 17l6-6-6-6M12 19h8",
    file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6",
    chart: "M18 20V10M12 20V4M6 20v-6",
    live: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    settings: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
};

function NavIcon({ icon, className }: { icon: string; className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d={navIcons[icon] ?? navIcons.grid} />
        </svg>
    );
}

export function DashboardLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const user = useSelector(selectUser);
    const dispatch = useDispatch<AppDispatch>();
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const stored = localStorage.getItem("sidebar-open");
        return stored !== null ? stored === "true" : true;
    });

    const handleSidebarOpenChange = (nextOpen: boolean) => {
        setSidebarOpen(nextOpen);
        localStorage.setItem("sidebar-open", String(nextOpen));
    };

    const topItems = [
        { label: "Dashboard", id: "dashboard", to: "/app", icon: "grid" },
        { label: "Sessions", id: "sessions", to: "/app/sessions", icon: "terminal" },
        { label: "Questions", id: "questions", to: "/app/questions", icon: "file" },
        { label: "Reports", id: "reports", to: "/app/reports", icon: "chart" },
    ];

    const bottomItems = [
        { label: "Live Room", id: "live-room", to: "/live", icon: "live" },
        { label: "Settings", id: "settings", to: "/app/settings", icon: "settings" },
    ];

    const allItems = [...topItems, ...bottomItems];

    const activeId =
        [...allItems]
            .sort((a, b) => b.to.length - a.to.length)
            .find((item) => location.pathname.startsWith(item.to))?.id ?? "dashboard";

    const userName = user?.name ?? "User";
    if (userName === "User") navigate('/');
    const initials = userName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    const intitalFullName = userName
        .split(" ")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

    return (
        <div className="flex h-svh w-full overflow-hidden bg-bg">
            <AnimatedSidebarProvider open={sidebarOpen} onOpenChange={handleSidebarOpenChange} className="flex h-full w-full">
                <AnimatedSidebar
                    ariaLabel="Navigation"
                    collapsible="icon"
                    className="h-full"
                    panelClassName="h-full"
                >
                    <AnimatedSidebarHeader className="p-3 pb-2">
                        {sidebarOpen ? (
                            <div className="flex min-h-11 items-center gap-3 overflow-hidden px-2 justify-center">
                                <Link to="/app" className="flex items-center justify-center no-underline hover:no-underline">
                                    <img src="/logo.svg" alt="Algorym" className="h-10 sm:h-12 w-auto shrink-0" />
                                </Link>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => handleSidebarOpenChange(true)}
                                className="group relative flex min-h-11 w-full items-center justify-center rounded-xl outline-none transition-colors hover:bg-surface-2 cursor-pointer"
                                aria-label="Expand sidebar"
                            >
                                <img
                                    src="/logo.svg"
                                    alt="Algorym"
                                    className="h-8 w-auto shrink-0 opacity-100 transition-opacity duration-150 group-hover:opacity-0 pointer-events-none"
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-4 text-muted">
                                        <rect width="18" height="18" x="3" y="3" rx="2" />
                                        <path d="M9 3v18" />
                                    </svg>
                                </div>
                            </button>
                        )}
                    </AnimatedSidebarHeader>

                    <AnimatedSidebarContent>
                        <AnimatedSidebarGroup className="pt-1">
                            <AnimatedSidebarGroupContent>
                                <AnimatedSidebarMenu>
                                    {topItems.map((item) => (
                                        <AnimatedSidebarMenuItem key={item.id}>
                                            <AnimatedSidebarMenuButton
                                                isActive={activeId === item.id}
                                                icon={<NavIcon icon={item.icon} className="size-4" />}
                                                onSelect={() => navigate(item.to)}
                                            >
                                                {item.label}
                                            </AnimatedSidebarMenuButton>
                                        </AnimatedSidebarMenuItem>
                                    ))}
                                </AnimatedSidebarMenu>
                            </AnimatedSidebarGroupContent>
                        </AnimatedSidebarGroup>

                        <div className="my-1 mx-3 h-px bg-border" />

                        <AnimatedSidebarGroup>
                            <AnimatedSidebarGroupContent>
                                <AnimatedSidebarMenu>
                                    {bottomItems.map((item) => (
                                        <AnimatedSidebarMenuItem key={item.id}>
                                            <AnimatedSidebarMenuButton
                                                isActive={activeId === item.id}
                                                icon={<NavIcon icon={item.icon} className="size-4" />}
                                                onSelect={() => navigate(item.to)}
                                            >
                                                {item.label}
                                            </AnimatedSidebarMenuButton>
                                        </AnimatedSidebarMenuItem>
                                    ))}
                                </AnimatedSidebarMenu>
                            </AnimatedSidebarGroupContent>
                        </AnimatedSidebarGroup>
                    </AnimatedSidebarContent>

                    <AnimatedSidebarFooter className="px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                        {sidebarOpen ? (
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => dispatch(logoutThunk())}
                                    className="flex min-h-11 flex-1 items-center gap-3 overflow-hidden rounded-xl p-1 text-left outline-none transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent"
                                >
                                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold uppercase text-accent-text">
                                        {initials}
                                    </span>
                                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">
                                        {intitalFullName}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSidebarOpenChange(false)}
                                    className="grid size-7 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-fg"
                                    aria-label="Collapse sidebar"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
                                        <rect width="18" height="18" x="3" y="3" rx="2" />
                                        <path d="M9 3v18" />
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => dispatch(logoutThunk())}
                                className="flex w-full items-center justify-center rounded-xl p-1 outline-none transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent"
                            >
                                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold uppercase text-accent-text">
                                    {initials}
                                </span>
                            </button>
                        )}
                    </AnimatedSidebarFooter>

                    <AnimatedSidebarRail />
                </AnimatedSidebar>

                <AnimatedSidebarInset className="min-h-0">
                    <header className="flex shrink-0 items-center border-border px-4 md:hidden">
                        <AnimatedSidebarTrigger className="text-muted transition-colors hover:bg-surface-2 hover:text-fg">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                                <rect width="18" height="18" x="3" y="3" rx="2" />
                                <path d="M9 3v18" />
                            </svg>
                        </AnimatedSidebarTrigger>
                    </header>

                    <div className="flex-1 overflow-auto">
                        <Outlet />
                    </div>
                </AnimatedSidebarInset>
            </AnimatedSidebarProvider>
        </div>
    );
}
