
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import ResetPassword from "./pages/ResetPassword";
import EventDetail from "./pages/EventDetail";
import Schedule from "./pages/Schedule";
import Community from "./pages/Community";
import NearbyPlaces from "./pages/NearbyPlaces";
import "./App.css";

function App() {
  const path = window.location.pathname;

  // 관리자 페이지
  if (path === "/admin") {
    return <Admin />;
  }

  // 비밀번호 재설정
  if (path === "/reset-password") {
    return <ResetPassword />;
  }

  // 전체 일정
  if (path === "/schedule") {
    return <Schedule />;
  }

  // 커뮤니티
  if (path === "/community") {
    return <Community />;
  }

  // 주변 맛집 · 카페 지도
   if (path === "/nearby") {
    return <NearbyPlaces />;
  }//

  // 일정 상세 페이지
  if (path.startsWith("/event/")) {
    return <EventDetail />;
  }

  // 메인 페이지
  return <Home />;
}

export default App;
