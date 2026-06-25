import { useEffect, useState } from "react";
import { supabase } from "../supabase";   // correct import

export default function useTrails() {
  const [trails, setTrails] = useState([]);
  const [visitedTrails, setVisitedTrails] = useState([]);
  const [showTrails, setShowTrails] = useState(true);

  // Get the current user (async)
  async function getUser() {
    const { data } = await supabase.auth.getUser();
    return data?.user || null;
  }

  // Load trails.json
  useEffect(() => {
    fetch("/data/fl_bike_trail_systems.json")
      .then((res) => res.json())
      .then((data) => setTrails(data));
  }, []);

  // Load visited trails from Supabase
  useEffect(() => {
    async function loadVisited() {
      const user = await getUser();
      if (!user) {
        setVisitedTrails([]);
        return;
      }

      const { data, error } = await supabase
        .from("visited_trails")
        .select("trail_id")
        .eq("user_id", user.id);

      if (!error && data) {
        setVisitedTrails(data.map((row) => row.trail_id));
      }
    }

    loadVisited();
  }, []);

  // Toggle visited/unvisited
  async function toggleVisited(trailId) {
    const user = await getUser();
    if (!user) return;

    const isVisited = visitedTrails.includes(trailId);

    if (isVisited) {
      // Delete from Supabase
      await supabase
        .from("visited_trails")
        .delete()
        .eq("user_id", user.id)
        .eq("trail_id", trailId);

      // Update UI
      setVisitedTrails((prev) => prev.filter((id) => id !== trailId));
    } else {
      const today = new Date().toISOString();

      // Save to Supabase
      await supabase.from("visited_trails").insert({
        user_id: user.id,
        trail_id: trailId,
        visited_at: today
      });

      // Update UI
      setVisitedTrails((prev) => [...prev, trailId]);
    }
  }

  return {
    trails,
    visitedTrails,
    toggleVisited,
    showTrails,
    setShowTrails
  };
}
