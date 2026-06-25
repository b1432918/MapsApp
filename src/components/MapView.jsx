// MERGED LOAD LOGIC (NEW)
// ---------------------------------------------------------

async function loadParks() {
  const response = await fetch("/data/parks.json", { cache: "no-store" });
  const baseParks = await response.json();

  // stored parkData is an object keyed by id
  const stored = JSON.parse(localStorage.getItem("parkData") || "{}");

  const merged = {};
  baseParks.forEach((p) => {
    merged[p.id] = stored[p.id] ? { ...p, ...stored[p.id] } : p;
  });

  return merged;
}

// ---------------------------------------------------------
// LOAD NPS DATA (from /public/data/nps.json)
// ---------------------------------------------------------
async function loadNPS() {
  const response = await fetch("/data/nps.json", { cache: "no-store" });
  return await response.json();
}

//////////BLOCK1//////////

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { loadVisitedParks, saveVisitedPark, deleteVisitedPark } from "../visitedParks";
import { useSupabaseAuth } from "../auth";
import { saveVisitedNPS, deleteVisitedNPS } from "../visitedNPS";


// ---------------------------------------------------------
// ICONS
// ---------------------------------------------------------

const iconDefault = new L.Icon({
  iconUrl: "/icons/park.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

const iconVisited = new L.Icon({
  iconUrl: "/icons/park-visited.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

// ---------------------------------------------------------
// NPS ICONS
// ---------------------------------------------------------
const npsIcon = new L.Icon({
  iconUrl: "/icons/nps.png",
  iconSize: [20, 20],
  iconAnchor: [10, 20],
  popupAnchor: [0, -20]
});

const npsVisitedIcon = new L.Icon({
  iconUrl: "/icons/nps-visited.png",
  iconSize: [20, 20],
  iconAnchor: [10, 20],
  popupAnchor: [0, -20]
});

// ---------------------------------------------------------
// FEATURES LIST
// ---------------------------------------------------------

const ALL_FEATURES = [
  "Beach",
  "Bicycling",
  "Boat Ramp",
  //  "Boating",
  "Cabins",
  "Camping",
  "Hiking",
  "Paddling",
  //  "Parking",
  //  "Restrooms",
  "Showers",
  "Swimming",
  //  "Trails",
  "Tubing"
  //  "Stargazing"
];

export default function MapView() {
  // park data (editable)
  const [parkData, setParkData] = useState({});

  const [nps, setNPS] = useState([]);

  // visited boolean
  const [visited, setVisited] = useState(() => {
    const saved = localStorage.getItem("visitedParks");
    return saved ? JSON.parse(saved) : {};
  });

  // visited date storage
  const [visitedDates, setVisitedDates] = useState(() => {
    const saved = localStorage.getItem("visitedDates");
    return saved ? JSON.parse(saved) : {};
  });

  // visited filter
  const [filter, setFilter] = useState("all");

  // features filter
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [featuresOpen, setFeaturesOpen] = useState(false);

  // -----------------------------------------
  // ADD YOUR NPS STATE RIGHT HERE
  // -----------------------------------------

  // NPS layer toggle
  const [showNPS, setShowNPS] = useState(true);

  // NPS visited tracking
  const [visitedNPS, setVisitedNPS] = useState({});

  // NPS visited filter
  const [npsVisitedFilter, setNpsVisitedFilter] = useState("all");

  // NPS selected unit (for popup)
  const [selectedNPS, setSelectedNPS] = useState(null);

  // -----------------------------------------
  // YOUR EXISTING MODALS GO BELOW THIS
  // -----------------------------------------
  
  // modals
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [visitModalParkId, setVisitModalParkId] = useState(null);
  const [visitModalDate, setVisitModalDate] = useState("");

  const [unvisitModalOpen1, setUnvisitModalOpen1] = useState(false);
  const [unvisitModalOpen2, setUnvisitModalOpen2] = useState(false);
  const [unvisitModalParkId, setUnvisitModalParkId] = useState(null);

  // NEW: feature deletion modals
  const [featureDeleteModal, setFeatureDeleteModal] = useState(false);
  const [featureDeleteConfirmModal, setFeatureDeleteConfirmModal] = useState(false);
  const [featureDeleteParkId, setFeatureDeleteParkId] = useState(null);
  const [featureDeleteSelection, setFeatureDeleteSelection] = useState([]);

  // NEW: Supabase cloud‑synced visited parks
  const [visitedParks, setVisitedParks] = useState(new Set());

  const { user, supabase } = useSupabaseAuth();   //  MUST come before any function that uses `user`

// NEW: Load visited parks from Supabase
useEffect(() => {
  async function init() {
    if (!user) return;

  const { data, error } = await supabase
    .from("visited_parks")
    .select("park_id, visited_at")
    .eq("user_id", user.id);


    if (error) {
      console.error("Error loading visited parks:", error);
      return;
    }

    const visitedSet = new Set();
    const visitedObj = {};
    const datesObj = {};

    data.forEach((row) => {
      visitedSet.add(row.park_id);
      visitedObj[row.park_id] = true;
      datesObj[row.park_id] = row.visited_at;
    });

    setVisitedParks(visitedSet);
    setVisited(visitedObj);
    setVisitedDates(datesObj);
  }

  init();
}, [user]);

// NEW: Load visited NPS from Supabase
useEffect(() => {
  async function loadVisitedNPS() {
    if (!user) return;

    const { data, error } = await supabase
      .from("visited_nps")
      .select("nps_id, visited, visited_at")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error loading visited NPS:", error);
      return;
    }

    const obj = {};
    data.forEach(row => {
      obj[row.nps_id] = row.visited ? row.visited_at : false;
    });

    setVisitedNPS(obj);
  }

  loadVisitedNPS();
}, [user]);


// ---------------------------------------------------------
// LOAD PARKS (Trails coming soon) — REVISED
// ---------------------------------------------------------

useEffect(() => {
  loadParks().then((merged) => {
    setParkData(merged);

    // CRITICAL: Save merged data so visited + features persist
    localStorage.setItem("parkData", JSON.stringify(merged));
  });
}, []);

// LOAD ALL NPS UNITS (offline JSON)
useEffect(() => {
  async function loadAllNPS() {
    const npsUnits = await loadNPS();
    setNPS(npsUnits);
  }
  loadAllNPS();
}, []);

// PARK CLICK HANDLER (STATE PARKS ONLY)
async function handleParkClick(parkId) {
  if (!user) return;

  // Save visit to Supabase with today's date
  const today = new Date().toISOString();
  await saveVisitedPark(supabase, user.id, parkId, today);

  // Update icon state
  setVisitedParks(prev => new Set([...prev, parkId]));

  // Update your existing UI logic
  setVisited(prev => ({ ...prev, [parkId]: true }));
  setVisitedDates(prev => ({ ...prev, [parkId]: today }));
}

async function handleUnvisit(parkId) {
  if (!user) return;

  // Delete from Supabase
  await deleteVisitedPark(supabase, user.id, parkId);

  // Update icon state
  setVisitedParks(prev => {
    const updated = new Set(prev);
    updated.delete(parkId);
    return updated;
  });

  // Update your existing UI logic
  setVisited(prev => {
    const updated = { ...prev };
    delete updated[parkId];
    return updated;
  });

  setVisitedDates(prev => {
    const updated = { ...prev };
    delete updated[parkId];
    return updated;
  });
}

// ---------------------------------------------------------
// FIXED: CONFIRM VISIT (MODAL)
// ---------------------------------------------------------
const confirmVisit = async () => {
  if (!visitModalDate) return;

  const id = visitModalParkId;

  // Update UI immediately
  setVisited(prev => ({ ...prev, [id]: true }));
  setVisitedDates(prev => ({ ...prev, [id]: visitModalDate }));
  setVisitedParks(prev => new Set([...prev, id]));

  // Supabase write (STATE PARKS ONLY)
  await saveVisitedPark(supabase, user.id, id, visitModalDate);

  // Close modal
  setVisitModalOpen(false);
  setVisitModalParkId(null);
  setVisitModalDate("");
};

// ---------------------------------------------------------
// FIXED: CONFIRM UNVISIT (MODAL)
// ---------------------------------------------------------
const confirmUnvisit = async () => {
  const id = unvisitModalParkId;

  // Update UI immediately
  setVisited(prev => {
    const updated = { ...prev };
    delete updated[id];
    return updated;
  });

  setVisitedDates(prev => {
    const updated = { ...prev };
    delete updated[id];
    return updated;
  });

  setVisitedParks(prev => {
    const updated = new Set(prev);
    updated.delete(id);
    return updated;
  });

  // Supabase delete (STATE PARKS ONLY)
  await deleteVisitedPark(supabase, user.id, id);

  // Close modal
  setUnvisitModalOpen2(false);
  setUnvisitModalParkId(null);
};


// ---------------------------------------------------------
  // FEATURE FILTER LOGIC
  // ---------------------------------------------------------

  const toggleFeature = (feature) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  };

  const parkMatchesFeatures = (park) => {
    if (selectedFeatures.length === 0) return true;
    if (!park.features) return false;

    return selectedFeatures.some((f) => park.features.includes(f));
  };

  // ---------------------------------------------------------
  // FINAL FILTERED LIST
  // ---------------------------------------------------------

  const filteredParks = Object.values(parkData).filter((p) => {
    const visitedMatch =
      filter === "visited"
        ? visited[p.id]
        : filter === "not"
        ? !visited[p.id]
        : true;

    const featureMatch = parkMatchesFeatures(p);

    return visitedMatch && featureMatch;
  });

// ---------------------------------------------------------
//  ADD NPS FILTERING LOGIC HERE
// ---------------------------------------------------------

// Apply NPS layer toggle
const visibleNPS = showNPS ? nps : [];

// Apply NPS visited filter
const filteredNPS = visibleNPS.filter((unit) => {
  if (npsVisitedFilter === "visited") return visitedNPS[unit.id];
  if (npsVisitedFilter === "not") return !visitedNPS[unit.id];
  return true;
});

// ---------------------------------------------------------
// VISIT / UNVISIT MODAL OPENERS
// ---------------------------------------------------------

function requestVisitDate(parkId) {
  setVisitModalParkId(parkId);
  setVisitModalDate("");
  setVisitModalOpen(true);
}

function requestUnvisitConfirmation1(parkId) {
  setUnvisitModalParkId(parkId);
  setUnvisitModalOpen1(true);
}

function proceedToSecondUnvisitModal() {
  setUnvisitModalOpen1(false);
  setUnvisitModalOpen2(true);
}

// ---------------------------------------------------------
// FEATURE ADDING
// ---------------------------------------------------------

function addFeature(parkId, feature) {
  if (!feature.trim()) return;

  setParkData(prev => {
    const updated = { ...prev };
    const park = updated[parkId];

    if (!park.features.includes(feature)) {
      park.features = [...park.features, feature];
    }

    // SAVE UPDATED DATA HERE
    localStorage.setItem("parkData", JSON.stringify(updated));

    return updated;
  });
}


// ---------------------------------------------------------
// FEATURE DELETION
// ---------------------------------------------------------

function deleteSelectedFeatures() {
  const parkId = featureDeleteParkId;

  setParkData(prev => {
    const updated = { ...prev };
    const park = updated[parkId];

    park.features = park.features.filter(
      f => !featureDeleteSelection.includes(f)
    );

    // SAVE UPDATED DATA HERE
    localStorage.setItem("parkData", JSON.stringify(updated));

    return updated;
  });

  setFeatureDeleteConfirmModal(false);
  setFeatureDeleteModal(false);
  setFeatureDeleteSelection([]);
}


// ---------------------------------------------------------
// RENDER
// ---------------------------------------------------------

return (
  <div style={{ height: "100vh", width: "100vw" }}>

    {/* RIGHT-SIDE FILTER PANEL */}
    <div style={{
      position: "absolute",
      zIndex: 1000,
      top: 10,
      right: 10,
      background: "white",
      padding: "8px 12px",
      borderRadius: "8px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
      maxHeight: "90vh",
      overflowY: "auto"
    }}>


      {/* VISITED FILTER */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
        <button
          onClick={() => setFilter("all")}
          style={{
            padding: "6px 10px",
            background: filter === "all" ? "#0078ff" : "#e6e6e6",
            color: filter === "all" ? "white" : "black",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          All
        </button>

        <button
          onClick={() => setFilter("visited")}
          style={{
            padding: "6px 10px",
            background: filter === "visited" ? "#c49a6c" : "#e6e6e6",
            color: filter === "visited" ? "white" : "black",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Visited
        </button>

        <button
          onClick={() => setFilter("not")}
          style={{
            padding: "6px 10px",
            background: filter === "not" ? "#0078ff" : "#e6e6e6",
            color: filter === "not" ? "white" : "black",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Not Visited
        </button>
      </div>
{/* NPS TOGGLE BUTTON */}
<div style={{ marginBottom: "12px" }}>
  <button
    onClick={() => setShowNPS(prev => !prev)}
    style={{
      padding: "6px 10px",
      background: showNPS ? "#0078ff" : "#e6e6e6",
      color: showNPS ? "white" : "black",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      width: "100%"
    }}
  >
    {showNPS ? "Hide NPS" : "Show NPS"}
  </button>
</div>

      {/* TRAILS COMING SOON BUTTON */}
      <div style={{ marginBottom: "12px" }}>
        <button
          disabled
          style={{
            padding: "6px 10px",
            background: "#ddd",
            color: "#666",
            border: "none",
            borderRadius: "4px",
            cursor: "not-allowed",
            width: "100%",
            fontStyle: "italic"
          }}
        >
          Trails Coming Soon
        </button>
      </div>


        {/* FEATURES COLLAPSIBLE */}
        <div>
          <div
            onClick={() => setFeaturesOpen(!featuresOpen)}
            style={{
              cursor: "pointer",
              fontWeight: "bold",
              userSelect: "none",
              marginBottom: featuresOpen ? "6px" : "0"
            }}
          >
            {featuresOpen ? "▼ Features" : "▶ Features"}
          </div>

          {featuresOpen && (
            <div style={{
              maxHeight: "300px",
              overflowY: "auto",
              marginTop: "6px",
              paddingLeft: "4px"
            }}>
              {ALL_FEATURES.map((feature) => (
                <label key={feature} style={{ display: "block", marginBottom: "4px" }}>
                  <input
                    type="checkbox"
                    checked={selectedFeatures.includes(feature)}
                    onChange={() => toggleFeature(feature)}
                    style={{ marginRight: "6px" }}
                  />
                  {feature}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MAP */}
      <MapContainer
        center={[28.5383, -81.3792]}
        zoom={7}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />

        {filteredParks.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={visited[p.id] ? iconVisited : iconDefault}
          >
            <Popup>
              <div>
                <strong>{p.name}</strong>
                <br />

                {/* VISITED BUTTONS */}
                {visited[p.id] ? (
                  <>
                    <div>Visited on: {visitedDates[p.id]}</div>
                    <button onClick={() => requestUnvisitConfirmation1(p.id)}>
                      Mark as Unvisited
                    </button>
                  </>
                ) : (
                  <button onClick={() => requestVisitDate(p.id)}>
                    Mark as Visited
                  </button>
                )}

                <hr />

                {/* BLOCK5 */}

                {/* FEATURES LIST */}
                <div><strong>Features:</strong></div>
                {p.features.map((f) => (
                  <div key={f}>• {f}</div>
                ))}

                {/* ADD FEATURE */}
                <div style={{ marginTop: "10px" }}>
                  <input
                    type="text"
                    placeholder="Add feature"
                    id={`add-feature-${p.id}`}
                    style={{ width: "120px", marginRight: "6px" }}
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById(`add-feature-${p.id}`);
                      addFeature(p.id, input.value);
                      input.value = "";
                    }}
                  >
                    Add
                  </button>
                </div>

                {/* DELETE FEATURES BUTTON */}
                <button
                  style={{ marginTop: "10px", width: "100%" }}
                  onClick={() => {
                    setFeatureDeleteParkId(p.id);
                    setFeatureDeleteSelection([]);
                    setFeatureDeleteModal(true);
                  }}
                >
                  Delete Features
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

{/*  NPS MARKERS GO HERE  */}
{filteredNPS.map((unit) => (
  <Marker
    key={`nps-${unit.id}`}
    position={[unit.lat, unit.lng]}
    icon={visitedNPS[unit.id] ? npsVisitedIcon : npsIcon}
    eventHandlers={{
      click: () => setSelectedNPS(unit)
    }}
  />
))}

{selectedNPS && (
  <Popup
    position={[selectedNPS.lat, selectedNPS.lng]}
    onClose={() => setSelectedNPS(null)}
  >
    <div>
      <strong>{selectedNPS.name}</strong>
      <br />

      {visitedNPS[selectedNPS.id] ? (
        <button
          onClick={async () => {
            // UI update
            setVisitedNPS(prev => {
              const updated = { ...prev };
              delete updated[selectedNPS.id];
              return updated;
            });

            // Supabase delete
            await deleteVisitedNPS(supabase, user.id, selectedNPS.id);
          }}
        >
          Mark as Unvisited
        </button>
      ) : (
        <button
          onClick={async () => {
            const today = new Date().toISOString();

            // UI update
            setVisitedNPS(prev => ({
              ...prev,
              [selectedNPS.id]: today
            }));

            // Supabase save
            await saveVisitedNPS(supabase, user.id, selectedNPS.id, today);
          }}
        >
          Mark as Visited
        </button>
      )}
    </div>
  </Popup>
)}


      {/* FEATURE DELETE MODAL */}
      {featureDeleteModal && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3>Select Features to Delete</h3>

            <div style={{ maxHeight: "200px", overflowY: "auto", textAlign: "left" }}>
              {parkData[featureDeleteParkId].features.map((f) => (
                <label key={f} style={{ display: "block", marginBottom: "6px" }}>
                  <input
                    type="checkbox"
                    checked={featureDeleteSelection.includes(f)}
                    onChange={() => {
                      setFeatureDeleteSelection((prev) =>
                        prev.includes(f)
                          ? prev.filter((x) => x !== f)
                          : [...prev, f]
                      );
                    }}
                    style={{ marginRight: "6px" }}
                  />
                  {f}
                </label>
              ))}
            </div>

            <button
              style={confirmBtn}
              onClick={() => {
                if (featureDeleteSelection.length === 0) return;
                setFeatureDeleteModal(false);
                setFeatureDeleteConfirmModal(true);
              }}
            >
              Continue
            </button>

            <button
              style={cancelBtn}
              onClick={() => setFeatureDeleteModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* FEATURE DELETE CONFIRMATION */}
      {featureDeleteConfirmModal && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3>Confirm Deletion</h3>
            <p>This cannot be undone.</p>

            <button
              style={confirmBtn}
              onClick={deleteSelectedFeatures}
            >
              Confirm Delete
            </button>

            <button
              style={cancelBtn}
              onClick={() => setFeatureDeleteConfirmModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

//////////BLOCK6//////////

// ---------------------------------------------------------
// SHARED STYLES
// ---------------------------------------------------------

const modalOverlay = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 2000
};

const modalBox = {
  background: "white",
  padding: "20px",
  borderRadius: "8px",
  width: "260px",
  textAlign: "center",
  boxShadow: "0 2px 10px rgba(0,0,0,0.3)"
};

const inputStyle = {
  width: "100%",
  padding: "8px",
  marginTop: "10px",
  marginBottom: "15px"
};

const confirmBtn = {
  padding: "8px 12px",
  background: "#0078ff",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  width: "100%",
  marginBottom: "8px"
};

const cancelBtn = {
  padding: "8px 12px",
  background: "#ccc",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  width: "100%"
};