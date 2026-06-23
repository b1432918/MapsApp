import { supabase } from "./supabase"

// Save a visit with a date
export async function saveVisitedPark(userId, parkId, date) {
  await supabase
    .from("visited_parks")
    .upsert({
      user_id: userId,
      park_id: parkId,
      visited: true,
      visited_at: date
    })
}

// Delete a visit
export async function deleteVisitedPark(userId, parkId) {
  await supabase
    .from("visited_parks")
    .delete()
    .eq("user_id", userId)
    .eq("park_id", parkId)
}

// Load visited parks + dates
export async function loadVisitedParks(userId) {
  const { data, error } = await supabase
    .from("visited_parks")
    .select("park_id, visited_at")
    .eq("user_id", userId)

  if (error) {
    console.error("Error loading visited parks:", error)
    return {
      visitedSet: new Set(),
      visitedDatesMap: {}
    }
  }

  const visitedSet = new Set()
  const visitedDatesMap = {}

  data.forEach(row => {
    visitedSet.add(row.park_id)
    visitedDatesMap[row.park_id] = row.visited_at
  })

  return { visitedSet, visitedDatesMap }
}
