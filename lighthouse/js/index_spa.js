AFRAME.registerComponent('auto-hide-overlay', {
    init: function() {
        // 모델 애니메이션 딜레이(4000ms)와 동일한 시점에 오버레이 제거
        setTimeout(() => {
            // A-Frame 씬에서 컴포넌트 기능 해제
            this.el.removeAttribute('coaching-overlay');
            
            // DOM에 남아있는 UI 요소 강제 숨김 처리 (사진에 찍히지 않도록)
            const overlayUI = document.getElementById('coachingOverlay') || document.querySelector('.coaching-overlay');
            if (overlayUI) {
                overlayUI.style.display = 'none';
            }
        }, 4000); 
    }
});

document.addEventListener('DOMContentLoaded', () => {
  const captureBtn = document.querySelector('xrextras-capture-button');
  
  if (captureBtn && captureBtn.shadowRoot) {
    const style = document.createElement('style');
    style.textContent = `
      :host {
        bottom: 120px !important;
      }
    `;
    captureBtn.shadowRoot.appendChild(style);
  }
});

// 1. 전역 변수 선언 (naverMap, map 혼용을 map 하나로 통일)
let map = null;
let myLocationMarker = null;
let isMapZoomedIn = false;
const initialCenter = new naver.maps.LatLng(36.484881, 127.949252);
const initialZoom = 7;
const photoauthSceneTemplate = `
<a-scene auto-hide-overlay responsive-immersive coaching-overlay landing-page xrextras-gesture-detector xrextras-loading hide-guide-on-start
                xrextras-runtime-error gltf-model="dracoDecoderPath: https://cdn.8thwall.com/web/aframe/draco-decoder/"
                renderer="colorManagement: true" xrweb="allowedDevices: any; defaultEnvironmentFogIntensity: 0.5; defaultEnvironmentFloorTexture: #groundTex; defaultEnvironmentFloorColor: #FFF; defaultEnvironmentSkyBottomColor: #B4C4CC; defaultEnvironmentSkyTopColor: #5ac8fa; defaultEnvironmentSkyGradientStrength: 0.5; scale: absolute">

                <a-assets>
                    <a-asset-item id="LumiModel" src="./models/lumi-photo-ani.glb"></a-asset-item>
                    <a-asset-item id="vfx" src="./models/appear-effect.glb"></a-asset-item>
                    <img id="groundTex" src="./models/textures/concrete.jpg">
                </a-assets>

                <xrextras-capture-button capture-mode="photo"></xrextras-capture-button>
                <xrextras-capture-config file-name-prefix="my-photo-" request-mic="manual"></xrextras-capture-config>

                <a-camera id="camera" position="0 1.75 12" raycaster="objects: .cantap"
                    cursor="fuse: false; rayOrigin: mouse;">
                </a-camera>

                <a-entity xr-light light="type: directional; castShadow: true; shadowMapHeight:2048; shadowMapWidth:2048; shadowCameraTop: 20; shadowCameraBottom: -20; shadowCameraLeft: -20; shadowCameraRight: 20; target: #car; shadowRadius: 3" 
                          xrextras-attach="target: car; offset: 0 15 0;" shadow>
                </a-entity>

                <a-light xr-light="max: 0.5" type="ambient">
                </a-light>

                <a-entity id="car" gltf-model="#LumiModel" rotation="0 0 0" scale="2 2 2"
                    xrextras-hold-drag="rise-height: 0" xrextras-two-finger-rotate absolute-pinch-scale proximity
                    animation="property: position; from: 0 -10 0; to: 0 0 0; dir: linear; delay: 4000; dur: 8000; loop: false"
                    animation__1="property: scale; from: 0 0 0; to: 2 2 2; dir: linear; delay: 4000; dur: 8000; loop: false"
                    animation-mixer shadow="receive: false">
                    <a-entity id="car" gltf-model="#vfx" rotation="0 0 0" scale="2 2 2"
                        xrextras-hold-drag="rise-height: 0" xrextras-two-finger-rotate absolute-pinch-scale proximity
                        animation="property: scale; from: 2 2 2; to: 0 0 0; dir: linear; delay: 16000; dur: 1000; loop: false"
                        animation-mixer>
                    </a-entity>
                </a-entity>

                <a-plane id="ground" rotation="-90 0 0" width="100" height="100"
                    material="shader: shadow; opacity: 0.5;" shadow></a-plane>

            </a-scene>
        `;

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

  const arVideo = document.getElementById("arjs-video");
  const targets = ["arnavi", "photoauth"];
  const photoContainer = document.getElementById("photoauth-ar-container");

  if (targets.includes(pageId)) {
    document.body.classList.add("ar-mode"); // Flex 끄기 & 투명 배경

    if (pageId === "photoauth" && photoContainer) {
      if (!photoContainer.innerHTML.trim()) {
        photoContainer.innerHTML = photoauthSceneTemplate;
      }
    }

    const arVideo = document.getElementById("arjs-video");
    if (arVideo) arVideo.style.display = "block";
  } else {
    document.body.classList.remove("ar-mode"); // 원래 블루 배경 & Flex 복구
    if (photoContainer) {
      photoContainer.innerHTML = "";
    }
    const arVideo = document.getElementById("arjs-video");
    if (arVideo) arVideo.style.display = "none";
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

function openModal() {
  document.getElementById("infoModal").style.display = "flex";
}
function closeModal() {
  document.getElementById("infoModal").style.display = "none";
}
function emptyopenModal() {
  document.getElementById("empty-infoModal").style.display = "flex";
}
function emptycloseModal() {
  document.getElementById("empty-infoModal").style.display = "none";
}

// ==========================================
// [스와이프 및 클릭 페이지 전환 로직]
// ==========================================

let touchstartX = 0;
let touchendX = 0;

// 현재 활성화된 페이지에 따라 이전/다음 페이지 ID를 반환하는 함수
function getPassportPagination() {
  const activePage = document.querySelector(".page.active");
  if (!activePage) return { prev: null, next: null };

  const pageId = activePage.id;

  switch (pageId) {
    case "page-passport":
      return { prev: null, next: "passport-sub" };
    case "page-passport-sub":
      return { prev: "passport", next: "passport-empty" };
    case "page-passport-empty":
      return { prev: "passport-sub", next: null };
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

//AR Navi
// 1. 등대 데이터
const lighthouses = [
  { title: "간절곶등대", lat: 35.359, lng: 129.3606 },
  { title: "영도등대", lat: 35.0523, lng: 129.0921 },
  { title: "산지등대", lat: 33.5214, lng: 126.5456 },
  { title: "소매물도등대", lat: 34.6196, lng: 128.5479 },
  { title: "오동도등대", lat: 34.7442, lng: 127.7677 },
  { title: "등대", lat: 37.4891, lng: 126.9569 }, //test용
  // 필요에 따라 추가
];

let targetLighthouse = null;
let minimap = null;
let myLocMarker, targetMarker;
let watchId;

// 시작 버튼 클릭 시 실행
async function startNavigation() {
  // 1. [iOS 13+ 전용] 기기 방향(나침반/자이로스코프) 권한 명시적 요청
  if (
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof DeviceOrientationEvent.requestPermission === "function"
  ) {
    try {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission !== "granted") {
        alert("AR 길안내를 위해 기기 방향 센서 권한이 필요합니다.");
        // 권한 거부 시에도 지도는 작동해야 하므로 계속 진행
      }
    } catch (error) {
      console.error("방향 센서 권한 요청 에러:", error);
    }
  }

  // 2. 시작 화면 숨기고 UI 표시
  document.getElementById("start_area").style.display = "none";
  document.getElementById("minimap-wrapper").style.display = "block";
  document.getElementById("info-panel").style.display = "block";
  document.body.classList.add("ar-mode");

  const themeMeta = document.getElementById("theme-color-meta");
  if (themeMeta) {
    const isDarkMode =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const originalColor = isDarkMode ? "#000000" : "#f1f3f4";
    themeMeta.setAttribute("content", originalColor);
  }
  // 3. 버튼을 누른 직후에 AR 씬(카메라+GPS)을 동적으로 삽입 (권한 요청 팝업 발생 지점)
  const arContainer = document.getElementById("ar-container");
  arContainer.innerHTML = `
                <a-scene embedded id="ar-scene" 
                              vr-mode-ui="enabled: false" 
                              device-orientation-permission-ui="enabled: false"
                              arjs="sourceType: webcam; videoTexture: true; debugUIEnabled: false;" 
                              renderer="antialias: true; alpha: true">
                    <a-entity light="type: ambient; intensity: 1.5;"></a-entity>
                    <a-entity id="m1" scale="1 1 1" visible="false" gltf-model="url(./models/lighthouse.glb)" animation-mixer="loop: true"></a-entity>      
                    <a-camera id="camera" look-controls-enabled="false" arjs-look-controls="smoothingFactor: 0.1" gps-projected-camera="maxDistance: 700"> 
                        <a-entity id="m0" position="0 -1.1 -1.5" scale="0.3 0.3 0.3" gltf-model="url(./models/lumi-light-ani.glb)" animation-mixer="loop: true"></a-entity> 
                        <a-entity id="cylinderGroup" position="0 -1.7 -2.5"></a-entity>
                    </a-camera>
                    <a-entity run></a-entity>
                </a-scene>
            `;

  // 4. 미니맵 및 위치 추적 실행
  initMap();
  startTracking();
}

// 네이버 미니맵 초기화
function initMap() {
  minimap = new naver.maps.Map("minimap", {
    center: new naver.maps.LatLng(37.5666, 126.9784),
    zoom: 17, // 최대 줌인
    disableKinematicPan: true,
    mapDataControl: false,
    scaleControl: false,
    logoControl: false,
    zoomControl: false,
    draggable: false,
  });
}

// 실시간 위치 추적 및 로직 처리
function startTracking() {
  if (navigator.geolocation) {
    watchId = navigator.geolocation.watchPosition(
      (position) =>
        processLocationUpdate(
          position.coords.latitude,
          position.coords.longitude,
        ),
      (error) => console.warn(error),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 },
    );
  } else {
    alert("GPS를 지원하지 않습니다.");
  }
}

function processLocationUpdate(lat, lng) {
  const currentLatLng = new naver.maps.LatLng(lat, lng);

  // 미니맵 업데이트: 중심 이동 및 내 마커 표시
  minimap.setCenter(currentLatLng);
  if (!myLocMarker) {
    myLocMarker = new naver.maps.Marker({
      position: currentLatLng,
      map: minimap,
      icon: {
        content:
          '<div style="width:16px;height:16px;background:red;border-radius:50%;border:2px solid white;"></div>',
      },
    });
  } else {
    myLocMarker.setPosition(currentLatLng);
  }

  // 최초 1회, 가장 가까운 등대 타겟팅 및 AR 목적지 세팅
  if (!targetLighthouse) {
    targetLighthouse = findNearestLighthouse(lat, lng);

    // AR 타겟 (m1) 위치 부여
    let m1 = document.getElementById("m1");
    m1.setAttribute(
      "gps-projected-entity-place",
      `latitude: ${targetLighthouse.lat}; longitude: ${targetLighthouse.lng};`,
    );
    m1.setAttribute("visible", "true");
  }

  // 거리 계산 및 UI/선 업데이트
  const targetLatLng = new naver.maps.LatLng(
    targetLighthouse.lat,
    targetLighthouse.lng,
  );
  const distance = Math.round(
    calculateDistance(lat, lng, targetLighthouse.lat, targetLighthouse.lng),
  );

  document.getElementById("distance-info").innerText =
    `${targetLighthouse.title}까지 ${distance}m`;

  // 미니맵 목적지 핀 및 점선 그리기
  if (!targetMarker) {
    targetMarker = new naver.maps.Marker({
      position: targetLatLng,
      map: minimap,
      icon: {
        content:
          '<div style="font-size:20px;"><img src="./img/lighthouse-i.png" style="width:40px;height:40px;"></div>',
      },
    });
  }

  // 도착 및 범위 이탈 체크 (기존 코드 기준치 반영)
  if (distance > 1000) {
    showAlert("거리가 너무 멀어요!<br>등대 근처에서 다시 시도해 주세요.");
    navigator.geolocation.clearWatch(watchId);
  } else if (distance < 10) {
    showAlert("축하합니다!<br>등대에 도착했습니다.");
    navigator.geolocation.clearWatch(watchId);
  }
}

// 가장 가까운 등대 찾기
function findNearestLighthouse(lat, lng) {
  let minDistance = Infinity;
  let nearest = lighthouses[0];
  lighthouses.forEach((lh) => {
    let dist = calculateDistance(lat, lng, lh.lat, lh.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = lh;
    }
  });
  return nearest;
}

// 알림 모달
function showAlert(msg) {
  document.getElementById("alert-msg").innerHTML = msg;
  document.getElementById("alert-modal").style.display = "flex";
}

function arnavicloseModal() {
  document.getElementById("alert-modal").style.display = "none";
}

//인증샷 촬영
document.addEventListener("DOMContentLoaded", () => {
  const scene = document.querySelector("a-scene");
  const uiLayer = document.getElementById("custom-ui-layer");

  // 미리보기 요소
  const previewScreen = document.getElementById("preview-screen");
  const previewImg = document.getElementById("preview-image");
  const previewVid = document.getElementById("preview-video");
  const captureTimeText = document.getElementById("capture-time");
  const btnSaveStamp = document.getElementById("btn-save-stamp");

  // 모달 요소
  const modalConfirm = document.getElementById("modal-confirm");
  const btnConfirmCancel = document.getElementById("btn-confirm-cancel");
  const btnConfirmSave = document.getElementById("btn-confirm-save");

  const modalShare = document.getElementById("modal-share");
  const btnPostReview = document.getElementById("btn-post-review");
  const btnPostShare = document.getElementById("btn-post-share");

  // 임시 저장용 데이터 변수
  let capturedDataUrl = null;
  let capturedFile = null;

  // --- [1] 사진/영상 촬영 완료 이벤트 감지 ---
  window.addEventListener("mediarecorder-photocomplete", (e) => {
    console.log("📸 photo 이벤트 발생!", e.detail);

    const reader = new FileReader();
    reader.onload = (ev) => {
      addTimestampToImage(ev.target.result, (composed) => {
        capturedDataUrl = composed;

        fetch(composed)
          .then((r) => r.blob())
          .then((blob) => {
            capturedFile = new File([blob], "lighthouse-stamp.jpg", {
              type: "image/jpeg",
            });
          });

        showPreview(composed, "photo");
      });
    };
    reader.readAsDataURL(e.detail.blob);
  });

  // ✅ 핵심 함수: Canvas로 시간 합성
  function addTimestampToImage(dataUrl, callback) {
    const img = new Image();

    img.onload = () => {
      // ===== 최종 출력 크기 =====
      const targetWidth = 1080;
      const targetHeight = 1350; // 4:5 비율

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext("2d");

      // ===== 중앙 크롭 계산 =====
      const targetRatio = targetWidth / targetHeight;
      const imageRatio = img.width / img.height;

      let sx, sy, sw, sh;

      if (imageRatio > targetRatio) {
        // 사진이 더 넓음
        sh = img.height;
        sw = sh * targetRatio;

        sx = (img.width - sw) / 2;
        sy = 0;
      } else {
        // 사진이 더 길쭉함
        sw = img.width;
        sh = sw / targetRatio;

        sx = 0;
        sy = (img.height - sh) * 0.35;
      }

      // ===== 중앙 크롭 후 1080x1350으로 그림 =====
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);

      // ===== 시간 스탬프 =====
      const now = new Date();

      const timeStr =
        `${now.getFullYear()}.` +
        `${String(now.getMonth() + 1).padStart(2, "0")}.` +
        `${String(now.getDate()).padStart(2, "0")} ` +
        `${String(now.getHours()).padStart(2, "0")}:` +
        `${String(now.getMinutes()).padStart(2, "0")}`;

      const lighthouseName =
        document.getElementById("lighthouse-name").innerText;

      const fontSize = 42;

      ctx.font = `bold ${fontSize}px Arial`;

      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = "white";

      // 등대명
      ctx.textAlign = "left";
      ctx.fillText(lighthouseName, 40, targetHeight - 50);

      // 시간
      ctx.textAlign = "right";
      ctx.fillText(timeStr, targetWidth - 40, targetHeight - 50);

      callback(canvas.toDataURL("image/jpeg", 0.92));
    };

    img.src = dataUrl;
  }

  function showPreview(mediaUrl, type) {
    uiLayer.classList.remove("hidden");
    previewScreen.classList.remove("hidden");

    document.querySelector(".info-overlay").classList.add("hidden");

    if (type === "photo") {
      previewImg.src = mediaUrl;
      previewImg.classList.remove("hidden");
      previewVid.classList.add("hidden");
    } else {
      previewVid.src = mediaUrl;
      previewVid.classList.remove("hidden");
      previewImg.classList.add("hidden");
      previewVid.play();
    }
  }

  // --- [2] 스탬프북 저장 (확인 모달 띄우기) ---
  btnSaveStamp.addEventListener("click", () => {
    modalConfirm.classList.remove("hidden");
  });

  // 저장 취소
  btnConfirmCancel.addEventListener("click", () => {
    modalConfirm.classList.add("hidden");
  });

  // DB 임시 저장 및 공유 모달 띄우기
  btnConfirmSave.addEventListener("click", () => {
    // TODO: 서버 API 통신 로직 추가 (여권번호, 등대위치, 촬영시간, 사진 데이터 전송)
    console.log("DB 저장 완료: 스탬프 획득 처리됨!");

    modalConfirm.classList.add("hidden");
    modalShare.classList.remove("hidden"); // 3번 프로세스로 넘어감
  });

  // --- [4] 사진후기 게시 버튼 로직 ---
  btnPostReview.addEventListener("click", () => {
    // TODO: 사용자 DB 정보에서 게시 flag = true 처리 로직
    console.log("게시 flag true 업데이트 완료 (game-process.html에 반영)");
    alert("사진 후기가 성공적으로 게시되었습니다.");
    resetUI();
  });

  // --- [5] 게시 후 SNS 공유 버튼 로직 ---
  btnPostShare.addEventListener("click", async () => {
    if (!capturedFile) {
      alert("사진 준비 중입니다. 잠시 후 다시 눌러주세요.");
      return;
    }

    if (navigator.canShare && navigator.canShare({ files: [capturedFile] })) {
      navigator
        .share({
          files: [capturedFile],
          title: "등대 스탬프 투어",
          text: "호미곶 등대에서 멋진 사진을 찍고 스탬프를 획득했어요!",
        })
        .then(() => {
          resetUI();
        })
        .catch((err) => {
          console.log("공유 취소 또는 실패", err);
          resetUI();
        });
    } else if (navigator.share) {
      navigator
        .share({
          title: "등대 스탬프 투어",
          text: "호미곶 등대에서 멋진 사진을 찍고 스탬프를 획득했어요!",
        })
        .then(() => resetUI())
        .catch(() => resetUI());
    } else {
      alert("해당 브라우저에서는 공유 기능을 지원하지 않습니다.");
      resetUI();
    }
  });

  // UI 초기화 및 AR 화면 복귀
  function resetUI() {
    uiLayer.classList.add("hidden");
    previewScreen.classList.add("hidden");
    modalConfirm.classList.add("hidden");
    modalShare.classList.add("hidden");
    previewImg.src = "";
    previewVid.src = "";
    capturedDataUrl = null;
    capturedFile = null;
  }

  window.resetUI = resetUI;
});

