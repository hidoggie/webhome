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

document.addEventListener('DOMContentLoaded', () => {
  const captureUi = document.getElementById('capture-ui');
  const savedFace = sessionStorage.getItem('capturedFace');

  if (!savedFace) {
    // [모드 1] 캡처 모드 실행
    captureUi.style.display = 'flex';
    const video = document.getElementById('video-feed');
    const captureBtn = document.getElementById('capture-btn');
    const switchCameraBtn = document.getElementById('switch-camera-btn');

    // 현재 카메라 모드 상태 저장 (기본은 전면)
    let currentFacingMode = 'user';

    // 📸 카메라 스트림을 시작/재시작하는 함수
    const startCamera = (facingMode) => {
      // 이미 켜져 있는 카메라가 있다면 먼저 끕니다
      if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
      }
      
      navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode } 
      })
      .then(stream => { 
        video.srcObject = stream; 
      })
      .catch(err => alert("카메라 권한을 허용해 주세요: " + err));
    };

    // 처음 화면이 켜질 때 전면 카메라 실행
    startCamera(currentFacingMode);

    // 🔄 카메라 전환 버튼 클릭 이벤트
    if (switchCameraBtn) {
      switchCameraBtn.addEventListener('click', () => {
        // user면 environment로, environment면 user로 토글
        currentFacingMode = (currentFacingMode === 'user') ? 'environment' : 'user';
        startCamera(currentFacingMode);
      });
    }

captureBtn.addEventListener('click', () => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // 1. 얼굴 크기 조절 (줌 인 효과)
  // 0.55를 0.4(더 확대) ~ 0.7(더 축소)로 조절하여 사진이 들어가는 비율을 맞출 수 있습니다.
  const minDimension = Math.min(video.videoWidth, video.videoHeight);
  const faceSize = minDimension * 0.55; 
  const startX = (video.videoWidth - faceSize) / 2;
  const startY = (video.videoHeight - faceSize) / 2;

  // 2. 캔버스 배경 피부색 칠하기
  ctx.fillStyle = '#ffccb6'; 
  ctx.fillRect(0, 0, 512, 512);

  // 3. 캔버스 전체를 꽉 채우는 마스크로 수정
  ctx.beginPath();
  // 모자 챙 밑 직선 (y축을 60으로 설정하여 이마 위쪽만 살짝 직선으로 자름)
  ctx.moveTo(0, 60); 
  ctx.lineTo(512, 60); 
  // 오른쪽 가장자리를 따라 중간까지 선 긋기
  ctx.lineTo(512, 256);
  // 아래쪽 턱을 향해 캔버스에 꽉 차는 반원 그리기 (반지름을 256으로 최대화)
  ctx.arc(256, 256, 256, 0, Math.PI, false); 
  // 왼쪽 가장자리를 따라 다시 이마 라인으로 올라가기
  ctx.lineTo(0, 60);
  ctx.closePath();
  ctx.clip(); 

  // 4. 잘라낸 얼굴 이미지를 캔버스에 꽉 차게(512x512) 그리기
  ctx.drawImage(video, startX, startY, faceSize, faceSize, 0, 0, 512, 512);

  // 임시 저장 및 새로고침
  sessionStorage.setItem('capturedFace', canvas.toDataURL('image/jpeg'));
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
  }
  window.location.reload();
});

  } else {
    // [모드 2] AR 모드 (기존과 동일하게 유지)
    captureUi.style.display = 'none';
    const template = document.getElementById('ar-template');
    const clone = template.content.cloneNode(true);
    document.body.appendChild(clone);
  }
});