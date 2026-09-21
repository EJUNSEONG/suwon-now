import Home from "./pages/Home";
import Admin from "./pages/Admin";
import ResetPassword from "./pages/ResetPassword";
import "./App.css";

function App() {
  const path = window.location.pathname;

  if (path === "/admin") {
    return <Admin />;
  }

  if (path === "/reset-password") {
    return <ResetPassword />;
  }

  return <Home />;
}

export default App;