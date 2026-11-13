
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Header from "../components/Header";
import { supabase } from "../lib/supabase";
import "./Community.css";

type Category = "all" | "food" | "together" | "free";
type PostCategory = Exclude<Category, "all">;
type View = "list" | "write" | "detail";
type SortOrder = "latest" | "views";

type Post = {
  id: number;
  category: PostCategory;
  title: string;
  author: string;
  content: string;
  view_count: number;
  created_at: string;
};

type Comment = {
  id: number;
  post_id: number;
  author: string;
  content: string;
  created_at: string;
};

type FunctionResult = {
  success?: boolean;
  error?: string;
  postId?: number;
  commentId?: number;
};

type DeleteTarget =
  | { type: "post"; id: number }
  | { type: "comment"; id: number }
  | null;

const categories: { value: Category; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "food", label: "맛집 추천" },
  { value: "together", label: "동행 모집" },
  { value: "free", label: "자유게시판" },
];

const categoryLabel = (value: Category) =>
  categories.find((item) => item.value === value)?.label ?? "전체";

const formatDate = (value: string) =>
  new Date(value).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

async function getErrorMessage(
  error: unknown,
  fallback: string
): Promise<string> {
  if (error && typeof error === "object") {
    if (
      "context" in error &&
      error.context instanceof Response
    ) {
      try {
        const result = await error.context.clone().json();

        if (typeof result?.error === "string") {
          return result.error;
        }

        if (typeof result?.message === "string") {
          return result.message;
        }
      } catch {
        // JSON 응답이 아닐 때
      }
    }

    if (
      "message" in error &&
      typeof error.message === "string"
    ) {
      return error.message;
    }
  }

  return fallback;
}

function Community() {
  const [category, setCategory] = useState<Category>("all");
  const [sortOrder, setSortOrder] =
    useState<SortOrder>("latest");
  const [view, setView] = useState<View>("list");

  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedPost, setSelectedPost] =
    useState<Post | null>(null);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [busy, setBusy] = useState(false);

  // 게시글 작성·수정
  const [editingPost, setEditingPost] = useState(false);
  const [writeCategory, setWriteCategory] =
    useState<PostCategory>("free");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [password, setPassword] = useState("");
  const [content, setContent] = useState("");

  // 댓글 작성
  const [commentAuthor, setCommentAuthor] = useState("");
  const [commentPassword, setCommentPassword] = useState("");
  const [commentContent, setCommentContent] = useState("");

  // 댓글 수정
  const [editingCommentId, setEditingCommentId] =
    useState<number | null>(null);
  const [editCommentContent, setEditCommentContent] =
    useState("");
  const [editCommentPassword, setEditCommentPassword] =
    useState("");

  // 삭제
  const [deleteTarget, setDeleteTarget] =
    useState<DeleteTarget>(null);
  const [deletePassword, setDeletePassword] = useState("");

  // =====================================
  // 데이터 조회
  // =====================================

  const fetchPosts = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("community_posts")
      .select(
        "id, category, title, author, content, view_count, created_at"
      )
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    if (error) {
      console.error("게시글 조회 오류:", error);
      setErrorMessage("게시글을 불러오지 못했습니다.");
    } else {
      setPosts((data ?? []) as Post[]);
      setErrorMessage("");
    }

    setLoading(false);
  };

  const fetchComments = async (postId: number) => {
    const { data, error } = await supabase
      .from("community_comments")
      .select("id, post_id, author, content, created_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("댓글 조회 오류:", error);
      setErrorMessage("댓글을 불러오지 못했습니다.");
      return false;
    }

    setComments((data ?? []) as Comment[]);
    setErrorMessage("");
    return true;
  };

  useEffect(() => {
    void fetchPosts();
  }, []);

  // =====================================
  // 카테고리 필터 + 정렬
  // =====================================

  const filteredPosts = posts
    .filter(
      (post) =>
        category === "all" || post.category === category
    )
    .sort((a, b) => {
      if (sortOrder === "views") {
        return (
          (b.view_count ?? 0) - (a.view_count ?? 0) ||
          b.id - a.id
        );
      }

      return (
        new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime() ||
        b.id - a.id
      );
    });

  // =====================================
  // 화면 이동
  // =====================================

  const goToList = () => {
    setView("list");
    setSelectedPost(null);
    setComments([]);
    setEditingPost(false);
    setEditingCommentId(null);
    setDeleteTarget(null);
    setDeletePassword("");
    setPassword("");
    setErrorMessage("");
  };

  // 게시글 상세 화면 + 조회수 증가
  const openPost = async (post: Post) => {
    setSelectedPost(post);
    setView("detail");
    setComments([]);
    setDetailLoading(true);
    setEditingCommentId(null);
    setDeleteTarget(null);
    setErrorMessage("");

    setCommentAuthor("");
    setCommentPassword("");
    setCommentContent("");

    // Supabase 조회수 증가 함수 호출
    try {
      const { error } = await supabase.rpc(
        "increment_community_post_view",
        { p_post_id: post.id }
      );

      if (error) {
        console.error("조회수 증가 실패:", error);
      } else {
        // 상세 화면 조회수 반영
        setSelectedPost((prev) =>
          prev && prev.id === post.id
            ? {
                ...prev,
                view_count: (prev.view_count ?? 0) + 1,
              }
            : prev
        );

        // 게시글 목록 조회수 반영
        setPosts((prev) =>
          prev.map((item) =>
            item.id === post.id
              ? {
                  ...item,
                  view_count: (item.view_count ?? 0) + 1,
                }
              : item
          )
        );
      }
    } catch (error) {
      console.error("조회수 처리 오류:", error);
    }

    await fetchComments(post.id);
    setDetailLoading(false);
  };

  const openWrite = () => {
    setEditingPost(false);
    setSelectedPost(null);
    setWriteCategory("free");
    setTitle("");
    setAuthor("");
    setPassword("");
    setContent("");
    setView("write");
  };

  const openEditPost = () => {
    if (!selectedPost) return;

    setEditingPost(true);
    setWriteCategory(selectedPost.category);
    setTitle(selectedPost.title);
    setAuthor(selectedPost.author);
    setContent(selectedPost.content);
    setPassword("");
    setView("write");
  };

  // =====================================
  // 게시글 작성·수정
  // =====================================

  const handleWrite = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (busy) return;

    const cleanTitle = title.trim();
    const cleanAuthor = author.trim();
    const cleanContent = content.trim();

    if (!cleanTitle || !cleanAuthor || !cleanContent) {
      alert("모든 항목을 입력해주세요.");
      return;
    }

    if (password.length < 8 || password.length > 128) {
      alert("비밀번호는 8~128자로 입력해주세요.");
      return;
    }

    setBusy(true);

    try {
      const functionName = editingPost
        ? "community-manage-post"
        : "community-create-post";

      const body = editingPost
        ? {
            action: "update",
            post_id: selectedPost?.id,
            password,
            category: writeCategory,
            title: cleanTitle,
            content: cleanContent,
          }
        : {
            category: writeCategory,
            title: cleanTitle,
            author: cleanAuthor,
            password,
            content: cleanContent,
          };

      const { data, error } =
        await supabase.functions.invoke<FunctionResult>(
          functionName,
          { body }
        );

      if (error) {
        alert(
          await getErrorMessage(error, "게시글 처리 실패")
        );
        return;
      }

      if (!data?.success) {
        alert(data?.error ?? "게시글 처리 실패");
        return;
      }

      if (editingPost && selectedPost) {
        const updatedPost: Post = {
          ...selectedPost,
          category: writeCategory,
          title: cleanTitle,
          content: cleanContent,
        };

        setSelectedPost(updatedPost);

        setPosts((prev) =>
          prev.map((post) =>
            post.id === updatedPost.id ? updatedPost : post
          )
        );

        setEditingPost(false);
        setView("detail");
        alert("게시글이 수정되었습니다.");
      } else {
        setCategory("all");
        await fetchPosts();
        goToList();
        alert("게시글이 등록되었습니다.");
      }

      setPassword("");
    } catch (error) {
      console.error("게시글 처리 오류:", error);
      alert("게시글 처리 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  };

  // =====================================
  // 댓글 작성
  // =====================================

  const handleCommentSubmit = async () => {
    if (!selectedPost || busy) return;

    if (
      !commentAuthor.trim() ||
      !commentContent.trim() ||
      commentPassword.length < 8 ||
      commentPassword.length > 128
    ) {
      alert(
        "작성자, 비밀번호(8자 이상), 댓글을 입력해주세요."
      );
      return;
    }

    setBusy(true);

    try {
      const { data, error } =
        await supabase.functions.invoke<FunctionResult>(
          "community-create-comment",
          {
            body: {
              post_id: selectedPost.id,
              author: commentAuthor.trim(),
              password: commentPassword,
              content: commentContent.trim(),
            },
          }
        );

      if (error) {
        alert(
          await getErrorMessage(error, "댓글 등록 실패")
        );
        return;
      }

      if (!data?.success) {
        alert(data?.error ?? "댓글 등록 실패");
        return;
      }

      setCommentAuthor("");
      setCommentPassword("");
      setCommentContent("");

      await fetchComments(selectedPost.id);
    } catch (error) {
      console.error("댓글 등록 오류:", error);
      alert("댓글 등록 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  };

  // =====================================
  // 댓글 수정
  // =====================================

  const startEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditCommentContent(comment.content);
    setEditCommentPassword("");
  };

  const handleUpdateComment = async (
    commentId: number
  ) => {
    if (!selectedPost || busy) return;

    if (
      !editCommentContent.trim() ||
      editCommentPassword.length < 8 ||
      editCommentPassword.length > 128
    ) {
      alert(
        "댓글 내용과 비밀번호(8~128자)를 입력해주세요."
      );
      return;
    }

    setBusy(true);

    try {
      const { data, error } =
        await supabase.functions.invoke<FunctionResult>(
          "community-manage-comment",
          {
            body: {
              action: "update",
              comment_id: commentId,
              password: editCommentPassword,
              content: editCommentContent.trim(),
            },
          }
        );

      if (error) {
        alert(
          await getErrorMessage(error, "댓글 수정 실패")
        );
        return;
      }

      if (!data?.success) {
        alert(data?.error ?? "댓글 수정 실패");
        return;
      }

      setEditingCommentId(null);
      setEditCommentPassword("");
      await fetchComments(selectedPost.id);

      alert("댓글이 수정되었습니다.");
    } catch (error) {
      console.error("댓글 수정 오류:", error);
      alert("댓글 수정 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  };

  // =====================================
  // 삭제창 열기
  // =====================================

  const openDeletePost = () => {
    if (!selectedPost) return;

    setDeleteTarget({
      type: "post",
      id: selectedPost.id,
    });

    setDeletePassword("");
  };

  const openDeleteComment = (commentId: number) => {
    setDeleteTarget({
      type: "comment",
      id: commentId,
    });

    setDeletePassword("");
  };

  // =====================================
  // 게시글·댓글 삭제
  // =====================================

  const handleDelete = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!deleteTarget || busy) return;

    if (
      deletePassword.length < 8 ||
      deletePassword.length > 128
    ) {
      alert("비밀번호는 8~128자로 입력해주세요.");
      return;
    }

    const target = deleteTarget;
    setBusy(true);

    try {
      const functionName =
        target.type === "post"
          ? "community-manage-post"
          : "community-manage-comment";

      const body =
        target.type === "post"
          ? {
              action: "delete",
              post_id: target.id,
              password: deletePassword,
            }
          : {
              action: "delete",
              comment_id: target.id,
              password: deletePassword,
            };

      const { data, error } =
        await supabase.functions.invoke<FunctionResult>(
          functionName,
          { body }
        );

      if (error) {
        console.error("삭제 오류:", error);

        alert(
          await getErrorMessage(
            error,
            "삭제에 실패했습니다."
          )
        );
        return;
      }

      if (!data?.success) {
        alert(data?.error ?? "삭제에 실패했습니다.");
        return;
      }

      setDeleteTarget(null);
      setDeletePassword("");

      if (target.type === "post") {
        setPosts((prev) =>
          prev.filter((post) => post.id !== target.id)
        );

        goToList();
        alert("게시글이 삭제되었습니다.");
      } else {
        setComments((prev) =>
          prev.filter(
            (comment) => comment.id !== target.id
          )
        );

        if (selectedPost) {
          await fetchComments(selectedPost.id);
        }

        alert("댓글이 삭제되었습니다.");
      }
    } catch (error) {
      console.error("삭제 처리 오류:", error);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  };

  // =====================================
  // 화면
  // =====================================

  return (
    <>
      <Header />

      <main className="community-page">
        <div className="community-container">
          <div className="community-heading">
            <span className="community-eyebrow">
              SUWON PLAY
            </span>

            <h1>COMMUNITY</h1>

            <p>
              수원의 맛집을 추천하고, 함께 경기를 볼
              사람을 찾아보세요.
            </p>
          </div>

          {/* 게시글 목록 */}
          {view === "list" && (
            <>
              <div className="community-toolbar">
                <div className="community-tabs">
                  {categories.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className={
                        category === item.value
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setCategory(item.value)
                      }
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* 최신순 / 조회수순 */}
                <div className="community-sort">
                  <button
                    type="button"
                    className={
                      sortOrder === "latest"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setSortOrder("latest")
                    }
                  >
                    최신순
                  </button>

                  <button
                    type="button"
                    className={
                      sortOrder === "views"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setSortOrder("views")
                    }
                  >
                    조회수순
                  </button>
                </div>

                <button
                  type="button"
                  className="community-primary-btn"
                  onClick={openWrite}
                >
                  글쓰기
                </button>
              </div>

              <div className="community-board">
                <div className="community-board-head">
                  <span>번호</span>
                  <span>제목</span>
                  <span>작성자</span>
                  <span>작성일</span>
                  <span>조회</span>
                </div>

                {loading ? (
                  <div className="community-empty">
                    게시글을 불러오는 중입니다.
                  </div>
                ) : errorMessage ? (
                  <div className="community-empty">
                    {errorMessage}
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="community-empty">
                    등록된 게시글이 없습니다.
                  </div>
                ) : (
                  filteredPosts.map((post, index) => (
                    <button
                      type="button"
                      className="community-board-row"
                      key={post.id}
                      onClick={() =>
                        void openPost(post)
                      }
                    >
                      <span className="community-post-number">
                        {filteredPosts.length - index}
                      </span>

                      <span className="community-post-title">
                        <span className="community-post-category">
                          {categoryLabel(post.category)}
                        </span>

                        <span className="community-post-title-text">
                          {post.title}
                        </span>
                      </span>

                      <span>{post.author}</span>

                      <span>
                        {formatDate(post.created_at)}
                      </span>

                      <span>
                        {post.view_count ?? 0}
                      </span>
                    </button>
                  ))
                )}
              </div>

              <div className="community-board-footer">
                총 {filteredPosts.length}개의 게시글
              </div>
            </>
          )}

          {/* 게시글 작성·수정 */}
          {view === "write" && (
            <section className="community-panel">
              <div className="community-panel-heading">
                <h2>
                  {editingPost
                    ? "게시글 수정"
                    : "글쓰기"}
                </h2>

                <p>
                  {editingPost
                    ? "작성 당시 설정한 비밀번호를 입력해주세요."
                    : "수원에 관한 이야기를 자유롭게 작성해보세요."}
                </p>
              </div>

              <form
                className="community-form"
                onSubmit={handleWrite}
              >
                <label>
                  카테고리
                  <select
                    value={writeCategory}
                    onChange={(event) =>
                      setWriteCategory(
                        event.target.value as PostCategory
                      )
                    }
                  >
                    <option value="food">
                      맛집 추천
                    </option>
                    <option value="together">
                      동행 모집
                    </option>
                    <option value="free">
                      자유게시판
                    </option>
                  </select>
                </label>

                <label>
                  제목
                  <input
                    type="text"
                    value={title}
                    maxLength={100}
                    onChange={(event) =>
                      setTitle(event.target.value)
                    }
                    required
                  />
                </label>

                <div className="community-form-grid">
                  <label>
                    작성자
                    <input
                      type="text"
                      value={author}
                      maxLength={20}
                      disabled={editingPost}
                      onChange={(event) =>
                        setAuthor(event.target.value)
                      }
                      required
                    />
                  </label>

                  <label>
                    비밀번호
                    <input
                      type="password"
                      value={password}
                      minLength={8}
                      maxLength={128}
                      placeholder={
                        editingPost
                          ? "기존 비밀번호 입력"
                          : "8자 이상 입력"
                      }
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      required
                    />
                  </label>
                </div>

                <label>
                  내용
                  <textarea
                    rows={10}
                    value={content}
                    maxLength={10000}
                    onChange={(event) =>
                      setContent(event.target.value)
                    }
                    required
                  />
                </label>

                <p className="community-form-note">
                  비밀번호는 게시글 수정 및 삭제 시
                  필요합니다.
                </p>

                <div className="community-form-actions">
                  <button
                    type="button"
                    className="community-secondary-btn"
                    disabled={busy}
                    onClick={() => {
                      if (
                        editingPost &&
                        selectedPost
                      ) {
                        setView("detail");
                        setEditingPost(false);
                      } else {
                        goToList();
                      }
                    }}
                  >
                    취소
                  </button>

                  <button
                    type="submit"
                    className="community-primary-btn"
                    disabled={busy}
                  >
                    {busy
                      ? "처리 중..."
                      : editingPost
                        ? "수정 완료"
                        : "등록하기"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* 게시글 상세 */}
          {view === "detail" && selectedPost && (
            <section className="community-panel">
              <div className="community-detail-heading">
                <span className="community-detail-category">
                  {categoryLabel(
                    selectedPost.category
                  )}
                </span>

                <h2>{selectedPost.title}</h2>

                <div className="community-detail-meta">
                  <span>
                    {selectedPost.author}
                  </span>

                  <span>
                    {formatDate(
                      selectedPost.created_at
                    )}
                  </span>

                  <span>
                    조회{" "}
                    {selectedPost.view_count ?? 0}
                  </span>
                </div>
              </div>

              <div className="community-detail-content">
                {selectedPost.content}
              </div>

              <div className="community-detail-actions">
                <button
                  type="button"
                  className="community-secondary-btn"
                  onClick={goToList}
                >
                  목록으로
                </button>

                <button
                  type="button"
                  className="community-secondary-btn"
                  disabled={busy}
                  onClick={openEditPost}
                >
                  수정
                </button>

                <button
                  type="button"
                  className="community-secondary-btn"
                  disabled={busy}
                  onClick={openDeletePost}
                >
                  삭제
                </button>
              </div>

              {/* 댓글 목록 */}
              <div className="community-comments">
                <h3>댓글 {comments.length}</h3>

                {detailLoading ? (
                  <p className="community-no-comments">
                    댓글을 불러오는 중입니다.
                  </p>
                ) : errorMessage ? (
                  <p className="community-no-comments">
                    {errorMessage}
                  </p>
                ) : comments.length === 0 ? (
                  <p className="community-no-comments">
                    아직 댓글이 없습니다.
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div
                      className="community-comment"
                      key={comment.id}
                    >
                      <div className="community-comment-top">
                        <div className="community-comment-meta">
                          <strong>
                            {comment.author}
                          </strong>

                          <span>
                            {formatDate(
                              comment.created_at
                            )}
                          </span>
                        </div>

                        {editingCommentId !==
                          comment.id && (
                          <div className="community-comment-actions">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                startEditComment(
                                  comment
                                )
                              }
                            >
                              수정
                            </button>

                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                openDeleteComment(
                                  comment.id
                                )
                              }
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </div>

                      {editingCommentId ===
                      comment.id ? (
                        <div className="community-comment-form">
                          <textarea
                            value={
                              editCommentContent
                            }
                            maxLength={2000}
                            rows={3}
                            onChange={(event) =>
                              setEditCommentContent(
                                event.target.value
                              )
                            }
                          />

                          <input
                            type="password"
                            placeholder="기존 비밀번호"
                            value={
                              editCommentPassword
                            }
                            maxLength={128}
                            onChange={(event) =>
                              setEditCommentPassword(
                                event.target.value
                              )
                            }
                          />

                          <div className="community-comment-edit-actions">
                            <button
                              type="button"
                              className="community-primary-btn"
                              disabled={busy}
                              onClick={() =>
                                void handleUpdateComment(
                                  comment.id
                                )
                              }
                            >
                              수정 완료
                            </button>

                            <button
                              type="button"
                              className="community-secondary-btn"
                              disabled={busy}
                              onClick={() => {
                                setEditingCommentId(
                                  null
                                );
                                setEditCommentPassword(
                                  ""
                                );
                              }}
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p>{comment.content}</p>
                      )}
                    </div>
                  ))
                )}

                {/* 댓글 등록 */}
                <div className="community-comment-form">
                  <div className="community-form-grid">
                    <input
                      type="text"
                      placeholder="작성자"
                      value={commentAuthor}
                      maxLength={20}
                      onChange={(event) =>
                        setCommentAuthor(
                          event.target.value
                        )
                      }
                    />

                    <input
                      type="password"
                      placeholder="비밀번호 (8자 이상)"
                      value={commentPassword}
                      minLength={8}
                      maxLength={128}
                      onChange={(event) =>
                        setCommentPassword(
                          event.target.value
                        )
                      }
                    />
                  </div>

                  <textarea
                    placeholder="댓글을 입력해주세요."
                    value={commentContent}
                    maxLength={2000}
                    rows={4}
                    onChange={(event) =>
                      setCommentContent(
                        event.target.value
                      )
                    }
                  />

                  <button
                    type="button"
                    className="community-primary-btn"
                    disabled={
                      busy || detailLoading
                    }
                    onClick={() =>
                      void handleCommentSubmit()
                    }
                  >
                    {busy
                      ? "처리 중..."
                      : "댓글 등록"}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* 삭제 비밀번호 입력창 */}
          {deleteTarget && (
            <div
              className="community-delete-overlay"
              role="presentation"
              onClick={() => {
                if (!busy) {
                  setDeleteTarget(null);
                  setDeletePassword("");
                }
              }}
            >
              <div
                className="community-delete-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="community-delete-title"
                onClick={(event) =>
                  event.stopPropagation()
                }
              >
                <h3 id="community-delete-title">
                  {deleteTarget.type === "post"
                    ? "게시글 삭제"
                    : "댓글 삭제"}
                </h3>

                <p>
                  작성 당시 설정한 비밀번호를
                  입력해주세요. 삭제한 내용은
                  복구할 수 없습니다.
                </p>

                <form onSubmit={handleDelete}>
                  <input
                    type="password"
                    placeholder="비밀번호 (8자 이상)"
                    value={deletePassword}
                    minLength={8}
                    maxLength={128}
                    autoFocus
                    required
                    onChange={(event) =>
                      setDeletePassword(
                        event.target.value
                      )
                    }
                  />

                  <div className="community-delete-modal-actions">
                    <button
                      type="button"
                      className="community-secondary-btn"
                      disabled={busy}
                      onClick={() => {
                        setDeleteTarget(null);
                        setDeletePassword("");
                      }}
                    >
                      취소
                    </button>

                    <button
                      type="submit"
                      className="community-delete-confirm-btn"
                      disabled={busy}
                    >
                      {busy
                        ? "삭제 중..."
                        : "삭제하기"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default Community;
