const characterMoveComponent = {
  init() {
    this.walkSound = new Audio('./assets/walk.mp3');
    this.walkSound.loop = true; // 이동 중에는 계속 반복
    this.walkSound.volume = 0.5; // 볼륨 조절 (0.0 ~ 1.0)  

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
      // 🌟 [사운드 재생] 이동 중일 때 소리가 멈춰있다면 재생
      if (this.walkSound.paused) {
        this.walkSound.play().catch(e => console.log("Audio play error:", e));
      }   

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
    // 🌟 [사운드 정지] 조이스틱에서 손을 뗐을 때 소리 정지
      if (!this.walkSound.paused) {
        this.walkSound.pause();
      }   

      this.el.setAttribute('animation-mixer', {
        clip: 'idle_02',
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
    this.currentScore = 0;
    this.targetScore = 100;
    this.scorePerStar = 10;
    this.totalTime = 60;
    this.timeLeft = 60;

    this.isGameOver = false;
    this.isGameStarted = false;

    this.catchSound = new Audio('./assets/catch.mp3');
    this.successSound = new Audio('./assets/success.mp3');
    this.failSound = new Audio('./assets/fail.mp3');

    this.scoreText = document.getElementById('current-score');
    this.timeText = document.getElementById('time-left');
    this.successPopup = document.getElementById('success-popup');
    this.failPopup = document.getElementById('fail-popup');    
    this.startPopup = document.getElementById('start-popup');
    this.startBtn = document.getElementById('start-btn');
    this.player = document.getElementById('target');
    
    this.startBtn.addEventListener('click', () => {
      this.startPopup.style.display = 'none'; 
      this.isGameStarted = true;              
      
      this.spawnStar();                       
      this.startTimer();                      
    });
  },

  startTimer: function () {
    this.timerInterval = setInterval(() => {
      if (this.isGameOver) {
        clearInterval(this.timerInterval);
        return;
      }

      this.timeLeft--;
      this.timeText.innerText = this.timeLeft;

      if (this.timeLeft <= 0) {
        this.timeOver();
      }
    }, 1000);
  },

  timeOver: function () {
    this.isGameOver = true;
    clearInterval(this.timerInterval);
    
    this.failPopup.style.display = 'block';

    if (this.failSound) {
      this.failSound.currentTime = 0;
      this.failSound.play().catch(e => console.log(e));
    }
  },

  spawnStar: function () {
    if (this.isGameOver) return;

    this.currentStar = document.createElement('a-entity');
    this.currentStar.setAttribute('gltf-model', '#starModel');
    this.currentStar.setAttribute('scale', '2 2 2');

    // 🌟 캐릭터 바로 근처에 스폰되어 시작하자마자 먹어지는 현상 방지
    const playerPos = this.player.object3D.position;
    let randomX, randomZ;
    do {
      randomX = (Math.random() - 0.5) * 6;
      randomZ = (Math.random() - 0.5) * 6;
    } while (Math.abs(randomX - playerPos.x) < 2 && Math.abs(randomZ - playerPos.z) < 2);

    this.currentStar.setAttribute('position', `${randomX} 0 ${randomZ}`);
    this.el.appendChild(this.currentStar);
    this.isStarCaught = false;
  },

  // 🌟 중복되었던 tick 함수를 하나로 완벽하게 통합
  tick: function () {
    if (!this.isGameStarted || this.isGameOver || !this.currentStar || this.isStarCaught) return;

    const playerPos = this.player.object3D.position;
    const starPos = this.currentStar.object3D.position;
    const distance = playerPos.distanceTo(starPos);

    if (distance < 1.5) {
      this.catchStar();
    }
  },

  catchStar: function () {
    this.isStarCaught = true;
    this.currentScore += this.scorePerStar;
    this.scoreText.innerText = this.currentScore;

    if (this.currentScore >= this.targetScore) {
      this.isGameOver = true;
      clearInterval(this.timerInterval);
      
      this.successSound.currentTime = 0; 
      this.successSound.play().catch(e => console.log(e));

      if (this.currentStar.parentNode) {
        this.currentStar.parentNode.removeChild(this.currentStar);
      }

      this.fireConfetti();

      setTimeout(() => {
        this.successPopup.style.display = 'block'; 
      }, 500); 
    } else {
      this.catchSound.currentTime = 0;
      this.catchSound.play().catch(e => console.log(e));

      this.currentStar.setAttribute('animation-mixer', 'clip: confettiAction; loop: once;');

      setTimeout(() => {
        if (this.currentStar.parentNode) {
          this.currentStar.parentNode.removeChild(this.currentStar);
        }
        this.spawnStar();
      }, 1000);
    }
  },

  fireConfetti: function () {
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0, y: 0.8 }, colors: ['#7611b7', '#c86dd7', '#ffffff', '#ffd700'], zIndex: 10000 });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1, y: 0.8 }, colors: ['#7611b7', '#c86dd7', '#ffffff', '#ffd700'], zIndex: 10000 });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }
});