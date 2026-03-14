import {ShowHideComponent} from './components/sky-show-hide.js'
AFRAME.registerComponent('sky-show-hide', ShowHideComponent)

import {debugComponent} from './components/sky-debug.js'
AFRAME.registerComponent('sky-debug', debugComponent)

import {recenterComponent} from './components/sky-recenter.js'
AFRAME.registerComponent('sky-recenter', recenterComponent)

import {chromaKeyShader} from './components/chroma-key.js'
AFRAME.registerShader('chromakey', chromaKeyShader)

// ✅ FIX: 씬 로드 완료 후 모든 비디오 강제 재생
document.addEventListener('DOMContentLoaded', () => {
  const sceneEl = document.querySelector('a-scene')

  const tryPlayAllVideos = () => {
    const videos = document.querySelectorAll('video')
    videos.forEach(v => {
      v.muted = true
      v.playsInline = true
      v.play().catch(err => {
        console.warn('Video autoplay blocked, waiting for user gesture:', err)
      })
    })
  }

  if (sceneEl) {
    sceneEl.addEventListener('loaded', tryPlayAllVideos)
  }

  // 사용자 첫 인터랙션 시 재생 재시도 (iOS/Android 브라우저 대응)
  const onUserGesture = () => {
    tryPlayAllVideos()
    document.removeEventListener('click', onUserGesture)
    document.removeEventListener('touchstart', onUserGesture)
  }
  document.addEventListener('click', onUserGesture)
  document.addEventListener('touchstart', onUserGesture)
})

AFRAME.registerComponent('play-video', {
  schema: {
    video: {type: 'string'},
    autoplay: {type: 'bool', default: true},
  },

  init() {
    const v = document.querySelector(this.data.video)
    const {el} = this
    let playing = false

    const togglePlayPause = () => {
      if (!playing) {
        v.play()
        playing = true
      } else {
        v.pause()
        playing = false
      }
    }

    if (this.data.autoplay === true) {
      v.muted = true
      v.playsInline = true

      // ✅ FIX: readyState 체크 + Promise 방식으로 안전하게 재생
      const attemptPlay = () => {
        const promise = v.play()
        if (promise !== undefined) {
          promise.catch(() => {
            // 재생 실패 시 사용자 제스처 이후 재시도
            document.addEventListener('touchstart', () => v.play(), {once: true})
            document.addEventListener('click', () => v.play(), {once: true})
          })
        }
      }

      if (v.readyState >= 2) {
        attemptPlay()
      } else {
        v.addEventListener('loadeddata', attemptPlay, {once: true})
        // ✅ FIX: canplay 이벤트도 함께 처리 (loadeddata보다 빠를 수 있음)
        v.addEventListener('canplay', attemptPlay, {once: true})
      }
    } else {
      el.addEventListener('click', togglePlayPause)
    }
  },
})
