"use client"

import React from "react"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import DashboardNav from "@/components/dashboard-nav"
import ShiftCard from "@/components/shift-card"
import { CalendarDays, ArrowUpDown, Plus, Loader2 } from "lucide-react"

type Shift = {
  id: string
  start_time: string
  end_time: string
  status: string
  assigned_to: string
  users: { full_name: string } | null
}

type SwapRequest = {
  id: string
  shift_id: string
  requested_by: string
  status: string
}

type UserProfile = {
  id: string
  full_name: string
  role: string
}

export default function DashboardPage() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([])
  const [user, setUser] = useState<UserProfile | null>(null)
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "mine" | "open">("all")
  const [showAddForm, setShowAddForm] = useState(false)
  const [addingShift, setAddingShift] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const fetchShifts = useCallback(async () => {
    const { data } = await supabase
      .from("shifts")
      .select("*, users(full_name)")
      .order("start_time", { ascending: true })

    if (data) setShifts(data)

    const { data: requests } = await supabase
      .from("swap_requests")
      .select("*")
      .eq("status", "pending")

    if (requests) setSwapRequests(requests)
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

      setAuthUserId(authUser.id)

      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single()

      if (profile) setUser(profile)

      await fetchShifts()
      setLoading(false)
    }

    init()
  }, [supabase, router, fetchShifts])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("shifts-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shifts" },
        () => {
          fetchShifts()
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "swap_requests" },
        () => {
          fetchShifts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchShifts])

  async function handleClaim(shiftId: string) {
    const res = await fetch("/api/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shiftId }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.error }
    await fetchShifts()
    return {}
  }

  async function handlePostForSwap(shiftId: string) {
    const res = await fetch("/api/post-swap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shiftId }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.error }
    await fetchShifts()
    return {}
  }

  async function handleAddShift(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setAddingShift(true)
    const formData = new FormData(e.currentTarget)
    const date = formData.get("date") as string
    const startTime = formData.get("startTime") as string
    const endTime = formData.get("endTime") as string

    if (!date || !startTime || !endTime || !authUserId) {
      setAddingShift(false)
      return
    }

    const startDateTime = new Date(`${date}T${startTime}:00`)
    const endDateTime = new Date(`${date}T${endTime}:00`)

    await supabase.from("shifts").insert({
      assigned_to: authUserId,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      status: "scheduled",
    })

    await fetchShifts()
    setShowAddForm(false)
    setAddingShift(false)
  }

  const filteredShifts = shifts.filter((s) => {
    if (filter === "mine") return s.assigned_to === authUserId
    if (filter === "open") return s.status === "open_for_swap"
    return true
  })

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
        fullName={user?.full_name || "User"}
        role={user?.role || "worker"}
        activePage="dashboard"
      />

      <main className="pt-24 pb-16 px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-primary mb-2 block">
              Dashboard
            </span>
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              Shift Board
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-md text-xs uppercase tracking-widest font-display font-semibold hover:brightness-110 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Shift
            </button>
          </div>
        </div>

        {/* Add Shift Form */}
        {showAddForm && (
          <div className="border border-border bg-card rounded-lg p-4 md:p-6 mb-8 overflow-hidden">
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-primary mb-4 block">
              New Shift
            </span>
            <form
              onSubmit={handleAddShift}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 min-w-0"
            >
              <div className="min-w-0">
                <label
                  htmlFor="date"
                  className="block text-xs uppercase tracking-widest text-muted-foreground mb-2 font-medium"
                >
                  Date
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  required
                  className="w-full min-w-0 bg-background border border-border rounded-md px-3 py-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors text-sm"
                />
              </div>
              <div className="min-w-0">
                <label
                  htmlFor="startTime"
                  className="block text-xs uppercase tracking-widest text-muted-foreground mb-2 font-medium"
                >
                  Start Time
                </label>
                <input
                  id="startTime"
                  name="startTime"
                  type="time"
                  required
                  className="w-full min-w-0 bg-background border border-border rounded-md px-3 py-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors text-sm"
                />
              </div>
              <div className="min-w-0">
                <label
                  htmlFor="endTime"
                  className="block text-xs uppercase tracking-widest text-muted-foreground mb-2 font-medium"
                >
                  End Time
                </label>
                <input
                  id="endTime"
                  name="endTime"
                  type="time"
                  required
                  className="w-full min-w-0 bg-background border border-border rounded-md px-3 py-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors text-sm"
                />
              </div>
              <div className="flex items-end min-w-0">
                <button
                  type="submit"
                  disabled={addingShift}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-md text-xs uppercase tracking-widest font-display font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {addingShift ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Create"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 mb-8 border-b border-border pb-4">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          {(["all", "open", "mine"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs uppercase tracking-widest font-semibold transition-colors ${
                filter === f
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "All Shifts" : f === "open" ? "Open" : "My Shifts"}
            </button>
          ))}
        </div>

        {/* Shift Grid */}
        {filteredShifts.length === 0 ? (
          <div className="text-center py-20 border border-border rounded-lg bg-card">
            <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              No shifts found
            </h3>
            <p className="text-sm text-muted-foreground">
              {filter === "mine"
                ? "You don't have any shifts yet. Add one above."
                : filter === "open"
                  ? "No shifts are open for swap right now."
                  : "No shifts in the system yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredShifts.map((shift) => {
              const shiftClaims = swapRequests.filter((r) => r.shift_id === shift.id)
              const userHasClaimed = shiftClaims.some((r) => r.requested_by === authUserId)
              return (
                <ShiftCard
                  key={shift.id}
                  shift={shift}
                  currentUserId={authUserId || ""}
                  userRole={user?.role || "worker"}
                  userHasClaimed={userHasClaimed}
                  pendingClaimCount={shiftClaims.length}
                  onClaim={handleClaim}
                  onPostForSwap={handlePostForSwap}
                />
              )
            })}
          </div>
        )}

        {/* Stats Bar */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border rounded-lg overflow-hidden">
          {[
            {
              label: "Total Shifts",
              value: shifts.length,
            },
            {
              label: "Open for Swap",
              value: shifts.filter((s) => s.status === "open_for_swap").length,
            },
            {
              label: "Pending",
              value: swapRequests.length,
            },
            {
              label: "Swapped",
              value: shifts.filter((s) => s.status === "swapped").length,
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
