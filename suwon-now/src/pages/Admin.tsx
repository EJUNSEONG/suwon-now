
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import Header from "../components/Header";
import CommunityAdmin from "./CommunityAdmin";
import { supabase } from "../lib/supabase";
import { teams } from "../teams";

type EventItem = {
  id: number;
  created_at: string;
  title: string;
  category: string;
  sport_type: string | null;
  event_type: "short" | "long";
  event_date: string;
  end_date: string | null;
  event_time: string | null;
  place: string | null;
  description: string | null;
  image_url: string | null;
  ticket_url: string | null;
  is_published: boolean;
  home_team: string | null;
  away_team: string | null;
  card_line1: string | null;
  card_line2: string | null;
};

const MATCH_SPORTS = [
  "soccer", "baseball", "wk-league",
  "basketball", "volleyball",
];

const SPORT_OPTIONS = [
  ["soccer", "⚽ 축구"],
  ["wk-league", "⚽ 여자축구 (WK리그)"],
  ["baseball", "⚾ 야구"],
  ["basketball", "🏀 농구"],
  ["volleyball", "🏐 배구"],
  ["running", "🏃 러닝"],
  ["badminton", "🏸 배드민턴"],
  ["tennis", "🎾 테니스"],
  ["golf", "⛳ 골프"],
  ["etc", "🏅 기타"],
];

const CATEGORY_OPTIONS = [
  ["sports", "스포츠"],
  ["performance", "공연"],
  ["festival", "축제"],
  ["popup", "팝업"],
];

export default function Admin() {
  const [adminTab, setAdminTab] =
    useState<"events" | "community">("events");

  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState<number[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("sports");
  const [sportType, setSportType] = useState("");
  const [eventType, setEventType] = useState<"short" | "long">("short");
  const [eventDate, setEventDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [place, setPlace] = useState("");
  const [description, setDescription] = useState("");
  const [ticketUrl, setTicketUrl] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] =
    useState<string | null>(null);

  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [cardLine1, setCardLine1] = useState("");
  const [cardLine2, setCardLine2] = useState("");

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [deleteMode, setDeleteMode] =
    useState<"single" | "multiple" | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<EventItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const isMatchSport =
    category === "sports" && MATCH_SPORTS.includes(sportType);

  const availableTeams = teams.filter(
    (team) => team.sport === sportType
  );

  const homeLogo = availableTeams.find(
    (team) => team.name === homeTeam
  )?.logo;

  const awayLogo = availableTeams.find(
    (team) => team.name === awayTeam
  )?.logo;

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setAuthLoading(false);
    };

    void checkSession();

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, currentSession) => {
        setSession(currentSession);
      });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      void fetchEvents();
    } else {
      setEvents([]);
      setSelectedEventIds([]);
    }
  }, [session]);

  const fetchEvents = async () => {
    setEventsLoading(true);

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("일정 불러오기 오류:", error);
    } else {
      setEvents((data ?? []) as EventItem[]);
    }

    setEventsLoading(false);
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim() || !password) {
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

    if (error) setLoginError(error.message);
    setLoginLoading(false);
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setLoginError("먼저 관리자 이메일을 입력해주세요.");
      return;
    }

    setLoginError("");
    setResetMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/reset-password` }
    );

    if (error) {
      setLoginError(error.message);
    } else {
      setResetMessage(
        "비밀번호 재설정 메일을 보냈습니다. 이메일을 확인해주세요."
      );
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAdminTab("events");
  };

  const resetEventForm = () => {
    setTitle("");
    setCategory("sports");
    setSportType("");
    setEventType("short");
    setEventDate("");
    setEndDate("");
    setEventTime("");
    setPlace("");
    setDescription("");
    setTicketUrl("");
    setIsPublished(true);
    setImageFile(null);
    setExistingImageUrl(null);
    setEditingEventId(null);
    setSubmitError("");
    setHomeTeam("");
    setAwayTeam("");
    setCardLine1("");
    setCardLine2("");
  };

  const handleOpenNewEvent = () => {
    resetEventForm();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (submitLoading) return;
    setIsModalOpen(false);
    resetEventForm();
  };

  const handleEditEvent = (event: EventItem) => {
    resetEventForm();

    setEditingEventId(event.id);
    setTitle(event.title);
    setCategory(event.category);
    setSportType(event.sport_type ?? "");
    setEventType(event.event_type ?? "short");
    setEventDate(event.event_date);
    setEndDate(event.end_date ?? "");
    setEventTime(event.event_time?.slice(0, 5) ?? "");
    setPlace(event.place ?? "");
    setDescription(event.description ?? "");
    setTicketUrl(event.ticket_url ?? "");
    setIsPublished(event.is_published);
    setExistingImageUrl(event.image_url);
    setHomeTeam(event.home_team ?? "");
    setAwayTeam(event.away_team ?? "");
    setCardLine1(event.card_line1 ?? "");
    setCardLine2(event.card_line2 ?? "");

    setIsModalOpen(true);
  };

  const getStorageFilePath = (imageUrl: string | null) => {
    if (!imageUrl) return null;

    const marker = "/storage/v1/object/public/event-images/";
    const index = imageUrl.indexOf(marker);

    if (index === -1) return null;

    return decodeURIComponent(
      imageUrl.substring(index + marker.length).split("?")[0]
    );
  };

  const handleSubmitEvent = async () => {
    if (!title.trim()) {
      setSubmitError("일정 제목을 입력해주세요.");
      return;
    }

    if (category === "sports" && !sportType) {
      setSubmitError("스포츠 종목을 선택해주세요.");
      return;
    }

    if (!eventDate) {
      setSubmitError("날짜를 선택해주세요.");
      return;
    }

    if (eventType === "long" && !endDate) {
      setSubmitError("장기 일정은 종료일을 선택해주세요.");
      return;
    }

    if (eventType === "long" && endDate < eventDate) {
      setSubmitError(
        "종료일은 시작일과 같거나 이후로 설정해주세요."
      );
      return;
    }

    if (isMatchSport && (homeTeam || awayTeam)) {
      if (!homeTeam || !awayTeam) {
        setSubmitError("홈팀과 원정팀을 모두 선택해주세요.");
        return;
      }

      if (homeTeam === awayTeam) {
        setSubmitError("홈팀과 원정팀은 서로 달라야 합니다.");
        return;
      }

      if (
        !availableTeams.some((team) => team.name === homeTeam) ||
        !availableTeams.some((team) => team.name === awayTeam)
      ) {
        setSubmitError("선택한 종목에 맞는 팀을 선택해주세요.");
        return;
      }
    }

    if (isMatchSport && (cardLine1 + cardLine2).length >= 30) {
      setSubmitError(
        "카드 문구는 두 줄 합쳐 공백 포함 30자 미만으로 작성해주세요."
      );
      return;
    }

    setSubmitLoading(true);
    setSubmitError("");

    let newUploadedFileName: string | null = null;

    try {
      let imageUrl = existingImageUrl;

      if (imageFile) {
        const allowedTypes = [
          "image/jpeg", "image/png", "image/webp",
        ];

        if (!allowedTypes.includes(imageFile.type)) {
          setSubmitError(
            "이미지는 JPG, PNG, WebP 형식만 업로드할 수 있습니다."
          );
          return;
        }

        if (imageFile.size > 5 * 1024 * 1024) {
          setSubmitError("이미지 용량은 5MB 이하로 업로드해주세요.");
          return;
        }

        const extension =
          imageFile.name.split(".").pop()?.toLowerCase() ?? "png";

        const fileName =
          `${Date.now()}-${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("event-images")
          .upload(fileName, imageFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          setSubmitError(
            "이미지 업로드에 실패했습니다: " + uploadError.message
          );
          return;
        }

        newUploadedFileName = fileName;

        const { data } = supabase.storage
          .from("event-images")
          .getPublicUrl(fileName);

        imageUrl = data.publicUrl;
      }

      const eventData = {
        title: title.trim(),
        category,
        sport_type: category === "sports" ? sportType : null,
        event_type: eventType,
        event_date: eventDate,
        end_date: eventType === "long" ? endDate : null,
        event_time: eventTime || null,
        place: place.trim() || null,
        description: description.trim() || null,
        image_url: imageUrl,
        ticket_url: ticketUrl.trim() || null,
        is_published: isPublished,
        home_team: isMatchSport ? homeTeam || null : null,
        away_team: isMatchSport ? awayTeam || null : null,
        card_line1: isMatchSport ? cardLine1.trim() || null : null,
        card_line2: isMatchSport ? cardLine2.trim() || null : null,
      };

      const { error: saveError } =
        editingEventId !== null
          ? await supabase
              .from("events")
              .update(eventData)
              .eq("id", editingEventId)
          : await supabase
              .from("events")
              .insert([eventData]);

      if (saveError) {
        if (newUploadedFileName) {
          await supabase.storage
            .from("event-images")
            .remove([newUploadedFileName]);
        }

        setSubmitError(
          "일정 저장에 실패했습니다: " + saveError.message
        );
        return;
      }

      if (
        editingEventId !== null &&
        imageFile &&
        existingImageUrl
      ) {
        const oldPath = getStorageFilePath(existingImageUrl);

        if (oldPath) {
          const { error } = await supabase.storage
            .from("event-images")
            .remove([oldPath]);

          if (error) {
            console.warn("기존 이미지 삭제 실패:", error);
          }
        }
      }

      await fetchEvents();
      setIsModalOpen(false);
      resetEventForm();
    } catch (error) {
      console.error("일정 저장 오류:", error);
      setSubmitError("일정을 저장하는 중 오류가 발생했습니다.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSelectEvent = (id: number) => {
    setSelectedEventIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedEventIds.length === events.length) {
      setSelectedEventIds([]);
    } else {
      setSelectedEventIds(events.map((event) => event.id));
    }
  };

  const handleDeleteEvent = (event: EventItem) => {
    setDeleteMode("single");
    setDeleteTarget(event);
    setDeleteError("");
  };

  const handleDeleteSelected = () => {
    if (selectedEventIds.length === 0) return;
    setDeleteMode("multiple");
    setDeleteTarget(null);
    setDeleteError("");
  };

  const closeDeleteModal = () => {
    if (deleteLoading) return;
    setDeleteMode(null);
    setDeleteTarget(null);
    setDeleteError("");
  };

  const confirmDeleteEvent = async () => {
    if (!deleteMode) return;

    const targetIds =
      deleteMode === "single"
        ? deleteTarget ? [deleteTarget.id] : []
        : selectedEventIds;

    if (targetIds.length === 0) return;

    setDeleteLoading(true);
    setDeleteError("");

    try {
      const targetEvents = events.filter((event) =>
        targetIds.includes(event.id)
      );

      const { error } = await supabase
        .from("events")
        .delete()
        .in("id", targetIds);

      if (error) {
        setDeleteError(
          "일정 삭제에 실패했습니다: " + error.message
        );
        return;
      }

      const imagePaths = targetEvents
        .map((event) => getStorageFilePath(event.image_url))
        .filter((path): path is string => path !== null);

      if (imagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("event-images")
          .remove(imagePaths);

        if (storageError) {
          console.warn("이미지 삭제 오류:", storageError);
        }
      }

      setSelectedEventIds((prev) =>
        prev.filter((id) => !targetIds.includes(id))
      );

      await fetchEvents();
      setDeleteMode(null);
      setDeleteTarget(null);
    } catch (error) {
      console.error("일정 삭제 오류:", error);
      setDeleteError("삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const getThisWeekCount = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;

    const start = new Date(today);
    start.setDate(today.getDate() + diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return events.filter((event) => {
      if (event.event_type === "long") return false;

      const date = new Date(`${event.event_date}T00:00:00`);
      return date >= start && date <= end;
    }).length;
  };

  const getCategoryName = (value: string) =>
    CATEGORY_OPTIONS.find(([key]) => key === value)?.[1] ?? value;

  const formatEventDate = (value: string) =>
    value.replace(/-/g, ".");

  if (authLoading) {
    return (
      <>
        <Header />
        <main className="admin-page">
          <div className="admin-container">
            <div className="admin-empty">
              <h3>관리자 정보를 확인하고 있습니다.</h3>
            </div>
          </div>
        </main>
      </>
    );
  }

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
              <h1>관리자 로그인</h1>
              <p className="admin-login-description">
                관리자 계정으로 로그인해주세요.
              </p>

              <form
                className="admin-login-form"
                onSubmit={handleLogin}
              >
                <div className="admin-form-group">
                  <label>이메일</label>
                  <input
                    type="email"
                    placeholder="관리자 이메일"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="admin-form-group">
                  <label>비밀번호</label>
                  <input
                    type="password"
                    placeholder="비밀번호"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                  {loginLoading ? "로그인 중..." : "로그인"}
                </button>

                <button
                  type="button"
                  className="admin-reset-button"
                  onClick={handlePasswordReset}
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

  const allSelected =
    events.length > 0 &&
    selectedEventIds.length === events.length;

  return (
    <>
      <Header />

      <main className="admin-page">
        <div className="admin-container">
          <section className="admin-top">
            <div>
              <span className="admin-label">
                SUWON PLAY ADMIN
              </span>

              <h1>
                {adminTab === "events"
                  ? "일정 관리"
                  : "게시판 관리"}
              </h1>

              <p>
                {adminTab === "events"
                  ? "경기·공연·축제·팝업 일정을 등록하고 관리할 수 있습니다."
                  : "커뮤니티 게시글과 댓글을 관리할 수 있습니다."}
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

              {adminTab === "events" && (
                <button
                  type="button"
                  className="admin-add-button"
                  onClick={handleOpenNewEvent}
                >
                  + 새 일정 등록
                </button>
              )}
            </div>
          </section>

          {/* 관리자 메뉴 */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              margin: "20px 0 28px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => setAdminTab("events")}
              style={{
                padding: "12px 20px",
                borderRadius: "8px",
                border: "1px solid #d9e2ee",
                cursor: "pointer",
                background:
                  adminTab === "events" ? "#075ec5" : "#fff",
                color:
                  adminTab === "events" ? "#fff" : "#264265",
              }}
            >
              일정 관리
            </button>

            <button
              type="button"
              onClick={() => setAdminTab("community")}
              style={{
                padding: "12px 20px",
                borderRadius: "8px",
                border: "1px solid #d9e2ee",
                cursor: "pointer",
                background:
                  adminTab === "community" ? "#075ec5" : "#fff",
                color:
                  adminTab === "community" ? "#fff" : "#264265",
              }}
            >
              게시판 관리
            </button>
          </div>

          {/* 게시판 관리 */}
          {adminTab === "community" && <CommunityAdmin />}

          {/* 기존 일정 관리 */}
          {adminTab === "events" && (
            <>
              <section className="admin-summary">
                <div className="admin-summary-card">
                  <span>전체 일정</span>
                  <strong>{events.length}</strong>
                </div>

                <div className="admin-summary-card">
                  <span>공개 일정</span>
                  <strong>
                    {events.filter(
                      (event) => event.is_published
                    ).length}
                  </strong>
                </div>

                <div className="admin-summary-card">
                  <span>이번 주 일정</span>
                  <strong>{getThisWeekCount()}</strong>
                </div>
              </section>

              <section className="admin-list-section">
                <div className="admin-list-heading">
                  <div>
                    <h2>등록된 일정</h2>
                    <p>
                      SUWON PLAY에 등록된 일정을 관리합니다.
                    </p>
                  </div>
                </div>

                {events.length > 0 && (
                  <div className="admin-bulk-toolbar">
                    <div className="admin-bulk-left">
                      <label className="admin-select-all">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={handleSelectAll}
                        />
                        <span>전체 선택</span>
                      </label>

                      {selectedEventIds.length > 0 && (
                        <span className="admin-selected-count">
                          {selectedEventIds.length}개 선택됨
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="admin-bulk-delete-button"
                      disabled={selectedEventIds.length === 0}
                      onClick={handleDeleteSelected}
                    >
                      선택 삭제
                    </button>
                  </div>
                )}

                {eventsLoading ? (
                  <div className="admin-empty">
                    <h3>일정을 불러오고 있습니다.</h3>
                  </div>
                ) : events.length === 0 ? (
                  <div className="admin-empty">
                    <h3>등록된 일정이 없습니다.</h3>
                    <p>새 일정 등록 버튼을 눌러주세요.</p>
                  </div>
                ) : (
                  <div className="admin-event-list">
                    {events.map((event) => {
                      const isSelected =
                        selectedEventIds.includes(event.id);

                      return (
                        <div
                          key={event.id}
                          className={
                            isSelected
                              ? "admin-event-item admin-event-item-selected"
                              : "admin-event-item"
                          }
                        >
                          <label className="admin-event-checkbox">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() =>
                                handleSelectEvent(event.id)
                              }
                            />
                          </label>

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
                                {getCategoryName(event.category)}
                              </span>
                              <span>
                                {event.event_type === "long"
                                  ? "장기 일정"
                                  : "단기 일정"}
                              </span>
                              <span>
                                {event.is_published
                                  ? "공개"
                                  : "비공개"}
                              </span>
                            </div>

                            <h3>{event.title}</h3>

                            <p>
                              {formatEventDate(event.event_date)}
                              {event.event_type === "long" &&
                                event.end_date &&
                                ` ~ ${formatEventDate(event.end_date)}`}
                              {event.event_time &&
                                ` · ${event.event_time.slice(0, 5)}`}
                              {event.place &&
                                ` · ${event.place}`}
                            </p>

                            {event.home_team &&
                              event.away_team && (
                                <p>
                                  {event.home_team} VS{" "}
                                  {event.away_team}
                                </p>
                              )}
                          </div>

                          <div className="admin-event-actions">
                            <button
                              type="button"
                              className="admin-edit-button"
                              onClick={() => handleEditEvent(event)}
                            >
                              수정
                            </button>

                            <button
                              type="button"
                              className="admin-delete-button"
                              onClick={() => handleDeleteEvent(event)}
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      {/* 일정 등록 및 수정 모달 */}
      {isModalOpen && (
        <div
          className="admin-modal-overlay"
          onClick={closeModal}
        >
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
          >
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

            <div className="admin-form">
              <div className="admin-form-group admin-form-full">
                <label>일정 제목 *</label>
                <input
                  type="text"
                  placeholder="예: 수원 KT vs 창원 LG"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="admin-form-group">
                <label>카테고리 *</label>
                <select
                  value={category}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCategory(value);

                    if (value !== "sports") {
                      setSportType("");
                      setHomeTeam("");
                      setAwayTeam("");
                    }
                  }}
                >
                  {CATEGORY_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {category === "sports" && (
                <div className="admin-form-group">
                  <label>스포츠 종목 *</label>
                  <select
                    value={sportType}
                    onChange={(e) => {
                      setSportType(e.target.value);
                      setHomeTeam("");
                      setAwayTeam("");
                    }}
                  >
                    <option value="">종목 선택</option>
                    {SPORT_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {isMatchSport && (
                <>
                  <div className="admin-form-group">
                    <label>홈팀 선택</label>
                    <select
                      value={homeTeam}
                      onChange={(e) =>
                        setHomeTeam(e.target.value)
                      }
                    >
                      <option value="">홈팀 선택</option>
                      {availableTeams.map((team) => (
                        <option
                          key={team.name}
                          value={team.name}
                        >
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label>원정팀 선택</label>
                    <select
                      value={awayTeam}
                      onChange={(e) =>
                        setAwayTeam(e.target.value)
                      }
                    >
                      <option value="">원정팀 선택</option>
                      {availableTeams.map((team) => (
                        <option
                          key={team.name}
                          value={team.name}
                        >
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(homeLogo || awayLogo) && (
                    <div className="admin-form-group admin-form-full">
                      <label>경기 로고 미리보기</label>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: "20px",
                          padding: "16px",
                          borderRadius: "12px",
                          background: "#15233d",
                        }}
                      >
                        {[homeLogo, awayLogo].map(
                          (logo, index) => (
                            <div
                              key={index}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                              }}
                            >
                              {index === 1 && (
                                <strong
                                  style={{ color: "white" }}
                                >
                                  VS
                                </strong>
                              )}

                              <div
                                style={{
                                  width: "90px",
                                  height: "90px",
                                  background: "white",
                                  borderRadius: "10px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  overflow: "hidden",
                                  padding: "8px",
                                  boxSizing: "border-box",
                                }}
                              >
                                {logo && (
                                  <img
                                    src={logo}
                                    alt={
                                      index === 0
                                        ? "홈팀 로고"
                                        : "원정팀 로고"
                                    }
                                    style={{
                                      maxWidth: "100%",
                                      maxHeight: "100%",
                                      objectFit: "contain",
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  <div className="admin-form-group admin-form-full">
                    <label>경기 카드 첫 번째 문구</label>
                    <input
                      type="text"
                      placeholder="예: 수원 KT와 창원 LG"
                      value={cardLine1}
                      onChange={(e) =>
                        setCardLine1(e.target.value)
                      }
                    />
                  </div>

                  <div className="admin-form-group admin-form-full">
                    <label>경기 카드 두 번째 문구</label>
                    <input
                      type="text"
                      placeholder="예: 승리를 가져갈 팀은?"
                      value={cardLine2}
                      onChange={(e) =>
                        setCardLine2(e.target.value)
                      }
                    />

                    <p
                      style={{
                        fontSize: "12px",
                        color: "#888",
                        marginTop: "6px",
                      }}
                    >
                      두 줄 합계{" "}
                      {cardLine1.length + cardLine2.length}/29자
                      (공백 포함)
                    </p>
                  </div>
                </>
              )}

              <div className="admin-form-group">
                <label>일정 유형 *</label>
                <select
                  value={eventType}
                  onChange={(e) => {
                    const value =
                      e.target.value as "short" | "long";
                    setEventType(value);

                    if (value === "short") {
                      setEndDate("");
                    }
                  }}
                >
                  <option value="short">단기 일정</option>
                  <option value="long">장기 일정</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label>
                  {eventType === "long"
                    ? "시작일 *"
                    : "날짜 *"}
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => {
                    setEventDate(e.target.value);

                    if (
                      endDate &&
                      endDate < e.target.value
                    ) {
                      setEndDate("");
                    }
                  }}
                />
              </div>

              {eventType === "long" && (
                <div className="admin-form-group">
                  <label>종료일 *</label>
                  <input
                    type="date"
                    value={endDate}
                    min={eventDate || undefined}
                    onChange={(e) =>
                      setEndDate(e.target.value)
                    }
                  />
                </div>
              )}

              <div className="admin-form-group">
                <label>시작 시간</label>
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) =>
                    setEventTime(e.target.value)
                  }
                />
              </div>

              <div className="admin-form-group">
                <label>장소</label>
                <input
                  type="text"
                  placeholder="예: 수원 KT 소닉붐 아레나"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                />
              </div>

              <div className="admin-form-group admin-form-full">
                <label>대표 이미지</label>

                {editingEventId !== null &&
                  existingImageUrl && (
                    <div className="admin-current-image">
                      <img
                        src={existingImageUrl}
                        alt="현재 대표 이미지"
                      />
                      <p>현재 등록된 이미지</p>
                    </div>
                  )}

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={(e) =>
                    setImageFile(
                      e.target.files?.[0] ?? null
                    )
                  }
                />

                {imageFile && (
                  <p
                    style={{
                      marginTop: "8px",
                      fontSize: "13px",
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
                  }}
                >
                  경기 카드는 팀 로고를 활용할 수 있으므로
                  대표 이미지 없이 등록해도 됩니다.
                  공연·축제·팝업은 기존처럼 이미지를 업로드하세요.
                  JPG, PNG, WebP · 최대 5MB
                </p>
              </div>

              <div className="admin-form-group admin-form-full">
                <label>상세 설명</label>
                <textarea
                  placeholder="일정에 대한 설명을 입력하세요."
                  rows={4}
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                />
              </div>

              <div className="admin-form-group admin-form-full">
                <label>예매 / 공식 링크</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={ticketUrl}
                  onChange={(e) =>
                    setTicketUrl(e.target.value)
                  }
                />
              </div>

              <div className="admin-form-full admin-publish">
                <label>
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) =>
                      setIsPublished(e.target.checked)
                    }
                  />
                  <span>웹사이트에 공개하기</span>
                </label>
              </div>

              {submitError && (
                <div className="admin-form-full">
                  <p className="admin-login-error">
                    {submitError}
                  </p>
                </div>
              )}
            </div>

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
                onClick={handleSubmitEvent}
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

      {/* 일정 삭제 확인 모달 */}
      {deleteMode && (
        <div
          className="delete-modal-overlay"
          onClick={closeDeleteModal}
        >
          <div
            className="delete-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="delete-modal-icon">!</div>

            <h2>
              {deleteMode === "multiple"
                ? "선택 일정 삭제"
                : "일정 삭제"}
            </h2>

            {deleteMode === "single" &&
              deleteTarget && (
                <p className="delete-modal-description">
                  <strong>{deleteTarget.title}</strong>
                  {" "}일정을 정말 삭제하시겠습니까?
                </p>
              )}

            {deleteMode === "multiple" && (
              <p className="delete-modal-description">
                선택한{" "}
                <strong>
                  {selectedEventIds.length}개의 일정
                </strong>
                을 모두 삭제하시겠습니까?
              </p>
            )}

            <p className="delete-modal-warning">
              삭제한 일정은 복구할 수 없습니다.
            </p>

            {deleteError && (
              <p className="delete-modal-error">
                {deleteError}
              </p>
            )}

            <div className="delete-modal-buttons">
              <button
                type="button"
                className="delete-cancel-button"
                disabled={deleteLoading}
                onClick={closeDeleteModal}
              >
                취소
              </button>

              <button
                type="button"
                className="delete-confirm-button"
                disabled={deleteLoading}
                onClick={confirmDeleteEvent}
              >
                {deleteLoading
                  ? "삭제 중..."
                  : deleteMode === "multiple"
                    ? `${selectedEventIds.length}개 삭제`
                    : "삭제하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
