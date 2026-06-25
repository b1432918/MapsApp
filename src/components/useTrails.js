import { useEffect, useState } from "react";
import { supabase } from "../supabase";


export default function useTrails(user) {
  const [trails, setTrails] = useState([]);
  const [visitedTrails, setVisitedTrails] = useState(new Set());
  const [showTrails, setShowTrails] = useState(true);

  // Load trails.json (local static dataset)
  useEffect(() => {
    fetch("/data/fl_bike_trail_systems.json")
      .then((res) => res.json())
      .then((data) => setTrails(data));
  }, []);

  // Load visited trails from Supabase
  useEffect(() => {
    if (!user) {
      setVisitedTrails(new Set());
      return;
    }

    async function loadVisited() {
      const { data, error } = await supabase
        .from("visited_trails")
        .select("trail_id")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error loading visited trails:", error);
        return;
      }

      const ids = new Set(data.map((row) => row.trail_id));
      setVisitedTrails(ids);
    }

    loadVisited();
  }, [user]);

  // Toggle visited/unvisited
  async function toggleVisited(trailId) {
    console.log("toggleVisited called for", trailId);
    if (!user) return;

    const isVisited = visitedTrails.has(trailId);

    if (isVisited) {
      // DELETE row (composite PK: user_id + trail_id)
      const { error } = await supabase
        .from("visited_trails")
        .delete()
        .eq("user_id", user.id)
        .eq("trail_id", trailId);

      if (!error) {
        const updated = new Set(visitedTrails);
        updated.delete(trailId);
        setVisitedTrails(updated);
      }
    } else {
      // INSERT row
      const { error } = await supabase
        .from("visited_trails")
        .insert({
          user_id: user.id,
          trail_id: trailId
        });

      if (!error) {
        const updated = new Set(visitedTrails);
        updated.add(trailId);
        setVisitedTrails(updated);
      }
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
