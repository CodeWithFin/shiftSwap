"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LogOut, LayoutDashboard, ShieldCheck } from "lucide-react"

interface DashboardNavProps {
  fullName: string
  role: string
  activePage: "dashboard" | "manager"
}

export default function DashboardNav({
  fullName,
  role,
  activePage,
}: DashboardNavProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <nav className="fixed top-0 w-full border-b border-border bg-background/80 backdrop-blur-md z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/dashboard"
            className="font-display text-lg font-bold tracking-tight"
          >
            SHIFT<span className="text-primary">SWAP</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs uppercase tracking-widest font-semibold transition-colors ${
                activePage === "dashboard"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Shift Board
            </Link>
            {role === "manager" && (
              <Link
                href="/manager"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs uppercase tracking-widest font-semibold transition-colors ${
                  activePage === "manager"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Approvals
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium text-foreground">
              {fullName}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-primary font-semibold">
              {role}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  )
}
