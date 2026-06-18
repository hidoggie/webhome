/**
 * ar-hunt-common.js
 */
(function () {
  function initArHunt(targetMap, options) {
    options = options || {};

    const overlay = document.querySelector(
      options.overlaySelector || "#scanning-overlay",
    );
    let activeTarget = null;

    // ★ 옵션으로 전달받은 타겟 순서를 최우선으로 사용
    const targetOrder = options.targetOrder || Object.keys(targetMap);
    let currentTargetIndex = 0;

    const boundTargets = new Set();
    const collected = {};

    if (overlay && targetMap[targetOrder[0]]) {
      overlay.style.opacity = targetMap[targetOrder[0]].overlayOpacity;
    }

    function toggleCollection() {
      const panel = document.getElementById("collection-panel");
      if (!panel) return;
      panel.style.display = panel.style.display === "flex" ? "none" : "flex";
    }

    function collectItem(targetName) {
      if (collected[targetName]) return;
      collected[targetName] = true;

      const slot = document.getElementById("slot-" + targetName);
      if (slot) slot.classList.add("collected");

      const count = Object.keys(collected).length;
      const badge = document.getElementById("collection-badge");
      if (badge) {
        badge.textContent = count;
        badge.style.display = "flex";
      }

      const popup = document.getElementById("collect-popup");
      const popupImg = document.getElementById("collect-popup-img");
      const popupMsg = document.getElementById("collect-popup-msg");
      if (popupImg) popupImg.src = targetMap[targetName].thumbImg;
      if (popupMsg)
        popupMsg.textContent = targetMap[targetName].itemName + " 수집 완료!";
      if (popup) popup.classList.add("show");
      setTimeout(() => {
        if (popup) popup.classList.remove("show");
      }, 2000);

      const touchHint = document.getElementById("touch-hint");
      if (touchHint) touchHint.style.display = "none";

      const { modelId, videoPlaneId, video } = targetMap[targetName];
      const modelEntity = document.getElementById(modelId);
      const videoPlane = document.getElementById(videoPlaneId);
      if (modelEntity) modelEntity.setAttribute("visible", false);
      if (videoPlane) videoPlane.setAttribute("visible", false);
      if (video) video.pause();

      // ★ 기획 의도: 다음 타겟으로 인덱스 이동
      currentTargetIndex++;

      if (currentTargetIndex < targetOrder.length) {
        const nextTarget = targetOrder[currentTargetIndex];
        if (overlay) {
          const overlayImgEl = overlay.querySelector("img");
          if (overlayImgEl) overlayImgEl.src = targetMap[nextTarget].overlayImg;
          overlay.style.display = "flex";
          overlay.style.animation = "none";
          overlay.style.opacity = targetMap[nextTarget].overlayOpacity || "1";
        }
      } else {
        if (typeof options.onAllCollected === "function") {
          options.onAllCollected();
        } else {
          setTimeout(() => {
            alert("모든 아이템을 찾았습니다!");
            if (options.reloadOnComplete) {
              location.reload();
            } else if (
              window.parent &&
              typeof window.parent.routeTo === "function"
            ) {
              window.parent.routeTo(options.nextRoute || "mission");
            }
          }, 2200);
        }
      }
    }

    function enableModelTouch(modelEntity, targetName) {
      modelEntity.classList.add("cantap");
      if (!modelEntity.dataset.touchEnabled) {
        modelEntity.addEventListener("click", () => {
          collectItem(targetName);
        });
        modelEntity.dataset.touchEnabled = "true"; // 등록 완료 꼬리표 붙임
      }
    }

    function fadeInModel(modelEntity) {
      modelEntity.setAttribute("visible", true);
      function startFade() {
        const mesh = modelEntity.getObject3D("mesh");
        if (!mesh) {
          setTimeout(startFade, 100);
          return;
        }
        mesh.traverse((node) => {
          if (node.material) {
            const mats = Array.isArray(node.material)
              ? node.material
              : [node.material];
            mats.forEach((mat) => {
              mat.transparent = true;
              mat.opacity = 0;
            });
          }
        });
        function easeInOutQuad(t) {
          return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        }
        const duration = 1500,
          start = performance.now();
        function fade(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = easeInOutQuad(progress);
          mesh.traverse((node) => {
            if (node.material) {
              const mats = Array.isArray(node.material)
                ? node.material
                : [node.material];
              mats.forEach((mat) => {
                mat.opacity = eased;
              });
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
      video.addEventListener("ended", () => {
        if (activeTarget !== targetName) return;
        const modelEntity = document.getElementById(modelId);
        if (modelEntity) {
          fadeInModel(modelEntity);
          enableModelTouch(modelEntity, targetName);
          const touchHint = document.getElementById("touch-hint");
          if (touchHint) touchHint.style.display = "block";
        }
        video.loop = true;
        video.play();
      });
    }

    const sceneEl = document.querySelector("a-scene");

    // 이벤트 부착 로직 분리
    function attachEvents() {
      sceneEl.addEventListener("xrimagefound", (event) => {
        const name = event.detail.name;
        if (!targetMap[name]) return;

        // ★ 순서 제어 로직 복구 (현재 찾아야 할 타겟이 아니면 무시)
        if (name !== targetOrder[currentTargetIndex]) return;

        if (collected[name]) return;

        activeTarget = name;
        if (overlay) {
          overlay.style.animation = "fadeOut 0.5s forwards";
          setTimeout(() => {
            overlay.style.display = "none";
          }, 500);
        }

        const { video, modelId } = targetMap[name];
        const modelEntity = document.getElementById(modelId);
        video.loop = false;
        video.currentTime = 0;
        video.play().catch(() => {
          document.addEventListener("click", () => video.play(), {
            once: true,
          });
          document.addEventListener("touchstart", () => video.play(), {
            once: true,
          });
        });

        if (modelEntity) {
          modelEntity.setAttribute("visible", false);
          const mesh = modelEntity.getObject3D("mesh");
          if (mesh) {
            mesh.traverse((node) => {
              if (node.material) {
                const mats = Array.isArray(node.material)
                  ? node.material
                  : [node.material];
                mats.forEach((mat) => {
                  mat.transparent = true;
                  mat.opacity = 0;
                });
              }
            });
          }
        }
        bindVideoEnded(name);
      });

      sceneEl.addEventListener("xrimagelost", (event) => {
        const name = event.detail.name;
        if (!targetMap[name]) return;

        if (name === targetOrder[currentTargetIndex] && !collected[name]) {
          if (overlay) {
            const overlayImgEl = overlay.querySelector("img");
            if (overlayImgEl) overlayImgEl.src = targetMap[name].overlayImg;
            overlay.style.display = "flex";
            overlay.style.animation = "none";
            overlay.style.opacity = targetMap[name].overlayOpacity || "1";
          }
        }
      });
    }

    // A-Frame 로드 완료 후 안전하게 이벤트 바인딩
    if (sceneEl.hasLoaded) {
      attachEvents();
    } else {
      sceneEl.addEventListener("loaded", attachEvents);
    }

    window.toggleCollection = toggleCollection;
  }

  window.initArHunt = initArHunt;
})();
