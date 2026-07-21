const weekEvents = [
  {
    id: 1,
    category: "FOOTBALL",
    title: "수원FC 홈경기",
    date: "7월 25일",
    time: "19:30",
    place: "수원종합운동장",
    image: "/images/suwon-fc.jpg",
  },
  {
    id: 2,
    category: "VOLLEYBALL",
    title: "한국전력 빅스톰",
    date: "7월 27일",
    time: "14:00",
    place: "수원체육관",
    image: "/images/kepco-volleyball.png",
  },
  {
    id: 3,
    category: "VOLLEYBALL",
    title: "현대건설 힐스테이트",
    date: "7월 28일",
    time: "16:00",
    place: "수원체육관",
    image: "/images/hyundai-volleyball.png",
  },
  {
    id: 4,
    category: "FESTIVAL",
    title: "수원 주말 문화행사",
    date: "7월 30일",
    time: "18:00",
    place: "수원 화성 일대",
    image: "/images/suwon-fc.jpg",
  },
];

function ThisWeek() {
  return (
    <section className="this-week-section" id="this-week">
      <div className="section-inner">
        <div className="section-heading">
          <div>
            <span className="section-label">SUWON PLAY PICK</span>
            <h2>THIS WEEK</h2>
            <p>이번 주 수원에서 즐길 수 있는 주요 일정을 확인해보세요.</p>
          </div>

          <a href="#this-month" className="section-more">
            전체 일정 보기 →
          </a>
        </div>

        <div className="event-grid">
          {weekEvents.map((event) => (
            <article className="event-card" key={event.id}>
              <div
                className="event-image"
                style={{
                  backgroundImage: `url(${event.image})`,
                }}
              >
                <span className="event-category">{event.category}</span>
              </div>

              <div className="event-info">
                <div className="event-date">
                  <strong>{event.date}</strong>
                  <span>{event.time}</span>
                </div>

                <h3>{event.title}</h3>
                <p>{event.place}</p>

                <button type="button" className="event-detail-button">
                  자세히 보기
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ThisWeek;