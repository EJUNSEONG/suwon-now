import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

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

function ThisWeek() {
  const [events, setEvents] =
    useState<EventItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const sliderRef =
    useRef<HTMLDivElement>(null);

  // ========================================
  // YYYY-MM-DD 형식 변환
  // ========================================

  const formatDate = (date: Date) => {
    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1
      ).padStart(2, "0");

    const day =
      String(
        date.getDate()
      ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // ========================================
  // 이번 주 일정 불러오기
  //
  // 단기 일정:
  // 날짜가 이번 주에 있으면 표시
  //
  // 장기 일정:
  // 일정 기간과 이번 주가
  // 하루라도 겹치면 표시
  // ========================================

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);

      const today = new Date();

      // ------------------------------------
      // 이번 주 월요일
      // ------------------------------------

      const day =
        today.getDay();

      const diff =
        day === 0
          ? -6
          : 1 - day;

      const startOfWeek =
        new Date(today);

      startOfWeek.setDate(
        today.getDate() + diff
      );

      startOfWeek.setHours(
        0,
        0,
        0,
        0
      );

      // ------------------------------------
      // 이번 주 일요일
      // ------------------------------------

      const endOfWeek =
        new Date(startOfWeek);

      endOfWeek.setDate(
        startOfWeek.getDate() + 6
      );

      endOfWeek.setHours(
        23,
        59,
        59,
        999
      );

      const startDateString =
        formatDate(startOfWeek);

      const endDateString =
        formatDate(endOfWeek);

      // ====================================
      // Supabase 조회
      //
      // 단기:
      // event_date >= 이번 주 월요일
      // event_date <= 이번 주 일요일
      //
      // 장기:
      // event_date <= 이번 주 일요일
      // end_date >= 이번 주 월요일
      // ====================================

      const { data, error } =
        await supabase
          .from("events")
          .select("*")

          // 공개된 일정만
          .eq(
            "is_published",
            true
          )

          // 시작일이 이번 주 마지막 날보다
          // 뒤에 있으면 안 됨
          .lte(
            "event_date",
            endDateString
          )

          // 단기 / 장기 일정 조건
          .or(
            `and(event_type.eq.short,event_date.gte.${startDateString}),and(event_type.eq.long,end_date.gte.${startDateString})`
          )

          .order(
            "event_date",
            {
              ascending: true,
            }
          )

          .order(
            "event_time",
            {
              ascending: true,
            }
          );

      if (error) {
        console.error(
          "이번 주 일정 불러오기 오류:",
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
  }, []);

  // ========================================
  // 날짜 표시
  //
  // 2026-10-04
  // → 10월 4일
  // ========================================

  const formatDisplayDate = (
    dateString: string
  ) => {
    const [, month, day] =
      dateString.split("-");

    return `${Number(month)}월 ${Number(day)}일`;
  };

  // ========================================
  // 카드 날짜 표시
  //
  // 단기:
  // 10월 4일
  //
  // 장기:
  // 10월 1일 ~ 10월 20일
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
  // 카테고리 표시
  // ========================================

  const getCategoryName = (
    category: string
  ) => {
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
        return category.toUpperCase();
    }
  };

  // ========================================
  // 슬라이드 이동
  //
  // 카드 한 개씩 이동
  // PC / 태블릿 / 모바일 자동 대응
  // ========================================

  const scrollSlider = (
    direction: "left" | "right"
  ) => {
    if (!sliderRef.current) {
      return;
    }

    const container =
      sliderRef.current;

    const firstCard =
      container.querySelector(
        ".event-card"
      ) as HTMLElement | null;

    if (!firstCard) {
      return;
    }

    // 실제 카드 너비
    const cardWidth =
      firstCard.offsetWidth;

    // CSS gap
    const styles =
      window.getComputedStyle(
        container
      );

    const gap =
      parseFloat(
        styles.columnGap
      ) || 0;

    // 카드 하나 + 간격
    const scrollAmount =
      cardWidth + gap;

    container.scrollBy({
      left:
        direction === "left"
          ? -scrollAmount
          : scrollAmount,

      behavior: "smooth",
    });
  };

  // ========================================
  // 화면
  // ========================================

  return (
    <section
      className="this-week-section"
      id="this-week"
    >
      <div className="section-inner">

        {/* ==================================
            상단 제목
        ================================== */}

        <div className="section-heading">

          <div>

            <span className="section-label">
              SUWON PLAY PICK
            </span>

            <h2>
              THIS WEEK
            </h2>

            <p>
              이번 주 수원에서 즐길 수 있는 주요 일정을 확인해보세요.
            </p>

          </div>

          <a
            href="/schedule"
            className="section-more"
          >
            전체 일정 보기 →
          </a>

        </div>

        {/* ==================================
            일정
        ================================== */}

        {loading ? (

          <p>
            일정을 불러오는 중입니다.
          </p>

        ) : events.length > 0 ? (

          <div className="this-week-slider-wrapper">

            {/* ==============================
                왼쪽 화살표
            ============================== */}

            {events.length > 1 && (
              <button
                type="button"
                className="
                  this-week-arrow
                  this-week-arrow-left
                "
                onClick={() =>
                  scrollSlider("left")
                }
                aria-label="이전 일정"
              >
                ‹
              </button>
            )}

            {/* ==============================
                일정 슬라이더
            ============================== */}

            <div
              className="this-week-slider"
              ref={sliderRef}
            >

              {events.map(
                (event) => (

                  <article
                    className="event-card"
                    key={event.id}
                  >

                    {/* ========================
                        이미지
                    ======================== */}

                    <div
                      className="event-image"
                      style={
                        event.image_url
                          ? {
                              backgroundImage:
                                `url(${event.image_url})`,
                            }
                          : {}
                      }
                    >

                      <span className="event-category">
                        {getCategoryName(
                          event.category
                        )}
                      </span>

                    </div>

                    {/* ========================
                        일정 정보
                    ======================== */}

                    <div className="event-info">

                      <div className="event-date">

                        <strong>
                          {getEventDateText(
                            event
                          )}
                        </strong>

                        {event.event_time && (
                          <span>
                            {formatTime(
                              event.event_time
                            )}
                          </span>
                        )}

                      </div>

                      <h3>
                        {event.title}
                      </h3>

                      {event.place && (
                        <p>
                          {event.place}
                        </p>
                      )}

                      <button
                        type="button"
                        className="event-detail-button"
                      >
                        자세히 보기
                      </button>

                    </div>

                  </article>

                )
              )}

            </div>

            {/* ==============================
                오른쪽 화살표
            ============================== */}

            {events.length > 1 && (
              <button
                type="button"
                className="
                  this-week-arrow
                  this-week-arrow-right
                "
                onClick={() =>
                  scrollSlider("right")
                }
                aria-label="다음 일정"
              >
                ›
              </button>
            )}

          </div>

        ) : (

          <p>
            이번 주 예정된 일정이 없습니다.
          </p>

        )}

      </div>
    </section>
  );
}

export default ThisWeek;