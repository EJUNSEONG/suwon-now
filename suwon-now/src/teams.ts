
export type Team = {
  name: string;
  logo: string;
  sport: "basketball" | "soccer" | "volleyball" | "baseball";
};

export const teams: Team[] = [
  // 농구 (10개)
  { name: "원주 DB 프로미", logo: "/logos/basketball-db-promy.png", sport: "basketball" },
  { name: "울산 현대모비스 피버스", logo: "/logos/basketball-hyundai-mobis.png", sport: "basketball" },
  { name: "안양 정관장 레드부스터스", logo: "/logos/basketball-jung-kwan-jang.png", sport: "basketball" },
  { name: "부산 KCC 이지스", logo: "/logos/basketball-kcc-egis.png", sport: "basketball" },
  { name: "수원 KT 소닉붐", logo: "/logos/basketball-kt-sonicboom.png", sport: "basketball" },
  { name: "창원 LG 세이커스", logo: "/logos/basketball-lg-sakers.png", sport: "basketball" },
  { name: "대구 한국가스공사 페가수스", logo: "/logos/basketball-pegasus.png", sport: "basketball" },
  { name: "서울 삼성 썬더스", logo: "/logos/basketball-samsung-thunders.png", sport: "basketball" },
  { name: "서울 SK 나이츠", logo: "/logos/basketball-sk-knights.png", sport: "basketball" },
  { name: "고양 소노 스카이거너스", logo: "/logos/basketball-sono-skygunners.png", sport: "basketball" },

  // 축구 K리그2 (17개)
  { name: "안산 그리너스", logo: "/logos/soccer-ansan-greeners.png", sport: "soccer" },
  { name: "부산 아이파크", logo: "/logos/soccer-busan-ipark.png", sport: "soccer" },
  { name: "천안 시티 FC", logo: "/logos/soccer-cheonan-city.png", sport: "soccer" },
  { name: "충북 청주 FC", logo: "/logos/soccer-chungbuk-cheongju.png", sport: "soccer" },
  { name: "충남 아산 FC", logo: "/logos/soccer-chungnam-asan.png", sport: "soccer" },
  { name: "대구 FC", logo: "/logos/soccer-daegu-fc.png", sport: "soccer" },
  { name: "김해 FC", logo: "/logos/soccer-gimhae-fc.png", sport: "soccer" },
  { name: "김포 FC", logo: "/logos/soccer-gimpo-fc.png", sport: "soccer" },
  { name: "경남 FC", logo: "/logos/soccer-gyeongnam-fc.png", sport: "soccer" },
  { name: "화성 FC", logo: "/logos/soccer-hwaseong-fc.png", sport: "soccer" },
  { name: "전남 드래곤즈", logo: "/logos/soccer-jeonnam-dragons.png", sport: "soccer" },
  { name: "파주 프런티어 FC", logo: "/logos/soccer-paju-frontier.png", sport: "soccer" },
  { name: "성남 FC", logo: "/logos/soccer-seongnam-fc.png", sport: "soccer" },
  { name: "서울 이랜드 FC", logo: "/logos/soccer-seoul-eland.png", sport: "soccer" },
  { name: "수원 삼성 블루윙즈", logo: "/logos/soccer-suwon-bluewings.png", sport: "soccer" },
  { name: "수원 FC", logo: "/logos/soccer-suwon-fc.png", sport: "soccer" },
  { name: "용인 FC", logo: "/logos/soccer-yongin-fc.png", sport: "soccer" },

  // 배구 (14개)
  { name: "GS칼텍스 서울 KIXX", logo: "/logos/volleyball-gs-caltex.png", sport: "volleyball" },
  { name: "한국도로공사 하이패스", logo: "/logos/volleyball-hi-pass.png", sport: "volleyball" },
  { name: "현대건설 힐스테이트", logo: "/logos/volleyball-hillstate.png", sport: "volleyball" },
  { name: "현대캐피탈 스카이워커스", logo: "/logos/volleyball-hyundai-capital.png", sport: "volleyball" },
  { name: "IBK기업은행 알토스", logo: "/logos/volleyball-ibk-altos.png", sport: "volleyball" },
  { name: "KB손해보험 스타즈", logo: "/logos/volleyball-kb-stars-men.png", sport: "volleyball" },
  { name: "한국전력 빅스톰", logo: "/logos/volleyball-kepco.png", sport: "volleyball" },
  { name: "대한항공 점보스", logo: "/logos/volleyball-korean-air.png", sport: "volleyball" },
  { name: "OK저축은행", logo: "/logos/volleyball-okman.png", sport: "volleyball" },
  { name: "흥국생명 핑크스파이더스", logo: "/logos/volleyball-pink-spiders.png", sport: "volleyball" },
  { name: "정관장 레드스파크스", logo: "/logos/volleyball-red-sparks.png", sport: "volleyball" },
  { name: "삼성화재 블루팡스", logo: "/logos/volleyball-samsung-bluefangs.png", sport: "volleyball" },
  { name: "숲 수퍼스", logo: "/logos/volleyball-soop-supers.png", sport: "volleyball" },
  { name: "우리카드 우리WON", logo: "/logos/volleyball-woori-card.png", sport: "volleyball" },

    // ========================================
  // WK리그 여자축구
  // ========================================

  {
    sport: "wk-league",
    name: "경주한수원",
    logo: "/logos/soccer-wk-gyeongju.png",
  },
  {
    sport: "wk-league",
    name: "수원FC",
    logo: "/logos/soccer-wk-suwon.png",
  },
  {
    sport: "wk-league",
    name: "세종 스포츠토토",
    logo: "/logos/soccer-wk-sejong.png",
  },
  {
    sport: "wk-league",
    name: "인천현대제철",
    logo: "/logos/soccer-wk-incheon.png",
  },
  {
    sport: "wk-league",
    name: "문경상무",
    logo: "/logos/soccer-wk-mungyeong.png",
  },
  {
    sport: "wk-league",
    name: "강진 스완스 WFC",
    logo: "/logos/soccer-wk-gangjin.png",
  },
  {
    sport: "wk-league",
    name: "서울시청",
    logo: "/logos/soccer-wk-seoul.png",
  },
  {
    sport: "wk-league",
    name: "화천KSPO",
    logo: "/logos/soccer-wk-hwacheon.png",
  },

];

 
 

// 팀 이름으로 로고 찾기
export const getTeamLogo = (teamName: string): string => {
  return teams.find((team) => team.name === teamName)?.logo ?? "";
};
