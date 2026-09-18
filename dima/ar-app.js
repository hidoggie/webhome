// ============================================================================
// Tiger Pose Quest — 2-step Web AR verification game
//
// STEP 1 (pose auth)   : MediaPipe Tasks Vision GestureRecognizer running on
//                        its own getUserMedia camera stream. Detects the
//                        built-in "Thumb_Up" / "Victory" gestures.
// STEP 2 (image recog) : 8th Wall Web (XR8) + A-Frame + XRExtras, using the
//                        SAME image-target pipeline as ../curved-aframe in
//                        this repo. The tiger photo is pre-compiled into
//                        ./tiger-target.json (see /tools/compile-target.mjs
//                        for how that file + ./assets/tiger-target.png were
//                        generated with the official @8thwall/image-target-cli).
// ============================================================================

// NOTE: MediaPipe is loaded with a *dynamic* import inside getGestureRecognizer()
// rather than a static top-level import. If this ever failed as a static import
// (CDN hiccup, ad-blocker, offline test, ...), the whole module would throw and
// none of the UI below — tabs, the start button, screens 2-4 — would work at all.
// A dynamic import lets a CDN failure degrade gracefully to just an on-screen
// error on the pose step instead of a dead page.
const MEDIAPIPE_CDN_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1";

// ---------------------------------------------------------------------------
// 8th Wall: register the built-in CanvasScreenshot pipeline module
// ---------------------------------------------------------------------------
// This MUST happen before XR8.run() (which the A-Frame `xrweb` component
// triggers automatically once <a-scene xrweb> is mounted), so we register it
// once here at module load — either immediately if the engine script has
// already finished loading (window.XR8 exists), or on the 'xrloaded' event
// it dispatches once it has (the standard 8th Wall boilerplate pattern).
//
// Why we need this at all: A-Frame's own built-in `screenshot` component
// (what the previous version of this file used) calls renderer.render(...)
// a second time to grab a frame. That re-render does NOT go through 8th
// Wall's own camera pipeline (the step that blits the live camera feed into
// the canvas each frame), so the captured image can come out with the AR
// content but a missing/blank camera background, or fail outright depending
// on buffer state. XR8.CanvasScreenshot hooks directly into 8th Wall's own
// render pipeline instead, so it reliably captures exactly what's on screen
// (camera feed + AR overlay together) as a base64 JPEG string. See
// https://www.8thwall.com/docs/api/canvasscreenshot/takescreenshot/
function registerCanvasScreenshotModule() {
  const addModule = () => {
    if (window.XR8 && window.XR8.CanvasScreenshot) {
      XR8.addCameraPipelineModules([XR8.CanvasScreenshot.pipelineModule()]);
    } else {
      console.warn("XR8.CanvasScreenshot module not available — AR photo capture will be skipped.");
    }
  };
  if (window.XR8) {
    addModule();
  } else {
    window.addEventListener("xrloaded", addModule);
  }
}
registerCanvasScreenshotModule();

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const MEDIAPIPE_WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const MEDIAPIPE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";

// Maps our UI pose ids to MediaPipe's built-in gesture category names.
const POSE_GESTURE_MAP = {
  thumbs_up: "Thumb_Up",
  victory: "Victory",
};
const POSE_LABEL_KO = {
  thumbs_up: "엄지척 포즈",
  victory: "V 포즈",
};

const GESTURE_CONFIDENCE_THRESHOLD = 0.65;
const POSE_HOLD_MS = 1200; // how long the gesture must be held to pass
const IMAGE_TARGET_NAME = "tiger-target";
const IMAGE_TIMEOUT_MS = 25000; // give up automatically after this long

// ---------------------------------------------------------------------------
// Shared state
// ---------------------------------------------------------------------------
const state = {
  selectedPose: "thumbs_up",
  facingMode: "environment",
  poseStream: null,
  gestureRecognizer: null,
  poseRafId: null,
  holdStartedAt: null,
  poseDone: false,
  poseFrameUrl: null,
  imageFrameUrl: null,
  resultPhotoBlob: null,
  currentSceneEl: null,
  xrConfigured: false,
  imageTimeoutHandle: null,
  imageTimerRafId: null,
  imageStartedAt: null,
  imageFound: false,
};

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------
const $ = (sel) => document.querySelector(sel);

const screens = {
  intro: $("#screen-intro"),
  pose: $("#screen-pose"),
  image: $("#screen-image"),
  result: $("#screen-result"),
};

function showScreen(name) {
  Object.values(screens).forEach((el) => el.classList.remove("active"));
  screens[name].classList.add("active");
}

// ---------------------------------------------------------------------------
// INTRO SCREEN
// ---------------------------------------------------------------------------
document.querySelectorAll("#pose-tabs .tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll("#pose-tabs .tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    state.selectedPose = tab.dataset.pose;
  });
});

$("#btn-start").addEventListener("click", () => {
  resetGameState();
  showScreen("pose");
  enterPoseScreen();
});

// ---------------------------------------------------------------------------
// STEP 1 — POSE AUTH (MediaPipe GestureRecognizer)
// ---------------------------------------------------------------------------
async function getGestureRecognizer() {
  if (state.gestureRecognizer) return state.gestureRecognizer;
  const { GestureRecognizer, FilesetResolver } = await import(MEDIAPIPE_CDN_URL);
  const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_BASE);
  state.gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MEDIAPIPE_MODEL_URL,
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numHands: 1,
  });
  return state.gestureRecognizer;
}

async function startPoseCamera() {
  stopPoseCamera();
  const video = $("#pose-video");
  const constraints = {
    audio: false,
    video: {
      facingMode: state.facingMode,
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  };
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  state.poseStream = stream;
  video.srcObject = stream;
  await new Promise((resolve) => {
    if (video.readyState >= 2) return resolve();
    video.onloadedmetadata = () => resolve();
  });
  await video.play();
}

function stopPoseCamera() {
  if (state.poseStream) {
    state.poseStream.getTracks().forEach((t) => t.stop());
    state.poseStream = null;
  }
  if (state.poseRafId) {
    cancelAnimationFrame(state.poseRafId);
    state.poseRafId = null;
  }
}

async function enterPoseScreen() {
  const poseKo = POSE_LABEL_KO[state.selectedPose];
  $("#pose-banner-text").textContent = `${poseKo}를 인식시켜 주세요`;
  $("#pose-status-label").textContent = "포즈 인식 대기중";
  $("#guide-icon").dataset.icon = state.selectedPose;
  $("#guide-icon").classList.remove("matched");
  setRingProgress(0);
  state.holdStartedAt = null;
  state.poseDone = false;

  try {
    await startPoseCamera();
  } catch (err) {
    console.error(err);
    $("#pose-status-label").textContent = "카메라를 사용할 수 없어요";
    alert(
      "카메라 접근에 실패했어요. 브라우저의 카메라 권한을 확인한 뒤 다시 시도해주세요.\n\n" +
        err.message
    );
    return;
  }

  try {
    await getGestureRecognizer();
    poseLoop();
  } catch (err) {
    console.error(err);
    $("#pose-status-label").textContent = "포즈 인식 모델을 불러오지 못했어요";
    alert(
      "손 포즈 인식 모델(MediaPipe)을 불러오지 못했어요. 인터넷 연결 상태를 확인한 뒤 " +
        "다시 시도해주세요.\n\n" +
        err.message
    );
  }
}

function setRingProgress(ratio) {
  const circumference = 327; // 2 * PI * 52, matches the SVG circle in index.html
  const clamped = Math.max(0, Math.min(1, ratio));
  $("#progress-ring-fg").style.strokeDashoffset = String(circumference * (1 - clamped));
}

function poseLoop() {
  const video = $("#pose-video");

  const tick = () => {
    if (state.poseDone) return;
    if (video.readyState >= 2 && state.gestureRecognizer) {
      const now = performance.now();
      const result = state.gestureRecognizer.recognizeForVideo(video, now);
      handleGestureResult(result, now);
    }
    state.poseRafId = requestAnimationFrame(tick);
  };
  state.poseRafId = requestAnimationFrame(tick);
}

function handleGestureResult(result, now) {
  const targetGesture = POSE_GESTURE_MAP[state.selectedPose];
  let matched = false;

  if (result.gestures && result.gestures.length > 0) {
    const top = result.gestures[0][0]; // best category for the first detected hand
    if (top && top.categoryName === targetGesture && top.score >= GESTURE_CONFIDENCE_THRESHOLD) {
      matched = true;
    }
  }

  const guideIcon = $("#guide-icon");

  if (matched) {
    guideIcon.classList.add("matched");
    if (!state.holdStartedAt) state.holdStartedAt = now;
    const elapsed = now - state.holdStartedAt;
    setRingProgress(elapsed / POSE_HOLD_MS);
    $("#pose-status-label").textContent = "포즈 유지해주세요...";

    if (elapsed >= POSE_HOLD_MS) {
      onPoseSuccess();
    }
  } else {
    guideIcon.classList.remove("matched");
    state.holdStartedAt = null;
    setRingProgress(0);
    $("#pose-status-label").textContent = "포즈 인식 대기중";
  }
}

async function onPoseSuccess() {
  state.poseDone = true;
  $("#pose-status-label").textContent = "PERFECT!";

  // capture the winning pose frame — used later as one half of the single
  // merged result photo, so keep it plain/unlabelled (no per-shot banner).
  state.poseFrameUrl = captureVideoSnapshot($("#pose-video"));

  const overlay = $("#step-transition");
  $("#transition-bg").src = state.poseFrameUrl;
  overlay.classList.add("visible");

  // let the fade-in finish while the (still-live) pose video is hidden behind it,
  // THEN stop the camera and swap screens underneath — invisible to the user.
  await wait(400);
  stopPoseCamera();
  showScreen("image");
  await enterImageScreen(); // mounts the AR scene and resolves once its camera is live (or times out)

  overlay.classList.remove("visible");
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

$("#btn-flip-camera").addEventListener("click", async () => {
  state.facingMode = state.facingMode === "environment" ? "user" : "environment";
  try {
    await startPoseCamera();
  } catch (err) {
    console.error(err);
  }
});

// ---------------------------------------------------------------------------
// STEP 2 — IMAGE RECOGNITION (8th Wall / A-Frame / XRExtras)
// ---------------------------------------------------------------------------
function buildArSceneMarkup() {
  // NOTE: no `screenshot` component and no `preserveDrawingBuffer` here —
  // neither reliably captures 8th Wall's composited camera+AR frame (see the
  // big comment above registerCanvasScreenshotModule() for why). The actual
  // capture happens via XR8.CanvasScreenshot.takeScreenshot() in
  // captureArSnapshot() below, which is registered as a camera pipeline
  // module once at module load.
  return `
    <a-scene
      xrextras-loading
      xrextras-runtime-error
      renderer="colorManagement: true; physicallyBasedRendering: true;"
      xrweb="disableWorldTracking: true">

      <a-camera position="0 1 1" raycaster="objects: .cantap" cursor="fuse: false; rayOrigin: mouse;"></a-camera>
      <a-light type="directional" intensity="1.2" position="0 1 0"></a-light>
      <a-light type="ambient" intensity="0.35"></a-light>

      <xrextras-named-image-target name="${IMAGE_TARGET_NAME}" id="tiger-target-entity">
        <a-plane
          class="found-frame"
          material="color:#22c55e; opacity:0.18; transparent:true; shader:flat;"
          width="1" height="1.3"
          position="0 0 0.01">
        </a-plane>
      </xrextras-named-image-target>
    </a-scene>
  `;
}

async function enterImageScreen() {
  $("#image-banner-text").textContent = "호랑이 이미지를 화면 안에 비춰주세요";
  $("#image-status-label").textContent = "이미지 스캔 중...";
  $("#image-timer-bar").style.width = "100%";
  state.imageFound = false;
  state.imageStartedAt = performance.now();

  const mount = $("#ar-mount");
  mount.innerHTML = buildArSceneMarkup();
  const sceneEl = mount.querySelector("a-scene");
  const targetEl = mount.querySelector("#tiger-target-entity");
  state.currentSceneEl = sceneEl;

  // 8th Wall's engine dispatches the low-level "xrimagefound"/"xrimagelost"
  // events on the <a-scene>, and the xrextras-named-image-target wrapper
  // (once it matches by name) re-emits the friendlier "xrextrasfound"/
  // "xrextraslost" on the target entity itself. We listen for both so this
  // still works even if one naming contract shifts between XRExtras builds.
  const onFound = (e) => {
    if (!e.detail || e.detail.name === IMAGE_TARGET_NAME) onImageFound();
  };
  const onLost = (e) => {
    if ((!e.detail || e.detail.name === IMAGE_TARGET_NAME) && !state.imageFound) {
      $("#image-status-label").textContent = "이미지 스캔 중...";
    }
  };
  sceneEl.addEventListener("xrimagefound", onFound);
  sceneEl.addEventListener("xrimagelost", onLost);
  if (targetEl) {
    targetEl.addEventListener("xrextrasfound", onFound);
    targetEl.addEventListener("xrextraslost", onLost);
  }

  const onXrLoaded = async () => {
    try {
      const res = await fetch("./tiger-target.json");
      const json = await res.json();
      window.XR8.XrController.configure({ imageTargetData: [json] });
      state.xrConfigured = true;
    } catch (err) {
      console.error("Failed to load tiger-target.json", err);
      $("#image-status-label").textContent = "이미지 타겟 데이터를 불러오지 못했어요.";
    }
  };
  if (window.XR8) {
    onXrLoaded();
  } else {
    window.addEventListener("xrloaded", onXrLoaded, { once: true });
  }

  startImageTimeout();
  await waitForArReady(sceneEl);
}

// Resolves once the AR camera pipeline appears to be actually running, so the
// transition overlay only fades out once there's a live camera feed underneath
// it (never a black or half-initialized frame). "xrimagescanning" is 8th
// Wall's own signal that image-target scanning has started on live frames;
// since its exact availability can vary by engine build, this is raced
// against a short bounded timeout so the reveal never hangs indefinitely.
function waitForArReady(sceneEl, timeoutMs = 2200) {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    sceneEl.addEventListener("xrimagescanning", finish, { once: true });
    setTimeout(finish, timeoutMs);
  });
}

function startImageTimeout() {
  clearImageTimers();

  const tick = () => {
    if (state.imageFound) return;
    const elapsed = performance.now() - state.imageStartedAt;
    const remainRatio = Math.max(0, 1 - elapsed / IMAGE_TIMEOUT_MS);
    $("#image-timer-bar").style.width = `${remainRatio * 100}%`;
    if (elapsed >= IMAGE_TIMEOUT_MS) {
      onImageTimeout();
      return;
    }
    state.imageTimerRafId = requestAnimationFrame(tick);
  };
  state.imageTimerRafId = requestAnimationFrame(tick);
}

function clearImageTimers() {
  if (state.imageTimerRafId) {
    cancelAnimationFrame(state.imageTimerRafId);
    state.imageTimerRafId = null;
  }
  if (state.imageTimeoutHandle) {
    clearTimeout(state.imageTimeoutHandle);
    state.imageTimeoutHandle = null;
  }
}

function onImageFound() {
  if (state.imageFound) return;
  state.imageFound = true;
  clearImageTimers();
  $("#image-status-label").textContent = "인식 성공!";
  $("#image-banner-text").textContent = "호랑이를 찾았어요!";

  // Give the green highlight plane a beat to actually render before we
  // snapshot, then capture through XR8.CanvasScreenshot BEFORE tearing the
  // AR scene down (it needs the camera session to still be live).
  setTimeout(async () => {
    state.imageFrameUrl = await captureArSnapshot();
    teardownArScene();
    finishGame(true);
  }, 400);
}

async function onImageTimeout() {
  state.imageFrameUrl = await captureArSnapshot();
  teardownArScene();
  finishGame(false);
}

$("#btn-give-up").addEventListener("click", async () => {
  clearImageTimers();
  state.imageFrameUrl = await captureArSnapshot();
  teardownArScene();
  finishGame(false);
});

// Captures the live 8th Wall AR view (camera feed + AR overlay, composited)
// via the built-in XR8.CanvasScreenshot pipeline module registered in
// registerCanvasScreenshotModule() above. This replaced an earlier attempt
// that used A-Frame's own `screenshot` component: that component calls
// renderer.render(...) a second time, which does NOT go through 8th Wall's
// own per-frame camera blit, so it could come back with a missing camera
// background (or a blank image) instead of the actual AR photo.
// Must be called BEFORE teardownArScene()/XR8.stop() — the pipeline module
// needs the live camera session to still be running to grab a frame.
async function captureArSnapshot() {
  try {
    if (!window.XR8 || !XR8.CanvasScreenshot) return null;
    const base64Jpeg = await XR8.CanvasScreenshot.takeScreenshot();
    if (!base64Jpeg) return null;
    return "data:image/jpeg;base64," + base64Jpeg;
  } catch (err) {
    console.warn("Could not capture AR snapshot", err);
    return null;
  }
}

function teardownArScene() {
  clearImageTimers();
  try {
    if (window.XR8 && typeof window.XR8.stop === "function") window.XR8.stop();
  } catch (err) {
    console.warn("XR8.stop() failed", err);
  }
  state.currentSceneEl = null;
  $("#ar-mount").innerHTML = "";
}

// ---------------------------------------------------------------------------
// RESULT SCREEN
// ---------------------------------------------------------------------------
async function finishGame(success) {
  showScreen("result");

  const icon = $("#result-icon");
  icon.classList.remove("success", "fail", "pop-in");
  void icon.offsetWidth; // restart animation
  icon.classList.add(success ? "success" : "fail", "pop-in");
  icon.textContent = success ? "✓" : "✕";

  $("#result-title").textContent = success ? "인증 성공!" : "인증 실패";
  $("#result-sub").textContent = success
    ? "포즈 인증과 이미지 인식을 모두 완료했어요."
    : "호랑이 이미지를 다시 인식시켜 도전해보세요.";

  const photoImg = $("#result-photo");
  const downloadBtn = $("#btn-download");

  if (!state.poseFrameUrl && !state.imageFrameUrl) {
    photoImg.style.visibility = "hidden";
    downloadBtn.style.display = "none";
    return;
  }

  downloadBtn.disabled = true;
  downloadBtn.textContent = "사진 준비 중...";

  const blob = await composeResultPhoto(success);
  state.resultPhotoBlob = blob;

  if (blob) {
    photoImg.src = URL.createObjectURL(blob);
    photoImg.style.visibility = "visible";
    downloadBtn.style.display = "inline-flex";
    downloadBtn.disabled = false;
    downloadBtn.textContent = "사진 저장하기";
  } else {
    photoImg.style.visibility = "hidden";
    downloadBtn.style.display = "none";
  }
}

$("#btn-retry").addEventListener("click", () => {
  resetGameState();
  showScreen("intro");
});

$("#btn-download").addEventListener("click", async () => {
  const blob = state.resultPhotoBlob;
  if (!blob) return;
  const fileName = "tiger-quest-result.png";

  // Prefer the Web Share API on mobile: <a download> with a data/blob URL is
  // unreliable on iOS Safari (it tends to just open the image instead of
  // saving it), while navigator.share's file support reliably offers
  // "Save Image" through the native share sheet.
  const file = new File([blob], fileName, { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "타이거 포즈 인증 퀘스트" });
      return;
    } catch (err) {
      if (err && err.name === "AbortError") return; // user cancelled the share sheet
      console.warn("navigator.share failed, falling back to download link", err);
    }
  }

  // Fallback for desktop browsers: a temporary, click-triggered <a download>
  // (same pattern A-Frame's own screenshot component uses internally).
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
});

// ---------------------------------------------------------------------------
// Snapshot helpers
// ---------------------------------------------------------------------------
function captureVideoSnapshot(videoEl) {
  const canvas = document.createElement("canvas");
  canvas.width = videoEl.videoWidth || 720;
  canvas.height = videoEl.videoHeight || 960;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

// Draws the pose frame and the AR frame edge-to-edge (no gap) into a single
// canvas so the result reads as one photo, with one shared caption strip
// underneath — not two separate cropped tiles with a border between them.
function composeResultPhoto(success) {
  const canvas = $("#compose-canvas");
  const panelW = 540;
  const panelH = 720;
  const captionH = 70;
  canvas.width = panelW * 2;
  canvas.height = panelH + captionH;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#100f16";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const drawPanel = (src, x) =>
    new Promise((resolve) => {
      if (!src) return resolve();
      const img = new Image();
      img.onload = () => {
        // cover-fit into the panel so both frames fill it edge-to-edge
        // with no letterboxing, matching a real seamless photo strip.
        const scale = Math.max(panelW / img.width, panelH / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        ctx.drawImage(img, x + (panelW - drawW) / 2, (panelH - drawH) / 2, drawW, drawH);
        resolve();
      };
      img.onerror = resolve;
      img.src = src;
    });

  return Promise.all([
    drawPanel(state.poseFrameUrl, 0),
    drawPanel(state.imageFrameUrl, panelW),
  ]).then(() => {
    // thin seam so the join between the two frames still reads intentionally
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillRect(panelW - 1, 0, 2, panelH);

    ctx.fillStyle = success ? "#22c55e" : "#ef4444";
    ctx.font = "700 34px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      success ? "TIGER QUEST · SUCCESS" : "TIGER QUEST · FAILED",
      canvas.width / 2,
      panelH + captionH / 2
    );

    return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  });
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------
function resetGameState() {
  stopPoseCamera();
  teardownArScene();
  $("#step-transition").classList.remove("visible");
  state.holdStartedAt = null;
  state.poseDone = false;
  state.poseFrameUrl = null;
  state.imageFrameUrl = null;
  state.resultPhotoBlob = null;
  state.imageFound = false;
  setRingProgress(0);
}
