// 1. 3D 모델에 캡처한 얼굴 텍스처를 입히는 A-Frame 컴포넌트
const applyFaceTextureComponent = {
  init() {
    // sessionStorage에 저장된 사진 데이터 불러오기
    const imageData = sessionStorage.getItem('capturedFace');
    if (!imageData) return;

    sessionStorage.removeItem('capturedFace');

    this.el.addEventListener('model-loaded', () => {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(imageData, (texture) => {
        texture.flipY = false; // 위아래 뒤집힘 방지

        // 수정한 UV를 가진 모델 메쉬 찾기
        const modelMesh = this.el.getObject3D('mesh').getObjectByName('face_change_01');
        if (modelMesh) {
          modelMesh.traverse((node) => {
            if (node.isMesh) {
              const newMaterial = new THREE.MeshStandardMaterial({
              map: texture,
              color: 0xffffff, // 텍스처 본연의 색상을 살리기 위해 베이스는 흰색
              roughness: node.material.roughness || 0.5, // 기존 거칠기 유지
              metalness: node.material.metalness || 0.0  // 기존 금속성 유지
            });

            node.material = newMaterial;
            node.material.needsUpdate = true;            }
          });
        }
      });
    });
  }
}

// A-Frame 컴포넌트 등록
AFRAME.registerComponent('apply-face-texture', applyFaceTextureComponent);

// 2. 카메라 충돌 방지를 위한 앱 상태 관리
document.addEventListener('DOMContentLoaded', () => {
  const captureUi = document.getElementById('capture-ui');
  const savedFace = sessionStorage.getItem('capturedFace');

  if (!savedFace) {
    // ----------------------------------------------------
    // [모드 1] 저장된 사진이 없다면: 전면 카메라 캡처 모드 실행
    // ----------------------------------------------------
    captureUi.style.display = 'flex';
    const video = document.getElementById('video-feed');
    const captureBtn = document.getElementById('capture-btn');

    // 전면 카메라 요청
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then(stream => { video.srcObject = stream; })
      .catch(err => alert("카메라 권한을 허용해 주세요: " + err));

captureBtn.addEventListener('click', () => {
  const canvas = document.createElement('canvas');
  // 텍스처 해상도는 512x512 고정
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // 1. 얼굴 부분만 타이트하게 확대해서 자르기 위한 계산
  const minDimension = Math.min(video.videoWidth, video.videoHeight);
  // 전체 비디오 화면의 60% 크기만 얼굴로 간주 (필요시 0.5 ~ 0.7 사이로 조절하세요)
  const faceSize = minDimension * 0.6; 
  
  const startX = (video.videoWidth - faceSize) / 2;
  const startY = (video.videoHeight - faceSize) / 2;

  // 2. 캔버스 전체를 캐릭터의 기본 피부색으로 칠하기 (뒷배경 가리기)
  ctx.fillStyle = '#ffccb6'; // 살구색(캐릭터 피부톤에 맞춰 수정 가능)
  ctx.fillRect(0, 0, 512, 512);

  // 3. 동그란 구멍(마스크) 뚫기
  ctx.beginPath();
  ctx.arc(256, 256, 256, 0, Math.PI * 2); // 캔버스 정중앙에 꽉 차는 원
  ctx.closePath();
  ctx.clip(); // 이 선언 이후에는 붓질이나 사진이 무조건 '원형 안쪽'에만 그려집니다.

  // 4. 계산해둔 얼굴 중앙(faceSize) 영역만 가져와서 캔버스 전체에 꽉 차게 그리기
  ctx.drawImage(video, startX, startY, faceSize, faceSize, 0, 0, 512, 512);

  // 5. 이미지를 세션 스토리지에 저장
  sessionStorage.setItem('capturedFace', canvas.toDataURL('image/jpeg'));

  // 카메라 하드웨어 종료 및 페이지 새로고침
  const stream = video.srcObject;
  stream.getTracks().forEach(track => track.stop());
  window.location.reload();
});

  } else {
    // ----------------------------------------------------
    // [모드 2] 저장된 사진이 있다면: AR 엔진 모드 실행
    // ----------------------------------------------------
    captureUi.style.display = 'none';

    // 숨겨두었던 <a-scene> 템플릿을 꺼내서 HTML에 추가 (이때 8th Wall 후면 카메라 작동)
    const template = document.getElementById('ar-template');
    const clone = template.content.cloneNode(true);
    document.body.appendChild(clone);
  }
});