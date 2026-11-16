
import { useEffect, useState } from "react";
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

// Leaflet 기본 마커 아이콘 경로 설정
//delete (
  //L.Icon.Default.prototype as L.Icon.Default & {
    //_getIconUrl?: () => string;
  //}
//)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

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

const stadiumIcon = L.divIcon({
  className: "nearby-stadium-marker",
  html: `
    <div class="nearby-stadium-pin">🏟️</div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

function MapController({
  lat,
  lng,
  zoom = 15,
}: {
  lat: number;
  lng: number;
  zoom?: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([lat, lng], zoom, {
      duration: 0.8,
    });
  }, [map, lat, lng, zoom]);

  return null;
}

function NearbyPlaces() {
  const [selectedStadium, setSelectedStadium] =
    useState(stadiums[0]);

  const [category, setCategory] =
    useState<FilterCategory>("all");

  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] =
    useState<Place | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchPlaces = async () => {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("nearby_places")
        .select(
          "id, stadium, name, category, address, latitude, longitude, description, kakao_url, created_at"
        )
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        console.error("맛집 조회 오류:", error);
        setErrorMessage(
          "맛집 정보를 불러오지 못했습니다."
        );
        setPlaces([]);
      } else {
        setPlaces((data ?? []) as Place[]);
      }

      setLoading(false);
    };

    void fetchPlaces();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredPlaces = places.filter((place) => {
    const matchesStadium =
      place.stadium === selectedStadium.name;

    const matchesCategory =
      category === "all" || place.category === category;

    return matchesStadium && matchesCategory;
  });

  const mapCenter = selectedPlace
    ? {
        lat: selectedPlace.latitude,
        lng: selectedPlace.longitude,
      }
    : {
        lat: selectedStadium.lat,
        lng: selectedStadium.lng,
      };

  const selectStadium = (stadium: Stadium) => {
    setSelectedStadium(stadium);
    setSelectedPlace(null);
  };

  const openKakaoMap = (place: Place) => {
    if (place.kakao_url) {
      window.open(
        place.kakao_url,
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }

    const url =
      `https://map.kakao.com/link/to/` +
      `${encodeURIComponent(place.name)},` +
      `${place.latitude},${place.longitude}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <Header />

      <main className="nearby-page">
        <div className="nearby-container">
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
                  <span>📍</span>
                  <strong>등록된 장소가 없습니다.</strong>
                  <p>
                    추천 맛집과 카페가 등록되면
                    이곳에 표시됩니다.
                  </p>
                </div>
              ) : (
                filteredPlaces.map((place) => (
                  <button
                    type="button"
                    key={place.id}
                    className={`nearby-place-card ${
                      selectedPlace?.id === place.id
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedPlace(place)
                    }
                  >
                    <div className="nearby-place-top">
                      <span
                        className={`nearby-place-category ${place.category}`}
                      >
                        {place.category === "restaurant"
                          ? "맛집"
                          : "카페"}
                      </span>
                    </div>

                    <h3>{place.name}</h3>

                    <p className="nearby-place-address">
                      📍 {place.address}
                    </p>

                    {place.description && (
                      <p className="nearby-place-description">
                        {place.description}
                      </p>
                    )}

                    <span className="nearby-place-view">
                      지도에서 보기 →
                    </span>
                  </button>
                ))
              )}
            </div>

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
                  zoom={selectedPlace ? 17 : 15}
                />

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
                      click: () =>
                        setSelectedPlace(place),
                    }}
                  >
                    <Popup>
                      <div className="nearby-popup">
                        <strong>{place.name}</strong>

                        <p>{place.address}</p>

                        {place.description && (
                          <p>{place.description}</p>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            openKakaoMap(place)
                          }
                        >
                          카카오맵 길찾기 →
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              {selectedPlace && (
                <div className="nearby-selected-info">
                  <div>
                    <strong>
                      {selectedPlace.name}
                    </strong>
                    <p>{selectedPlace.address}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      openKakaoMap(selectedPlace)
                    }
                  >
                    길찾기 →
                  </button>
                </div>
              )}
            </div>
          </div>

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
