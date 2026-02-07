import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check manager role
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "manager") {
    return NextResponse.json(
      { error: "Only managers can approve swaps" },
      { status: 403 }
    )
  }

  const { requestId, action } = await request.json()
  if (!requestId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  // Get the swap request with shift info
  const { data: swapRequest, error: reqError } = await supabase
    .from("swap_requests")
    .select("*, shifts(*)")
    .eq("id", requestId)
    .single()

  if (reqError || !swapRequest) {
    return NextResponse.json(
      { error: "Swap request not found" },
      { status: 404 }
    )
  }

  if (swapRequest.status !== "pending") {
    return NextResponse.json(
      { error: "Request already processed" },
      { status: 400 }
    )
  }

  if (action === "approve") {
    // Update swap request status
    const { error: swapError } = await supabase
      .from("swap_requests")
      .update({ status: "approved" })
      .eq("id", requestId)

    if (swapError) {
      console.log("[v0] swap_requests update error:", swapError.message)
      return NextResponse.json(
        { error: "Failed to update swap request: " + swapError.message },
        { status: 500 }
      )
    }

    // Update shift: reassign to the claimer and mark as swapped
    const { error: shiftError } = await supabase
      .from("shifts")
      .update({
        assigned_to: swapRequest.requested_by,
        status: "swapped",
      })
      .eq("id", swapRequest.shift_id)

    if (shiftError) {
      console.log("[v0] shifts update error:", shiftError.message)
      return NextResponse.json(
        { error: "Failed to update shift: " + shiftError.message },
        { status: 500 }
      )
    }

    // Reject all other pending requests for this shift
    await supabase
      .from("swap_requests")
      .update({ status: "rejected" })
      .eq("shift_id", swapRequest.shift_id)
      .eq("status", "pending")
      .neq("id", requestId)
  } else {
    // Reject the swap request
    const { error: rejectError } = await supabase
      .from("swap_requests")
      .update({ status: "rejected" })
      .eq("id", requestId)

    if (rejectError) {
      console.log("[v0] swap_requests reject error:", rejectError.message)
      return NextResponse.json(
        { error: "Failed to reject request: " + rejectError.message },
        { status: 500 }
      )
    }

    // Check if there are other pending requests for this shift
    const { data: otherPending } = await supabase
      .from("swap_requests")
      .select("id")
      .eq("shift_id", swapRequest.shift_id)
      .eq("status", "pending")

    // Shift stays open_for_swap (no status change needed since we never changed it)
  }

  return NextResponse.json({ success: true })
}
