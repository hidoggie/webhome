// 1. 전역 변수 선언 (naverMap, map 혼용을 map 하나로 통일)
let map = null;
let myLocationMarker = null;
let isMapZoomedIn = false;
const initialCenter = new naver.maps.LatLng(36.484881, 127.949252);
const initialZoom = 7;

// 10개 이벤트 지역 배열 (전역)
const eventLocations = [
  {
    title: "간절곶등대",
    lat: 35.359,
    lng: 129.3606,
    img: "img/ganjeolgot_icon_240.png",
    stamp: "img/stamp-ganjeolgot.png",
    desc: "한반도의 첫 해가 떠오르는 곳",
    audio: "audio/ganjeolgot.mp3",
    pimg: "img/p-ganjeolgot.png",
    addr: "울산광역시 울주군 서생면 간절곶1길 39-2",
  },
  {
    title: "영도등대",
    lat: 35.0523,
    lng: 129.0921,
    img: "img/youngdo_icon_240.png",
    stamp: "img/stamp-youngdo.png",
    desc: "바다를 디자인하다, 명승지 안의 명소",
    audio: "audio/youngdo.mp3",
    pimg: "img/p-youngdo.png",
    addr: "부산광역시 영도구 전망로 181",
  },
  {
    title: "산지등대",
    lat: 33.5214,
    lng: 126.5456,
    img: "img/sanji_icon_240.png",
    stamp: "img/stamp-sanji.png",
    desc: "해넘이 명소이자 제주항의 이정표",
    audio: "audio/sanji.mp3",
    pimg: "img/p-sanji.png",
    addr: "제주특별자치도 제주시 건입동 340-2",
  },
  {
    title: "소매물도등대",
    lat: 34.6196,
    lng: 128.5479,
    img: "img/somaemuldo_icon_240.png",
    stamp: "img/stamp-somaemuldo.png",
    desc: "닿기 힘들어 더 어여쁜 등대섬",
    audio: "audio/somaemuldo.mp3",
    pimg: "img/p-somaemuldo.png",
    addr: "경상남도 통영시 한산면 소매물도길 246",
  },
  {
    title: "오동도등대",
    lat: 34.7442,
    lng: 127.7677,
    img: "img/odongdo_icon_240.png",
    stamp: "img/stamp-odongdo.png",
    desc: "여수의 상징, 오동도 정상에 자리잡은 등대",
    audio: "audio/odongdo.mp3",
    pimg: "img/p-odongdo.png",
    addr: "전라남도 여수시 오동도로 238-32",
  },
  {
    title: "팔미도등대",
    lat: 37.3583,
    lng: 126.5106,
    img: "img/palmido_icon_240.png",
    stamp: "img/stamp-palmido.png",
    desc: "고단한 세월의 풍파를 견뎌온 최초의 등대",
    audio: "audio/palmido.mp3",
    pimg: "img/p-palmido.png",
    addr: "인천광역시 중구 팔미로 28",
  },
  {
    title: "묵호등대",
    lat: 37.554472,
    lng: 129.118555,
    img: "img/mukho_icon_240.png",
    stamp: "img/stamp-mukho.png",
    desc: "고즈넉한 등대오름길과 동해의 풍광을 담은 곳",
    audio: "audio/mukho.mp3",
    pimg: "img/p-mukho.png",
    addr: "강원특별자치도 동해시 해맞이길 289",
  },
  {
    title: "울기등대",
    lat: 35.4928,
    lng: 129.443,
    img: "img/ulgi_icon_240.png",
    stamp: "img/stamp-ulgi.png",
    desc: "동해안의 첫 등대",
    audio: "audio/ulgi.mp3",
    pimg: "img/p-ulgi.png",
    addr: "울산광역시 동구 등대로 155",
  },
  {
    title: "우도등대",
    lat: 33.4927,
    lng: 126.9658,
    img: "img/udo_icon_240.png",
    stamp: "img/stamp-udo.png",
    desc: "대한민국 최초의 등대테마공원",
    audio: "audio/udo.mp3",
    pimg: "img/p-udo.png",
    addr: "제주특별자치도 제주시 우도봉길 105",
  },
  {
    title: "속초등대",
    lat: 38.071536,
    lng: 128.615561,
    img: "img/sokcho_icon_240.png",
    stamp: "img/stamp-sokcho.png",
    desc: "등대 전망대에서 속초를 들여다보다",
    audio: "audio/sokcho.mp3",
    pimg: "img/p-sokcho.png",
    addr: "강원도 속초시 영금정로5길 8-28",
  },
];

// 2. 라우팅 (화면 전환) 함수
function routeTo(pageId) {
  const pages = document.querySelectorAll(".page");
  pages.forEach((page) => page.classList.remove("active"));

  const targetPage = document.getElementById(`page-${pageId}`);
  if (targetPage) {
    targetPage.classList.add("active");
  }

  const bottomNav = document.getElementById("global-bottom-nav");
  if (pageId === "intro") {
    bottomNav.style.display = "none";
  } else {
    bottomNav.style.display = "flex";
    // 하단 네비게이션 활성화 UI 업데이트
    document
      .querySelectorAll("#global-bottom-nav .nav-item")
      .forEach((item) => item.classList.remove("active"));
    if (pageId === "map")
      document
        .querySelectorAll("#global-bottom-nav .nav-item")[0]
        .classList.add("active");
    if (pageId === "mission")
      document
        .querySelectorAll("#global-bottom-nav .nav-item")[1]
        .classList.add("active");
    if (pageId === "passport")
      document
        .querySelectorAll("#global-bottom-nav .nav-item")[2]
        .classList.add("active");
  }

  const progressCard = document.getElementById("progress-card");
  if (progressCard && progressCard.classList.contains("expanded")) {
    progressCard.classList.remove("expanded");
  }

  // ★ 지도가 있는 화면이 열렸을 때 지도를 생성하거나 리사이즈
  if (pageId === "map") {
    setTimeout(() => {
      if (!map) {
        initNaverMap(); // 최초 생성
      } else {
        // 부모 컨테이너 크기 변경 감지 후 지도 리사이즈 강제 실행
        var mapElement = document.getElementById("map");
        if (
          mapElement &&
          mapElement.clientWidth > 0 &&
          mapElement.clientHeight > 0
        ) {
          map.setSize(
            new naver.maps.Size(
              mapElement.clientWidth,
              mapElement.clientHeight,
            ),
          );
        }
      }
    }, 300); // 렌더링 지연 시간을 살짝 늘려줌
  }
}

// 3. 지도 초기화 함수 (반드시 화면이 렌더링된 후 호출됨)
function initNaverMap() {
  var koreaBounds = new naver.maps.LatLngBounds(
    new naver.maps.LatLng(33.145182, 125.689334),
    new naver.maps.LatLng(38.31182, 130.256601),
  );

  map = new naver.maps.Map("map", {
    center: initialCenter,
    zoom: initialZoom,
    minZoom: 6,
    maxZoom: 7,
    maxBounds: koreaBounds,
    zoomControl: false,
    mapDataControl: false,
    scaleControl: false,
    disableTwoFingerTapZoom: true,
    tileTransition: false,
    gl: true,
    customStyleId: "c27f8c73-7e51-4eac-bb6a-c9d223b4ba20",
  });

  // 마커 생성
  eventLocations.forEach(function (loc) {
    var isCompleted = loc.title === "간절곶등대"; // 테스트용 조건
    var contentHtml = isCompleted
      ? `<div class="comp-pin" style="background-image: url('img/stamp-complete-red.png');"></div><div class="stamp-pin" style="background-image: url('${loc.img}');"></div>`
      : `<div class="stamp-pin" style="background-image: url('${loc.img}');"></div>`;

    var marker = new naver.maps.Marker({
      position: new naver.maps.LatLng(loc.lat, loc.lng),
      map: map,
      icon: {
        content: contentHtml,
        size: new naver.maps.Size(60, 60),
        anchor: new naver.maps.Point(30, 60),
      },
    });

    naver.maps.Event.addListener(marker, "click", function () {
      openPopup(loc);
    });
  });
}

// ---------------------------------------------------------
// 기존 함수들 (인트로 팝업, 하단 리스트 계산, 미션 탭 전환 등)
// ---------------------------------------------------------

// 미션 화면 내 탭 전환 로직 (미션/후기)
function switchTab(tabName, clickedBtn) {
  const tabContents = document.querySelectorAll("#page-mission .tab-content");
  tabContents.forEach((tab) => tab.classList.remove("active"));

  const navItems = document.querySelectorAll("#page-mission .top-item");
  navItems.forEach((item) => item.classList.remove("active"));

  document.getElementById(`tab-${tabName}`).classList.add("active");
  clickedBtn.classList.add("active");
}

// 거리 계산 및 하단 스탬프 리스트 그리기
function calculateDistance(lat1, lon1, lat2, lon2) {
  var R = 6371e3;
  var radLat1 = (lat1 * Math.PI) / 180;
  var radLat2 = (lat2 * Math.PI) / 180;
  var deltaLat = ((lat2 - lat1) * Math.PI) / 180;
  var deltaLon = ((lon2 - lon1) * Math.PI) / 180;
  var a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(radLat1) *
      Math.cos(radLat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function renderLighthouseList(userLat, userLng) {
  var listContainer = document.querySelector(".lighthouse-list");
  if (!listContainer) return;
  listContainer.innerHTML = "";

  var acquiredCount = 0;
  eventLocations.forEach(function (loc) {
    var isAcquired = loc.title === "간절곶등대";
    if (isAcquired) acquiredCount++;

    var distanceText = "위치 확인 필요";
    var rightSideHtml = "";

    if (userLat && userLng) {
      var distanceMeters = calculateDistance(
        userLat,
        userLng,
        loc.lat,
        loc.lng,
      );
      if (distanceMeters <= 1000) {
        distanceText = "여기에서 약 0km";
        if (!isAcquired)
          rightSideHtml = `<span class="stamp-zone-text">스탬프존 ${Math.round(distanceMeters)}m</span>`;
      } else {
        distanceText = `여기에서 약 ${Math.round(distanceMeters / 1000)}km`;
      }
    }

    if (isAcquired) rightSideHtml = `<span class="stamp-done-text">완료</span>`;
    var stampImgSrc = isAcquired ? loc.stamp : "img/stamp_off.png";
    var acquiredClass = isAcquired ? "acquired" : "";

    var li = document.createElement("li");
    li.className = `lh-item ${acquiredClass}`;
    li.style.cursor = "pointer";
    li.onclick = function () {
      routeTo("mission");
    };

    li.innerHTML = `
            <div class="lh-left">
                <img src="${stampImgSrc}" alt="스탬프" class="lh-stamp-img">
                <div class="lh-info"><div class="lh-name">${loc.title}</div><div class="lh-dist">${distanceText}</div></div>
            </div>
            <div class="lh-right">${rightSideHtml}</div>
        `;
    listContainer.appendChild(li);
  });
  updateProgressBar(acquiredCount, eventLocations.length);
}

function updateProgressBar(current, total) {
  document.getElementById("current-stamps").textContent = current;
  document.getElementById("total-stamps").textContent = total;
  var percentage = Math.max(0, Math.min((current / total) * 100, 100));
  document.getElementById("progress-fill").style.width = percentage + "%";
  document.getElementById("progress-thumb").style.left = percentage + "%";
}

// 페이지 로드 시 이벤트 바인딩
document.addEventListener("DOMContentLoaded", function () {
  renderLighthouseList(null, null);

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        renderLighthouseList(
          position.coords.latitude,
          position.coords.longitude,
        );
      },
      function (error) {
        console.log("초기 위치 권한 획득 실패 (무시 가능)");
      },
      { enableHighAccuracy: true, timeout: 5000 },
    );
  }

  var toggleHeader = document.getElementById("toggle-progress");
  var progressCard = document.getElementById("progress-card");
  if (toggleHeader && progressCard) {
    toggleHeader.addEventListener("click", function () {
      progressCard.classList.toggle("expanded");
    });
  }

  // 내 위치 버튼 이벤트 바인딩
  const btnLocation = document.getElementById("btn-location");
  if (btnLocation) {
    btnLocation.addEventListener("click", function () {
      if (!map) return;
      var btn = this;
      if (isMapZoomedIn) {
        map.setCenter(initialCenter);
        map.setZoom(initialZoom, true);
        btn.innerText = "🎯 내 위치 확인";
        isMapZoomedIn = false;
        return;
      }
      if (navigator.geolocation) {
        btn.innerText = "⏳ 위치 찾는 중...";
        navigator.geolocation.getCurrentPosition(
          function (position) {
            var newLatLng = new naver.maps.LatLng(
              position.coords.latitude,
              position.coords.longitude,
            );
            renderLighthouseList(
              position.coords.latitude,
              position.coords.longitude,
            );

            if (!myLocationMarker) {
              myLocationMarker = new naver.maps.Marker({
                position: newLatLng,
                map: map,
                icon: {
                  content:
                    '<div class="my-loc-pin"><img src="img/lh-man-map.png" style="width:40px;height:40px;"></div>',
                  size: new naver.maps.Size(20, 20),
                  anchor: new naver.maps.Point(10, 10),
                },
              });
            } else {
              myLocationMarker.setPosition(newLatLng);
            }
            map.setCenter(newLatLng);
            map.setZoom(8, true);
            btn.innerText = "🗺️ 전체 지도 보기";
            isMapZoomedIn = true;
          },
          function () {
            alert("위치 정보를 가져올 수 없습니다.");
            btn.innerText = "🎯 내 위치 확인";
          },
          { enableHighAccuracy: true, timeout: 5000 },
        );
      }
    });
  }
});

// 여권 팝업 및 기능
function generateMockPassportId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "LH-";
  for (let i = 0; i < 4; i++)
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  id += "-";
  for (let i = 0; i < 4; i++)
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  return id;
}
function openPassportModal() {
  document.getElementById("newPassportId").innerText = generateMockPassportId();
  document.getElementById("passportModal").style.display = "flex";
}
function closePassportModal() {
  document.getElementById("passportModal").style.display = "none";
}
function startNewJourney() {
  closePassportModal();
  routeTo("map");
}
function resumeJourney() {
  const val = document.getElementById("existingPassportId").value.trim();
  if (!val) {
    alert("여권 번호를 입력해주세요.");
    return;
  }
  alert("[" + val + "] 여권으로 이력을 불러옵니다!");
  routeTo("map");
}
function copyPassportId() {
  const idText = document.getElementById("newPassportId").innerText;
  navigator.clipboard
    .writeText(idText)
    .then(() => alert("복사되었습니다!"))
    .catch(() => alert("복사에 실패했습니다."));
}
function savePassportImage() {
  html2canvas(document.getElementById("captureArea"), {
    backgroundColor: "#ffffff",
    scale: 2,
  })
    .then((canvas) => {
      const downloadLink = document.createElement("a");
      downloadLink.href = canvas.toDataURL("image/png");
      downloadLink.download = "나의_등대_여권번호.png";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    })
    .catch((err) => alert("이미지 저장에 실패했습니다."));
}

// 팝업 및 앱링크 관련
let currentSelectedLoc = null;
let isPlaying = false;
const audio = document.getElementById("audioPlayer");
const audioBtn = document.getElementById("audioBtn");
function openPopup(loc) {
  currentSelectedLoc = loc;
  document.getElementById("lighthouseName").textContent = loc.title;
  document.getElementById("lighthouseDesc").textContent = loc.desc;
  document.getElementById("lighthouseImg").src = loc.pimg;
  document.getElementById("lighthouseAddr").textContent = loc.addr;
  document.getElementById("kakaoBtn").href =
    `https://map.kakao.com/link/to/${loc.title},${loc.lat},${loc.lng}`;
  document.getElementById("naverBtn").href =
    `https://map.naver.com/v5/directions/-/-/-/transit?c=${loc.lat},${loc.lng},15,0,0,0,dh`;
  document.getElementById("googleBtn").href =
    `http://googleusercontent.com/maps.google.com/maps?daddr=${loc.lat},${loc.lng}`;
  document.getElementById("tmapBtn").href =
    `tmap://route?goalx=${loc.lng}&goaly=${loc.lat}&goalname=${loc.title}`;
  document.getElementById("popupOverlay").style.display = "flex";
}
function closePopupOutside(e) {
  if (e.target === document.getElementById("popupOverlay")) {
    document.getElementById("popupOverlay").style.display = "none";
    if (isPlaying) toggleAudio();
  }
}
function toggleAudio() {
  if (!currentSelectedLoc || !currentSelectedLoc.audio) {
    alert("음성 파일이 준비 중입니다.");
    return;
  }
  if (!isPlaying) {
    document.getElementById("audioSource").src = currentSelectedLoc.audio;
    audio.load();
    audio.play();
    isPlaying = true;
    audioBtn.classList.add("playing");
  } else {
    audio.pause();
    audio.currentTime = 0;
    isPlaying = false;
    audioBtn.classList.remove("playing");
  }
}
if (audio)
  audio.addEventListener("ended", () => {
    isPlaying = false;
    if (audioBtn) audioBtn.classList.remove("playing");
  });
function openAppModal() {
  document.getElementById("appModal").classList.add("open");
}
function closeappModal() {
  document.getElementById("appModal").classList.remove("open");
  document.getElementById("missionModal").style.display = "none";
}
function closeModalOutside(e) {
  if (e.target === document.getElementById("appModal")) closeappModal();
}

// 스파클 애니메이션
setInterval(function () {
  const sky = document.querySelector(".sky");
  if (!sky || document.getElementById("page-intro").style.display === "none")
    return; // 인트로 화면일때만 생성
  const el = document.createElement("div");
  el.className = "sparkle";
  const size = Math.random() * 14 + 6;
  el.style.cssText = `width:${size}px; height:${size}px; left:${Math.random() * 90 + 5}%; top:${Math.random() * 60 + 5}%; animation-duration:${Math.random() * 0.8 + 0.6}s;`;
  el.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 10 10"><polygon points="5,0 6,4 10,5 6,6 5,10 4,6 0,5 4,4" fill="rgba(255,230,50,0.9)"/></svg>`;
  sky.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}, 600);

//game-process.html

// 모달창 제어 스크립트
const modal = document.getElementById("missionModal");
const modalTitle = document.getElementById("modalTitle");

function openModal(title) {
  modalTitle.innerText = title;
  modal.style.display = "flex";
}

function closeModal() {
  modal.style.display = "none";
}

window.onclick = function (event) {
  if (event.target == modal) {
    closeModal();
  }
};

// --- [네이버 지도용 전역 변수 설정 (미션 탭 전용)] ---
let smap = null;
const lighthouseCoords = { lat: 34.7442, lng: 127.7677 };

// 탭 전환 및 지도 호출 연동
function switchTab(tabName, clickedBtn) {
  const tabContents = document.querySelectorAll(".tab-content");
  tabContents.forEach((tab) => tab.classList.remove("active"));

  const navItems = document.querySelectorAll(".top-item");
  navItems.forEach((item) => item.classList.remove("active"));

  document.getElementById(`tab-${tabName}`).classList.add("active");
  clickedBtn.classList.add("active");

  // ★ 미션 탭의 '등대 위치(smap)' 클릭 시 전용 지도 호출
  if (tabName === "smap") {
    setTimeout(() => {
      initMissionMap(); // 이름이 변경된 함수 호출
    }, 100);
  }
}

// ★ 함수 이름 변경 (initNaverMap -> initMissionMap)
function initMissionMap() {
  if (smap) {
    window.dispatchEvent(new Event("resize"));
    smap.autoResize();
    return;
  }

  const lighthouseLatLng = new naver.maps.LatLng(
    lighthouseCoords.lat,
    lighthouseCoords.lng,
  );

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const userLatLng = new naver.maps.LatLng(userLat, userLng);

        // ★ 지도 생성 타겟을 'map'에서 'smap'으로 변경
        smap = new naver.maps.Map("smap", {
          center: lighthouseLatLng,
          zoom: 17,
          mapTypeId: naver.maps.MapTypeId.HYBRID,
        });

        new naver.maps.Marker({
          position: userLatLng,
          map: smap,
          icon: {
            content:
              '<div class="my-loc-pin"><img src="./img/lh-man-map.png" style="width:40px;height:40px;"></div>',
            size: new naver.maps.Size(20, 20),
            anchor: new naver.maps.Point(10, 10),
          },
          title: "현재 나의 위치",
        });

        new naver.maps.Marker({
          position: lighthouseLatLng,
          map: smap,
          title: "목표 등대 위치",
        });
      },
      function (error) {
        console.error(
          "위치 획득 실패, 기본 등대 위치 위주로 표시합니다.",
          error,
        );
        loadDefaultLighthouseMap(lighthouseLatLng);
      },
    );
  } else {
    loadDefaultLighthouseMap(lighthouseLatLng);
  }
}

// 위치 정보를 허용하지 않았을 때의 예외 처리 지도 로드
function loadDefaultLighthouseMap(lighthouseLatLng) {
  // ★ 지도 생성 타겟을 'map'에서 'smap'으로 변경
  smap = new naver.maps.Map("smap", {
    center: lighthouseLatLng,
    zoom: 17,
    mapTypeId: naver.maps.MapTypeId.HYBRID,
  });
  new naver.maps.Marker({
    position: lighthouseLatLng,
    map: smap,
    title: "목표 등대 위치",
  });
}


function openModal() { document.getElementById('infoModal').style.display = 'flex'; }
function closeModal() { document.getElementById('infoModal').style.display = 'none'; }

// ==========================================
// [스와이프 및 클릭 페이지 전환 로직]
// ==========================================

let touchstartX = 0;
let touchendX = 0;

// 현재 활성화된 페이지에 따라 이전/다음 페이지 ID를 반환하는 함수
function getPassportPagination() {
  const activePage = document.querySelector('.page.active');
  if (!activePage) return { prev: null, next: null };

  const pageId = activePage.id;

  switch (pageId) {
    case 'page-passport':
      return { prev: null, next: 'passport-sub' };
    case 'page-passport-sub':
      return { prev: 'passport', next: 'passport-empty' };
    case 'page-passport-empty':
      return { prev: 'passport-sub', next: null };
    default:
      // 여권 관련 페이지가 아닐 때는 스와이프 동작 안 함
      return { prev: null, next: null };
  }
}

// 제스처(스와이프) 핸들러
function handleGesture() {
  const { prev, next } = getPassportPagination();

  // 왼쪽으로 스와이프 (우측 화면을 당겨옴 -> 다음 페이지)
  if (touchendX < touchstartX - 50 && next) {
    routeTo(next);
  }
  // 오른쪽으로 스와이프 (좌측 화면을 당겨옴 -> 이전 페이지)
  if (touchendX > touchstartX + 50 && prev) {
    routeTo(prev);
  }
}

// [1] 모바일 터치 이벤트
document.addEventListener("touchstart", (e) => {
  touchstartX = e.changedTouches[0].screenX;
});
document.addEventListener("touchend", (e) => {
  touchendX = e.changedTouches[0].screenX;
  handleGesture();
});

// [2] PC 화면 좌/우 클릭 이벤트
document.addEventListener("click", (e) => {
  // 네비게이션이나 버튼, 모달창 등을 클릭했을 때는 페이지 넘어감 방지
  if (e.target.closest("a, button, [onclick], .modal-content")) return;

  const { prev, next } = getPassportPagination();
  
  // 이동할 이전/다음 페이지가 없거나, 여권 탭이 아니면 클릭 동작 무시
  if (!prev && !next) return;

  const screenWidth = window.innerWidth;
  const clickX = e.clientX;

  // 화면 우측 클릭 시 다음 페이지로
  if (clickX >= screenWidth / 2 && next) {
    routeTo(next); // SPA 방식에 맞게 routeTo 함수 사용
  }
  // 화면 좌측 클릭 시 이전 페이지로
  else if (clickX < screenWidth / 2 && prev) {
    routeTo(prev); // SPA 방식에 맞게 routeTo 함수 사용
  }
});