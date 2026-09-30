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
  view_count: number;
};

type SortType = "latest" | "views";

function Schedule() {
  const [events, setEvents] =
    useState<EventItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [sortType, setSortType] =
    useState<SortType>("latest");

  // ========================================
  // URL에서 카테고리 확인
  //
  // /schedule
  // → 전체
  //
  // /schedule?category=sports
  // → 스포츠
  // ========================================

  const searchParams =
    new URLSearchParams(
      window.location.search
    );

  const category =
    searchParams.get("category") ??
    "all";

  // ========================================
  // 카테고리 정보
  // ========================================

  const getCategoryName = (
    value: string
  ) => {
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
  //
  // 최신순:
  // event_date DESC
  //
  // 조회순:
  // view_count DESC
  // ========================================

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);

      let query =
        supabase
          .from("events")
          .select("*")
          .eq(
            "is_published",
            true
          );

      // ------------------------------------
      // 카테고리 필터
      // ------------------------------------

      if (category !== "all") {
        query =
          query.eq(
            "category",
            category
          );
      }

      // ------------------------------------
      // 정렬
      // ------------------------------------

      if (sortType === "views") {
        query =
          query
            .order(
              "view_count",
              {
                ascending: false,
              }
            )
            .order(
              "event_date",
              {
                ascending: false,
              }
            );
      } else {
        query =
          query
            .order(
              "event_date",
              {
                ascending: false,
              }
            )
            .order(
              "event_time",
              {
                ascending: false,
              }
            );
      }

      const { data, error } =
        await query;

      if (error) {
        console.error(
          "전체 일정 불러오기 오류:",
          error
        );

        setEvents([]);
      } else {
        setEvents(
          (data ?? []) as EventItem[]
        );
      }

      setLoading(false);
    };

    fetchEvents();
  }, [
    category,
    sortType,
  ]);

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
  // 시간
  // ========================================

  const formatTime = (
    time: string | null
  ) => {
    if (!time) return "";

    return time.slice(0, 5);
  };

  // ========================================
  // 화면
  // ========================================

  return (
    <>
      <Header />

      <main className="schedule-page">

        <div className="schedule-container">

          {/* ==================================
              페이지 제목
          ================================== */}

          <div className="schedule-heading">

            <span className="section-label">
              SUWON PLAY SCHEDULE
            </span>

            <h1>
              {getPageTitle()}
            </h1>

            <p>
              {getPageDescription()}
            </p>

          </div>

          {/* ==================================
              카테고리 메뉴
          ================================== */}

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
                category ===
                "performance"
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

          {/* ==================================
              결과 상단
          ================================== */}

          <div className="schedule-result-header">

            <div className="schedule-result-count">

              <strong>
                {getCategoryName(
                  category
                )}
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
                  setSortType(
                    "latest"
                  )
                }
              >
                최신순
              </button>

              <button
                type="button"
                className={
                  sortType === "views"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setSortType(
                    "views"
                  )
                }
              >
                조회순
              </button>

            </div>

          </div>

          {/* ==================================
              일정 목록
          ================================== */}

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

              {events.map(
                (event) => (

                  <a
                    href={
                      `/event/${event.id}`
                    }
                    className="schedule-card"
                    key={event.id}
                  >

                    {/* 이미지 */}

                    <div
                      className="schedule-card-image"
                    >

                      {event.image_url ? (

                        <img
                          src={
                            event.image_url
                          }
                          alt={
                            event.title
                          }
                        />

                      ) : (

                        <div className="schedule-card-no-image">
                          SUWON PLAY
                        </div>

                      )}

                      {/* 카테고리 */}

                      <span
                        className={
                          `schedule-card-category schedule-card-category-${event.category}`
                        }
                      >
                        {getCategoryName(
                          event.category
                        )}
                      </span>

                    </div>

                    {/* 정보 */}

                    <div className="schedule-card-info">

                      <div className="schedule-card-date">

                        <span>
                          {getEventDateText(
                            event
                          )}
                        </span>

                        {event.event_time && (
                          <span>
                            {formatTime(
                              event.event_time
                            )}
                          </span>
                        )}

                      </div>

                      <h2>
                        {event.title}
                      </h2>

                      {event.place && (
                        <p>
                          {event.place}
                        </p>
                      )}

                      <div className="schedule-card-bottom">

                        <span>
                          조회{" "}
                          {
                            event.view_count ??
                            0
                          }
                        </span>

                        <span>
                          자세히 보기 →
                        </span>

                      </div>

                    </div>

                  </a>

                )
              )}

            </div>

          )}

        </div>

      </main>
    </>
  );
}

export default Schedule;