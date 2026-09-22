function Header() {
  return (
    <header>
      <div className="logo">
        <a href="/">
          <h1>SUWON PLAY</h1>
        </a>
      </div>

      <nav>
        <a href="/">홈</a>
        <a href="/schedule">전체 일정</a>
        <a href="/schedule?category=sports">경기</a>
        <a href="/schedule?category=performance">공연</a>
        <a href="/schedule?category=festival">축제</a>
        <a href="/schedule?category=popup">팝업</a>
      </nav>
    </header>
  );
}

export default Header;