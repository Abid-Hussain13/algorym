import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
    AnimatedSidebar,
    AnimatedSidebarClose,
    AnimatedSidebarContent,
    AnimatedSidebarFooter,
    AnimatedSidebarGroup,
    AnimatedSidebarGroupContent,
    AnimatedSidebarGroupLabel,
    AnimatedSidebarHeader,
    AnimatedSidebarInset,
    AnimatedSidebarMenu,
    AnimatedSidebarMenuButton,
    AnimatedSidebarMenuItem,
    AnimatedSidebarMenuSub,
    AnimatedSidebarMenuSubButton,
    AnimatedSidebarMenuSubItem,
    AnimatedSidebarProvider,
    AnimatedSidebarRail,
    AnimatedSidebarTrigger,
} from "@/components/motion/animated-sidebar";
import { selectUser, logoutThunk } from "@/stores/auth-slice";
import type { AppDispatch } from "@/stores/store";
import { IconTerminal, IconCodeTogether } from "@/components/icons";

const navIcons: Record<string, string> = {
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
    terminal: "M4 17l6-6-6-6M12 19h8",
    file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6",
    settings: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
};

const navItems = [
    { label: "Dashboard", id: "dashboard", icon: "grid" },
    { label: "Sessions", id: "sessions", icon: "terminal", children: ["All Sessions", "Active", "Completed"] },
    { label: "Templates", id: "templates", icon: "file" },
    { label: "Settings", id: "settings", icon: "settings" },
] as const;

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
    const [active, setActive] = useState("dashboard");
    const [openSection, setOpenSection] = useState<string | null>(null);
    const user = useSelector(selectUser);
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    const userName = user?.name ?? "User";
    const userEmail = user?.email ?? "";
    const initials = userName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="flex h-svh w-full overflow-hidden bg-bg">
            <AnimatedSidebarProvider className="flex h-full w-full">
                <AnimatedSidebar
                    ariaLabel="Navigation"
                    collapsible="icon"
                    className="h-full"
                    panelClassName="h-full"
                >
                    <AnimatedSidebarHeader className="p-3 pb-2">
                        <div className="flex min-h-11 items-center gap-3 overflow-hidden px-2">
                            <div className="grid size-7 shrink-0 place-items-center rounded-md bg-accent text-on-accent">
                                <IconTerminal aria-hidden="true" className="size-4" />
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate("/app")}
                                className="flex min-w-0 flex-1 items-center gap-2 text-left outline-none group-data-[state=collapsed]/sidebar:hidden"
                            >
                                <span className="truncate text-sm font-semibold text-fg">
                                    Algorym
                                </span>
                            </button>
                            <AnimatedSidebarClose className="ml-auto text-muted hover:text-fg md:hidden">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                                    <path d="M18 6 6 18M6 6l12 12" />
                                </svg>
                            </AnimatedSidebarClose>
                        </div>
                    </AnimatedSidebarHeader>

                    <AnimatedSidebarContent className="px-2 pt-1">
                        <AnimatedSidebarGroup className="pb-2">
                            <AnimatedSidebarGroupContent>
                                <AnimatedSidebarMenu>
                                    <AnimatedSidebarMenuItem>
                                        <AnimatedSidebarMenuButton
                                            icon={
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                                                    <circle cx="11" cy="11" r="8" />
                                                    <path d="m21 21-4.3-4.3" />
                                                </svg>
                                            }
                                            onSelect={() => setActive("search")}
                                        >
                                            Search
                                        </AnimatedSidebarMenuButton>
                                    </AnimatedSidebarMenuItem>
                                    <AnimatedSidebarMenuItem>
                                        <AnimatedSidebarMenuButton
                                            icon={<IconCodeTogether className="size-4" />}
                                            onSelect={() => setActive("sessions")}
                                        >
                                            New Session
                                        </AnimatedSidebarMenuButton>
                                    </AnimatedSidebarMenuItem>
                                </AnimatedSidebarMenu>
                            </AnimatedSidebarGroupContent>
                        </AnimatedSidebarGroup>

                        <AnimatedSidebarGroup className="pt-1">
                            <AnimatedSidebarGroupLabel>
                                Navigation
                            </AnimatedSidebarGroupLabel>
                            <AnimatedSidebarGroupContent>
                                <AnimatedSidebarMenu>
                                    {navItems.map(({ label, id, icon, children }) => (
                                        <AnimatedSidebarMenuItem key={id}>
                                            <AnimatedSidebarMenuButton
                                                isActive={
                                                    active === id ||
                                                    children?.some((c) => c.toLowerCase().replace(/\s+/g, "-") === active) === true
                                                }
                                                ariaExpanded={
                                                    children ? openSection === id : undefined
                                                }
                                                icon={<NavIcon icon={icon} className="size-4" />}
                                                onSelect={() => {
                                                    if (children) {
                                                        setOpenSection((current) =>
                                                            current === id ? null : id
                                                        );
                                                    } else {
                                                        setActive(id);
                                                        setOpenSection(null);
                                                    }
                                                }}
                                            >
                                                {label}
                                            </AnimatedSidebarMenuButton>
                                            {children ? (
                                                <AnimatedSidebarMenuSub
                                                    open={openSection === id}
                                                >
                                                    {children.map((child) => (
                                                        <AnimatedSidebarMenuSubItem key={child}>
                                                            <AnimatedSidebarMenuSubButton
                                                                isActive={active === child.toLowerCase().replace(/\s+/g, "-")}
                                                                onSelect={() => setActive(child.toLowerCase().replace(/\s+/g, "-"))}
                                                            >
                                                                {child}
                                                            </AnimatedSidebarMenuSubButton>
                                                        </AnimatedSidebarMenuSubItem>
                                                    ))}
                                                </AnimatedSidebarMenuSub>
                                            ) : null}
                                        </AnimatedSidebarMenuItem>
                                    ))}
                                </AnimatedSidebarMenu>
                            </AnimatedSidebarGroupContent>
                        </AnimatedSidebarGroup>
                    </AnimatedSidebarContent>

                    <AnimatedSidebarFooter className="gap-3 border-none p-3">
                        <button
                            type="button"
                            onClick={() => dispatch(logoutThunk())}
                            className="flex min-h-11 w-full items-center gap-3 overflow-hidden rounded-xl p-1 text-left outline-none transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent"
                        >
                            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent-text">
                                {initials}
                            </span>
                            <span className="min-w-0 flex-1 group-data-[state=collapsed]/sidebar:hidden">
                                <span className="block truncate text-sm font-medium text-fg">
                                    {userName}
                                </span>
                                <span className="block truncate text-xs text-muted">
                                    {userEmail}
                                </span>
                            </span>
                        </button>
                    </AnimatedSidebarFooter>

                    <AnimatedSidebarRail />
                </AnimatedSidebar>

                <AnimatedSidebarInset className="min-h-0">
                    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
                        <AnimatedSidebarTrigger className="text-muted transition-colors hover:bg-surface-2 hover:text-fg">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                                <rect width="18" height="18" x="3" y="3" rx="2" />
                                <path d="M9 3v18" />
                            </svg>
                        </AnimatedSidebarTrigger>
                        <div className="h-5 w-px bg-border" />
                        <p className="text-sm font-medium capitalize text-fg">{active}</p>
                    </header>

                    <div className="flex-1 overflow-auto">
                        <Outlet />
                    </div>
                </AnimatedSidebarInset>
            </AnimatedSidebarProvider>
        </div>
    );
}
