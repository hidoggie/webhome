/**
 * ar-hunt-common.js
 * --------------------------------------------------------
 * AR 이미지 타겟 기반 "보물찾기" 공통 로직 모듈.
 * hero.html 등 4개의 개별 페이지에서 동일하게 사용하던
 * <script> 하단 로직을 공통화한 파일입니다.
 *
 * 각 페이지는 자신만의 targetMap(과 필요 시 옵션)을 정의하고,
 * window.initArHunt(targetMap, options) 를 호출해서 초기화합니다.
 *
 * 사용 예 (각 html 파일의 <script> 안):
 *
 *   const targetMap = {
 *     'hero_target': {
 *       video: document.getElementById('portal-video'),
 *       videoPlaneId: 'video-plane-hero',
 *       modelId: 'model-hero',
 *       overlayImg: './img/hero-illust-s.svg',
 *       overlayOpacity: '0.5',
 *       thumbImg: './img/compass-b-thumb.png',
 *       itemName: '나침반'
 *     },
 *     'hero_target1': { ... }
 *   };
 *
 *   window.initArHunt(targetMap);
 * --------------------------------------------------------
 */
(function () {

  /**
   * AR 보물찾기 로직을 초기화합니다.
   *
   * @param {Object} targetMap - 타겟별 설정 객체.
   *   key: 이미지 타겟 이름 (xrextras-named-image-target의 name과 동일)
   *   value: {
   *     video: HTMLVideoElement,
   *     videoPlaneId: string,
   *     modelId: string,
   *     overlayImg: string,
   *     overlayOpacity: string,
   *     thumbImg: string,
   *     itemName: string
   *   }
   * @param {Object} [options] - 선택적 옵션
   *   @param {string[]} [options.targetOrder] - 타겟 진행 순서. 기본값: Object.keys(targetMap)
   *   @param {string} [options.overlaySelector] - 스캔 오버레이 엘리먼트 셀렉터. 기본값: '#scanning-overlay'
   *   @param {string} [options.nextRoute] - 모두 수집 완료 후 window.parent.routeTo() 에 전달할 값. 기본값: 'mission'
   *   @param {boolean} [options.reloadOnComplete] - 완료 후 routeTo 대신 location.reload() 사용 여부. 기본값: false
   *   @param {Function} [options.onAllCollected] - 모두 수집 완료 시 실행할 커스텀 콜백 (지정 시 기본 동작 대체)
   */
  function initArHunt(targetMap, options) {
    options = options || {};

    const overlay = document.querySelector(options.overlaySelector || '#scanning-overlay');
    let activeTarget = null;

    const targetOrder = options.targetOrder || Object.keys(targetMap);
    let currentTargetIndex = 0;

    const boundTargets = new Set();
    const collected = {};

    if (overlay && targetMap[targetOrder[0]]) {
      overlay.style.opacity = targetMap[targetOrder[0]].overlayOpacity;
    }

    function toggleCollection() {
      const panel = document.getElementById('collection-panel');
      if (!panel) return;
      panel.style.display = (panel.style.display === 'flex') ? 'none' : 'flex';
    }

    function collectItem(targetName) {
      if (collected[targetName]) return;
      collected[targetName] = true;

      const slot = document.getElementById('slot-' + targetName);
      if (slot) slot.classList.add('collected');

      const count = Object.keys(collected).length;
      const badge = document.getElementById('collection-badge');
      if (badge) {
        badge.textContent = count;
        badge.style.display = 'flex';
      }

      const popup = document.getElementById('collect-popup');
      const popupImg = document.getElementById('collect-popup-img');
      const popupMsg = document.getElementById('collect-popup-msg');
      if (popupImg) popupImg.src = targetMap[targetName].thumbImg;
      if (popupMsg) popupMsg.textContent = targetMap[targetName].itemName + ' 수집 완료!';
      if (popup) popup.classList.add('show');
      setTimeout(() => { if (popup) popup.classList.remove('show'); }, 2000);

      const touchHint = document.getElementById('touch-hint');
      if (touchHint) touchHint.style.display = 'none';

      const { modelId, videoPlaneId, video } = targetMap[targetName];
      const modelEntity = document.getElementById(modelId);
      const videoPlane = document.getElementById(videoPlaneId);
      if (modelEntity) modelEntity.setAttribute('visible', false);
      if (videoPlane) videoPlane.setAttribute('visible', false);
      if (video) video.pause();

      currentTargetIndex++;

      if (currentTargetIndex < targetOrder.length) {
        // 다음 타겟이 남아있다면 다음 오버레이 표시
        const nextTarget = targetOrder[currentTargetIndex];
        if (overlay) {
          const overlayImgEl = overlay.querySelector('img');
          if (overlayImgEl) overlayImgEl.src = targetMap[nextTarget].overlayImg;
          overlay.style.display = 'flex';
          overlay.style.animation = 'none';
          overlay.style.opacity = targetMap[nextTarget].overlayOpacity || '1';
        }
      } else {
        // 모두 수집 완료
        if (typeof options.onAllCollected === 'function') {
          options.onAllCollected();
        } else {
          setTimeout(() => {
            alert('모든 아이템을 찾았습니다!');
            if (options.reloadOnComplete) {
              location.reload();
            } else if (window.parent && typeof window.parent.routeTo === 'function') {
              window.parent.routeTo(options.nextRoute || 'mission');
            }
          }, 2200); // 팝업 애니메이션이 끝난 후 실행
        }
      }
    }

    function enableModelTouch(modelEntity, targetName) {
      modelEntity.classList.add('cantap');
      modelEntity.addEventListener('click', () => {
        collectItem(targetName);
      });
    }

    function fadeInModel(modelEntity) {
      modelEntity.setAttribute('visible', true);
      function startFade() {
        const mesh = modelEntity.getObject3D('mesh');
        if (!mesh) { setTimeout(startFade, 100); return; }
        mesh.traverse((node) => {
          if (node.material) {
            const mats = Array.isArray(node.material) ? node.material : [node.material];
            mats.forEach((mat) => { mat.transparent = true; mat.opacity = 0; });
          }
        });
        function easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
        const duration = 1500, start = performance.now();
        function fade(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = easeInOutQuad(progress);
          mesh.traverse((node) => {
            if (node.material) {
              const mats = Array.isArray(node.material) ? node.material : [node.material];
              mats.forEach((mat) => { mat.opacity = eased; });
            }
          });
          if (progress < 1) requestAnimationFrame(fade);
        }
        requestAnimationFrame(fade);
      }
      startFade();
    }

    function bindVideoEnded(targetName) {
      if (boundTargets.has(targetName)) return;
      boundTargets.add(targetName);

      const { video, modelId } = targetMap[targetName];
      video.addEventListener('ended', () => {
        if (activeTarget !== targetName) return;
        const modelEntity = document.getElementById(modelId);
        if (modelEntity) {
          fadeInModel(modelEntity);
          enableModelTouch(modelEntity, targetName);
          const touchHint = document.getElementById('touch-hint');
          if (touchHint) touchHint.style.display = 'block';
        }
        video.loop = true;
        video.play();
      });
    }

    const sceneEl = document.querySelector('a-scene');

    sceneEl.addEventListener('xrimagefound', (event) => {
      const name = event.detail.name;
      if (!targetMap[name]) return;
      if (name !== targetOrder[currentTargetIndex]) return;
      if (collected[name]) return;

      activeTarget = name;
      if (overlay) {
        overlay.style.animation = 'fadeOut 0.5s forwards';
        setTimeout(() => { overlay.style.display = 'none'; }, 500);
      }

      const { video, modelId } = targetMap[name];
      const modelEntity = document.getElementById(modelId);
      video.loop = false;
      video.currentTime = 0;
      video.play().catch(() => {
        document.addEventListener('click', () => video.play(), { once: true });
        document.addEventListener('touchstart', () => video.play(), { once: true });
      });
      if (modelEntity) {
        modelEntity.setAttribute('visible', false);
        const mesh = modelEntity.getObject3D('mesh');
        if (mesh) {
          mesh.traverse((node) => {
            if (node.material) {
              const mats = Array.isArray(node.material) ? node.material : [node.material];
              mats.forEach((mat) => { mat.transparent = true; mat.opacity = 0; });
            }
          });
        }
      }
      bindVideoEnded(name);
    });

    sceneEl.addEventListener('xrimagelost', (event) => {
      const name = event.detail.name;
      if (!targetMap[name]) return;

      if (name === targetOrder[currentTargetIndex] && !collected[name]) {
        if (overlay) {
          const overlayImgEl = overlay.querySelector('img');
          if (overlayImgEl) overlayImgEl.src = targetMap[name].overlayImg;
          overlay.style.display = 'flex';
          overlay.style.animation = 'none';
          overlay.style.opacity = targetMap[name].overlayOpacity || '1';
        }
      }
    });

    // toggleCollection은 HTML의 onclick="toggleCollection()"에서 호출되므로 전역에 노출
    window.toggleCollection = toggleCollection;
  }

  window.initArHunt = initArHunt;

})();