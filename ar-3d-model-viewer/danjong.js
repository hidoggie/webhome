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
        clip: 'Walking',
        loop: 'repeat',
        crossFadeDuration: 0.4,
      })
    } else {
      this.el.setAttribute('animation-mixer', {
        clip: 'idle_01',
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
AFRAME.registerComponent('character-move', characterMoveComponent)
AFRAME.registerComponent('character-recenter', characterRecenterComponent)
AFRAME.registerComponent('no-cull', {
  init() {
    this.el.addEventListener('model-loaded', () => {
      this.el.object3D.traverse(obj => obj.frustumCulled = false)
    })
  },
})
AFRAME.registerComponent('game-manager', {
  init: function () {
    // 점수 변수 초기화
    this.currentScore = 0;
    this.targetScore = 100;
    this.scorePerStar = 10;
    this.isGameOver = false;

    // DOM 요소 연결
    this.scoreText = document.getElementById('current-score');
    this.successPopup = document.getElementById('success-popup');
    
    // 조이스틱으로 움직이는 메인 캐릭터
    this.player = document.getElementById('target');
    
    // 첫 번째 별 스폰
    this.spawnStar();
  },

  spawnStar: function () {
    if (this.isGameOver) return;

    // 별 오브젝트 생성
    this.currentStar = document.createElement('a-entity');
    this.currentStar.setAttribute('gltf-model', '#starModel');
    this.currentStar.setAttribute('scale', '2 2 2');

    // 플레이어 주변 랜덤한 위치에 배치 (x, z 좌표 설정)
    const randomX = (Math.random() - 0.5) * 6; // -3 ~ 3 범위
    const randomZ = (Math.random() - 0.5) * 6; // -3 ~ 3 범위
    this.currentStar.setAttribute('position', `${randomX} 0 ${randomZ}`);

    // 씬에 별 추가
    this.el.appendChild(this.currentStar);
    this.isStarCaught = false;
  },

  tick: function () {
    if (this.isGameOver || !this.currentStar || this.isStarCaught) return;

    // 플레이어와 별의 현재 위치 가져오기
    const playerPos = this.player.object3D.position;
    const starPos = this.currentStar.object3D.position;

    // 두 오브젝트 간의 거리 계산
    const distance = playerPos.distanceTo(starPos);

    // 충돌 판정 (거리가 1.5 이하로 가까워지면 잡은 것으로 판정, 수치 조절 가능)
    if (distance < 1.5) {
      this.catchStar();
    }
  },

  catchStar: function () {
    this.isStarCaught = true;

    // 1. 별 획득 애니메이션 재생
    this.currentStar.setAttribute('animation-mixer', 'clip: confettiAction; loop: once;');

    // 2. 점수 증가 및 UI 업데이트
    this.currentScore += this.scorePerStar;
    this.scoreText.innerText = this.currentScore;

    // 3. 목표 점수 도달 체크
    if (this.currentScore >= this.targetScore) {
      this.isGameOver = true;
      this.fireConfetti();
      setTimeout(() => {
        this.successPopup.style.display = 'block'; // 축하 팝업 노출
      }, 500); // 애니메이션을 볼 수 있도록 약간의 딜레이
    } else {
      // 4. 애니메이션이 끝날 즈음(예: 1초 후) 별 삭제 후 새 별 스폰
      setTimeout(() => {
        if (this.currentStar.parentNode) {
          this.currentStar.parentNode.removeChild(this.currentStar);
        }
        this.spawnStar();
      }, 1000);
    }
  },
// 🌟 새롭게 추가하는 폭죽 애니메이션 함수
  fireConfetti: function () {
    // 3초 동안 폭죽 재생
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
      // 화면 왼쪽에서 발사
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ['#7611b7', '#c86dd7', '#ffffff', '#ffd700'], // 팝업 버튼 색상과 맞춤
        zIndex: 10000 // 팝업창보다 위에 오도록 설정
      });
      // 화면 오른쪽에서 발사
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: ['#7611b7', '#c86dd7', '#ffffff', '#ffd700'],
        zIndex: 10000
      });

      // 설정한 시간(3초)이 끝날 때까지 프레임 반복
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }
});
