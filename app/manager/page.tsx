"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import DashboardNav from "@/components/dashboard-nav"
import { format } from "date-fns"
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ShieldCheck,
  User,
  ArrowRight,
} from "lucide-react"

type SwapRequest = {
  id: string
  shift_id: string
  requested_by: string
  status: string
  created_at: string
  shifts: {
    id: string
    start_time: string
    end_time: string
    status: string
    assigned_to: string
    users: { full_name: string } | null
  } | null
  requester: { full_name: string } | null
}

type UserProfile = {
  id: string
  full_name: string
  role: string
}

export default function ManagerPage() {
  const [requests, setRequests] = useState<SwapRequest[]>([])
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"pending" | "all">("pending")
  const router = useRouter()
  const supabase = createClient()

  const fetchRequests = useCallback(async () => {
    const { data } = await supabase
      .from("swap_requests")
      .select("*, shifts(*, users(full_name))")
      .order("created_at", { ascending: false })

    if (data) {
      // Fetch requester names
      const enriched = await Promise.all(
        data.map(async (req) => {
          const { data: requester } = await supabase
            .from("users")
            .select("full_name")
            .eq("id", req.requested_by)
            .single()
          return { ...req, requester }
        })
      )
      setRequests(enriched)
    }
  }, [supabase])

  useEffect(() => {
    async function init() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      if (!authUser) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single()

      if (!profile || profile.role !== "manager") {
        router.push("/dashboard")
        return
      }

      setUser(profile)
      await fetchRequests()
      setLoading(false)
    }

    init()
  }, [supabase, router, fetchRequests])

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("swap-requests-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "swap_requests" },
        () => {
          fetchRequests()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchRequests])

  async function handleAction(requestId: string, action: "approve" | "reject") {
    setActionLoading(requestId)
    setActionError(null)
    try {
      const res = await fetch("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      })
      const data = await res.json()
      if (!res.ok) {
        setActionError(data.error || "Action failed")
      }
    } catch {
      setActionError("Network error")
    }
    await fetchRequests()
    setActionLoading(null)
  }

  const filteredRequests =
    filter === "pending"
      ? requests.filter((r) => r.status === "pending")
      : requests

  const statusStyles: Record<string, { icon: typeof Clock; color: string; label: string }> = {
    pending: { icon: Clock, color: "text-yellow-500", label: "Pending" },
    approved: {
      icon: CheckCircle2,
      color: "text-emerald-500",
      label: "Approved",
    },
    rejected: { icon: XCircle, color: "text-destructive", label: "Rejected" },
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav
        fullName={user?.full_name || "Manager"}
        role="manager"
        activePage="manager"
      />

      <main className="pt-24 pb-16 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-primary mb-2 block">
              Manager Dashboard
            </span>
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              Swap Approvals
            </h1>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-8 border-b border-border pb-4">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          {(["pending", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs uppercase tracking-widest font-semibold transition-colors ${
                filter === f
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "pending" ? "Pending" : "All Requests"}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">
            {filteredRequests.length} request
            {filteredRequests.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Error Banner */}
        {actionError && (
          <div className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 px-4 py-3 rounded-lg flex items-center justify-between">
            <span>{actionError}</span>
            <button
              onClick={() => setActionError(null)}
              className="text-destructive hover:text-foreground transition-colors text-xs uppercase tracking-widest font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Requests */}
        {filteredRequests.length === 0 ? (
          <div className="text-center py-20 border border-border rounded-lg bg-card">
            <ShieldCheck className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              {filter === "pending"
                ? "No pending requests"
                : "No swap requests yet"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Swap requests from workers will appear here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredRequests.map((req) => {
              const style = statusStyles[req.status] || statusStyles.pending
              const StatusIcon = style.icon
              const shift = req.shifts

              return (
                <div
                  key={req.id}
                  className="border border-border bg-card rounded-lg p-6 hover:bg-background transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <StatusIcon className={`h-4 w-4 ${style.color}`} />
                        <span
                          className={`text-[10px] uppercase tracking-widest font-semibold ${style.color}`}
                        >
                          {style.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(req.created_at), "MMM d, h:mm a")}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm mb-2">
                        <User className="h-3.5 w-3.5 text-primary" />
                        <span className="font-display font-medium text-foreground">
                          {req.requester?.full_name || "Unknown"}
                        </span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          wants to take
                        </span>
                        <span className="font-display font-medium text-foreground">
                          {shift?.users?.full_name || "Unknown"}
                          {"'s"}
                        </span>
                        <span className="text-muted-foreground">shift</span>
                      </div>

                      {shift && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {format(
                              new Date(shift.start_time),
                              "EEEE, MMM d"
                            )}{" "}
                            / {format(new Date(shift.start_time), "h:mm a")} -{" "}
                            {format(new Date(shift.end_time), "h:mm a")}
                          </span>
                        </div>
                      )}
                    </div>

                    {req.status === "pending" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAction(req.id, "approve")}
                          disabled={actionLoading === req.id}
                          className="flex items-center gap-2 bg-emerald-600 text-foreground px-4 py-2 rounded-md text-xs uppercase tracking-widest font-display font-semibold hover:bg-emerald-500 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === req.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Approve
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleAction(req.id, "reject")}
                          disabled={actionLoading === req.id}
                          className="flex items-center gap-2 border border-border text-muted-foreground px-4 py-2 rounded-md text-xs uppercase tracking-widest font-display font-semibold hover:border-destructive hover:text-destructive transition-colors disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Stats */}
        <div className="mt-12 grid grid-cols-3 gap-px bg-border border border-border rounded-lg overflow-hidden">
          {[
            {
              label: "Pending",
              value: requests.filter((r) => r.status === "pending").length,
            },
            {
              label: "Approved",
              value: requests.filter((r) => r.status === "approved").length,
            },
            {
              label: "Rejected",
              value: requests.filter((r) => r.status === "rejected").length,
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-card p-6 text-center">
              <div className="font-display text-2xl font-bold text-primary">
                {stat.value}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
