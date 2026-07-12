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

    // 찰칵! 캡처 버튼 이벤트 (이전의 U자형 마스크 로직 그대로 유지)
    captureBtn.addEventListener('click', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      const minDimension = Math.min(video.videoWidth, video.videoHeight);
      const faceSize = minDimension * 0.6; 
      const startX = (video.videoWidth - faceSize) / 2;
      const startY = (video.videoHeight - faceSize) / 2;

      ctx.fillStyle = '#ffccb6'; 
      ctx.fillRect(0, 0, 512, 512);

      // 모자에 맞춘 U자형 마스크
      ctx.beginPath();
      ctx.moveTo(256 - 200, 256 - 150); 
      ctx.lineTo(256 + 200, 256 - 150); 
      ctx.arc(256, 256, 200, 0, Math.PI, false); 
      ctx.closePath();
      ctx.clip(); 

      ctx.drawImage(video, startX, startY, faceSize, faceSize, 0, 0, 512, 512);

      sessionStorage.setItem('capturedFace', canvas.toDataURL('image/jpeg'));

      // 캡처 후 카메라 완전히 종료 및 새로고침
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