"use client"

import { format } from "date-fns"
import { Clock, User, ArrowRight, Loader2 } from "lucide-react"
import { useState } from "react"

interface ShiftCardProps {
  shift: {
    id: string
    start_time: string
    end_time: string
    status: string
    assigned_to: string
    users: { full_name: string } | null
  }
  currentUserId: string
  userRole?: string
  userHasClaimed?: boolean
  pendingClaimCount?: number
  onClaim?: (shiftId: string) => Promise<{ error?: string }>
  onPostForSwap?: (shiftId: string) => Promise<{ error?: string }>
}

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  scheduled: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    label: "Scheduled",
  },
  open_for_swap: {
    bg: "bg-primary/10",
    text: "text-primary",
    label: "Open for Swap",
  },
  pending_approval: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-500",
    label: "Pending Approval",
  },
  swapped: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
    label: "Swapped",
  },
}

export default function ShiftCard({
  shift,
  currentUserId,
  userRole = "worker",
  userHasClaimed = false,
  pendingClaimCount = 0,
  onClaim,
  onPostForSwap,
}: ShiftCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justClaimed, setJustClaimed] = useState(false)

  const effectiveStatus = (shift.status === "open_for_swap" && pendingClaimCount > 0) ? "pending_approval" : shift.status
  const style = statusStyles[effectiveStatus] || statusStyles.scheduled
  const isOwner = shift.assigned_to === currentUserId
  const alreadyClaimed = userHasClaimed || justClaimed
  const isManager = userRole === "manager"
  const canClaim = shift.status === "open_for_swap" && !isOwner && !alreadyClaimed && !isManager
  const canPost = shift.status === "scheduled" && isOwner

  const startDate = new Date(shift.start_time)
  const endDate = new Date(shift.end_time)

  async function handleAction() {
    setLoading(true)
    setError(null)

    try {
      if (canClaim && onClaim) {
        const result = await onClaim(shift.id)
        if (result?.error) {
          setError(result.error)
        } else {
          setJustClaimed(true)
        }
      } else if (canPost && onPostForSwap) {
        const result = await onPostForSwap(shift.id)
        if (result?.error) setError(result.error)
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-border bg-card rounded-lg p-6 hover:bg-background transition-colors group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <span className="font-display text-sm font-medium text-foreground">
            {shift.users?.full_name || "Unknown"}
          </span>
          {isOwner && (
            <span className="text-[10px] uppercase tracking-widest text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded">
              You
            </span>
          )}
        </div>
        <span
          className={`text-[10px] uppercase tracking-widest font-semibold px-2 py-1 rounded ${style.bg} ${style.text}`}
        >
          {style.label}
        </span>
      </div>

      <div className="mb-4">
        <div className="font-display text-lg font-semibold text-foreground mb-1">
          {format(startDate, "EEEE, MMM d")}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>
            {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded">
          {error}
        </div>
      )}

      {alreadyClaimed && (
        <div className="mb-3 text-xs text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded font-semibold uppercase tracking-widest text-center">
          You claimed this shift
        </div>
      )}

      {isOwner && pendingClaimCount > 0 && (
        <div className="mb-3 text-xs text-primary bg-primary/10 border border-primary/20 px-3 py-2 rounded font-semibold uppercase tracking-widest text-center">
          {pendingClaimCount} pending {pendingClaimCount === 1 ? "claim" : "claims"}
        </div>
      )}

      {(canClaim || canPost) && (
        <button
          onClick={handleAction}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-xs uppercase tracking-widest font-display font-semibold transition-all disabled:opacity-50 ${
            canClaim
              ? "bg-primary text-primary-foreground hover:brightness-110"
              : "border border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary"
          }`}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : canClaim ? (
            <>
              Claim Shift <ArrowRight className="h-3.5 w-3.5" />
            </>
          ) : (
            "Post for Swap"
          )}
        </button>
      )}
    </div>
  )
}
