
import { useEffect, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import { supabase } from "../lib/supabase";
import "leaflet/dist/leaflet.css";

// Leaflet 기본 마커 이미지 설정
const markerIcon = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type Category = "restaurant" | "cafe";

type Place = {
  id: number;
  stadium: string;
  name: string;
  category: Category;
  address: string;
  latitude: number;
  longitude: number;
  description: string | null;
  image_url: string | null;
  kakao_url: string | null;
  is_published: boolean;
};

type SearchResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

const STADIUMS = [
  {
    name: "수원월드컵경기장",
    lat: 37.2865,
    lng: 127.0369,
  },
  {
    name: "수원종합운동장",
    lat: 37.2997,
    lng: 127.0097,
  },
];

const fieldStyle: CSSProperties = {
  display: "grid",
  gap: 6,
  marginBottom: 15,
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "11px",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  boxSizing: "border-box",
  fontSize: 14,
};

const buttonStyle: CSSProperties = {
  padding: "11px 16px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "#fff",
  cursor: "pointer",
  fontSize: 14,
};

const primaryButton: CSSProperties = {
  ...buttonStyle,
  background: "#075ec5",
  borderColor: "#075ec5",
  color: "#fff",
};

const emptyForm = () => ({
  stadium: STADIUMS[0].name,
  name: "",
  category: "restaurant" as Category,
  address: "",
  latitude: "",
  longitude: "",
  description: "",
  kakao_url: "",
  is_published: true,
});

type FormData = ReturnType<typeof emptyForm>;

// 지도 중심 이동
function MapController({
  center,
  zoom,
}: {
  center: LatLngExpression;
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, zoom, {
      animate: true,
      duration: 0.7,
    });
  }, [map, center, zoom]);

  return null;
}

// 지도 클릭 시 좌표 선택
function MapClickHandler({
  onSelect,
}: {
  onSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event) {
      onSelect(
        event.latlng.lat,
        event.latlng.lng
      );
    },
  });

  return null;
}

export default function NearbyAdmin() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [form, setForm] = useState<FormData>(emptyForm);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [existingImage, setExistingImage] =
    useState<string | null>(null);

  const [imageFile, setImageFile] =
    useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // 주소 검색
  const [searchKeyword, setSearchKeyword] =
    useState("");

  const [searchResults, setSearchResults] =
    useState<SearchResult[]>([]);

  const [searching, setSearching] =
    useState(false);

  const [searchError, setSearchError] =
    useState("");

  // 지도 위치
  const [mapCenter, setMapCenter] =
    useState<[number, number]>([
      STADIUMS[0].lat,
      STADIUMS[0].lng,
    ]);

  const [mapZoom, setMapZoom] = useState(15);

  const selectedLat = Number(form.latitude);
  const selectedLng = Number(form.longitude);

  const hasSelectedLocation =
    form.latitude.trim() !== "" &&
    form.longitude.trim() !== "" &&
    Number.isFinite(selectedLat) &&
    Number.isFinite(selectedLng) &&
    selectedLat >= -90 &&
    selectedLat <= 90 &&
    selectedLng >= -180 &&
    selectedLng <= 180;

  // 등록된 장소 불러오기
  const loadPlaces = async () => {
    setLoading(true);

    const { data, error: fetchError } =
      await supabase
        .from("nearby_places")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

    if (fetchError) {
      setError(
        `목록 조회 실패: ${fetchError.message}`
      );
    } else {
      setPlaces((data ?? []) as Place[]);
      setError("");
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadPlaces();
  }, []);

  const change = <K extends keyof FormData>(
    key: K,
    value: FormData[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 좌표 선택
  const selectLocation = (
    lat: number,
    lng: number
  ) => {
    setForm((prev) => ({
      ...prev,
      latitude: lat.toFixed(7),
      longitude: lng.toFixed(7),
    }));

    setMapCenter([lat, lng]);
    setMapZoom(17);
  };

  // 경기장 변경
  const changeStadium = (name: string) => {
    change("stadium", name);

    const stadium = STADIUMS.find(
      (item) => item.name === name
    );

    if (stadium) {
      setMapCenter([
        stadium.lat,
        stadium.lng,
      ]);
      setMapZoom(15);
    }
  };

  // 주소 검색
  const searchAddress = async () => {
    const keyword = searchKeyword.trim();

    if (!keyword) {
      setSearchError(
        "검색할 주소나 가게 이름을 입력해주세요."
      );
      return;
    }

    setSearching(true);
    setSearchError("");
    setSearchResults([]);

    try {
      const params = new URLSearchParams({
        q: keyword,
        format: "json",
        addressdetails: "1",
        limit: "5",
        countrycodes: "kr",
        "accept-language": "ko",
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `주소 검색 요청 실패 (${response.status})`
        );
      }

      const results =
        (await response.json()) as SearchResult[];

      setSearchResults(results);

      if (results.length === 0) {
        setSearchError(
          "검색 결과가 없습니다. 도로명주소로 다시 검색하거나 지도에서 직접 위치를 선택해주세요."
        );
      }
    } catch (caught) {
      setSearchError(
        caught instanceof Error
          ? caught.message
          : "주소 검색 중 오류가 발생했습니다."
      );
    } finally {
      setSearching(false);
    }
  };

  // 검색 결과 선택
  const selectSearchResult = (
    result: SearchResult
  ) => {
    const lat = Number(result.lat);
    const lng = Number(result.lon);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      setSearchError(
        "검색 결과의 위치를 확인할 수 없습니다."
      );
      return;
    }

    setForm((prev) => ({
      ...prev,
      address: result.display_name,
      latitude: lat.toFixed(7),
      longitude: lng.toFixed(7),
    }));

    setSearchKeyword(result.display_name);
    setSearchResults([]);
    setSearchError("");

    setMapCenter([lat, lng]);
    setMapZoom(17);
  };

  // 입력 초기화
  const reset = () => {
    setForm(emptyForm());
    setEditingId(null);
    setExistingImage(null);
    setImageFile(null);
    setMessage("");
    setError("");
    setSearchKeyword("");
    setSearchResults([]);
    setSearchError("");

    setMapCenter([
      STADIUMS[0].lat,
      STADIUMS[0].lng,
    ]);
    setMapZoom(15);
  };

  // 장소 수정
  const edit = (place: Place) => {
    setEditingId(place.id);

    setForm({
      stadium: place.stadium,
      name: place.name,
      category: place.category,
      address: place.address,
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      description: place.description ?? "",
      kakao_url: place.kakao_url ?? "",
      is_published: place.is_published,
    });

    setExistingImage(place.image_url);
    setImageFile(null);

    setSearchKeyword(place.address);
    setSearchResults([]);
    setSearchError("");
    setMessage("");
    setError("");

    setMapCenter([
      place.latitude,
      place.longitude,
    ]);
    setMapZoom(17);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // 장소 등록 및 수정
  const save = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setMessage("");

    const lat = Number(form.latitude);
    const lng = Number(form.longitude);

    if (
      !form.name.trim() ||
      !form.address.trim() ||
      !hasSelectedLocation
    ) {
      setError(
        "가게 이름, 주소, 지도 위치를 모두 입력해주세요."
      );
      return;
    }

    if (
      form.kakao_url.trim() &&
      !/^https:\/\//i.test(
        form.kakao_url.trim()
      )
    ) {
      setError(
        "카카오맵 링크는 https:// 주소로 입력해주세요."
      );
      return;
    }

    if (
      imageFile &&
      (
        ![
          "image/jpeg",
          "image/png",
          "image/webp",
        ].includes(imageFile.type) ||
        imageFile.size > 5 * 1024 * 1024
      )
    ) {
      setError(
        "사진은 JPG·PNG·WebP 형식, 5MB 이하만 가능합니다."
      );
      return;
    }

    setSaving(true);

    let uploadedPath: string | null = null;

    try {
      let imageUrl = existingImage;

      // 사진 업로드
      if (imageFile) {
        const extension =
          imageFile.type === "image/png"
            ? "png"
            : imageFile.type === "image/webp"
              ? "webp"
              : "jpg";

        uploadedPath =
          `nearby/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } =
          await supabase.storage
            .from("place-images")
            .upload(uploadedPath, imageFile, {
              contentType: imageFile.type,
            });

        if (uploadError) {
          throw uploadError;
        }

        imageUrl = supabase.storage
          .from("place-images")
          .getPublicUrl(uploadedPath)
          .data.publicUrl;
      }

      const payload = {
        stadium: form.stadium,
        name: form.name.trim(),
        category: form.category,
        address: form.address.trim(),
        latitude: lat,
        longitude: lng,
        description:
          form.description.trim() || null,
        kakao_url:
          form.kakao_url.trim() || null,
        image_url: imageUrl,
        is_published: form.is_published,
      };

      const { error: saveError } =
        editingId === null
          ? await supabase
              .from("nearby_places")
              .insert(payload)
          : await supabase
              .from("nearby_places")
              .update(payload)
              .eq("id", editingId);

      if (saveError) {
        throw saveError;
      }

      await loadPlaces();
      reset();

      setMessage(
        editingId === null
          ? "장소가 등록되었습니다."
          : "장소가 수정되었습니다."
      );
   } catch (caught) {
  console.error("맛집 저장 오류:", caught);

  if (uploadedPath) {
    await supabase.storage
      .from("place-images")
      .remove([uploadedPath]);
  }

  const errorMessage =
    caught &&
    typeof caught === "object" &&
    "message" in caught
      ? String(caught.message)
      : JSON.stringify(caught);

  setError(`저장 실패: ${errorMessage}`);
} finally {
      setSaving(false);
    }
  };

  // 장소 삭제
  const remove = async (place: Place) => {
    if (
      !window.confirm(
        `'${place.name}' 장소를 삭제하시겠습니까?`
      )
    ) {
      return;
    }

    setError("");
    setMessage("");

    const { error: deleteError } =
      await supabase
        .from("nearby_places")
        .delete()
        .eq("id", place.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    if (editingId === place.id) {
      reset();
    }

    await loadPlaces();
    setMessage("장소를 삭제했습니다.");
  };

  return (
    <section
      style={{
        display: "grid",
        gap: 24,
      }}
    >
      {/* 장소 등록 폼 */}
      <form
        onSubmit={save}
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          padding: 22,
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          {editingId === null
            ? "맛집·카페 등록"
            : "맛집·카페 수정"}
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(230px, 1fr))",
            gap: "0 18px",
          }}
        >
          <label style={fieldStyle}>
            경기장
            <select
              style={inputStyle}
              value={form.stadium}
              onChange={(e) =>
                changeStadium(e.target.value)
              }
            >
              {STADIUMS.map((stadium) => (
                <option
                  key={stadium.name}
                  value={stadium.name}
                >
                  {stadium.name}
                </option>
              ))}
            </select>
          </label>

          <label style={fieldStyle}>
            구분
            <select
              style={inputStyle}
              value={form.category}
              onChange={(e) =>
                change(
                  "category",
                  e.target.value as Category
                )
              }
            >
              <option value="restaurant">
                맛집
              </option>
              <option value="cafe">
                카페
              </option>
            </select>
          </label>

          <label style={fieldStyle}>
            가게 이름 *
            <input
              style={inputStyle}
              value={form.name}
              onChange={(e) =>
                change("name", e.target.value)
              }
              placeholder="가게 이름"
              required
            />
          </label>

          <label style={fieldStyle}>
            주소 *
            <input
              style={inputStyle}
              value={form.address}
              onChange={(e) =>
                change("address", e.target.value)
              }
              placeholder="경기도 수원시 ..."
              required
            />
          </label>
        </div>

        {/* 주소 검색 */}
        <div
          style={{
            marginTop: 10,
            padding: 18,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
          }}
        >
          <h3 style={{ margin: "0 0 8px" }}>
            📍 위치 검색 및 선택
          </h3>

          <p
            style={{
              fontSize: 13,
              color: "#64748b",
              marginBottom: 15,
            }}
          >
            주소를 검색하거나 지도에서
            가게 위치를 직접 클릭해주세요.
          </p>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <input
              style={{
                ...inputStyle,
                flex: "1 1 220px",
                width: "auto",
              }}
              placeholder="도로명주소 또는 가게 이름"
              value={searchKeyword}
              onChange={(e) =>
                setSearchKeyword(
                  e.target.value
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void searchAddress();
                }
              }}
            />

            <button
              type="button"
              style={primaryButton}
              disabled={searching}
              onClick={() =>
                void searchAddress()
              }
            >
              {searching
                ? "검색 중..."
                : "주소 검색"}
            </button>
          </div>

          {searchError && (
            <p
              style={{
                color: "#dc2626",
                fontSize: 13,
              }}
            >
              {searchError}
            </p>
          )}

          {searchResults.length > 0 && (
            <div
              style={{
                marginTop: 12,
                border:
                  "1px solid #e2e8f0",
                borderRadius: 8,
                overflow: "hidden",
                background: "#fff",
              }}
            >
              {searchResults.map((result) => (
                <button
                  key={result.place_id}
                  type="button"
                  onClick={() =>
                    selectSearchResult(
                      result
                    )
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    padding: 12,
                    textAlign: "left",
                    background: "#fff",
                    border: "none",
                    borderBottom:
                      "1px solid #e2e8f0",
                    cursor: "pointer",
                    fontSize: 13,
                    lineHeight: 1.6,
                  }}
                >
                  📍 {result.display_name}
                </button>
              ))}
            </div>
          )}

          {/* 지도 */}
          <div
            style={{
              height: 350,
              marginTop: 16,
              borderRadius: 10,
              overflow: "hidden",
              border:
                "1px solid #e2e8f0",
              position: "relative",
              zIndex: 0,
            }}
          >
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{
                height: "100%",
                width: "100%",
              }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapController
                center={mapCenter}
                zoom={mapZoom}
              />

              <MapClickHandler
                onSelect={selectLocation}
              />

              {hasSelectedLocation && (
                <Marker
                  position={[
                    selectedLat,
                    selectedLng,
                  ]}
                  icon={markerIcon}
                  draggable
                  eventHandlers={{
                    dragend(event) {
                      const marker =
                        event.target as L.Marker;

                      const position =
                        marker.getLatLng();

                      selectLocation(
                        position.lat,
                        position.lng
                      );
                    },
                  }}
                />
              )}
            </MapContainer>
          </div>

          <p
            style={{
              fontSize: 12,
              color: "#64748b",
              marginTop: 10,
            }}
          >
            지도를 클릭하거나 마커를
            드래그해서 정확한 위치를
            지정할 수 있습니다.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
              marginTop: 15,
            }}
          >
            <label style={fieldStyle}>
              위도 *
              <input
                style={inputStyle}
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) =>
                  change(
                    "latitude",
                    e.target.value
                  )
                }
                placeholder="지도에서 선택"
                required
              />
            </label>

            <label style={fieldStyle}>
              경도 *
              <input
                style={inputStyle}
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) =>
                  change(
                    "longitude",
                    e.target.value
                  )
                }
                placeholder="지도에서 선택"
                required
              />
            </label>
          </div>

          {hasSelectedLocation && (
            <p
              style={{
                color: "#166534",
                fontSize: 13,
                margin: 0,
              }}
            >
              ✓ 지도 위치가 선택되었습니다.
            </p>
          )}
        </div>

        {/* 설명 */}
        <label
          style={{
            ...fieldStyle,
            marginTop: 22,
          }}
        >
          설명
          <textarea
            style={{
              ...inputStyle,
              minHeight: 95,
            }}
            value={form.description}
            onChange={(e) =>
              change(
                "description",
                e.target.value
              )
            }
            placeholder="추천 메뉴, 분위기, 특징 등"
          />
        </label>

        {/* 카카오맵 링크 */}
        <label style={fieldStyle}>
          카카오맵 링크 (선택)
          <input
            style={inputStyle}
            type="url"
            value={form.kakao_url}
            onChange={(e) =>
              change(
                "kakao_url",
                e.target.value
              )
            }
            placeholder="https://..."
          />
        </label>

        {/* 사진 */}
        <label style={fieldStyle}>
          대표 사진 (JPG·PNG·WebP, 최대 5MB)
          <input
            style={inputStyle}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) =>
              setImageFile(
                e.target.files?.[0] ??
                  null
              )
            }
          />
        </label>

        {existingImage && (
          <img
            src={existingImage}
            alt="현재 대표 사진"
            style={{
              width: 180,
              height: 120,
              objectFit: "cover",
              borderRadius: 8,
              marginBottom: 12,
            }}
          />
        )}

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 18,
          }}
        >
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) =>
              change(
                "is_published",
                e.target.checked
              )
            }
          />
          웹사이트에 공개하기
        </label>

        {error && (
          <p
            role="alert"
            style={{
              color: "#b91c1c",
            }}
          >
            {error}
          </p>
        )}

        {message && (
          <p
            role="status"
            style={{
              color: "#166534",
            }}
          >
            {message}
          </p>
        )}

        <div
          style={{
            display: "flex",
            gap: 10,
          }}
        >
          <button
            type="submit"
            disabled={saving}
            style={primaryButton}
          >
            {saving
              ? "저장 중..."
              : editingId === null
                ? "장소 등록"
                : "수정 완료"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              style={buttonStyle}
              onClick={reset}
            >
              수정 취소
            </button>
          )}
        </div>
      </form>

      {/* 등록된 장소 목록 */}
      <div
        style={{
          background: "#fff",
          border:
            "1px solid #e2e8f0",
          borderRadius: 14,
          padding: 22,
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          등록된 장소 ({places.length})
        </h2>

        {loading ? (
          <p>불러오는 중...</p>
        ) : places.length === 0 ? (
          <p>
            등록된 장소가 없습니다.
          </p>
        ) : (
          places.map((place) => (
            <div
              key={place.id}
              style={{
                display: "flex",
                gap: 14,
                alignItems: "center",
                padding: "14px 0",
                borderBottom:
                  "1px solid #e2e8f0",
                flexWrap: "wrap",
              }}
            >
              {place.image_url && (
                <img
                  src={place.image_url}
                  alt={place.name}
                  style={{
                    width: 85,
                    height: 65,
                    borderRadius: 8,
                    objectFit: "cover",
                  }}
                />
              )}

              <div
                style={{
                  flex: "1 1 180px",
                }}
              >
                <strong>
                  {place.name}
                </strong>

                <p
                  style={{
                    margin: "4px 0",
                    fontSize: 13,
                    color: "#64748b",
                  }}
                >
                  {place.stadium}
                  {" · "}
                  {place.category ===
                  "restaurant"
                    ? "맛집"
                    : "카페"}
                  {" · "}
                  {place.is_published
                    ? "공개"
                    : "비공개"}
                </p>

                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: "#64748b",
                  }}
                >
                  {place.address}
                </p>
              </div>

              <button
                type="button"
                style={buttonStyle}
                onClick={() =>
                  edit(place)
                }
              >
                수정
              </button>

              <button
                type="button"
                style={{
                  ...buttonStyle,
                  color: "#b91c1c",
                }}
                onClick={() =>
                  void remove(place)
                }
              >
                삭제
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
