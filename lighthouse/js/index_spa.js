// 1. 지도 객체를 담을 전역 변수를 하나 선언합니다.
let naverMap = null; 

// 2. 라우팅 함수
function routeTo(pageId) {
    // 모든 페이지 숨기고, 타겟 페이지만 보여주기 (기존 동일)
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));

    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // 네비게이션 제어 (기존 동일)
    const bottomNav = document.getElementById('global-bottom-nav');
    if (pageId === 'intro') {
        bottomNav.style.display = 'none';
    } else {
        bottomNav.style.display = 'flex';
    }

    // 🌟 3. 지도가 있는 페이지로 이동했을 때의 특별 처리 🌟
    if (pageId === 'map') {
        // 화면이 block으로 나타난 후 크기를 잡을 수 있도록 아주 약간(0.1초) 기다립니다.
        setTimeout(() => {
            if (!naverMap) {
                // 지도가 한 번도 생성된 적이 없다면 최초 생성
                initNaverMap(); 
            } else {
                // 이미 생성된 지도가 있다면, 화면 크기에 맞춰 사이즈만 강제 갱신
                window.dispatchEvent(new Event('resize')); 
            }
        }, 100); 
    }
}

// 4. 지도 초기화 함수 (기존 game-process.html에 있던 코드 응용)
function initNaverMap() {
    const lighthouseLatLng = new naver.maps.LatLng(34.7442, 127.7677); // 오동도 등대 좌표 예시

    // 지도 생성
    naverMap = new naver.maps.Map('map', {
        center: lighthouseLatLng,
        zoom: 17,
        mapTypeId: naver.maps.MapTypeId.HYBRID
    });

    // 마커 등 추가 로직...
    new naver.maps.Marker({
        position: lighthouseLatLng,
        map: naverMap,
        title: '목표 등대 위치'
    });
}

// 💡 2. 인트로 페이지 로직 (기존 index.html의 스크립트)
  // 반짝이 스파클 효과
  function createSparkle() {
    const el = document.createElement('div');
    el.className = 'sparkle';
    const size = Math.random() * 14 + 6;
    el.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*90+5}%; top:${Math.random()*60+5}%;
      animation-duration:${Math.random()*0.8+0.6}s;
    `;
    el.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 10 10">
      <polygon points="5,0 6,4 10,5 6,6 5,10 4,6 0,5 4,4"
               fill="rgba(255,230,50,0.9)"/>
    </svg>`;
    document.querySelector('.sky').appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }
  setInterval(createSparkle, 600);

  // ── 여권 팝업 관련 로직 ── //

  // 랜덤 여권 번호 생성기 (DB 연동 전 UI 테스트용)
  function generateMockPassportId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = 'LH-';
    for(let i=0; i<4; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
    id += '-';
    for(let i=0; i<4; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
    return id;
  }

function openPassportModal() {
//    document.getElementById('newPassportId').innerText = 'LH-1234-ABCD'; // 임시
    document.getElementById('newPassportId').innerText = generateMockPassportId();
    document.getElementById('passportModal').style.display = 'flex';
}

function startNewJourney() {
    // 기존의 window.location.href = 'lighthouse_map.html'; 대신 아래 라우팅 함수 사용
    closePassportModal();
    routeTo('map'); 
}

  function closePassportModal() {
    document.getElementById('passportModal').style.display = 'none';
  }

  // 번호 복사
  function copyPassportId() {
    const idText = document.getElementById('newPassportId').innerText;
    navigator.clipboard.writeText(idText).then(() => {
        alert('여권 번호 [' + idText + ']가 복사되었습니다!');
    }).catch(err => {
        alert('복사에 실패했습니다. 직접 메모해주세요.');
    });
  }

  // ── 여권 영역 이미지로 캡처하여 저장하기 ── //
  function savePassportImage() {
    const captureArea = document.getElementById('captureArea');
    
    // html2canvas 실행 (배경색 흰색 지정)
    html2canvas(captureArea, { backgroundColor: '#ffffff', scale: 2 }).then(canvas => {
      // 이미지 URL 변환
      const imageURL = canvas.toDataURL('image/png');
      
      // 가상 링크 생성 및 다운로드 트리거
      const downloadLink = document.createElement('a');
      downloadLink.href = imageURL;
      downloadLink.download = '나의_등대_여권번호.png'; // 저장될 파일 이름
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }).catch(err => {
      console.error('캡처 실패:', err);
      alert('이미지 저장에 실패했습니다. 화면을 직접 캡처해주세요.');
    });
  }

 
  // 이어하기 라우팅
  function resumeJourney() {
    const val = document.getElementById('existingPassportId').value.trim().toUpperCase();
    if(!val) {
        alert('발급받으셨던 여권 번호를 입력해주세요.');
        return;
    }
    
    // 향후 이곳에서 서버 API(/api/tour/login)를 호출하여 코드를 검증하고 세션을 교체합니다.
    alert('[' + val + '] 여권으로 이력을 불러옵니다!');
    routeTo('map'); 
  }

  // 배경 클릭 시 팝업 닫기 (선택 사항)
  window.onclick = function(event) {
    const modal = document.getElementById('passportModal');
    if (event.target == modal) {
      closePassportModal();
    }
  }


// 💡 3. 지도 및 미션 페이지 로직 (기존 스크립트들)
        // --- 1. 데이터 설정 (10개 이벤트 지역 배열) ---
   
     var eventLocations = [
            { title: "간절곶등대", lat: 35.3590, lng: 129.3606, img: "./img/ganjeolgot_icon_240.png", stamp: "./img/stamp-ganjeolgot.png", desc: "한반도의 첫 해가 떠오르는 곳", audio: "./audio/ganjeolgot.mp3", pimg: "./img/p-ganjeolgot.png", addr: "울산광역시 울주군 서생면 간절곶1길 39-2" },
            { title: "영도등대", lat: 35.0523, lng: 129.0921, img: "./img/youngdo_icon_240.png", stamp: "./img/stamp-youngdo.png", desc: "바다를 디자인하다, 명승지 안의 명소", audio: "./audio/youngdo.mp3", pimg: "./img/p-youngdo.png", addr: "부산광역시 영도구 전망로 181"  },
            { title: "산지등대", lat: 33.5214, lng: 126.5456, img: "./img/sanji_icon_240.png", stamp: "./img/stamp-sanji.png", desc: "해넘이 명소이자 제주항의 이정표", audio: "./audio/sanji.mp3", pimg: "./img/p-sanji.png", addr: "제주특별자치도 제주시 건입동 340-2"  },
            { title: "소매물도등대", lat: 34.6196, lng: 128.5479, img: "./img/somaemuldo_icon_240.png", stamp: "./img/stamp-somaemuldo.png", desc: "닿기 힘들어 더 어여쁜 등대섬", audio: "./audio/somaemuldo.mp3", pimg: "./img/p-somaemuldo.png", addr: "경상남도 통영시 한산면 소매물도길 246"  },
            { title: "오동도등대", lat: 34.7442, lng: 127.7677, img: "./img/odongdo_icon_240.png", stamp: "./img/stamp-odongdo.png", desc: "여수의 상징, 오동도 정상에 자리잡은 등대", audio: "./audio/odongdo.mp3", pimg: "./img/p-odongdo.png", addr: "전라남도 여수시 오동도로 238-32"  },
            { title: "팔미도등대", lat: 37.3583, lng: 126.5106, img: "./img/palmido_icon_240.png", stamp: "./img/stamp-palmido.png", desc: "고단한 세월의 풍파를 견뎌온 최초의 등대", audio: "./audio/palmido.mp3", pimg: "./img/p-palmido.png", addr: "인천광역시 중구 팔미로 28"  },
            { title: "묵호등대", lat: 37.554472, lng: 129.118555, img: "./img/mukho_icon_240.png", stamp: "./img/stamp-mukho.png", desc: "고즈넉한 등대오름길과 동해의 풍광을 담은 곳", audio: "./audio/mukho.mp3", pimg: "./img/p-mukho.png", addr: "강원특별자치도 동해시 해맞이길 289"  },
            { title: "울기등대", lat: 35.4928, lng: 129.4430, img: "./img/ulgi_icon_240.png", stamp: "./img/stamp-ulgi.png", desc: "동해안의 첫 등대", audio: "./audio/ulgi.mp3", pimg: "./img/p-ulgi.png", addr: "울산광역시 동구 등대로 155"  },
            { title: "우도등대", lat: 33.4927, lng: 126.9658, img: "./img/udo_icon_240.png", stamp: "./img/stamp-udo.png", desc: "대한민국 최초의 등대테마공원", audio: "./audio/udo.mp3", pimg: "./img/p-udo.png", addr: "제주특별자치도 제주시 우도봉길 105"  },
            { title: "속초등대", lat: 38.071536, lng: 128.615561, img: "./img/sokcho_icon_240.png", stamp: "./img/stamp-sokcho.png", desc: "등대 전망대에서 속초를 들여다보다", audio: "./audio/sokcho.mp3", pimg: "./img/p-sokcho.png", addr: "강원도 속초시 영금정로5길 8-28"  }
        ];

        // --- 2. 대한민국 영역 제한 설정 (북한 제외) ---
        // 남서쪽(마라도 부근)과 북동쪽(고성/울릉도 부근)의 좌표를 기준 상자로 설정합니다.
        var koreaBounds = new naver.maps.LatLngBounds(
            new naver.maps.LatLng(33.145182, 125.689334), // 남서쪽 (South-West)
            new naver.maps.LatLng(38.311820, 130.256601)  // 북동쪽 (North-East)
        );

        // --- 3. 지도 초기화 ---
        var map = new naver.maps.Map('map', {
            center: new naver.maps.LatLng(36.484881, 127.949252),  // 36.804326, 127.934921
            zoom: 7, 
            minZoom: 6, 
            maxZoom: 7, 
            maxBounds: koreaBounds, // ★ 지도 이동 제한 (대한민국 영역)
            
            zoomControl: false, 
            mapDataControl: false, 
            scaleControl: false, 
            disableTwoFingerTapZoom: true,
            tileTransition: false,

            gl: true, 
            customStyleId: 'c27f8c73-7e51-4eac-bb6a-c9d223b4ba20' 
        });

        // --- 4. 배열을 돌면서 10개의 마커 생성 ---
        eventLocations.forEach(function(loc) {
            if(loc.title == "간절곶등대") {   // test용
            var marker = new naver.maps.Marker({
                position: new naver.maps.LatLng(loc.lat, loc.lng),
                map: map,
                icon: {
                    // HTML 태그의 style에 배경 이미지를 동적으로 삽입합니다.
                    content: `<div class="comp-pin" style="background-image: url('./img/stamp-complete-red.png');"></div>
                                 <div class="stamp-pin" style="background-image: url('${loc.img}');"></div>`,
                    size: new naver.maps.Size(60, 60),
                    anchor: new naver.maps.Point(30, 60)
                }
            });

            }  else {
            var marker = new naver.maps.Marker({
                position: new naver.maps.LatLng(loc.lat, loc.lng),
                map: map,
                icon: {
                    // HTML 태그의 style에 배경 이미지를 동적으로 삽입합니다.
                    content: `<div class="stamp-pin" style="background-image: url('${loc.img}');"></div>`,
                    size: new naver.maps.Size(60, 60),
                    anchor: new naver.maps.Point(30, 60)
                }
            });
            }

           

            // 각 마커의 클릭 이벤트
            naver.maps.Event.addListener(marker, 'click', function() {
                openPopup(loc); // 팝업 열기 함수 호출
            });
        });

// --- 5. 내 위치 확인 기능 (토글 방식) ---
        var myLocationMarker = null; // 내 위치 핀을 저장할 변수
        var isMapZoomedIn = false;   // ★ 지도가 내 위치로 확대되었는지 상태를 저장하는 변수
        var initialCenter = new naver.maps.LatLng(36.484881, 127.949252); // ★ 초기 지도 중심 좌표
        var initialZoom = 7;         // ★ 초기 줌 레벨

        document.getElementById('btn-location').addEventListener('click', function() {
            var btn = this; // 현재 클릭된 버튼

            // 1. 이미 내 위치를 찾아서 지도가 확대된 상태라면 -> 초기 화면(전체 지도)으로 되돌리기
            if (isMapZoomedIn) {
                map.setCenter(initialCenter);
                map.setZoom(initialZoom, true); // true: 부드러운 애니메이션 효과
                btn.innerText = "🎯 내 위치 확인"; // 버튼 텍스트를 원래대로 복구
                isMapZoomedIn = false; // 상태 초기화
                return; // 아래의 위치 찾기 로직이 실행되지 않도록 여기서 함수 종료
            }

            // 2. 초기 상태라면 -> GPS로 내 위치 찾기 로직 실행
            if (navigator.geolocation) {
                btn.innerText = "⏳ 위치 찾는 중...";

                navigator.geolocation.getCurrentPosition(function(position) {
                    var lat = position.coords.latitude;
                    var lng = position.coords.longitude;
                    var newLatLng = new naver.maps.LatLng(lat, lng);

                    // 스탬프 리스트 거리 재계산
                    renderLighthouseList(lat, lng);

                    // 마커가 없으면 처음 생성, 이미 있으면 위치만 갱신
                    if (!myLocationMarker) {
                        myLocationMarker = new naver.maps.Marker({
                            position: newLatLng,
                            map: map,
                            icon: {
                                content: '<div class="my-loc-pin"><img src="./img/lh-man-map.png" style="width:40px;height:40px;"></div>',
                                size: new naver.maps.Size(20, 20),
                                anchor: new naver.maps.Point(10, 10) // 점의 정중앙을 좌표에 맞춤
                            }
                        });
                    } else {
                        myLocationMarker.setPosition(newLatLng);
                    }

                    // 내 위치로 지도를 부드럽게 이동하고 줌 확대
                    map.setCenter(newLatLng);
                    map.setZoom(8, true); 
                    
                    // ★ 내 위치를 찾고 나면 버튼 이름을 변경하고 상태를 '확대됨(true)'으로 업데이트
                    btn.innerText = "🗺️ 전체 지도 보기"; 
                    isMapZoomedIn = true;

                }, function(error) {
                    alert("위치 정보를 가져올 수 없습니다. 스마트폰의 위치 서비스(GPS)가 켜져 있는지 확인해 주세요.");
                    btn.innerText = "🎯 내 위치 확인"; // 에러 시 버튼 원상복구
                }, { 
                    enableHighAccuracy: true, 
                    timeout: 5000 
                });
            } else {
                alert("현재 브라우저에서는 위치 서비스를 지원하지 않습니다.");
            }
        });

// --- 6. 거리 계산 및 하단 리스트 동적 생성 로직 ---

// 두 위도/경도 사이의 거리를 미터(m) 단위로 계산하는 함수 (하버사인 공식)
function calculateDistance(lat1, lon1, lat2, lon2) {
    var R = 6371e3; // 지구의 반지름 (미터)
    var radLat1 = lat1 * Math.PI / 180;
    var radLat2 = lat2 * Math.PI / 180;
    var deltaLat = (lat2 - lat1) * Math.PI / 180;
    var deltaLon = (lon2 - lon1) * Math.PI / 180;

    var a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
            Math.cos(radLat1) * Math.cos(radLat2) *
            Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c; // 미터(m) 단위 거리 반환
}

// 하단 스탬프 리스트를 화면에 그리는 함수
function renderLighthouseList(userLat, userLng) {
    var listContainer = document.querySelector('.lighthouse-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = ''; 

    var acquiredCount = 0; // ★ 현재까지 획득한 스탬프 개수를 저장할 변수

    eventLocations.forEach(function(loc) {
        // [테스트용] 나중에 서버 연동 시 이 부분을 실제 유저 데이터로 변경하세요.
        var isAcquired = (loc.title === "간절곶등대"); 
        
        // ★ 획득한 등대라면 카운트 1 증가
        if (isAcquired) {
            acquiredCount++; 
        }

        var distanceText = "위치 확인 필요";
        var rightSideHtml = "";

        if (userLat && userLng) {
            var distanceMeters = calculateDistance(userLat, userLng, loc.lat, loc.lng);
            
            if (distanceMeters <= 1000) {
                distanceText = "여기에서 약 0km"; 
                if (!isAcquired) {
                    rightSideHtml = `<span class="stamp-zone-text">스탬프존 ${Math.round(distanceMeters)}m</span>`;
                }
            } else {
                var distanceKm = Math.round(distanceMeters / 1000);
                distanceText = `여기에서 약 ${distanceKm}km`;
            }
        }

        if (isAcquired) {
            rightSideHtml = `<span class="stamp-done-text">완료</span>`;
        }

        // ★ 회원님이 요청하신 개별 스탬프 이미지 적용 부분!
        var stampImgSrc = isAcquired ? loc.stamp : './img/stamp_off.png';
        var acquiredClass = isAcquired ? 'acquired' : '';

        var li = document.createElement('li');
        li.className = `lh-item ${acquiredClass}`;

        li.style.cursor = 'pointer';
        li.onclick = function() {
            window.location.href = 'game-process.html';
        };

        li.innerHTML = `
            <div class="lh-left">
                <img src="${stampImgSrc}" alt="스탬프" class="lh-stamp-img">
                <div class="lh-info">
                    <div class="lh-name">${loc.title}</div>
                    <div class="lh-dist">${distanceText}</div>
                </div>
            </div>
            <div class="lh-right">
                ${rightSideHtml}
            </div>
        `;
        listContainer.appendChild(li);
    });

    // ★ 루프가 끝난 뒤 상단 프로그레스 바(게이지 및 숫자) 자동 업데이트
    updateProgressBar(acquiredCount, eventLocations.length);
}

// 상단 프로그레스 바를 업데이트하는 전용 함수
function updateProgressBar(current, total) {
    document.getElementById('current-stamps').textContent = current;
    document.getElementById('total-stamps').textContent = total;

    var percentage = (current / total) * 100;
    percentage = Math.max(0, Math.min(percentage, 100)); // 0~100 사이로 제한

    document.getElementById('progress-fill').style.width = percentage + '%';
    document.getElementById('progress-thumb').style.left = percentage + '%';
}

// 1. 페이지 로드 시 최초 실행 및 클릭 이벤트 등록
document.addEventListener("DOMContentLoaded", function() {
    
    // 1) 우선 위치 정보가 없는 상태의 뼈대를 빠르게 그립니다.
    renderLighthouseList(null, null);

    // ★ 2) 페이지가 열리자마자 사용자 위치를 즉시 요청하여 거리를 업데이트합니다.
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;
            
            // 위치 권한이 허용되어 좌표를 가져오면, 리스트를 거리 계산된 버전으로 싹 바꿉니다!
            renderLighthouseList(lat, lng);
        }, function(error) {
            // 사용자가 위치 권한을 거부했거나 오류가 발생한 경우 조용히 넘어갑니다.
            // (이 경우엔 기존대로 '위치 확인 필요'가 유지됩니다)
            console.log("초기 위치 권한 획득 실패 또는 거부됨");
        }, { 
            enableHighAccuracy: true, 
            timeout: 5000 
        });
    }

    // ★ 3) 스탬프 인증 현황 카드 펼치기/접기 동작 추가
    var toggleHeader = document.getElementById('toggle-progress');
    var progressCard = document.getElementById('progress-card');

    if (toggleHeader && progressCard) {
        toggleHeader.addEventListener('click', function() {
            progressCard.classList.toggle('expanded');
        });
    }
});

// --- 7. 팝업 및 오디오, 길찾기 모달 제어 로직 ---
let currentSelectedLoc = null; // 현재 선택된 등대 정보 저장
let isPlaying = false;

const audio = document.getElementById('audioPlayer');
const audioSource = document.getElementById('audioSource');
const audioBtn = document.getElementById('audioBtn');
const popupOverlay = document.getElementById('popupOverlay');

// 마커 클릭 시 팝업 열기
function openPopup(loc) {
    currentSelectedLoc = loc;
    
    // 팝업 내용 업데이트
    document.getElementById('lighthouseName').textContent = loc.title;
    document.getElementById('lighthouseDesc').textContent = loc.desc;
    document.getElementById('lighthouseImg').src = loc.pimg; // 상세 팝업용 이미지 사용
    document.getElementById('lighthouseImg').alt = loc.title;
    document.getElementById('lighthouseAddr').textContent = loc.addr; // 주소 업데이트

    // 외부 길찾기 앱 좌표 업데이트
    document.getElementById('kakaoBtn').href = `https://map.kakao.com/link/to/${loc.title},${loc.lat},${loc.lng}`;
    document.getElementById('naverBtn').href = `https://map.naver.com/v5/directions/-/-/-/transit?c=${loc.lat},${loc.lng},15,0,0,0,dh`;
    document.getElementById('googleBtn').href = `http://googleusercontent.com/maps.google.com/maps?daddr=${loc.lat},${loc.lng}`;
    document.getElementById('tmapBtn').href = `tmap://route?goalx=${loc.lng}&goaly=${loc.lat}&goalname=${loc.title}`;

    // 팝업 보이기 및 애니메이션 실행
    popupOverlay.style.display = 'flex';
    const card = document.getElementById('popupCard');
    card.style.animation = 'none';
    void card.offsetWidth; // reflow 트리거
    card.style.animation = 'cardIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both';
}

// 팝업 바깥 영역 클릭 시 닫기
function closePopupOutside(e) {
    if (e.target === popupOverlay) {
        popupOverlay.style.display = 'none';
        if (isPlaying) toggleAudio(); // 팝업 닫을 때 오디오 정지
    }
}

// 오디오 재생/정지 토글
function toggleAudio() {
    if (!currentSelectedLoc || !currentSelectedLoc.audio) {
        alert('음성 파일이 준비 중입니다.');
        return;
    }

    if (!isPlaying) {
        audioSource.src = currentSelectedLoc.audio;
        audio.load();
        audio.play().then(() => {
            isPlaying = true;
            audioBtn.classList.add('playing');
        }).catch((err) => {
            console.log(err);
            alert('오디오를 재생할 수 없습니다.');
        });
    } else {
        audio.pause();
        audio.currentTime = 0;
        isPlaying = false;
        audioBtn.classList.remove('playing');
    }
}

// 오디오가 끝났을 때 상태 초기화
audio.addEventListener('ended', () => {
    isPlaying = false;
    audioBtn.classList.remove('playing');
});

// 외부 앱 연결 모달 제어
function openAppModal() {
    document.getElementById('appModal').classList.add('open');
}

function closeModal() {
    document.getElementById('appModal').classList.remove('open');
}

function closeModalOutside(e) {
    if (e.target === document.getElementById('appModal')) closeModal();
}

// passport 
    let touchstartX = 0;
    let touchendX = 0;

    const prevPage = null; 
    const nextPage = 'lh-passport-sub.html';

    function handleGesture() {
        if (touchendX < touchstartX - 50 && nextPage) window.location.href = nextPage;
        if (touchendX > touchstartX + 50 && prevPage) window.location.href = prevPage;
    }

    // [1] 모바일 터치 이벤트
    document.addEventListener('touchstart', e => { touchstartX = e.changedTouches[0].screenX; });
    document.addEventListener('touchend', e => {
        touchendX = e.changedTouches[0].screenX;
        handleGesture();
    });

    // [2] PC 화면 좌/우 클릭 이벤트 (수정됨)
    document.addEventListener('click', e => {
        // 네비게이션이나 버튼 클릭 시 페이지 넘어감 방지
        if (e.target.closest('a, button, [onclick]')) return;

        const screenWidth = window.innerWidth;
        const clickX = e.clientX;

        // 화면 우측 클릭 시 다음 페이지로
        if (clickX >= screenWidth / 2 && nextPage) {
            window.location.href = nextPage;
        } 
        // 화면 좌측 클릭 시 이전 페이지로
        else if (clickX < screenWidth / 2 && prevPage) {
            window.location.href = prevPage;
        }
    });
