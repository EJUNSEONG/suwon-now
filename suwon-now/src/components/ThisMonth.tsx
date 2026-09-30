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
  // 실제 오늘 날짜
  // ========================================

  const today = new Date();

  const todayYear =
    today.getFullYear();

  const todayMonth =
    today.getMonth();

  // ========================================
  // 현재 달력에서 보고 있는 년 / 월
  // ========================================

  const [viewYear, setViewYear] =
    useState(todayYear);

  const [viewMonth, setViewMonth] =
    useState(todayMonth);

  // ========================================
  // 이동 가능한 범위
  //
  // 현재 달 기준
  // 이전 1년 ~ 이후 1년
  //
  // 예:
  // 2026년 9월 기준
  // 2025년 9월 ~ 2027년 9월
  // ========================================

  const minDate =
    new Date(
      todayYear - 1,
      todayMonth,
      1
    );

  const maxDate =
    new Date(
      todayYear + 1,
      todayMonth,
      1
    );

  const currentViewDate =
    new Date(
      viewYear,
      viewMonth,
      1
    );

  const canGoPrevious =
    currentViewDate.getTime() >
    minDate.getTime();

  const canGoNext =
    currentViewDate.getTime() <
    maxDate.getTime();

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
  // 현재 보고 있는 달의 시작 / 마지막 날짜
  // ========================================

  const monthStart =
    new Date(
      viewYear,
      viewMonth,
      1
    );

  const monthEnd =
    new Date(
      viewYear,
      viewMonth + 1,
      0
    );

  const monthStartString =
    formatDate(monthStart);

  const monthEndString =
    formatDate(monthEnd);

  // ========================================
  // 이전 달
  // ========================================

  const handlePreviousMonth = () => {
    if (!canGoPrevious) return;

    const previousMonth =
      new Date(
        viewYear,
        viewMonth - 1,
        1
      );

    setViewYear(
      previousMonth.getFullYear()
    );

    setViewMonth(
      previousMonth.getMonth()
    );
  };

  // ========================================
  // 다음 달
  // ========================================

  const handleNextMonth = () => {
    if (!canGoNext) return;

    const nextMonth =
      new Date(
        viewYear,
        viewMonth + 1,
        1
      );

    setViewYear(
      nextMonth.getFullYear()
    );

    setViewMonth(
      nextMonth.getMonth()
    );
  };

  // ========================================
  // 현재 달로 돌아가기
  // ========================================

  const handleGoToday = () => {
    setViewYear(todayYear);
    setViewMonth(todayMonth);
  };

  // ========================================
  // 일정 불러오기
  //
  // 단기 일정:
  // 해당 월 안에 날짜가 있는 일정
  //
  // 장기 일정:
  // 해당 월과 일정 기간이
  // 하루라도 겹치면 가져옴
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

          // 일정 시작일이
          // 현재 보고 있는 달의 마지막 날보다
          // 이전이어야 함
          .lte(
            "event_date",
            monthEndString
          )

          // 단기 일정 또는 장기 일정
          .or(
            `and(event_type.eq.short,event_date.gte.${monthStartString}),and(event_type.eq.long,end_date.gte.${monthStartString})`
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
          "월간 일정 불러오기 오류:",
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
  // 달력 첫 번째 요일
  // ========================================

  const firstDay =
    monthStart.getDay();

  const daysInMonth =
    monthEnd.getDate();

  // ========================================
  // 달력 날짜 배열 생성
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

  // 마지막 주 빈칸
  while (
    calendarDays.length % 7 !== 0
  ) {
    calendarDays.push(null);
  }

  // ========================================
  // 특정 날짜에 해당하는 일정
  // ========================================

  const getEventsForDay = (
    day: number
  ) => {
    const date =
      new Date(
        viewYear,
        viewMonth,
        day
      );

    const dateString =
      formatDate(date);

    return events.filter(
      (event) => {

        // ------------------------------
        // 단기 일정
        // ------------------------------

        if (
          event.event_type === "short"
        ) {
          return (
            event.event_date ===
            dateString
          );
        }

        // ------------------------------
        // 장기 일정
        // ------------------------------

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
  //
  // 다른 달을 보고 있을 때는
  // 오늘 표시가 나오지 않음
  // ========================================

  const isToday = (
    day: number
  ) => {
    return (
      todayYear === viewYear &&
      todayMonth === viewMonth &&
      today.getDate() === day
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

        {/* ==================================
            상단 제목
        ================================== */}

        <div className="section-heading">

          <div>

            <span className="section-label">
              MONTHLY SCHEDULE
            </span>

            <h2>
              THIS MONTH
            </h2>

            <p>
              수원의 경기·공연·축제·팝업 일정을 월별로 확인해보세요.
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
            달력
        ================================== */}

        <div className="month-calendar">

          {/* ==================================
              달력 상단
          ================================== */}

          <div className="month-calendar-header">

            {/* 이전 달 */}

            <button
              type="button"
              className="month-nav-button"
              onClick={
                handlePreviousMonth
              }
              disabled={
                !canGoPrevious
              }
              aria-label="이전 달"
            >
              ‹
            </button>

            {/* 년 / 월 */}

            <div className="month-calendar-title">

              <h3>
                {viewYear}년{" "}
                {viewMonth + 1}월
              </h3>

              {/* 현재 달이 아닐 때만 표시 */}

              {(
                viewYear !== todayYear ||
                viewMonth !== todayMonth
              ) && (
                <button
                  type="button"
                  className="month-today-button"
                  onClick={
                    handleGoToday
                  }
                >
                  이번 달
                </button>
              )}

            </div>

            {/* 다음 달 */}

            <button
              type="button"
              className="month-nav-button"
              onClick={
                handleNextMonth
              }
              disabled={
                !canGoNext
              }
              aria-label="다음 달"
            >
              ›
            </button>

          </div>

          {/* ==================================
              요일
          ================================== */}

          <div className="month-weekdays">

            <div>일</div>
            <div>월</div>
            <div>화</div>
            <div>수</div>
            <div>목</div>
            <div>금</div>
            <div>토</div>

          </div>

          {/* ==================================
              날짜
          ================================== */}

          <div className="month-days">

            {calendarDays.map(
              (day, index) => {

                // 빈칸
                if (day === null) {
                  return (
                    <div
                      className="month-day month-day-empty"
                      key={
                        `empty-${index}`
                      }
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

                    {/* 날짜 */}

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
                              className={
                                `month-event month-event-${event.category}`
                              }
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

                      {/* 3개 이상 */}

                      {dayEvents.length > 3 && (
                        <span className="month-more-events">
                          +
                          {
                            dayEvents.length -
                            3
                          }
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

        {/* 로딩 */}

        {loading && (
          <p className="month-loading">
            일정을 불러오는 중입니다.
          </p>
        )}

      </div>
    </section>
  );
}

export default ThisMonth;