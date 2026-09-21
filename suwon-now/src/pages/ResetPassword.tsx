import { useState } from "react";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!password || !passwordCheck) {
      setMessage("새 비밀번호를 입력해주세요.");
      return;
    }

    if (password !== passwordCheck) {
      setMessage("비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    if (password.length < 6) {
      setMessage("비밀번호는 6자 이상으로 설정해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      console.error("비밀번호 변경 오류:", error);
      setMessage("비밀번호 변경에 실패했습니다: " + error.message);
      setLoading(false);
      return;
    }

    setMessage("비밀번호가 변경되었습니다.");

    await supabase.auth.signOut();

    setTimeout(() => {
      window.location.href = "/admin";
    }, 1500);
  };

  return (
    <>
      <Header />

      <main className="admin-page">
        <div className="admin-login-container">
          <div className="admin-login-card">

            <span className="admin-label">
              SUWON PLAY ADMIN
            </span>

            <h1>새 비밀번호 설정</h1>

            <p className="admin-login-description">
              관리자 계정에서 사용할 새로운 비밀번호를 입력해주세요.
            </p>

            <form
              className="admin-login-form"
              onSubmit={handleResetPassword}
            >
              <div className="admin-form-group">
                <label>새 비밀번호</label>

                <input
                  type="password"
                  placeholder="새 비밀번호"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="admin-form-group">
                <label>새 비밀번호 확인</label>

                <input
                  type="password"
                  placeholder="새 비밀번호 다시 입력"
                  value={passwordCheck}
                  onChange={(e) => setPasswordCheck(e.target.value)}
                />
              </div>

              {message && (
                <p className="admin-login-error">
                  {message}
                </p>
              )}

              <button
                type="submit"
                className="admin-login-button"
                disabled={loading}
              >
                {loading
                  ? "변경 중..."
                  : "비밀번호 변경"}
              </button>
            </form>

          </div>
        </div>
      </main>
    </>
  );
}

export default ResetPassword;