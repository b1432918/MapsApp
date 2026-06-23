import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

//  Save a visited park
export async function saveVisitedPark(supabase, userId, parkId, date) {
  const { error } = await supabase
    .from("visited_parks")
    .upsert({
      user_id: userId,
      park_id: parkId,
      visited_at: date
    });

  if (error) {
    console.error("Error saving visited park:", error);
  }
}

//  Delete a visited park
export async function deleteVisitedPark(supabase, userId, parkId) {
  const { error } = await supabase
    .from("visited_parks")
    .delete()
    .eq("user_id", userId)
    .eq("park_id", parkId);

  if (error) {
    console.error("Error deleting visited park:", error);
  }
}

//  Load visited parks + dates
export async function loadVisitedParks(userId) {
  const { data, error } = await supabase
    .from("visited_parks")
    .select("park_id, visited_at")
    .eq("user_id", userId);

  if (error) {
    console.error("Error loading visited parks:", error);
    return {
      visitedSet: new Set(),
      visitedDatesMap: {}
    };
  }

  const visitedSet = new Set();
  const visitedDatesMap = {};

  data.forEach((row) => {
    visitedSet.add(row.park_id);
    visitedDatesMap[row.park_id] = row.visited_at;
  });

  return { visitedSet, visitedDatesMap };
}
