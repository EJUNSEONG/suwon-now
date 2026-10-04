function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-slider">
        <picture className="hero-picture">
          {/* 모바일 전용 이미지 */}
          <source
            media="(max-width: 768px)"
            srcSet="/images/main-image-mobile.png"
          />

          {/* PC 기존 이미지 */}
          <img
            src="/images/main-image.png"
            alt="SUWON PLAY"
            className="hero-main-image"
          />
        </picture>
      </div>

      <div className="hero-buttons">
        <a href="#this-week" className="hero-button">
          이번 주 일정 보기
        </a>

        <a href="#this-month" className="hero-button">
          이번 달 일정 보기
        </a>
      </div>
    </section>
  );
}

export default Hero;