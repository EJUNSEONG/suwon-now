
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

type SortType = "latest" | "views";

// ========================================
// 날짜 정렬용 함수
// ========================================

// YYYY-MM-DD를 한국 시간 기준 날짜로 변환
const parseEventDate = (dateString: string) => {
  const [year, month, day] = dateString
    .slice(0, 10)
    .split("-")
    .map(Number);

  return new Date(year, month - 1, day).getTime();
};

// 일정 시작 날짜 + 시간
const getEventDateTime = (event: EventItem) => {
  const date = event.event_date;

  const time = event.event_time
    ? event.event_time.slice(0, 8)
    : "00:00:00";

  const normalizedTime =
    time.length === 5 ? `${time}:00` : time;

  return `${date}T${normalizedTime}`;
};

// 일정이 종료되는 날짜
const getEventEndDate = (event: EventItem) => {
  if (
    event.event_type === "long" &&
    event.end_date
  ) {
    return parseEventDate(event.end_date);
  }

  return parseEventDate(event.event_date);
};

// 다가오는 일정 먼저, 지난 일정 나중에 정렬
const sortEventsByUpcoming = (
  eventList: EventItem[]
): EventItem[] => {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const todayTime = today.getTime();

  return [...eventList].sort((a, b) => {
    const startA = parseEventDate(a.event_date);
    const startB = parseEventDate(b.event_date);

    const endA = getEventEndDate(a);
    const endB = getEventEndDate(b);

    // 종료일이 오늘 이후면 다가오는 일정
    const isUpcomingA = endA >= todayTime;
    const isUpcomingB = endB >= todayTime;

    // 다가오는 일정을 먼저 표시
    if (isUpcomingA !== isUpcomingB) {
      return isUpcomingA ? -1 : 1;
    }

    // 다가오는 일정끼리는 가까운 날짜순
    if (isUpcomingA && isUpcomingB) {
      // 진행 중인 장기 일정은 오늘 날짜로 취급
      const orderA = Math.max(startA, todayTime);
      const orderB = Math.max(startB, todayTime);

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // 같은 날짜라면 시간이 빠른 순서
      return getEventDateTime(a).localeCompare(
        getEventDateTime(b)
      );
    }

    // 지난 일정은 가장 최근에 끝난 순서
    if (endA !== endB) {
      return endB - endA;
    }

    // 종료 날짜가 같으면 최근 시작한 일정 먼저
    return getEventDateTime(b).localeCompare(
      getEventDateTime(a)
    );
  });
};

function Schedule() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [sortType, setSortType] =
    useState<SortType>("latest");

  // ========================================
  // URL에서 카테고리 확인
  // ========================================

  const searchParams = new URLSearchParams(
    window.location.search
  );

  const category =
    searchParams.get("category") ?? "all";

  // ========================================
  // 카테고리 정보
  // ========================================

  const getCategoryName = (value: string) => {
    switch (value) {
      case "sports":
        return "스포츠";
      case "performance":
        return "공연";
      case "festival":
        return "축제";
      case "popup":
        return "팝업";
      default:
        return "전체 일정";
    }
  };

  // ========================================
  // 페이지 제목
  // ========================================

  const getPageTitle = () => {
    switch (category) {
      case "sports":
        return "SPORTS";
      case "performance":
        return "PERFORMANCE";
      case "festival":
        return "FESTIVAL";
      case "popup":
        return "POP-UP";
      default:
        return "ALL SCHEDULE";
    }
  };

  // ========================================
  // 페이지 설명
  // ========================================

  const getPageDescription = () => {
    switch (category) {
      case "sports":
        return "수원에서 열리는 스포츠 일정을 확인해보세요.";
      case "performance":
        return "수원에서 즐길 수 있는 공연 일정을 확인해보세요.";
      case "festival":
        return "수원의 다양한 축제 일정을 확인해보세요.";
      case "popup":
        return "수원에서 열리는 팝업 일정을 확인해보세요.";
      default:
        return "수원의 경기·공연·축제·팝업 일정을 한눈에 확인해보세요.";
    }
  };

  // ========================================
  // 일정 불러오기
  // ========================================

  useEffect(() => {
    let cancelled = false;

    const fetchEvents = async () => {
      setLoading(true);

      let query = supabase
        .from("events")
        .select("*")
        .eq("is_published", true);

      // 카테고리 필터
      if (category !== "all") {
        query = query.eq("category", category);
      }

      // 조회순 정렬
      if (sortType === "views") {
        query = query
          .order("view_count", {
            ascending: false,
          })
          .order("event_date", {
            ascending: true,
          });
      }

      const { data, error } = await query;

      if (cancelled) return;

      if (error) {
        console.error(
          "전체 일정 불러오기 오류:",
          error
        );

        setEvents([]);
      } else {
        const eventList = (data ?? []) as EventItem[];

        // ========================================
        // 날짜순 정렬
        //
        // 1. 다가오는 일정 먼저
        // 2. 가까운 날짜부터
        // 3. 지난 일정은 최근 종료된 순서
        // ========================================

        if (sortType === "latest") {
          const sortedEvents =
            sortEventsByUpcoming(eventList);

          setEvents(sortedEvents);
        } else {
          // 조회순은 Supabase 정렬 결과 유지
          setEvents(eventList);
        }
      }

      setLoading(false);
    };

    void fetchEvents();

    return () => {
      cancelled = true;
    };
  }, [category, sortType]);

  // ========================================
  // 날짜 표시
  // ========================================

  const formatDisplayDate = (
    dateString: string
  ) => {
    const [year, month, day] =
      dateString.split("-");

    return `${year}.${String(
      Number(month)
    ).padStart(2, "0")}.${String(
      Number(day)
    ).padStart(2, "0")}`;
  };

  // ========================================
  // 일정 기간 표시
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
  // 시간 표시
  // ========================================

  const formatTime = (
    time: string | null
  ) => {
    if (!time) return "";

    return time.slice(0, 5);
  };

  // ========================================
  // 스포츠 경기 로고 가져오기
  // WK리그 포함
  // ========================================

  const getMatchLogos = (
    event: EventItem
  ) => {
    if (
      event.category !== "sports" ||
      !event.sport_type ||
      !event.home_team ||
      !event.away_team
    ) {
      return null;
    }

    const home = teams.find(
      (team) =>
        team.sport === event.sport_type &&
        team.name === event.home_team
    );

    const away = teams.find(
      (team) =>
        team.sport === event.sport_type &&
        team.name === event.away_team
    );

    if (!home?.logo || !away?.logo) {
      return null;
    }

    return { home, away };
  };

  // ========================================
  // 화면
  // ========================================

  return (
    <>
      <Header />

      <main className="schedule-page">
        <div className="schedule-container">

          {/* 페이지 제목 */}

          <div className="schedule-heading">
            <span className="section-label">
              SUWON PLAY SCHEDULE
            </span>

            <h1>{getPageTitle()}</h1>

            <p>{getPageDescription()}</p>
          </div>

          {/* 카테고리 메뉴 */}

          <div className="schedule-category-menu">
            <a
              href="/schedule"
              className={
                category === "all"
                  ? "active"
                  : ""
              }
            >
              전체
            </a>

            <a
              href="/schedule?category=sports"
              className={
                category === "sports"
                  ? "active"
                  : ""
              }
            >
              스포츠
            </a>

            <a
              href="/schedule?category=performance"
              className={
                category === "performance"
                  ? "active"
                  : ""
              }
            >
              공연
            </a>

            <a
              href="/schedule?category=festival"
              className={
                category === "festival"
                  ? "active"
                  : ""
              }
            >
              축제
            </a>

            <a
              href="/schedule?category=popup"
              className={
                category === "popup"
                  ? "active"
                  : ""
              }
            >
              팝업
            </a>
          </div>

          {/* 결과 상단 */}

          <div className="schedule-result-header">
            <div className="schedule-result-count">
              <strong>
                {getCategoryName(category)}
              </strong>

              <span>
                {events.length}개의 일정
              </span>
            </div>

            {/* 정렬 */}

            <div className="schedule-sort">
              <button
                type="button"
                className={
                  sortType === "latest"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setSortType("latest")
                }
              >
                날짜순
              </button>

              <button
                type="button"
                className={
                  sortType === "views"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setSortType("views")
                }
              >
                조회순
              </button>
            </div>
          </div>

          {/* 일정 목록 */}

          {loading ? (
            <div className="schedule-message">
              일정을 불러오는 중입니다.
            </div>
          ) : events.length === 0 ? (
            <div className="schedule-message">
              등록된 일정이 없습니다.
            </div>
          ) : (
            <div className="schedule-grid">
              {events.map((event) => {
                const match = getMatchLogos(event);

                return (
                  <a
                    href={`/event/${event.id}`}
                    className="schedule-card"
                    key={event.id}
                  >

                    {/* 카드 이미지 영역 */}

                    <div
                      className={`schedule-card-image ${
                        match
                          ? "schedule-match-image"
                          : ""
                      }`}
                    >

                      {match ? (

                        /* 스포츠 경기 카드 */

                        <div className="schedule-match-content">

                          {/* 팀 로고 */}

                          <div className="schedule-match-teams">

                            {/* 홈팀 */}

                            <div className="schedule-match-team">
                              <div className="schedule-match-logo">
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

                            <strong className="schedule-match-vs">
                              VS
                            </strong>

                            {/* 원정팀 */}

                            <div className="schedule-match-team">
                              <div className="schedule-match-logo">
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
                            <div className="schedule-match-copy">

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

                          {/* 날짜 / 시간 / 장소 */}

                          <div className="schedule-match-meta">
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

                        /* 기존 포스터 이미지 */

                        <img
                          src={event.image_url}
                          alt={event.title}
                        />

                      ) : (

                        /* 이미지 없는 일반 일정 */

                        <div className="schedule-card-no-image">
                          SUWON PLAY
                        </div>

                      )}

                      {/* 카테고리 표시 */}

                      <span
                        className={`schedule-card-category schedule-card-category-${event.category}`}
                      >
                        {getCategoryName(
                          event.category
                        )}
                      </span>

                    </div>

                    {/* 일정 정보 */}

                    <div className="schedule-card-info">

                      <div className="schedule-card-date">
                        <span>
                          {getEventDateText(event)}
                        </span>

                        {event.event_time && (
                          <span>
                            {formatTime(
                              event.event_time
                            )}
                          </span>
                        )}
                      </div>

                      <h2>{event.title}</h2>

                      {event.place && (
                        <p>{event.place}</p>
                      )}

                      <div className="schedule-card-bottom">
                        <span>
                          조회 {event.view_count ?? 0}
                        </span>

                        <span>
                          자세히 보기 →
                        </span>
                      </div>

                    </div>
                  </a>
                );
              })}
            </div>
          )}

        </div>
      </main>
    </>
  );
}

export default Schedule;
