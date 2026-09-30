import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";

type EventItem = {
  id: number;
  title: string;
  category: string;

  event_type: "short" | "long";
  event_date: string;
  end_date: string | null;

  event_time: string | null;
  place: string | null;
  description: string | null;
  image_url: string | null;
  ticket_url: string | null;
  is_published: boolean;
};

function EventDetail() {
  const [event, setEvent] =
    useState<EventItem | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // URL:
  // /event/15
  // → 15 추출
  const eventId =
    window.location.pathname
      .split("/")
      .filter(Boolean)[1];

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) {
        setError(
          "일정 정보를 찾을 수 없습니다."
        );

        setLoading(false);
        return;
      }

      const { data, error } =
        await supabase
          .from("events")
          .select("*")
          .eq("id", eventId)
          .eq("is_published", true)
          .single();

      if (error || !data) {
        console.error(
          "일정 상세 조회 오류:",
          error
        );

        setError(
          "일정 정보를 찾을 수 없습니다."
        );

        setLoading(false);
        return;
      }

      setEvent(data);
      setLoading(false);
    };

    fetchEvent();
  }, [eventId]);

  // 날짜 표시
  const formatDisplayDate = (
    dateString: string
  ) => {
    const [year, month, day] =
      dateString.split("-");

    return `${year}년 ${Number(
      month
    )}월 ${Number(day)}일`;
  };

  // 시간 표시
  const formatTime = (
    time: string | null
  ) => {
    if (!time) return "";

    return time.slice(0, 5);
  };

  // 카테고리
  const getCategoryName = (
    category: string
  ) => {
    switch (category) {
      case "sports":
        return "스포츠";

      case "performance":
        return "공연";

      case "festival":
        return "축제";

      case "popup":
        return "팝업";

      default:
        return category;
    }
  };

  // 날짜
  const getEventDateText = (
    event: EventItem
  ) => {
    if (
      event.event_type === "long" &&
      event.end_date
    ) {
      return `${formatDisplayDate(
        event.event_date
      )} ~ ${formatDisplayDate(
        event.end_date
      )}`;
    }

    return formatDisplayDate(
      event.event_date
    );
  };

  if (loading) {
    return (
      <>
        <Header />

        <main className="event-detail-page">
          <div className="event-detail-container">
            <p>
              일정을 불러오는 중입니다.
            </p>
          </div>
        </main>
      </>
    );
  }

  if (error || !event) {
    return (
      <>
        <Header />

        <main className="event-detail-page">
          <div className="event-detail-container">

            <h1>
              일정 정보를 찾을 수 없습니다.
            </h1>

            <a
              href="/schedule"
              className="event-detail-back"
            >
              전체 일정으로 돌아가기
            </a>

          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="event-detail-page">

        <div className="event-detail-container">

          {/* 뒤로가기 */}

          <a
            href="/schedule"
            className="event-detail-back"
          >
            ← 전체 일정
          </a>

          <div className="event-detail-layout">

            {/* 대표 이미지 */}

            <div className="event-detail-image-area">

              {event.image_url ? (
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="event-detail-image"
                />
              ) : (
                <div className="event-detail-no-image">
                  SUWON PLAY
                </div>
              )}

            </div>

            {/* 정보 */}

            <div className="event-detail-info">

              <span className="event-detail-category">
                {getCategoryName(
                  event.category
                )}
              </span>

              <h1>
                {event.title}
              </h1>

              <div className="event-detail-meta">

                <div>
                  <span>
                    일정
                  </span>

                  <strong>
                    {getEventDateText(
                      event
                    )}
                  </strong>
                </div>

                {event.event_time && (
                  <div>
                    <span>
                      시간
                    </span>

                    <strong>
                      {formatTime(
                        event.event_time
                      )}
                    </strong>
                  </div>
                )}

                {event.place && (
                  <div>
                    <span>
                      장소
                    </span>

                    <strong>
                      {event.place}
                    </strong>
                  </div>
                )}

              </div>

              {event.description && (
                <div className="event-detail-description">

                  <h2>
                    일정 소개
                  </h2>

                  <p>
                    {event.description}
                  </p>

                </div>
              )}

              {event.ticket_url && (
                <a
                  href={event.ticket_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="event-detail-link"
                >
                  공식 / 예매 페이지 보기 →
                </a>
              )}

            </div>

          </div>

        </div>

      </main>
    </>
  );
}

export default EventDetail;