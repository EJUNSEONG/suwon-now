import { useEffect, useState } from "react";
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

function ThisMonth() {
  const [events, setEvents] =
    useState<EventItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  // ========================================
  // 현재 날짜
  // ========================================

  const today = new Date();

  const currentYear =
    today.getFullYear();

  const currentMonth =
    today.getMonth();

  // ========================================
  // YYYY-MM-DD 변환
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
  // 이번 달 시작 / 마지막 날짜
  // ========================================

  const monthStart =
    new Date(
      currentYear,
      currentMonth,
      1
    );

  const monthEnd =
    new Date(
      currentYear,
      currentMonth + 1,
      0
    );

  const monthStartString =
    formatDate(monthStart);

  const monthEndString =
    formatDate(monthEnd);

  // ========================================
  // 이번 달 일정 불러오기
  //
  // 단기:
  // event_date가 이번 달 안에 있으면 표시
  //
  // 장기:
  // 이번 달과 기간이 조금이라도 겹치면 표시
  // ========================================

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);

      const { data, error } =
        await supabase
          .from("events")
          .select("*")
          .eq(
            "is_published",
            true
          )
          .lte(
            "event_date",
            monthEndString
          )
          .or(
            `end_date.gte.${monthStartString},and(event_type.eq.short,event_date.gte.${monthStartString})`
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
          "이번 달 일정 불러오기 오류:",
          error
        );

        setEvents([]);
      } else {
        setEvents(data ?? []);
      }

      setLoading(false);
    };

    fetchEvents();
  }, [
    monthStartString,
    monthEndString,
  ]);

  // ========================================
  // 달력 첫 번째 칸 계산
  //
  // JS:
  // 일=0 월=1 화=2...
  //
  // 달력:
  // 일 월 화 수 목 금 토
  // ========================================

  const firstDay =
    monthStart.getDay();

  const daysInMonth =
    monthEnd.getDate();

  // ========================================
  // 달력 칸 생성
  // ========================================

  const calendarDays:
    Array<number | null> = [];

  // 앞쪽 빈칸
  for (
    let i = 0;
    i < firstDay;
    i++
  ) {
    calendarDays.push(null);
  }

  // 실제 날짜
  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    calendarDays.push(day);
  }

  // 마지막 주 빈칸 채우기
  while (
    calendarDays.length % 7 !== 0
  ) {
    calendarDays.push(null);
  }

  // ========================================
  // 해당 날짜의 일정 확인
  // ========================================

  const getEventsForDay = (
    day: number
  ) => {
    const date =
      new Date(
        currentYear,
        currentMonth,
        day
      );

    const dateString =
      formatDate(date);

    return events.filter(
      (event) => {
        // 단기 일정
        if (
          event.event_type === "short"
        ) {
          return (
            event.event_date ===
            dateString
          );
        }

        // 장기 일정
        const endDate =
          event.end_date ??
          event.event_date;

        return (
          event.event_date <=
            dateString &&
          endDate >=
            dateString
        );
      }
    );
  };

  // ========================================
  // 카테고리 한글
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
  // 오늘인지 확인
  // ========================================

  const isToday = (
    day: number
  ) => {
    return (
      today.getFullYear() ===
        currentYear &&
      today.getMonth() ===
        currentMonth &&
      today.getDate() ===
        day
    );
  };

  // ========================================
  // 화면
  // ========================================

  return (
    <section
      className="this-month-section"
      id="this-month"
    >
      <div className="section-inner">

        {/* 상단 */}

        <div className="section-heading">

          <div>
            <span className="section-label">
              MONTHLY SCHEDULE
            </span>

            <h2>
              THIS MONTH
            </h2>

            <p>
              이번 달 수원의 경기·공연·축제·팝업 일정을 한눈에 확인해보세요.
            </p>
          </div>

          <a
            href="/schedule"
            className="section-more"
          >
            전체 일정 보기 →
          </a>

        </div>

        {/* 달력 */}

        <div className="month-calendar">

          {/* 달력 상단 */}

          <div className="month-calendar-header">

            <h3>
              {currentYear}년{" "}
              {currentMonth + 1}월
            </h3>

          </div>

          {/* 요일 */}

          <div className="month-weekdays">

            <div>일</div>
            <div>월</div>
            <div>화</div>
            <div>수</div>
            <div>목</div>
            <div>금</div>
            <div>토</div>

          </div>

          {/* 날짜 */}

          <div className="month-days">

            {calendarDays.map(
              (day, index) => {

                if (day === null) {
                  return (
                    <div
                      className="month-day month-day-empty"
                      key={`empty-${index}`}
                    />
                  );
                }

                const dayEvents =
                  getEventsForDay(day);

                return (
                  <div
                    className={
                      isToday(day)
                        ? "month-day month-day-today"
                        : "month-day"
                    }
                    key={day}
                  >

                    {/* 날짜 숫자 */}

                    <div className="month-day-number">
                      {day}
                    </div>

                    {/* 일정 */}

                    <div className="month-day-events">

                      {dayEvents
                        .slice(0, 3)
                        .map(
                          (event) => (
                            <div
                              className={`month-event month-event-${event.category}`}
                              key={
                                `${event.id}-${day}`
                              }
                              title={
                                event.title
                              }
                            >

                              <span className="month-event-category">
                                {getCategoryName(
                                  event.category
                                )}
                              </span>

                              <span className="month-event-title">
                                {event.title}
                              </span>

                            </div>
                          )
                        )}

                      {dayEvents.length > 3 && (
                        <span className="month-more-events">
                          +
                          {dayEvents.length -
                            3}
                          개
                        </span>
                      )}

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </div>

        {loading && (
          <p className="month-loading">
            이번 달 일정을 불러오는 중입니다.
          </p>
        )}

      </div>
    </section>
  );
}

export default ThisMonth;