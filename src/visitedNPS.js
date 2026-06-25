// visitedNPS.js

// SAVE VISITED NPS
export async function saveVisitedNPS(supabase, userId, npsId, date) {
  return await supabase
    .from("visited_nps")
    .upsert({
      user_id: userId,
      nps_id: npsId,
      visited: true,
      visited_at: date
    });
}

// DELETE VISITED NPS
export async function deleteVisitedNPS(supabase, userId, npsId) {
  return await supabase
    .from("visited_nps")
    .delete()
    .eq("user_id", userId)
    .eq("nps_id", npsId);
}
