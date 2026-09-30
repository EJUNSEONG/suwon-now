import Home from "./pages/Home";
import Admin from "./pages/Admin";
import ResetPassword from "./pages/ResetPassword";
import EventDetail from "./pages/EventDetail";
import Schedule from "./pages/Schedule";
import "./App.css";

function App() {
  const path =
    window.location.pathname;

  if (path === "/admin") {
    return <Admin />;
  }

  if (
    path === "/reset-password"
  ) {
    return <ResetPassword />;
  }

  if (path === "/schedule") {
    return <Schedule />;
  }

  if (
    path.startsWith("/event/")
  ) {
    return <EventDetail />;
  }

  return <Home />;
}

export default App;