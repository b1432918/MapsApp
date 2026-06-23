import { useSupabaseAuth } from "./auth";
import MapView from "./components/MapView";
import Login from "./Login";

export default function App() {
  const { user } = useSupabaseAuth();

  // Not logged in → show login screen
  if (!user) {
    return <Login />;
  }

  // Logged in → show map
  return <MapView />;
}
