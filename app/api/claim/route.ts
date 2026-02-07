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

  // Managers cannot claim shifts
  const { data: claimerProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (claimerProfile?.role === "manager") {
    return NextResponse.json(
      { error: "Managers cannot claim shifts" },
      { status: 403 }
    )
  }

  const { shiftId } = await request.json()
  if (!shiftId) {
    return NextResponse.json(
      { error: "shiftId is required" },
      { status: 400 }
    )
  }

  // 1. Get the shift
  const { data: shift, error: shiftError } = await supabase
    .from("shifts")
    .select("*")
    .eq("id", shiftId)
    .single()

  if (shiftError || !shift) {
    return NextResponse.json({ error: "Shift not found" }, { status: 404 })
  }

  if (shift.status !== "open_for_swap") {
    return NextResponse.json(
      { error: "Shift is not available for swap" },
      { status: 400 }
    )
  }

  if (shift.assigned_to === user.id) {
    return NextResponse.json(
      { error: "You cannot claim your own shift" },
      { status: 400 }
    )
  }

  // 2. Double-booking check: does the user already have a shift on this day?
  const shiftDate = new Date(shift.start_time)
  const dayStart = new Date(shiftDate)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(shiftDate)
  dayEnd.setHours(23, 59, 59, 999)

  const { data: existingShifts } = await supabase
    .from("shifts")
    .select("id")
    .eq("assigned_to", user.id)
    .neq("status", "swapped")
    .gte("start_time", dayStart.toISOString())
    .lte("start_time", dayEnd.toISOString())

  if (existingShifts && existingShifts.length > 0) {
    return NextResponse.json(
      { error: "Double booking: you already have a shift on this day" },
      { status: 400 }
    )
  }

  // 3. Consecutive days check (simplified: no more than 6 consecutive workdays)
  const checkStart = new Date(shiftDate)
  checkStart.setDate(checkStart.getDate() - 6)
  const checkEnd = new Date(shiftDate)
  checkEnd.setDate(checkEnd.getDate() + 6)

  const { data: nearbyShifts } = await supabase
    .from("shifts")
    .select("start_time")
    .eq("assigned_to", user.id)
    .neq("status", "swapped")
    .gte("start_time", checkStart.toISOString())
    .lte("start_time", checkEnd.toISOString())
    .order("start_time")

  if (nearbyShifts) {
    const workDays = new Set(
      nearbyShifts.map((s) => new Date(s.start_time).toDateString())
    )
    workDays.add(shiftDate.toDateString())

    // Check for 7 consecutive days including the new shift
    const sortedDays = Array.from(workDays)
      .map((d) => new Date(d))
      .sort((a, b) => a.getTime() - b.getTime())

    let maxConsecutive = 1
    let currentStreak = 1
    for (let i = 1; i < sortedDays.length; i++) {
      const diff =
        (sortedDays[i].getTime() - sortedDays[i - 1].getTime()) /
        (1000 * 60 * 60 * 24)
      if (diff === 1) {
        currentStreak++
        maxConsecutive = Math.max(maxConsecutive, currentStreak)
      } else {
        currentStreak = 1
      }
    }

    if (maxConsecutive > 6) {
      return NextResponse.json(
        {
          error:
            "Compliance: claiming this shift would result in 7+ consecutive workdays",
        },
        { status: 400 }
      )
    }
  }

  // 4. Check if user already has a pending request for this shift
  const { data: existingRequest } = await supabase
    .from("swap_requests")
    .select("id")
    .eq("shift_id", shiftId)
    .eq("requested_by", user.id)
    .eq("status", "pending")
    .maybeSingle()

  if (existingRequest) {
    return NextResponse.json(
      { error: "You already have a pending claim for this shift" },
      { status: 400 }
    )
  }

  // 5. Create swap request (shift status stays open_for_swap until manager approves)
  const { error: insertError } = await supabase
    .from("swap_requests")
    .insert({
      shift_id: shiftId,
      requested_by: user.id,
      status: "pending",
    })

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to create swap request: " + insertError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
