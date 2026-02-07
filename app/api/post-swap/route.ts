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

  const { shiftId } = await request.json()
  if (!shiftId) {
    return NextResponse.json(
      { error: "shiftId is required" },
      { status: 400 }
    )
  }

  // Verify the shift belongs to the current user
  const { data: shift, error: shiftError } = await supabase
    .from("shifts")
    .select("*")
    .eq("id", shiftId)
    .eq("assigned_to", user.id)
    .single()

  if (shiftError || !shift) {
    return NextResponse.json(
      { error: "Shift not found or not yours" },
      { status: 404 }
    )
  }

  if (shift.status !== "scheduled") {
    return NextResponse.json(
      { error: "Only scheduled shifts can be posted for swap" },
      { status: 400 }
    )
  }

  const { error: updateError } = await supabase
    .from("shifts")
    .update({ status: "open_for_swap" })
    .eq("id", shiftId)

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update shift" },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
