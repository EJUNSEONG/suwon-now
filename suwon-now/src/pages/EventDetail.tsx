
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import { teams } from "../teams";

type EventItem = {
  id: number;
  title: string;
  category: string;

  sport_type: string | null;
  home_team: string | null;
  away_team: string | null;
  card_line1: string | null;
  card_line2: string | null;

  event_type: "short" | "long";
  event_date: string;
  end_date: string | null;

  event_time: string | null;
  place: string | null;
  description: string | null;
  image_url: string | null;
  ticket_url: string | null;
  is_published: boolean;

  view_count: number;
};

function EventDetail() {
  const [event, setEvent] =
    useState<EventItem | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ========================================
  // URL에서 일정 ID 가져오기
  // ========================================

  const eventId =
    window.location.pathname
      .split("/")
      .filter(Boolean)[1];

  // ========================================
  // 일정 상세 조회 + 조회수 증가
  // ========================================

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) {
        setError(
          "일정 정보를 찾을 수 없습니다."
        );
        setLoading(false);
        return;
      }

      // 일정 정보 조회

      const { data, error: fetchError } =
        await supabase
          .from("events")
          .select("*")
          .eq("id", eventId)
          .eq("is_published", true)
          .single();

      if (fetchError || !data) {
        console.error(
          "일정 상세 조회 오류:",
          fetchError
        );

        setError(
          "일정 정보를 찾을 수 없습니다."
        );
        setLoading(false);
        return;
      }

      setEvent(data as EventItem);

      // 조회수 +1

      const { error: viewError } =
        await supabase.rpc(
          "increment_event_view",
          {
            event_id: Number(eventId),
          }
        );

      if (viewError) {
        console.error(
          "조회수 증가 오류:",
          viewError
        );
      }

      setLoading(false);
    };

    fetchEvent();
  }, [eventId]);

  // ========================================
  // 날짜 표시
  // ========================================

  const formatDisplayDate = (
    dateString: string
  ) => {
    const [year, month, day] =
      dateString.split("-");

    return `${year}년 ${Number(
      month
    )}월 ${Number(day)}일`;
  };

  // ========================================
  // 시간 표시
  // ========================================

  const formatTime = (
    time: string | null
  ) => {
    if (!time) return "";

    return time.slice(0, 5);
  };

  // ========================================
  // 카테고리 한글 표시
  // ========================================

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

  // ========================================
  // 일정 날짜 표시
  // ========================================

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

  // ========================================
  // 스포츠 경기 로고 가져오기
  // ========================================

  const getMatchLogos = (
    item: EventItem
  ) => {
    if (
      item.category !== "sports" ||
      !item.sport_type ||
      !item.home_team ||
      !item.away_team
    ) {
      return null;
    }

    const home = teams.find(
      (team) =>
        team.sport === item.sport_type &&
        team.name === item.home_team
    );

    const away = teams.find(
      (team) =>
        team.sport === item.sport_type &&
        team.name === item.away_team
    );

    if (!home?.logo || !away?.logo) {
      return null;
    }

    return { home, away };
  };

  // ========================================
  // 로딩
  // ========================================

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

  // ========================================
  // 일정 없음
  // ========================================

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

  const match = getMatchLogos(event);

  // ========================================
  // 상세 화면
  // ========================================

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

            {/* =================================
                대표 이미지 / 스포츠 경기 카드
            ================================= */}

            <div className="event-detail-image-area">

              {match ? (

                <div className="event-detail-match-card">

                  {/* 홈팀 / 원정팀 */}

                  <div className="event-detail-match-teams">

                    {/* 홈팀 */}

                    <div className="event-detail-match-team">
                      <div className="event-detail-match-logo">
                        <img
                          src={match.home.logo}
                          alt={`${match.home.name} 로고`}
                        />
                      </div>

                      <span>
                        {match.home.name}
                      </span>
                    </div>

                    {/* VS */}

                    <strong className="event-detail-match-vs">
                      VS
                    </strong>

                    {/* 원정팀 */}

                    <div className="event-detail-match-team">
                      <div className="event-detail-match-logo">
                        <img
                          src={match.away.logo}
                          alt={`${match.away.name} 로고`}
                        />
                      </div>

                      <span>
                        {match.away.name}
                      </span>
                    </div>
                  </div>

                  {/* 두 줄 문구 */}

                  {(event.card_line1 ||
                    event.card_line2) && (

                    <div className="event-detail-match-copy">
                      {event.card_line1 && (
                        <div>
                          {event.card_line1}
                        </div>
                      )}

                      {event.card_line2 && (
                        <div>
                          {event.card_line2}
                        </div>
                      )}
                    </div>

                  )}

                  {/* 경기 날짜 / 시간 / 장소 */}

                  <div className="event-detail-match-meta">
                    <div>
                      {getEventDateText(event)}

                      {event.event_time &&
                        ` · ${formatTime(
                          event.event_time
                        )}`}
                    </div>

                    {event.place && (
                      <div>
                        {event.place}
                      </div>
                    )}
                  </div>

                </div>

              ) : event.image_url ? (

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

            {/* =================================
                일정 정보
            ================================= */}

            <div className="event-detail-info">

              <span className="event-detail-category">
                {getCategoryName(
                  event.category
                )}
              </span>

              <h1>
                {event.title}
              </h1>

              {/* 기본 정보 */}

              <div className="event-detail-meta">

                <div>
                  <span>
                    일정
                  </span>

                  <strong className="event-detail-meta-emphasis">
                    {getEventDateText(event)}
                  </strong>
                </div>

                {event.event_time && (

                  <div>
                    <span>
                      시간
                    </span>

                    <strong className="event-detail-meta-emphasis">
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

              {/* 일정 설명 */}

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

              {/* 공식 / 예매 링크 */}

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
