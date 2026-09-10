import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type EventItem = {
  id: number;
  title: string;
  category: string;
  event_date: string;
  event_time: string | null;
  place: string | null;
  description: string | null;
  image_url: string | null;
  ticket_url: string | null;
  is_published: boolean;
};

function ThisWeek() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const today = new Date();

      const day = today.getDay();
      const diff = day === 0 ? -6 : 1 - day;

      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() + diff);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
      };

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("event_date", formatDate(startOfWeek))
        .lte("event_date", formatDate(endOfWeek))
        .eq("is_published", true)
        .order("event_date", { ascending: true });

      if (error) {
        console.error("일정 불러오기 오류:", error);
      } else {
        setEvents(data ?? []);
      }

      setLoading(false);
    };

    fetchEvents();
  }, []);

  const formatDisplayDate = (dateString: string) => {
    const [, month, day] = dateString.split("-");
    return `${Number(month)}월 ${Number(day)}일`;
  };

  const formatTime = (time: string | null) => {
    if (!time) return "";
    return time.slice(0, 5);
  };

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

        {loading ? (
          <p>일정을 불러오는 중입니다.</p>
        ) : events.length > 0 ? (
          <div className="event-grid">
            {events.map((event) => (
              <article className="event-card" key={event.id}>
                <div
                  className="event-image"
                  style={
                    event.image_url
                      ? { backgroundImage: `url(${event.image_url})` }
                      : {}
                  }
                >
                  <span className="event-category">
                    {event.category.toUpperCase()}
                  </span>
                </div>

                <div className="event-info">
                  <div className="event-date">
                    <strong>{formatDisplayDate(event.event_date)}</strong>
                    <span>{formatTime(event.event_time)}</span>
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
        ) : (
          <p>이번 주 예정된 일정이 없습니다.</p>
        )}
      </div>
    </section>
  );
}

export default ThisWeek;