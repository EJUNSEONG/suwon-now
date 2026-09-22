import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import Header from "../components/Header";
import { supabase } from "../lib/supabase";

type EventItem = {
  id: number;
  created_at: string;
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

function Admin() {
  // ========================================
  // 로그인
  // ========================================
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  // ========================================
  // 일정 데이터
  // ========================================
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  // ========================================
  // 모달 / 수정 상태
  // ========================================
  const [isModalOpen, setIsModalOpen] = useState(false);

  // null = 새 일정 등록
  // 숫자 = 해당 일정 수정
  const [editingEventId, setEditingEventId] =
    useState<number | null>(null);

  // 수정할 때 기존 이미지 유지용
  const [existingImageUrl, setExistingImageUrl] =
    useState<string | null>(null);

  // ========================================
  // 일정 입력값
  // ========================================
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("sports");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [place, setPlace] = useState("");
  const [description, setDescription] = useState("");
  const [ticketUrl, setTicketUrl] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  const [imageFile, setImageFile] = useState<File | null>(null);

  // ========================================
  // 저장 상태
  // ========================================
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // ========================================
  // 로그인 상태 확인
  // ========================================
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
      setAuthLoading(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ========================================
  // 로그인 후 일정 불러오기
  // ========================================
  useEffect(() => {
    if (session) {
      fetchEvents();
    } else {
      setEvents([]);
    }
  }, [session]);

  // ========================================
  // Supabase 일정 불러오기
  // ========================================
  const fetchEvents = async () => {
    setEventsLoading(true);

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true })
      .order("event_time", { ascending: true });

    if (error) {
      console.error("일정 불러오기 오류:", error);
      setEventsLoading(false);
      return;
    }

    setEvents(data ?? []);
    setEventsLoading(false);
  };

  // ========================================
  // 로그인
  // ========================================
  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!email || !password) {
      setLoginError("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setLoginLoading(true);
    setLoginError("");
    setResetMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      console.error("로그인 오류:", error);
      setLoginError(error.message);
    }

    setLoginLoading(false);
  };

  // ========================================
  // 비밀번호 재설정
  // ========================================
  const handlePasswordReset = async () => {
    if (!email) {
      setLoginError("먼저 관리자 이메일을 입력해주세요.");
      return;
    }

    setLoginError("");
    setResetMessage("");

    const redirectUrl =
      `${window.location.origin}/reset-password`;

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: redirectUrl,
        }
      );

    if (error) {
      console.error("비밀번호 재설정 오류:", error);
      setLoginError(error.message);
      return;
    }

    setResetMessage(
      "비밀번호 재설정 메일을 보냈습니다. 이메일을 확인해주세요."
    );
  };

  // ========================================
  // 로그아웃
  // ========================================
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // ========================================
  // 입력폼 초기화
  // ========================================
  const resetEventForm = () => {
    setTitle("");
    setCategory("sports");
    setEventDate("");
    setEventTime("");
    setPlace("");
    setDescription("");
    setTicketUrl("");
    setIsPublished(true);

    setImageFile(null);
    setExistingImageUrl(null);

    setEditingEventId(null);

    setSubmitError("");
  };

  // ========================================
  // 새 일정 등록 모달 열기
  // ========================================
  const handleOpenNewEvent = () => {
    resetEventForm();
    setIsModalOpen(true);
  };

  // ========================================
  // 모달 닫기
  // ========================================
  const closeModal = () => {
    if (submitLoading) return;

    setIsModalOpen(false);
    resetEventForm();
  };

  // ========================================
  // 수정 모달 열기
  // ========================================
  const handleEditEvent = (event: EventItem) => {
    setEditingEventId(event.id);

    setTitle(event.title);
    setCategory(event.category);
    setEventDate(event.event_date);

    setEventTime(
      event.event_time
        ? event.event_time.slice(0, 5)
        : ""
    );

    setPlace(event.place ?? "");
    setDescription(event.description ?? "");
    setTicketUrl(event.ticket_url ?? "");
    setIsPublished(event.is_published);

    setExistingImageUrl(event.image_url);

    // 새로운 이미지는 아직 선택하지 않은 상태
    setImageFile(null);

    setSubmitError("");

    setIsModalOpen(true);
  };

  // ========================================
  // Storage URL에서 파일 경로 추출
  // ========================================
  const getStorageFilePath = (
    imageUrl: string | null
  ) => {
    if (!imageUrl) {
      return null;
    }

    const marker =
      "/storage/v1/object/public/event-images/";

    const markerIndex = imageUrl.indexOf(marker);

    if (markerIndex === -1) {
      return null;
    }

    const filePath = imageUrl.substring(
      markerIndex + marker.length
    );

    return decodeURIComponent(filePath);
  };

  // ========================================
  // 일정 등록 / 수정
  // ========================================
  const handleSubmitEvent = async () => {
    if (!title.trim()) {
      setSubmitError("일정 제목을 입력해주세요.");
      return;
    }

    if (!eventDate) {
      setSubmitError("날짜를 선택해주세요.");
      return;
    }

    setSubmitLoading(true);
    setSubmitError("");

    try {
      // 수정이면 기존 이미지 유지
      // 새 일정이면 null
      let imageUrl: string | null =
        existingImageUrl;

      let newUploadedFileName: string | null = null;

      // ====================================
      // 새로운 이미지가 선택된 경우
      // ====================================
      if (imageFile) {
        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/webp",
        ];

        if (!allowedTypes.includes(imageFile.type)) {
          setSubmitError(
            "이미지는 JPG, PNG, WebP 형식만 업로드할 수 있습니다."
          );

          setSubmitLoading(false);
          return;
        }

        // 최대 5MB
        if (imageFile.size > 5 * 1024 * 1024) {
          setSubmitError(
            "이미지 용량은 5MB 이하로 업로드해주세요."
          );

          setSubmitLoading(false);
          return;
        }

        const fileExtension =
          imageFile.name
            .split(".")
            .pop()
            ?.toLowerCase() || "jpg";

        const fileName =
          `${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;

        // Storage 업로드
        const { error: uploadError } =
          await supabase.storage
            .from("event-images")
            .upload(
              fileName,
              imageFile,
              {
                cacheControl: "3600",
                upsert: false,
              }
            );

        if (uploadError) {
          console.error(
            "이미지 업로드 오류:",
            uploadError
          );

          setSubmitError(
            "이미지 업로드에 실패했습니다: " +
              uploadError.message
          );

          setSubmitLoading(false);
          return;
        }

        newUploadedFileName = fileName;

        // 공개 URL 생성
        const { data: publicUrlData } =
          supabase.storage
            .from("event-images")
            .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;
      }

      // ====================================
      // DB에 저장할 데이터
      // ====================================
      const eventData = {
        title: title.trim(),
        category,
        event_date: eventDate,
        event_time: eventTime || null,
        place: place.trim() || null,
        description:
          description.trim() || null,
        image_url: imageUrl,
        ticket_url:
          ticketUrl.trim() || null,
        is_published: isPublished,
      };

      // ====================================
      // 기존 일정 수정
      // ====================================
      if (editingEventId !== null) {
        const { error: updateError } =
          await supabase
            .from("events")
            .update(eventData)
            .eq("id", editingEventId);

        if (updateError) {
          console.error(
            "일정 수정 오류:",
            updateError
          );

          // 새 이미지를 올렸는데 DB 수정 실패한 경우
          // 새 이미지 다시 삭제
          if (newUploadedFileName) {
            await supabase.storage
              .from("event-images")
              .remove([
                newUploadedFileName,
              ]);
          }

          setSubmitError(
            "일정 수정에 실패했습니다: " +
              updateError.message
          );

          setSubmitLoading(false);
          return;
        }

        // 이미지가 실제로 교체된 경우
        // 기존 Storage 이미지 삭제
        if (
          imageFile &&
          existingImageUrl
        ) {
          const oldFilePath =
            getStorageFilePath(
              existingImageUrl
            );

          if (oldFilePath) {
            const { error: removeError } =
              await supabase.storage
                .from("event-images")
                .remove([
                  oldFilePath,
                ]);

            if (removeError) {
              console.warn(
                "기존 이미지 삭제 실패:",
                removeError
              );
            }
          }
        }

        alert("일정이 수정되었습니다.");
      }

      // ====================================
      // 새 일정 등록
      // ====================================
      else {
        const { error: insertError } =
          await supabase
            .from("events")
            .insert([
              eventData,
            ]);

        if (insertError) {
          console.error(
            "일정 등록 오류:",
            insertError
          );

          // DB 저장 실패 시
          // 방금 올린 이미지 삭제
          if (newUploadedFileName) {
            await supabase.storage
              .from("event-images")
              .remove([
                newUploadedFileName,
              ]);
          }

          setSubmitError(
            "일정 등록에 실패했습니다: " +
              insertError.message
          );

          setSubmitLoading(false);
          return;
        }

        alert("일정이 등록되었습니다.");
      }

      // 관리자 목록 다시 불러오기
      await fetchEvents();

      setSubmitLoading(false);
      setIsModalOpen(false);

      resetEventForm();
    } catch (error) {
      console.error(
        "일정 저장 중 오류:",
        error
      );

      setSubmitError(
        "일정을 저장하는 중 오류가 발생했습니다."
      );

      setSubmitLoading(false);
    }
  };

  // ========================================
  // 일정 삭제
  // ========================================
  const handleDeleteEvent = async (
    event: EventItem
  ) => {
    const confirmed = window.confirm(
      `"${event.title}" 일정을 정말 삭제하시겠습니까?`
    );

    if (!confirmed) {
      return;
    }

    // 우선 DB에서 삭제
    const { error: deleteError } =
      await supabase
        .from("events")
        .delete()
        .eq("id", event.id);

    if (deleteError) {
      console.error(
        "일정 삭제 오류:",
        deleteError
      );

      alert("일정 삭제에 실패했습니다.");
      return;
    }

    // 일정에 이미지가 있으면
    // Storage에서도 삭제
    if (event.image_url) {
      const filePath =
        getStorageFilePath(
          event.image_url
        );

      if (filePath) {
        const { error: imageDeleteError } =
          await supabase.storage
            .from("event-images")
            .remove([
              filePath,
            ]);

        if (imageDeleteError) {
          console.warn(
            "이미지 삭제 오류:",
            imageDeleteError
          );
        }
      }
    }

    alert("일정이 삭제되었습니다.");

    await fetchEvents();
  };

  // ========================================
  // 이번 주 일정 수
  // 월요일 ~ 일요일
  // ========================================
  const getThisWeekCount = () => {
    const today = new Date();

    const day = today.getDay();

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

    return events.filter((event) => {
      const eventDateObject =
        new Date(
          `${event.event_date}T00:00:00`
        );

      return (
        eventDateObject >= startOfWeek &&
        eventDateObject <= endOfWeek
      );
    }).length;
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
  // 날짜 표시
  // ========================================
  const formatEventDate = (
    dateString: string
  ) => {
    const [year, month, day] =
      dateString.split("-");

    return `${year}.${month}.${day}`;
  };

  // ========================================
  // 인증 확인 중
  // ========================================
  if (authLoading) {
    return (
      <>
        <Header />

        <main className="admin-page">
          <div className="admin-container">

            <div className="admin-empty">
              <h3>
                관리자 정보를 확인하고 있습니다.
              </h3>
            </div>

          </div>
        </main>
      </>
    );
  }

  // ========================================
  // 로그인 화면
  // ========================================
  if (!session) {
    return (
      <>
        <Header />

        <main className="admin-page">

          <div className="admin-login-container">

            <div className="admin-login-card">

              <span className="admin-label">
                SUWON PLAY ADMIN
              </span>

              <h1>
                관리자 로그인
              </h1>

              <p className="admin-login-description">
                일정 관리를 위해 관리자 계정으로
                로그인해주세요.
              </p>

              <form
                className="admin-login-form"
                onSubmit={handleLogin}
              >

                <div className="admin-form-group">

                  <label>
                    이메일
                  </label>

                  <input
                    type="email"
                    placeholder="관리자 이메일"
                    value={email}
                    onChange={(e) =>
                      setEmail(
                        e.target.value
                      )
                    }
                  />

                </div>

                <div className="admin-form-group">

                  <label>
                    비밀번호
                  </label>

                  <input
                    type="password"
                    placeholder="비밀번호"
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                  />

                </div>

                {loginError && (
                  <p className="admin-login-error">
                    {loginError}
                  </p>
                )}

                {resetMessage && (
                  <p className="admin-reset-success">
                    {resetMessage}
                  </p>
                )}

                <button
                  type="submit"
                  className="admin-login-button"
                  disabled={loginLoading}
                >
                  {loginLoading
                    ? "로그인 중..."
                    : "로그인"}
                </button>

                <button
                  type="button"
                  className="admin-reset-button"
                  onClick={
                    handlePasswordReset
                  }
                >
                  비밀번호 재설정
                </button>

              </form>

            </div>

          </div>

        </main>
      </>
    );
  }

  // ========================================
  // 관리자 페이지
  // ========================================
  return (
    <>
      <Header />

      <main className="admin-page">

        <div className="admin-container">

          {/* 상단 */}
          <section className="admin-top">

            <div>

              <span className="admin-label">
                SUWON PLAY ADMIN
              </span>

              <h1>
                일정 관리
              </h1>

              <p>
                경기·공연·축제·팝업 일정을
                등록하고 관리할 수 있습니다.
              </p>

            </div>

            <div className="admin-top-buttons">

              <button
                type="button"
                className="admin-logout-button"
                onClick={handleLogout}
              >
                로그아웃
              </button>

              <button
                type="button"
                className="admin-add-button"
                onClick={
                  handleOpenNewEvent
                }
              >
                + 새 일정 등록
              </button>

            </div>

          </section>

          {/* 통계 */}
          <section className="admin-summary">

            <div className="admin-summary-card">

              <span>
                전체 일정
              </span>

              <strong>
                {events.length}
              </strong>

            </div>

            <div className="admin-summary-card">

              <span>
                공개 일정
              </span>

              <strong>
                {
                  events.filter(
                    (event) =>
                      event.is_published
                  ).length
                }
              </strong>

            </div>

            <div className="admin-summary-card">

              <span>
                이번 주 일정
              </span>

              <strong>
                {getThisWeekCount()}
              </strong>

            </div>

          </section>

          {/* 등록된 일정 */}
          <section className="admin-list-section">

            <div className="admin-list-heading">

              <div>

                <h2>
                  등록된 일정
                </h2>

                <p>
                  SUWON PLAY에 등록된 일정을
                  관리합니다.
                </p>

              </div>

            </div>

            {eventsLoading ? (

              <div className="admin-empty">

                <h3>
                  일정을 불러오고 있습니다.
                </h3>

              </div>

            ) : events.length === 0 ? (

              <div className="admin-empty">

                <h3>
                  등록된 일정이 없습니다.
                </h3>

                <p>
                  새 일정 등록 버튼을 눌러
                  첫 일정을 등록해보세요.
                </p>

              </div>

            ) : (

              <div className="admin-event-list">

                {events.map((event) => (

                  <div
                    className="admin-event-item"
                    key={event.id}
                  >

                    {/* 이미지 미리보기 */}
                    {event.image_url && (

                      <div
                        className="admin-event-thumbnail"
                        style={{
                          backgroundImage:
                            `url(${event.image_url})`,
                        }}
                      />

                    )}

                    <div className="admin-event-main">

                      <div className="admin-event-meta">

                        <span className="admin-event-category">
                          {getCategoryName(
                            event.category
                          )}
                        </span>

                        <span>
                          {event.is_published
                            ? "공개"
                            : "비공개"}
                        </span>

                      </div>

                      <h3>
                        {event.title}
                      </h3>

                      <p>

                        {formatEventDate(
                          event.event_date
                        )}

                        {event.event_time &&
                          ` · ${event.event_time.slice(
                            0,
                            5
                          )}`}

                        {event.place &&
                          ` · ${event.place}`}

                      </p>

                    </div>

                    <div className="admin-event-actions">

                      <button
                        type="button"
                        className="admin-edit-button"
                        onClick={() =>
                          handleEditEvent(
                            event
                          )
                        }
                      >
                        수정
                      </button>

                      <button
                        type="button"
                        className="admin-delete-button"
                        onClick={() =>
                          handleDeleteEvent(
                            event
                          )
                        }
                      >
                        삭제
                      </button>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </section>

        </div>

      </main>

      {/* ====================================
          등록 / 수정 모달
      ==================================== */}
      {isModalOpen && (

        <div
          className="admin-modal-overlay"
          onClick={closeModal}
        >

          <div
            className="admin-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* 모달 상단 */}
            <div className="admin-modal-header">

              <div>

                <span className="admin-label">

                  {editingEventId !== null
                    ? "EDIT EVENT"
                    : "NEW EVENT"}

                </span>

                <h2>

                  {editingEventId !== null
                    ? "일정 수정"
                    : "새 일정 등록"}

                </h2>

              </div>

              <button
                type="button"
                className="admin-modal-close"
                onClick={closeModal}
                disabled={submitLoading}
              >
                ×
              </button>

            </div>

            {/* 폼 */}
            <div className="admin-form">

              {/* 제목 */}
              <div className="admin-form-group admin-form-full">

                <label>
                  일정 제목 *
                </label>

                <input
                  type="text"
                  placeholder="예: 수원FC 홈경기"
                  value={title}
                  onChange={(e) =>
                    setTitle(
                      e.target.value
                    )
                  }
                />

              </div>

              {/* 카테고리 */}
              <div className="admin-form-group">

                <label>
                  카테고리 *
                </label>

                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(
                      e.target.value
                    )
                  }
                >

                  <option value="sports">
                    스포츠
                  </option>

                  <option value="performance">
                    공연
                  </option>

                  <option value="festival">
                    축제
                  </option>

                  <option value="popup">
                    팝업
                  </option>

                </select>

              </div>

              {/* 날짜 */}
              <div className="admin-form-group">

                <label>
                  날짜 *
                </label>

                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) =>
                    setEventDate(
                      e.target.value
                    )
                  }
                />

              </div>

              {/* 시간 */}
              <div className="admin-form-group">

                <label>
                  시간
                </label>

                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) =>
                    setEventTime(
                      e.target.value
                    )
                  }
                />

              </div>

              {/* 장소 */}
              <div className="admin-form-group">

                <label>
                  장소
                </label>

                <input
                  type="text"
                  placeholder="예: 수원월드컵경기장"
                  value={place}
                  onChange={(e) =>
                    setPlace(
                      e.target.value
                    )
                  }
                />

              </div>

              {/* 이미지 */}
              <div className="admin-form-group admin-form-full">

                <label>
                  대표 이미지
                </label>

                {/* 수정 중 기존 이미지 */}
                {editingEventId !== null &&
                  existingImageUrl && (

                    <div className="admin-current-image">

                      <img
                        src={existingImageUrl}
                        alt="현재 대표 이미지"
                      />

                      <p>
                        현재 등록된 이미지
                      </p>

                    </div>

                  )}

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file =
                      e.target.files?.[0] ??
                      null;

                    setImageFile(file);
                  }}
                />

                {imageFile && (

                  <p
                    style={{
                      marginTop: "8px",
                      fontSize: "13px",
                      color: "#555",
                    }}
                  >
                    새 이미지: {imageFile.name}
                  </p>

                )}

                <p
                  style={{
                    marginTop: "7px",
                    fontSize: "12px",
                    color: "#999",
                    lineHeight: "1.5",
                  }}
                >
                  인스타그램용 1080×1350 이미지를
                  그대로 사용할 수 있습니다.
                  JPG, PNG, WebP · 최대 5MB
                </p>

                {editingEventId !== null &&
                  existingImageUrl &&
                  !imageFile && (

                    <p
                      style={{
                        marginTop: "3px",
                        fontSize: "12px",
                        color: "#777",
                      }}
                    >
                      새 이미지를 선택하지 않으면
                      기존 이미지가 유지됩니다.
                    </p>

                  )}

              </div>

              {/* 상세 설명 */}
              <div className="admin-form-group admin-form-full">

                <label>
                  상세 설명
                </label>

                <textarea
                  placeholder="일정에 대한 설명을 입력하세요."
                  rows={4}
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                />

              </div>

              {/* 링크 */}
              <div className="admin-form-group admin-form-full">

                <label>
                  예매 / 공식 링크
                </label>

                <input
                  type="url"
                  placeholder="https://..."
                  value={ticketUrl}
                  onChange={(e) =>
                    setTicketUrl(
                      e.target.value
                    )
                  }
                />

              </div>

              {/* 공개 여부 */}
              <div className="admin-form-full admin-publish">

                <label>

                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) =>
                      setIsPublished(
                        e.target.checked
                      )
                    }
                  />

                  <span>
                    웹사이트에 공개하기
                  </span>

                </label>

              </div>

              {/* 오류 */}
              {submitError && (

                <div className="admin-form-full">

                  <p className="admin-login-error">
                    {submitError}
                  </p>

                </div>

              )}

            </div>

            {/* 하단 */}
            <div className="admin-modal-footer">

              <button
                type="button"
                className="admin-cancel-button"
                onClick={closeModal}
                disabled={submitLoading}
              >
                취소
              </button>

              <button
                type="button"
                className="admin-submit-button"
                onClick={
                  handleSubmitEvent
                }
                disabled={submitLoading}
              >

                {submitLoading
                  ? "저장 중..."
                  : editingEventId !== null
                    ? "수정 완료"
                    : "일정 등록"}

              </button>

            </div>

          </div>

        </div>

      )}

    </>
  );
}

export default Admin;