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
        const modelMesh = this.el.getObject3D('mesh').getObjectByName('face_mesh-01');
        if (modelMesh) {
          modelMesh.traverse((node) => {
            if (node.isMesh) {
              const newMaterial = new THREE.MeshStandardMaterial({
              map: texture,
              color: 0xffffff, // 텍스처 본연의 색상을 살리기 위해 베이스는 흰색
              skinning: true,
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

const characterMoveComponent = {
  init() {
    this.handleTouch = (e) => {
      this.positionRaw = e.detail.positionRaw
      this.startPositionRaw = this.startPositionRaw || this.positionRaw
    }

    this.clearTouch = (e) => {
      this.startPositionRaw = null
    }

    window.addEventListener('onefingerstart', this.handleTouch)
    window.addEventListener('onefingermove', this.handleTouch)
    window.addEventListener('onefingerend', this.clearTouch)

    const overlay = document.getElementById('overlay')

    this.joystickParent = document.createElement('div')
    this.joystickParent.classList.add('joystick-container', 'absolute-fill', 'shadowed')

    this.joystickPosition = document.createElement('div')
    this.joystickPosition.classList.add('joystick', 'position')
    this.joystickParent.appendChild(this.joystickPosition)

    this.joystickOrigin = document.createElement('div')
    this.joystickOrigin.classList.add('joystick', 'origin')
    this.joystickParent.appendChild(this.joystickOrigin)

    overlay.appendChild(this.joystickParent)

    this.camera = document.getElementById('camera')
  },

  tick(time, timeDelta) {
    const {startPositionRaw, positionRaw, headModel} = this

    if (startPositionRaw) {
      const isTablet = window.matchMedia('(min-width: 640px)').matches
      const isDesktop = window.matchMedia('(min-width: 961px)').matches
      
      const maxRawDistance = Math.min(window.innerWidth, window.innerHeight) / (isDesktop ? 18 : isTablet ? 17 : 8)

      let rawOffsetX = positionRaw.x - startPositionRaw.x
      let rawOffsetY = positionRaw.y - startPositionRaw.y

      const rawDistance = Math.sqrt(Math.pow(rawOffsetX, 2) + Math.pow(rawOffsetY, 2))

      // Normalize to maxRawDistance
      if (rawDistance > maxRawDistance) {
        rawOffsetX *= maxRawDistance / rawDistance
        rawOffsetY *= maxRawDistance / rawDistance
      }

      const widthScale = 100 / window.innerWidth
      const heightScale = 100 / window.innerHeight

      this.joystickParent.classList.add('visible')
      this.joystickOrigin.style.left = `${startPositionRaw.x * widthScale}%`
      this.joystickOrigin.style.top = `${startPositionRaw.y * heightScale}%`
      this.joystickPosition.style.left = `${(startPositionRaw.x + rawOffsetX) * widthScale}%`
      this.joystickPosition.style.top = `${(startPositionRaw.y + rawOffsetY) * heightScale}%`

      const offsetX = rawOffsetX / maxRawDistance
      const offsetY = rawOffsetY / maxRawDistance

      const forward = -Math.min(Math.max(-1, offsetY), 1)
      const side = -Math.min(Math.max(-1, offsetX), 1)

      let dir
      const moveZ = -forward * 0.4
      const moveX = -side * 0.4

      // get y rot of camera
      const camY = this.camera.object3D.rotation.y

      let joystickRot = Math.atan2(forward, side)

      joystickRot -= camY

      const speed = 0.002

      this.el.object3D.position.z -= speed * Math.sin(joystickRot) * timeDelta
      this.el.object3D.position.x -= speed * Math.cos(joystickRot) * timeDelta

      const limit = 5.0; 
      this.el.object3D.position.z = Math.max(-limit, Math.min(limit, this.el.object3D.position.z));
      this.el.object3D.position.x = Math.max(-limit, Math.min(limit, this.el.object3D.position.x));     

      this.el.object3D.rotation.y = -joystickRot - Math.PI / 2

      this.el.setAttribute('animation-mixer', {
        clip: 'sunbi_walk_01',
        loop: 'repeat',
        crossFadeDuration: 0.4,
      })
    } else {
      this.el.setAttribute('animation-mixer', {
        clip: 'sunbi_idle_01',
        loop: 'repeat',
        crossFadeDuration: 0.4,
      })

      this.joystickParent.classList.remove('visible')
    }
  },

  remove() {
    window.removeEventListener('onefingerstart', this.handleTouch)
    window.removeEventListener('onefingermove', this.handleTouch)
    window.removeEventListener('onefingerend', this.clearTouch)

    this.joystickParent.parentNode.removeChild(this.joystickParent)
  },
}

const characterRecenterComponent = {
  init() {
    const recenterBtn = document.getElementById('recenterBtn')
    recenterBtn.addEventListener('click', () => {
      recenterBtn.classList.add('pulse-once')
      setTimeout(() => {
        recenterBtn.classList.remove('pulse-once')
      }, 500)
      this.el.sceneEl.emit('recenter')
      this.el.object3D.position.set(0, 0, 0)
    })
  },
}

// A-Frame 컴포넌트 등록
AFRAME.registerComponent('apply-face-texture', applyFaceTextureComponent);
AFRAME.registerComponent('character-move', characterMoveComponent)
AFRAME.registerComponent('character-recenter', characterRecenterComponent)
AFRAME.registerComponent('no-cull', {
  init() {
    this.el.addEventListener('model-loaded', () => {
      this.el.object3D.traverse(obj => obj.frustumCulled = false)
    })
  },
})

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


