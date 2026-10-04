import { useState } from "react";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header>
        {/* 로고 */}
        <div className="logo">
          <a href="/">
            <h1>SUWON PLAY</h1>
          </a>
        </div>

        {/* =========================
            PC 메뉴
        ========================= */}
        <nav className="desktop-nav">
          <a href="/">홈</a>
          <a href="/schedule">전체 일정</a>
          <a href="/schedule?category=sports">스포츠</a>
          <a href="/schedule?category=performance">공연</a>
          <a href="/schedule?category=festival">축제</a>
          <a href="/schedule?category=popup">팝업</a>
          <a href="/nearby">주변 맛집</a>
        </nav>

        {/* =========================
            모바일 상단 메뉴
        ========================= */}
        <div className="mobile-nav">
          <a
            href="/schedule"
            className="mobile-schedule-button"
          >
            일정 보기
          </a>

          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMenuOpen(true)}
            aria-label="전체 메뉴 열기"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      {/* =========================
          모바일 메뉴 배경
      ========================= */}
      {menuOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* =========================
          모바일 전체 메뉴
      ========================= */}
      <aside
        className={`mobile-menu ${
          menuOpen ? "open" : ""
        }`}
      >
        <div className="mobile-menu-top">
          <h2>전체 메뉴</h2>

          <button
            type="button"
            className="mobile-menu-close"
            onClick={() => setMenuOpen(false)}
            aria-label="전체 메뉴 닫기"
          >
            ×
          </button>
        </div>

        {/* 일정 카테고리 */}
        <div className="mobile-menu-section">
          <h3>일정</h3>

          <a href="/schedule">
            전체 일정
          </a>

          <a href="/schedule?category=sports">
            스포츠
          </a>

          <a href="/schedule?category=performance">
            공연
          </a>

          <a href="/schedule?category=festival">
            축제
          </a>

          <a href="/schedule?category=popup">
            팝업
          </a>
        </div>

        {/* 주변 정보 */}
        <div className="mobile-menu-section">
          <h3>둘러보기</h3>

          <a href="/nearby">
            주변 맛집
          </a>
        </div>
      </aside>
    </>
  );
}

export default Header;