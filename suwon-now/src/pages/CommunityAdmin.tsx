
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import "./CommunityAdmin.css";

type Post = {
  id: number;
  category: string;
  title: string;
  author: string;
  content: string;
  view_count: number;
  created_at: string;
  is_hidden: boolean;
};

type Comment = {
  id: number;
  post_id: number;
  author: string;
  content: string;
  created_at: string;
  is_hidden: boolean;
};

type AdminResult = {
  success?: boolean;
  error?: string;
  posts?: Post[];
  comments?: Comment[];
};

type Target = "post" | "comment";
type Filter = "all" | "visible" | "hidden";
type Tab = "post" | "comment";

const categoryNames: Record<string, string> = {
  food: "맛집 추천",
  together: "동행 모집",
  free: "자유게시판",
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

async function callAdminFunction(
  body: Record<string, unknown>
): Promise<AdminResult> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("관리자 로그인이 필요합니다.");
  }

  const { data, error } =
    await supabase.functions.invoke<AdminResult>(
      "community-admin",
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body,
      }
    );

  if (error) {
    if ("context" in error && error.context instanceof Response) {
      try {
        const result = await error.context.clone().json();
        if (result?.error) {
          throw new Error(result.error);
        }
      } catch (parseError) {
        if (parseError instanceof Error &&
            parseError.message !== "Unexpected end of JSON input") {
          throw parseError;
        }
      }
    }
    throw new Error(error.message);
  }

  if (!data?.success) {
    throw new Error(data?.error ?? "요청에 실패했습니다.");
  }

  return data;
}

export default function CommunityAdmin() {
  const [tab, setTab] = useState<Tab>("post");
  const [filter, setFilter] = useState<Filter>("all");
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await callAdminFunction({
        action: "list",
      });

      setPosts(result.posts ?? []);
      setComments(result.comments ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "목록을 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleAction = async (
    target: Target,
    id: number,
    action: "hide" | "show" | "delete"
  ) => {
    if (busyKey) return;

    if (action === "delete") {
      const ok = window.confirm(
        "정말 영구 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다."
      );
      if (!ok) return;
    }

    const key = `${target}-${id}`;
    setBusyKey(key);

    try {
      await callAdminFunction({
        action,
        target,
        id,
      });

      await loadData();
    } catch (err) {
      window.alert(
        err instanceof Error
          ? err.message
          : "작업에 실패했습니다."
      );
    } finally {
      setBusyKey("");
    }
  };

  const visiblePosts = posts.filter((post) => {
    if (filter === "visible") return !post.is_hidden;
    if (filter === "hidden") return post.is_hidden;
    return true;
  });

  const visibleComments = comments.filter((comment) => {
    if (filter === "visible") return !comment.is_hidden;
    if (filter === "hidden") return comment.is_hidden;
    return true;
  });

  const hiddenCount =
    posts.filter((post) => post.is_hidden).length +
    comments.filter((comment) => comment.is_hidden).length;

  return (
    <section className="community-admin">
      <div className="ca-heading">
        <div>
          <h2>게시판 관리</h2>
          <p>게시글과 댓글을 관리할 수 있습니다.</p>
        </div>

        <button
          type="button"
          className="ca-refresh"
          onClick={() => void loadData()}
          disabled={loading || !!busyKey}
        >
          새로고침
        </button>
      </div>

      <div className="ca-stats">
        <div>
          <strong>{posts.length}</strong>
          <span>전체 게시글</span>
        </div>
        <div>
          <strong>{comments.length}</strong>
          <span>전체 댓글</span>
        </div>
        <div>
          <strong>{hiddenCount}</strong>
          <span>숨김 처리</span>
        </div>
      </div>

      <div className="ca-toolbar">
        <div className="ca-tabs">
          <button
            className={tab === "post" ? "active" : ""}
            onClick={() => setTab("post")}
            type="button"
          >
            게시글 관리
          </button>
          <button
            className={tab === "comment" ? "active" : ""}
            onClick={() => setTab("comment")}
            type="button"
          >
            댓글 관리
          </button>
        </div>

        <div className="ca-filters">
          {(
            [
              ["all", "전체"],
              ["visible", "공개"],
              ["hidden", "숨김"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              className={filter === value ? "active" : ""}
              onClick={() => setFilter(value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="ca-error">{error}</p>}

      {loading ? (
        <p className="ca-empty">불러오는 중입니다...</p>
      ) : tab === "post" ? (
        visiblePosts.length === 0 ? (
          <p className="ca-empty">게시글이 없습니다.</p>
        ) : (
          <div className="ca-list">
            {visiblePosts.map((post) => (
              <article className="ca-item" key={post.id}>
                <div className="ca-item-main">
                  <div className="ca-item-title">
                    <strong>{post.title}</strong>
                    <span
                      className={
                        post.is_hidden
                          ? "ca-status hidden"
                          : "ca-status"
                      }
                    >
                      {post.is_hidden ? "숨김" : "공개"}
                    </span>
                  </div>

                  <div className="ca-meta">
                    {categoryNames[post.category] ??
                      post.category}
                    {" · "}
                    {post.author}
                    {" · "}
                    {formatDate(post.created_at)}
                    {" · 조회 "}
                    {post.view_count}
                  </div>

                  <p className="ca-content">
                    {post.content}
                  </p>
                </div>

                <div className="ca-actions">
                  <button
                    type="button"
                    disabled={!!busyKey || loading}
                    onClick={() =>
                      void handleAction(
                        "post",
                        post.id,
                        post.is_hidden ? "show" : "hide"
                      )
                    }
                  >
                    {post.is_hidden ? "복구" : "숨김"}
                  </button>
                  <button
                    type="button"
                    className="danger"
                    disabled={!!busyKey || loading}
                    onClick={() =>
                      void handleAction(
                        "post",
                        post.id,
                        "delete"
                      )
                    }
                  >
                    삭제
                  </button>
                </div>
              </article>
            ))}
          </div>
        )
      ) : visibleComments.length === 0 ? (
        <p className="ca-empty">댓글이 없습니다.</p>
      ) : (
        <div className="ca-list">
          {visibleComments.map((comment) => {
            const parent = posts.find(
              (post) => post.id === comment.post_id
            );

            return (
              <article
                className="ca-item"
                key={comment.id}
              >
                <div className="ca-item-main">
                  <div className="ca-item-title">
                    <strong>{comment.author}</strong>
                    <span
                      className={
                        comment.is_hidden
                          ? "ca-status hidden"
                          : "ca-status"
                      }
                    >
                      {comment.is_hidden ? "숨김" : "공개"}
                    </span>
                  </div>

                  <div className="ca-meta">
                    원글: {parent?.title ?? "삭제된 게시글"}
                    {" · "}
                    {formatDate(comment.created_at)}
                  </div>

                  <p className="ca-content">
                    {comment.content}
                  </p>
                </div>

                <div className="ca-actions">
                  <button
                    type="button"
                    disabled={!!busyKey || loading}
                    onClick={() =>
                      void handleAction(
                        "comment",
                        comment.id,
                        comment.is_hidden ? "show" : "hide"
                      )
                    }
                  >
                    {comment.is_hidden ? "복구" : "숨김"}
                  </button>
                  <button
                    type="button"
                    className="danger"
                    disabled={!!busyKey || loading}
                    onClick={() =>
                      void handleAction(
                        "comment",
                        comment.id,
                        "delete"
                      )
                    }
                  >
                    삭제
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
