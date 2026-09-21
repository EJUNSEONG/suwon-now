import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import Header from "../components/Header";
import { supabase } from "../lib/supabase";

function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);

  // 로그인 상태 확인
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

  // 로그인
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password) {
      setLoginError("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setLoginLoading(true);
    setLoginError("");
    setResetMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Supabase 로그인 오류:", error);
      setLoginError(error.message);
    }

    setLoginLoading(false);
  };

  // 비밀번호 재설정 이메일 발송
const handlePasswordReset = async () => {
  if (!email) {
    setLoginError("먼저 관리자 이메일을 입력해주세요.");
    return;
  }

  setLoginError("");
  setResetMessage("");

  const redirectUrl = "http://localhost:5173/reset-password";

  console.log("비밀번호 재설정 주소:", redirectUrl);

  const { data, error } = await supabase.auth.resetPasswordForEmail(
    email.trim(),
    {
      redirectTo: redirectUrl,
    }
  );

  console.log("reset data:", data);
  console.log("reset error:", error);

  if (error) {
    console.error("비밀번호 재설정 오류:", error);
    setLoginError(error.message);
    return;
  }

  setResetMessage(
    "비밀번호 재설정 메일을 보냈습니다. 이메일을 확인해주세요."
  );
};

  // 로그아웃
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // 로그인 상태 확인 중
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

  // 로그인하지 않은 경우
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
                일정 관리를 위해 관리자 계정으로 로그인해주세요.
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
                  {loginLoading
                    ? "로그인 중..."
                    : "로그인"}
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

  // 로그인 성공 후 관리자 페이지
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

              <h1>일정 관리</h1>

              <p>
                경기·공연·축제·팝업 일정을 등록하고 관리할 수 있습니다.
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
                onClick={() => setIsModalOpen(true)}
              >
                + 새 일정 등록
              </button>
            </div>
          </section>

          <section className="admin-summary">
            <div className="admin-summary-card">
              <span>전체 일정</span>
              <strong>-</strong>
            </div>

            <div className="admin-summary-card">
              <span>공개 일정</span>
              <strong>-</strong>
            </div>

            <div className="admin-summary-card">
              <span>이번 주 일정</span>
              <strong>-</strong>
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

            <div className="admin-empty">
              <h3>일정 데이터를 연결할 예정입니다.</h3>
              <p>
                다음 단계에서 Supabase에 등록된 일정을
                이곳에 표시합니다.
              </p>
            </div>
          </section>

        </div>
      </main>

      {isModalOpen && (
        <div
          className="admin-modal-overlay"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div>
                <span className="admin-label">
                  NEW EVENT
                </span>

                <h2>새 일정 등록</h2>
              </div>

              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="admin-form">

              <div className="admin-form-group admin-form-full">
                <label>일정 제목</label>

                <input
                  type="text"
                  placeholder="예: 수원FC 홈경기"
                />
              </div>

              <div className="admin-form-group">
                <label>카테고리</label>

                <select>
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

              <div className="admin-form-group">
                <label>날짜</label>
                <input type="date" />
              </div>

              <div className="admin-form-group">
                <label>시간</label>
                <input type="time" />
              </div>

              <div className="admin-form-group">
                <label>장소</label>

                <input
                  type="text"
                  placeholder="예: 수원월드컵경기장"
                />
              </div>

              <div className="admin-form-group admin-form-full">
                <label>대표 이미지</label>

                <input
                  type="file"
                  accept="image/*"
                />
              </div>

              <div className="admin-form-group admin-form-full">
                <label>상세 설명</label>

                <textarea
                  placeholder="일정에 대한 설명을 입력하세요."
                  rows={4}
                />
              </div>

              <div className="admin-form-group admin-form-full">
                <label>예매 / 공식 링크</label>

                <input
                  type="url"
                  placeholder="https://..."
                />
              </div>

              <div className="admin-form-full admin-publish">
                <label>
                  <input type="checkbox" />
                  <span>웹사이트에 공개하기</span>
                </label>
              </div>

            </div>

            <div className="admin-modal-footer">

              <button
                type="button"
                className="admin-cancel-button"
                onClick={() => setIsModalOpen(false)}
              >
                취소
              </button>

              <button
                type="button"
                className="admin-submit-button"
              >
                일정 등록
              </button>

            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Admin;