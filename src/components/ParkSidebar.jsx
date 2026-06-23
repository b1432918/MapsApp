import "./ParkSidebar.css";

export default function ParkSidebar({ parks, onSelect }) {
  return (
    <div className="sidebar">
      <h2>Florida State Parks</h2>

      <ul>
        {parks.map((p) => (
          <li key={p.id} onClick={() => onSelect(p)}>
            {p.name}
          </li>
        ))}
      </ul>
    </div>
  );
}