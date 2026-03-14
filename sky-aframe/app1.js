import {ShowHideComponent} from './components/sky-show-hide.js'
AFRAME.registerComponent('sky-show-hide', ShowHideComponent)

import {debugComponent} from './components/sky-debug.js'
AFRAME.registerComponent('sky-debug', debugComponent)

import {recenterComponent} from './components/sky-recenter.js'
AFRAME.registerComponent('sky-recenter', recenterComponent)

import {chromaKeyShader} from './components/chroma-key.js'
AFRAME.registerShader('chromakey', chromaKeyShader)

AFRAME.registerComponent('play-video', {
  schema: {
    video: {type: 'string'},
    autoplay: {type: 'bool', default: true},
  },

  init() {
    const v = document.querySelector(this.data.video)
    const {el} = this
    let playing = false

    // Function to handle play and pause
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
      v.muted = true  // Ensure the video is muted

      if (v.readyState >= 2) {  // Check if video data is available
        v.play()
      } else {
        // Wait for video data to be loaded, then play
        v.on('loadeddata', () => {
          v.play()
        })
      }
    } else {
      // Add tap event listener to play/pause
      el.on('click', togglePlayPause)
    }
  },
})

//import {skyRemoteAuthoringComponent} from './components/sky-remote-authoring.js'
//AFRAME.registerComponent('sky-remote-authoring', skyRemoteAuthoringComponent)

//import {deviceOrientationComponent} from './components/device-orientation.js'
//AFRAME.registerComponent('device-orientation', deviceOrientationComponent)
