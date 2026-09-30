import Home from "./pages/Home";
import Admin from "./pages/Admin";
import ResetPassword from "./pages/ResetPassword";
import EventDetail from "./pages/EventDetail";
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

  // /event/15 같은 주소
  if (path.startsWith("/event/")) {
    return <EventDetail />;
  }

  return <Home />;
}

export default App;