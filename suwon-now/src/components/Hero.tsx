import { useEffect, useState } from "react";

const slides = [
  {
    id: 1,
    image: "/images/suwon-fc.jpg",
    category: "FOOTBALL",
    title: "수원의 열기를 가장 가까이에서",
    description: "수원FC의 경기 일정을 확인해보세요.",
  },
  {
    id: 2,
    image: "/images/kepco-volleyball.png",
    category: "VOLLEYBALL",
    title: "수원에서 즐기는 남자 배구",
    description: "한국전력 빅스톰의 경기 일정을 확인해보세요.",
  },
  {
    id: 3,
    image: "/images/hyundai-volleyball.png",
    category: "VOLLEYBALL",
    title: "수원에서 즐기는 여자 배구",
    description: "현대건설 힐스테이트의 경기 일정을 확인해보세요.",
  },
];

function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentIndex((previousIndex) =>
        previousIndex === slides.length - 1 ? 0 : previousIndex + 1,
      );
    }, 2000);

    return () => window.clearInterval(timer);
  }, []);

  const previousSlide = () => {
    setCurrentIndex((previousIndex) =>
      previousIndex === 0 ? slides.length - 1 : previousIndex - 1,
    );
  };

  const nextSlide = () => {
    setCurrentIndex((previousIndex) =>
      previousIndex === slides.length - 1 ? 0 : previousIndex + 1,
    );
  };

  return (
    <section className="hero-section">
      <div className="hero-slider">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`hero-slide ${
              index === currentIndex ? "active" : ""
            }`}
            style={{
              backgroundImage: `url(${slide.image})`,
            }}
          >
            <div className="hero-overlay" />

            <div className="hero-content">
              <span className="hero-category">{slide.category}</span>

              <h2>{slide.title}</h2>

              <p>{slide.description}</p>
            </div>
          </div>
        ))}

        <button
          type="button"
          className="hero-arrow hero-arrow-left"
          onClick={previousSlide}
          aria-label="이전 슬라이드"
        >
          ‹
        </button>

        <button
          type="button"
          className="hero-arrow hero-arrow-right"
          onClick={nextSlide}
          aria-label="다음 슬라이드"
        >
          ›
        </button>

        <div className="hero-dots">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={index === currentIndex ? "active" : ""}
              onClick={() => setCurrentIndex(index)}
              aria-label={`${index + 1}번 슬라이드`}
            />
          ))}
        </div>
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