import { createClient } from "@supabase/supabase-js";

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// 혹시 환경변수에 /rest/v1 등이 남아 있어도
// Supabase 프로젝트 기본 주소만 사용하도록 정리
const supabaseUrl = rawUrl
  .replace(/\/rest\/v1\/?$/, "")
  .replace(/\/$/, "");

console.log("원본 Supabase URL:", rawUrl);
console.log("사용 Supabase URL:", supabaseUrl);

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);