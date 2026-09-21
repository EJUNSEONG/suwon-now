import { useState } from "react";
import Header from "../components/Header";

function Admin() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Header />

      <main className="admin-page">
        <div className="admin-container">

          {/* 관리자 페이지 상단 */}
          <section className="admin-top">
            <div>
              <span className="admin-label">SUWON PLAY ADMIN</span>
              <h1>일정 관리</h1>
              <p>
                경기·공연·축제·팝업 일정을 등록하고 관리할 수 있습니다.
              </p>
            </div>

            <button
              type="button"
              className="admin-add-button"
              onClick={() => setIsModalOpen(true)}
            >
              + 새 일정 등록
            </button>
          </section>

          {/* 간단한 현황 */}
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

          {/* 일정 목록 */}
          <section className="admin-list-section">
            <div className="admin-list-heading">
              <div>
                <h2>등록된 일정</h2>
                <p>SUWON PLAY에 등록된 일정을 관리합니다.</p>
              </div>
            </div>

            <div className="admin-empty">
              <h3>일정 데이터를 연결할 예정입니다.</h3>
              <p>
                다음 단계에서 Supabase에 등록된 일정을 이곳에 표시합니다.
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* 새 일정 등록 모달 */}
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
                <span className="admin-label">NEW EVENT</span>
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
                  <option value="sports">스포츠</option>
                  <option value="performance">공연</option>
                  <option value="festival">축제</option>
                  <option value="popup">팝업</option>
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