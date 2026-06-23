//////////BLOCK0//////////
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

//////////BLOCK1//////////


import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { loadVisitedParks, saveVisitedPark } from "../visitedParks"


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

  const { user } = useUser();   //  MUST come before any function that uses `user`

// NEW: Load visited parks from Supabase
useEffect(() => {
  async function init() {
    if (!user) return;

    const { visitedSet, visitedDatesMap } = await loadVisitedParks(user.id);

    // For marker icons
    setVisitedParks(visitedSet);

    // For your existing UI logic (modals, filters, dates)
    setVisited(visitedDatesMap);
    setVisitedDates(visitedDatesMap);
  }
  init();
}, [user]);


  // ---------------------------------------------------------
  // LOAD PARKS (Trails coming soon) — REVISED
  // ---------------------------------------------------------

  useEffect(() => {
    loadParks().then((merged) => {
      setParkData(merged);
    });
  }, []);

  //  INSERT THE CLICK HANDLER RIGHT HERE
  async function handleParkClick(parkId) {
    if (!user) return;

    await saveVisitedPark(user.id, parkId);

    setVisitedParks(prev => new Set([...prev, parkId]));
  }   //  You were missing this closing brace

  
  //////////BLOCK2//////////

  // ---------------------------------------------------------
  // FEATURE EDITING
  // ---------------------------------------------------------

  const addFeature = (id, feature) => {
    if (!feature.trim()) return;

    const updated = {
      ...parkData,
      [id]: {
        ...parkData[id],
        features: [...new Set([...parkData[id].features, feature])]
      }
    };

    setParkData(updated);
    localStorage.setItem("parkData", JSON.stringify(updated));
  };

  const deleteSelectedFeatures = () => {
    const id = featureDeleteParkId;

    const updated = {
      ...parkData,
      [id]: {
        ...parkData[id],
        features: parkData[id].features.filter(
          (f) => !featureDeleteSelection.includes(f)
        )
      }
    };

    setParkData(updated);
    localStorage.setItem("parkData", JSON.stringify(updated));

    setFeatureDeleteConfirmModal(false);
    setFeatureDeleteModal(false);
    setFeatureDeleteParkId(null);
    setFeatureDeleteSelection([]);
  };

// ---------------------------------------------------------
// VISIT / UNVISIT LOGIC
// ---------------------------------------------------------

const requestVisitDate = (id) => {
  setVisitModalParkId(id);
  setVisitModalDate("");
  setVisitModalOpen(true);
};

const confirmVisit = async () => {   // MUST be async
  if (!visitModalDate) return;

  const id = visitModalParkId;

  const updatedVisited = { ...visited, [id]: true };
  const updatedDates = { ...visitedDates, [id]: visitModalDate };

  setVisited(updatedVisited);
  setVisitedDates(updatedDates);

  // NEW: save online instead of localStorage
  await saveVisitedPark(user.id, id, visitModalDate);

  setVisitModalOpen(false);
  setVisitModalParkId(null);
  setVisitModalDate("");
};

const requestUnvisitConfirmation1 = (id) => {
  setUnvisitModalParkId(id);
  setUnvisitModalOpen1(true);
};

const proceedToSecondUnvisitModal = () => {
  setUnvisitModalOpen1(false);
  setUnvisitModalOpen2(true);
};

const confirmUnvisit = async () => {   // MUST be async
  const id = unvisitModalParkId;

  const updatedVisited = { ...visited, [id]: false };
  const updatedDates = { ...visitedDates };
  delete updatedDates[id];

  setVisited(updatedVisited);
  setVisitedDates(updatedDates);

  // NEW: delete online instead of localStorage
  await deleteVisitedPark(user.id, id);

  setUnvisitModalOpen2(false);
  setUnvisitModalParkId(null);
};


//////////BLOCK3//////////

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

        {/*BLOCK4*/}

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
      </MapContainer>

      {/* VISIT DATE MODAL */}
      {visitModalOpen && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3>Enter Visit Date</h3>
            <input
              type="date"
              value={visitModalDate}
              onChange={(e) => setVisitModalDate(e.target.value)}
              style={inputStyle}
            />
            <button onClick={confirmVisit} style={confirmBtn}>Confirm</button>
            <button onClick={() => setVisitModalOpen(false)} style={cancelBtn}>Cancel</button>
          </div>
        </div>
      )}

      {/* UNVISIT CONFIRMATION #1 */}
      {unvisitModalOpen1 && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3>Are you sure?</h3>
            <p>You are about to mark this park as unvisited.</p>

            <button onClick={proceedToSecondUnvisitModal} style={confirmBtn}>
              Continue
            </button>

            <button onClick={() => setUnvisitModalOpen1(false)} style={cancelBtn}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* UNVISIT CONFIRMATION #2 */}
      {unvisitModalOpen2 && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3>Remove Visit Date?</h3>
            <p>This action cannot be undone.</p>

            <button onClick={confirmUnvisit} style={confirmBtn}>
              Confirm
            </button>

            <button onClick={() => setUnvisitModalOpen2(false)} style={cancelBtn}>
              Cancel
            </button>
          </div>
        </div>
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