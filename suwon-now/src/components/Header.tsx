function Header() {
  return (
    <header>
      <div className="logo">
        <a
          href="/"
          style={{
            textDecoration: "none",
          }}
        >
          <h1>SUWON PLAY</h1>
        </a>
      </div>

      <nav>
        <a href="/">홈</a>
        <a href="/#sports">경기</a>
        <a href="/#performance">공연</a>
        <a href="/#festival">축제</a>
        <a href="/#popup">팝업</a>
      </nav>
    </header>
  );
}

export default Header;