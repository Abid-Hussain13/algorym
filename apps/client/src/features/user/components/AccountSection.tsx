import { useDispatch } from "react-redux"
import { Button } from "@/components/ui/Button"
import { logoutThunk } from "@/stores/auth-slice"
import type { AppDispatch } from "@/stores/store"
import { SectionCard } from "./SectionCard"

export function AccountSection() {
    const dispatch = useDispatch<AppDispatch>()

    return (
        <SectionCard title="Account">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm text-muted">Sign out of your account on this device.</span>
                        <span className="text-xs text-faint">You will need to sign in again to access your account.</span>
                    </div>
                    <Button variant="primary" size="sm" onClick={() => dispatch(logoutThunk())} className="shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Sign Out
                    </Button>
                </div>
            </div>
        </SectionCard>
    )
}
