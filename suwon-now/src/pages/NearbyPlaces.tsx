
import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Header from "../components/Header";
import { supabase } from "../lib/supabase";
import "./NearbyPlaces.css";

type PlaceCategory = "restaurant" | "cafe";
type FilterCategory = "all" | PlaceCategory;

type Place = {
  id: number;
  stadium: string;
  name: string;
  category: PlaceCategory;
  address: string;
  latitude: number;
  longitude: number;
  description: string | null;
  image_url: string | null;
  kakao_url: string | null;
  created_at: string;
};

type Stadium = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

const stadiums: Stadium[] = [
  {
    id: "worldcup",
    name: "수원월드컵경기장",
    lat: 37.2865,
    lng: 127.0369,
  },
  {
    id: "sports-complex",
    name: "수원종합운동장",
    lat: 37.2997,
    lng: 127.0097,
  },
];

// Leaflet 기본 마커 설정
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// 맛집·카페 마커
function createPlaceIcon(category: PlaceCategory) {
  const color =
    category === "restaurant" ? "#f97316" : "#2563eb";

  const symbol =
    category === "restaurant" ? "🍴" : "☕";

  return L.divIcon({
    className: "nearby-custom-marker",
    html: `
      <div
        style="
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: ${color};
          border: 3px solid white;
          box-shadow: 0 3px 10px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        "
      >
        ${symbol}
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  });
}

const restaurantIcon = createPlaceIcon("restaurant");
const cafeIcon = createPlaceIcon("cafe");

// 경기장 마커
const stadiumIcon = L.divIcon({
  className: "nearby-stadium-marker",
  html: `<div class="nearby-stadium-pin">🏟️</div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

// 지도 중심 이동
function MapController({
  lat,
  lng,
  zoom,
  selectionKey,
}: {
  lat: number;
  lng: number;
  zoom: number;
  selectionKey: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([lat, lng], zoom, {
      duration: 0.8,
    });
  }, [map, lat, lng, zoom, selectionKey]);

  return null;
}

function NearbyPlaces() {
  // 경기장 선택
  const [selectedStadium, setSelectedStadium] =
    useState<Stadium>(stadiums[0]);

  // 카테고리 필터
  const [category, setCategory] =
    useState<FilterCategory>("all");

  // 검색
  const [searchQuery, setSearchQuery] = useState("");

  // 장소 목록
  const [places, setPlaces] = useState<Place[]>([]);

  // 선택한 장소
  const [selectedPlace, setSelectedPlace] =
    useState<Place | null>(null);

  // 같은 장소 재선택 시에도 지도 이동
  const [selectionKey, setSelectionKey] = useState(0);

  // 가게 소개 펼치기
  const [showPlaceInfo, setShowPlaceInfo] = useState(false);

  // 로딩 및 오류
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Supabase에서 장소 조회
  useEffect(() => {
    let cancelled = false;

    async function fetchPlaces() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("nearby_places")
        .select(
          "id, stadium, name, category, address, latitude, longitude, description, image_url, kakao_url, created_at"
        )
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        console.error("맛집 조회 오류:", error);
        setErrorMessage(
          `맛집 정보를 불러오지 못했습니다: ${error.message}`
        );
        setPlaces([]);
      } else {
        setPlaces((data ?? []) as Place[]);
      }

      setLoading(false);
    }

    void fetchPlaces();

    return () => {
      cancelled = true;
    };
  }, []);

  // 경기장·카테고리·검색어 필터
  const filteredPlaces = useMemo(() => {
    const keyword = searchQuery
      .trim()
      .toLocaleLowerCase();

    return places.filter((place) => {
      const matchesStadium =
        place.stadium === selectedStadium.name;

      const matchesCategory =
        category === "all" ||
        place.category === category;

      const matchesSearch =
        !keyword ||
        place.name
          .toLocaleLowerCase()
          .includes(keyword) ||
        place.address
          .toLocaleLowerCase()
          .includes(keyword);

      return (
        matchesStadium &&
        matchesCategory &&
        matchesSearch
      );
    });
  }, [places, selectedStadium, category, searchQuery]);

  // 필터 결과에 포함된 선택 장소만 표시
  const visibleSelectedPlace =
    filteredPlaces.find(
      (place) => place.id === selectedPlace?.id
    ) ?? null;

  // 지도 중심
  const mapCenter = visibleSelectedPlace
    ? {
        lat: visibleSelectedPlace.latitude,
        lng: visibleSelectedPlace.longitude,
      }
    : {
        lat: selectedStadium.lat,
        lng: selectedStadium.lng,
      };

  // 경기장 변경
  const selectStadium = (stadium: Stadium) => {
    setSelectedStadium(stadium);
    setSelectedPlace(null);
    setSearchQuery("");
    setShowPlaceInfo(false);
    setSelectionKey((prev) => prev + 1);
  };

  // 장소 선택
  const selectPlace = (place: Place) => {
    setSelectedPlace(place);
    setShowPlaceInfo(false);
    setSelectionKey((prev) => prev + 1);
  };

  // 외부 지도 앱 열기
  const openMapLink = (place: Place) => {
    let url = place.kakao_url?.trim();

    if (!url || !/^https?:\/\//i.test(url)) {
      url =
        `https://map.kakao.com/link/to/` +
        `${encodeURIComponent(place.name)},` +
        `${place.latitude},${place.longitude}`;
    }

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <>
      <Header />

      <main className="nearby-page">
        <div className="nearby-container">
          {/* 페이지 제목 */}
          <div className="nearby-heading">
            <span className="section-label">
              SUWON PLAY GUIDE
            </span>

            <h1>NEARBY PLACES</h1>

            <p>
              경기 전후에 방문하기 좋은 수원의
              맛집과 카페를 찾아보세요.
            </p>
          </div>

          {/* 경기장 선택 */}
          <div className="nearby-stadium-section">
            <h2>경기장 선택</h2>

            <div className="nearby-stadium-tabs">
              {stadiums.map((stadium) => (
                <button
                  key={stadium.id}
                  type="button"
                  className={
                    selectedStadium.id === stadium.id
                      ? "active"
                      : ""
                  }
                  onClick={() => selectStadium(stadium)}
                >
                  {stadium.name}
                </button>
              ))}
            </div>
          </div>

          {/* 검색창 */}
          <div className="nearby-search-section">
            <div className="nearby-search-box">
              <span
                className="nearby-search-icon"
                aria-hidden="true"
              >
                🔍
              </span>

              <input
                type="search"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                placeholder="가게 이름 또는 주소 검색"
                aria-label="맛집과 카페 검색"
              />

              {searchQuery && (
                <button
                  type="button"
                  className="nearby-search-clear"
                  onClick={() => setSearchQuery("")}
                  aria-label="검색어 지우기"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* 카테고리 필터 */}
          <div className="nearby-filter-bar">
            <div className="nearby-category-tabs">
              <button
                type="button"
                className={
                  category === "all" ? "active" : ""
                }
                onClick={() => setCategory("all")}
              >
                전체
              </button>

              <button
                type="button"
                className={
                  category === "restaurant"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setCategory("restaurant")
                }
              >
                🍴 맛집
              </button>

              <button
                type="button"
                className={
                  category === "cafe" ? "active" : ""
                }
                onClick={() => setCategory("cafe")}
              >
                ☕ 카페
              </button>
            </div>

            <span className="nearby-count">
              {filteredPlaces.length}개의 장소
            </span>
          </div>

          <div className="nearby-content">
            {/* 왼쪽: 장소 목록 */}
            <div className="nearby-list">
              <div className="nearby-list-heading">
                <h2>{selectedStadium.name}</h2>
                <p>주변 추천 장소</p>
              </div>

              {loading ? (
                <div className="nearby-empty">
                  장소를 불러오는 중입니다.
                </div>
              ) : errorMessage ? (
                <div className="nearby-empty">
                  {errorMessage}
                </div>
              ) : filteredPlaces.length === 0 ? (
                <div className="nearby-empty">
                  <span>🔍</span>

                  <strong>
                    {searchQuery.trim()
                      ? "검색 결과가 없습니다."
                      : "등록된 장소가 없습니다."}
                  </strong>

                  <p>
                    {searchQuery.trim()
                      ? "다른 가게 이름이나 주소로 검색해보세요."
                      : "추천 맛집과 카페가 등록되면 이곳에 표시됩니다."}
                  </p>
                </div>
              ) : (
                filteredPlaces.map((place) => (
                  <button
                    type="button"
                    key={place.id}
                    className={`nearby-place-card nearby-place-card-simple ${
                      visibleSelectedPlace?.id === place.id
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => selectPlace(place)}
                  >
                    {/* 가게 대표 사진 */}
                    <div className="nearby-place-photo">
                      {place.image_url ? (
                        <img
                          src={place.image_url}
                          alt={`${place.name} 대표 사진`}
                          loading="lazy"
                        />
                      ) : (
                        <div className="nearby-photo-empty">
                          <span>🍽️</span>
                          <small>사진 준비 중</small>
                        </div>
                      )}
                    </div>

                    {/* 가게 이름과 주소 */}
                    <div className="nearby-place-details">
                      <h3>{place.name}</h3>

                      <p className="nearby-place-address">
                        <span aria-hidden="true">
                          📍
                        </span>
                        {place.address}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* 오른쪽: 지도 */}
            <div className="nearby-map-section">
              <MapContainer
                center={[
                  selectedStadium.lat,
                  selectedStadium.lng,
                ]}
                zoom={15}
                scrollWheelZoom={false}
                className="nearby-map"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapController
                  lat={mapCenter.lat}
                  lng={mapCenter.lng}
                  zoom={visibleSelectedPlace ? 17 : 15}
                  selectionKey={selectionKey}
                />

                {/* 경기장 마커 */}
                <Marker
                  position={[
                    selectedStadium.lat,
                    selectedStadium.lng,
                  ]}
                  icon={stadiumIcon}
                >
                  <Popup>
                    <strong>
                      {selectedStadium.name}
                    </strong>
                  </Popup>
                </Marker>

                {/* 맛집·카페 마커 */}
                {filteredPlaces.map((place) => (
                  <Marker
                    key={place.id}
                    position={[
                      place.latitude,
                      place.longitude,
                    ]}
                    icon={
                      place.category === "restaurant"
                        ? restaurantIcon
                        : cafeIcon
                    }
                    eventHandlers={{
                      click: () => selectPlace(place),
                    }}
                  >
                    <Popup>
                      <div className="nearby-popup">
                        {place.image_url && (
                          <img
                            src={place.image_url}
                            alt={place.name}
                            className="nearby-popup-image"
                          />
                        )}

                        <strong>{place.name}</strong>

                        <p>{place.address}</p>

                        <button
                          type="button"
                          onClick={() =>
                            openMapLink(place)
                          }
                        >
                          지도 앱에서 보기 →
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              {/* 지도 아래 선택된 가게 정보 */}
              {visibleSelectedPlace && (
                <div className="nearby-selected-info nearby-info-panel">
                  <div className="nearby-info-main">
                    <strong>
                      {visibleSelectedPlace.name}
                    </strong>

                    <p>
                      {visibleSelectedPlace.address}
                    </p>

                    {/* 버튼 2개 */}
                    <div className="nearby-info-actions">
                      <button
                        type="button"
                        className="nearby-info-button"
                        onClick={() =>
                          setShowPlaceInfo((prev) => !prev)
                        }
                        aria-expanded={showPlaceInfo}
                      >
                        {showPlaceInfo
                          ? "가게 정보 접기"
                          : "가게 정보 보기"}
                      </button>

                      <button
                        type="button"
                        className="nearby-app-button"
                        onClick={() =>
                          openMapLink(visibleSelectedPlace)
                        }
                      >
                        지도 앱에서 보기 →
                      </button>
                    </div>

                    {/* 가게 소개 펼치기 */}
                    {showPlaceInfo && (
                      <div className="nearby-info-description">
                        {visibleSelectedPlace.description?.trim() ||
                          "등록된 가게 소개가 없습니다."}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 하단 안내 */}
          <p className="nearby-map-notice">
            지도 데이터 © OpenStreetMap contributors.
            장소 정보는 SUWON PLAY에서 직접 등록한
            내용을 기준으로 제공됩니다.
          </p>
        </div>
      </main>
    </>
  );
}

export default NearbyPlaces;
