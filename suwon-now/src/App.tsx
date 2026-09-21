import Home from "./pages/Home";
import Admin from "./pages/Admin";
import "./App.css";

function App() {
  const path = window.location.pathname;

  if (path === "/admin") {
    return <Admin />;
  }

  return <Home />;
}

export default App;