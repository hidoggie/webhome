        // --- 1. 데이터 설정 (10개 이벤트 지역 배열) ---
        // img 속성에 각 지역에 맞는 개별 아이콘 이미지 경로를 넣어주세요.
   
     var eventLocations = [
            { title: "산지등대", lat: 33.5214, lng: 126.5456, img: "./img/sanji_icon_240.png" },
            { title: "소매물도등대", lat: 34.6196, lng: 128.5479, img: "./img/somaemuldo_icon_240.png" },
            { title: "오동도등대", lat: 34.7442, lng: 127.7677, img: "./img/odongdo_icon_240.png" },
            { title: "팔미도등대", lat: 37.3583, lng: 126.5106, img: "./img/palmido_icon_240.png" },
            { title: "묵호등대", lat: 37.554472, lng: 129.118555, img: "./img/mukho_icon_240.png" },
            { title: "울기등대", lat: 35.4928, lng: 129.4430, img: "./img/ulgi_icon_240.png" },
            { title: "영도등대", lat: 35.0523, lng: 129.0921, img: "./img/youngdo_icon_240.png" },
            { title: "우도등대", lat: 33.4927, lng: 126.9658, img: "./img/udo_icon_240.png" },
            { title: "간절곶등대", lat: 35.3590, lng: 129.3606, img: "./img/ganjeolgot_icon_240.png" },
            { title: "속초등대", lat: 38.071536, lng: 128.615561, img: "./img/sokcho_icon_240.png" }
   //         { title: "속초등대", lat: 38.2137, lng: 128.6000, img: "./img/sokcho_icon_240.png" }
        ];

        // --- 2. 대한민국 영역 제한 설정 (북한 제외) ---
        // 남서쪽(마라도 부근)과 북동쪽(고성/울릉도 부근)의 좌표를 기준 상자로 설정합니다.
        var koreaBounds = new naver.maps.LatLngBounds(
   //         new naver.maps.LatLng(32.745225, 125.652393), // 남서쪽 (South-West)
   //         new naver.maps.LatLng(38.360059, 129.522699)  // 북동쪽 (North-East)
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
            if(loc.title == "팔미도등대") {   // test용
            var marker = new naver.maps.Marker({
                position: new naver.maps.LatLng(loc.lat, loc.lng),
                map: map,
                icon: {
                    // HTML 태그의 style에 배경 이미지를 동적으로 삽입합니다.
                    content: `<div><img src="./img/stamp-complete-red.png" style="width:40px; height:40px;"></div>
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
                alert(loc.title + " 구역입니다! 가까이 다가가면 AR 길찾기 모드가 켜집니다.");
            });
        });

        // --- 5. 내 위치 확인 기능 ---
        var myLocationMarker = null; // 내 위치 핀을 저장할 변수

        document.getElementById('btn-location').addEventListener('click', function() {
            // 브라우저가 GPS(Geolocation)를 지원하는지 확인
            if (navigator.geolocation) {
                // 버튼 텍스트 변경으로 로딩 상태 표시
                this.innerText = "⏳ 위치 찾는 중...";

                navigator.geolocation.getCurrentPosition(function(position) {
                    var lat = position.coords.latitude;
                    var lng = position.coords.longitude;
                    var newLatLng = new naver.maps.LatLng(lat, lng);

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

                    // 내 위치로 지도를 부드럽게 이동하고 줌 레벨을 살짝 당김
                    map.setCenter(newLatLng);
                    map.setZoom(8, true); // true를 주면 부드러운 애니메이션 효과 적용
                    
                    document.getElementById('btn-location').innerText = "🎯 내 위치 확인";

                }, function(error) {
                    alert("위치 정보를 가져올 수 없습니다. 스마트폰의 위치 서비스(GPS)가 켜져 있는지 확인해 주세요.");
                    document.getElementById('btn-location').innerText = "🎯 내 위치 확인";
                }, { 
                    enableHighAccuracy: true, // 높은 정확도 (GPS) 사용
                    timeout: 5000 // 5초 안에 못 찾으면 에러 처리
                });
            } else {
                alert("현재 브라우저에서는 위치 서비스를 지원하지 않습니다.");
            }
        });
