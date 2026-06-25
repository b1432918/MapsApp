import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function useTrails() {
  const [trails, setTrails] = useState([]);
  const [visitedTrails, setVisitedTrails] = useState([]);
  const [showTrails, setShowTrails] = useState(true);

  // Load trails.json
  useEffect(() => {
    fetch("/data/fl_bike_trail_systems.json")
      .then((res) => res.json())
      .then((data) => setTrails(data));
  }, []);

  // Load visited trails from Supabase
  useEffect(() => {
    async function loadVisited() {
      const { data, error } = await supabase
        .from("visited_trails")
        .select("trail_id");

      if (!error && data) {
        setVisitedTrails(data.map((row) => row.trail_id));
      }
    }
    loadVisited();
  }, []);

  // Toggle visited/unvisited
  async function toggleVisited(trailId) {
    const isVisited = visitedTrails.includes(trailId);

    if (isVisited) {
      await supabase.from("visited_trails").delete().eq("trail_id", trailId);
      setVisitedTrails((prev) => prev.filter((id) => id !== trailId));
    } else {
      await supabase.from("visited_trails").insert({ trail_id: trailId });
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
