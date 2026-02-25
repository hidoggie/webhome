/* globals WEB4DS, ResourceManagerXHR, Model4D, Decoder4D */

import {Model4D} from './model4D_Three.js';

const hologram4dsComponent = () => ({
  schema: {
    'main-4ds': {type: 'asset'},                // 4ds video file to play (mobile version)
    'secondary-4ds': {type: 'asset'},           // 4ds video file to play (desktop version)
    'audio-4ds': {type: 'asset'},               // audio file. Keep blank if no audio or if embedded in 4ds file.
    'size': {default: 1},                       // hologram starting size
    'touch-target-size': {default: '1.5 0.5'},  // size of touch target cylinder: height, radius
    'touch-target-offset': {default: '0 0'},    // offset of touch target cylinder: x, z
    'touch-target-visible': {default: false},   // show touch target for debugging
  },
  init() {
    this.model4DS = null                        // hologram object
    const scene = document.querySelector('a-scene')
    this.prompt = document.getElementById('promptText')
    this.progressBar = document.getElementById('progressBar')
    this.playProgress = document.getElementById('playProgress')
    this.pauseBtn = document.getElementById('pauseBtn')
    this.muteBtn = document.getElementById('muteBtn')
    this.ground = document.getElementById('ground')

    // runs when hologram is loaded and ready for playback
    const readytoplay = () => {
      this.prompt.innerHTML = 'Tap to Place Hologram'
      this.prompt.style.display = 'block'
      this.ground.addEventListener('mousedown', this.placeHologram, {once: true})
    }
  
// 수정 부분
document.querySelector('a-scene').addEventListener('loaded', () => {
//const afscene = AFRAME.scenes[0]; 
//const renderer = afscene.renderer; 
//const camera = afscene.camera;
//

//console.log('renderer:', afscene.renderer); 
//console.log('camera:', afscene.camera);

    this.model4DS = new WEB4DS(
      'Welcome',                   // unique id
      this.data['secondary-4ds'],  // url Desktop format
      this.data['main-4ds'],       // url Mobile format
      this.data['audio-4ds'],      // url Audio
      [0, 0, 0],                   // position
      scene.renderer,              // renderer    수정 scene.renderer 를  renderer 로 변경
      scene,                       // scene
      camera                 // camera
    )
//
});

console.log('this.model4DS class 이후:',this.model4DS)
//

    // Set the option to keep the downloaded data in cache, to avoid a new download upon each loop
    this.model4DS.keepsChunksInCache(false)

    this.model4DS.setWaitingGif(  // empty transparent pixel disables waiting GIF
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    )

    // This loads (i.e. starts downloading) the 4ds file data.
    this.model4DS.load(
      false,       // showPlaceholder: displays the first frame while loading
      false,       // playOnLoad: play sequence automatically after it has loaded
      readytoplay  // runs after the sequence has been loaded
    )

    this.placeHologram = (event) => {
      // hide "Tap to Place Hologram" text + show playback UI
      this.prompt.style.display = 'none'
      this.pauseBtn.style.display = 'block'
      this.muteBtn.style.display = 'block'
      this.progressBar.style.display = 'block'

      // place hologram at touchpoint
      const touchPoint = event.detail.intersection.point
      this.el.object3D.position.set(touchPoint.x, 0, touchPoint.z)

      // ensures hologram is always being rendered
      this.model4DS.model4D.mesh.frustumCulled = false

      // rotates hologram towards camera for initial placement
      const camRot = this.el.sceneEl.camera.el.object3D.rotation
      const thisRot = this.el.object3D.rotation
      thisRot.set(thisRot.x, camRot.y - Math.PI / 2, thisRot.z)

      // begin hologram playback
      this.model4DS.play()

      // add a cylinder primitive to receive raycasting for gestures.
      // It is raised slightly off the ground to support tapping on the ground.
      const [tapVolumeHeight, tapVolumeRadius] =
      this.data['touch-target-size'].split(' ').map(v => Number(v))
      const [tapTargetOffsetX, tapTargetOffsetZ] =
      this.data['touch-target-offset'].split(' ').map(v => Number(v))
      const touchTargetAlpha = this.data['touch-target-visible'] ? 0.2 : 0.0

      this.el.insertAdjacentHTML('beforeend', `
      <a-entity 
        geometry="primitive: cylinder; height: ${tapVolumeHeight - 0.15}; radius: ${tapVolumeRadius}" 
        material="transparent: true; opacity: ${touchTargetAlpha}; depthTest: false;" 
        position="${tapTargetOffsetX} ${(tapVolumeHeight - 0.15) * 0.5 + 0.15} ${tapTargetOffsetZ}" 
        class="cantap"
        shadow="cast: false; receive: false">
      </a-entity>`)

      // animate hologram in from a small scale to its end scale
      const minS = this.data.size / 50
      const maxS = this.data.size
      this.el.setAttribute('scale', `${minS} ${minS} ${minS}`)
      this.el.setAttribute('animation', {
        property: 'scale',
        to: `${maxS} ${maxS} ${maxS}`,
        easing: 'easeOutElastic',
        dur: 800,
        delay: 300,
      })
    }

    // Play/Pause functionality
    const playImg = require('./assets/icons/play.svg')
    const pauseImg = require('./assets/icons/pause.svg')
    const pauseHolo = () => {
      if (this.model4DS.isPlaying) {
        this.pauseBtn.src = playImg
        this.model4DS.pause()  // pause hologram
      } else {
        this.pauseBtn.src = pauseImg
        this.model4DS.play()  // play hologram
      }
    }
    this.pauseBtn.addEventListener('click', pauseHolo)

    // Mute/Unmute functionality
    const muteImg = require('./assets/icons/mute.svg')
    const soundImg = require('./assets/icons/sound.svg')
    const muteHolo = () => {
      if (!this.model4DS.isMuted) {
        this.muteBtn.src = muteImg
        this.model4DS.mute()    // mute hologram
      } else {
        this.muteBtn.src = soundImg
        this.model4DS.unmute()  // unmute hologram
      }
    }
    this.muteBtn.addEventListener('click', muteHolo)
  },
  tick() {
    if (this.model4DS != null && this.model4DS.isLoaded) {
      this.model4DS.update()
      if (this.playProgress != null) {
        this.playProgress.style.width =
            `${(100 * (this.model4DS.currentFrame / this.model4DS.sequenceTotalLength))}%`
      }
    }
  },
})

const hologram4dsPrimitive = () => ({
  defaultComponents: {
    holo4ds: {},
  },
  mappings: {
    'main-4ds': 'holo4ds.main-4ds',
    'secondary-4ds': 'holo4ds.secondary-4ds',
    'audio-4ds': 'holo4ds.audio-4ds',
    'size': 'holo4ds.size',
    'touch-target-size': 'holo4ds.touch-target-size',
    'touch-target-offset': 'holo4ds.touch-target-offset',
    'touch-target-visible': 'holo4ds.touch-target-visible',
  },
})

export {hologram4dsComponent, hologram4dsPrimitive}

/// ///////////////////////4DViews web4dvImporter.js///////////////////////////////////////////////

const resourceManager = new ResourceManagerXHR()

// MAIN CLASS MANAGING A 4DS
class WEB4DS {
  constructor(id, urlD, urlM, urlA, position, renderer, scene, camera) {
    // properties
    this.id = id  // unique id
    this.urlD = urlD  // url Desktop format
    this.urlM = urlM  // url Mobile format
    this.urlA = urlA  // url Audio
    this.position = position
    this.renderer = renderer
    this.scene = scene
    this.camera = camera

    this.model4D = new Model4D()
    this.sequenceTotalLength = 0
    this.sequenceDecodedFrames = 0

console.log('class WEB4DS 내:', this.model4D)  //추가

    // Options
    this.showPlaceholder = false
    this.playOnload = true

    // Status
    this.isLoaded = false
    this.isPlaying = false
    this.isAudioloaded = false
    this.isAudioplaying = false
    this.wasPlaying = true
    this.isDecoding = false
    this.isMuted = false

    // Audio
    this.audioListener = null
    this.audioSound = null
    this.audioLoader = null
    // for cross browser compatibility
    const AudioContext = window.AudioContext || window.webkitAudioContext
    this.audioCtx = new AudioContext()
    this.gainNode = null
    this.audioStartOffset = 0
    this.audioStartTime = 0
    this.audioPassedTime = 0
    this.audioTrack = null
    this.audioLevel = null

    this.frameOffset = 0

    // Loop
    this.playbackLoop = null
    this.decodeLoop = null

    // this.firstChunks = true

    this.currentMesh = null
    this.currentFrame = null
    this.frameOffset = 0

    // Waiter
    this.waiterParent = this.renderer.domElement
    this.waiterElemLogo = new Image(320, 320)
    this.waiterLoaded = false

    if (this.waiterParent) {
      this.waiterParent.style.zIndex = '1'

      this.waiterElem = document.createElement('div')
      const waiterElemOpacity = 50

      this.waiterElem.id = 'web4dv-waiter'
      this.waiterElem.style.position = 'absolute'
      this.waiterElem.style.backgroundImage = 'red'
      this.waiterElem.style.top = '50%'
      this.waiterElem.style.left = '50%'
      this.waiterElem.style.width = '320px'
      this.waiterElem.style.height = '320px'
      this.waiterElem.style.marginTop = '-160px'
      this.waiterElem.style.marginLeft = '-160px'
      this.waiterElem.style.opacity = (waiterElemOpacity / 100)
      this.waiterElem.style.zIndex = '2'

      this.waiterElemLogo.src = 'https://dev.fourdviews.com/assets/waiter.gif'

      if (this.waiterLoaded === false) {
        this.waiterParent.parentNode.insertBefore(this.waiterElem, this.waiterParent.nextSibling)
        this.waiterElem.appendChild(this.waiterElemLogo)
        const waiterHtml = document.getElementById('web4dv-waiter')
        waiterHtml.style.display = 'none'

        this.waiterLoaded = true
      }
    }
  }

  initSequence(nbFrames, nbBlocs, framerate, maxVertices, maxTriangles, textureEncoding, textureSizeX, textureSizeY, modelPosition) {
    const vertices = new Float32Array(maxVertices * 3)
    const uvs = new Float32Array(maxVertices * 2)
    const indices = new Uint32Array(maxTriangles * 3)
    const normals = new Float32Array(maxVertices * 3)

    this.model4D.initMesh(vertices, uvs, indices, normals, textureEncoding, textureSizeX, textureSizeY, modelPosition)

    document.querySelector('hologram-4ds').object3D.add(this.model4D.mesh)
    this.scene.object3D.add(this.model4D.surface)
    this.scene.object3D.add(this.model4D.light)

    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMapSoft = true
  }

  // methods
  load(showPlaceholder, playOnload, callback) {
    if (!this.isLoaded) {
      this.showPlaceholder = showPlaceholder
      this.playOnload = playOnload

      if (this.renderer.extensions.get('WEBGL_compressed_texture_astc')) {
        resourceManager.set4DSFile(this.urlM)
        Decoder4D.SetInputTextureEncoding(164)
      } else {
        resourceManager.set4DSFile(this.urlD)
        Decoder4D.SetInputTextureEncoding(100)
      }

      resourceManager.Open(() => {
        const si = resourceManager._sequenceInfo

        this.initSequence(si.NbFrames, si.NbBlocs, si.Framerate, si.MaxVertices, si.MaxTriangles, si.TextureEncoding, si.TextureSizeX, si.TextureSizeY, this.position)  // Get sequence information

        this.Decode()  // Start decoding, downloading

        this.loadAudio(this.urlA)

        const waiterHtml = document.getElementById('web4dv-waiter')

        const waiter = setInterval(() => {
          if (Decoder4D._meshesCache.length >= Decoder4D._maxCacheSize) {
            clearInterval(waiter)  // Stop the waiter loop

            if (this.waiterElem) {  // Hide Waiter
              waiterHtml.style.display = 'none'
            }

            if (showPlaceholder === true) {  // Placeholder equals frame 0
              // Display the frame 0
              this.currentMesh = Decoder4D._meshesCache.shift()
              this.currentFrame = this.currentMesh.frame
              this.updateSequenceMesh(this.currentMesh)
            } else {  // Else, play sequence
              if (this.playOnload === true || this.playOnload == null) {
                this.play()
              }
              if (callback) {
                callback()
              }
            }
          } else {
            // Start waiter animation
            if (this.waiterElem && !this.waiterDisplayed) {  // Display waiter
              waiterHtml.style.display = 'block'
              this.waiterDisplayed = true
            }
          }
        }, 0.1)

        this.isLoaded = true
        this.sequenceTotalLength = si.NbFrames
      })
    } else {
      alert('A sequence is already loaded. One sequence at a time.')
    }
  }

  updateSequenceMesh(mesh) {
    this.model4D.updateMesh(mesh.vertices, mesh.faces, mesh.uvs, mesh.normals, mesh.texture, mesh.nbVertices, mesh.nbFaces)
  }

  // Decode 4D Sequence
  Decode() {
    if (this.isDecoding) {
      return
    }

    const dt = 1000.0 / (resourceManager._sequenceInfo.FrameRate * 6)

    this.isDecoding = true

    /* Decoding loop, 3*fps */
    this.decodeLoop = setInterval(() => {
      /* Decode chunk */
      for (let i = 0; i < 6; i++) Decoder4D.DecodeChunk()

      /* If a few chunks, download more */
      const maxCache = resourceManager._sequenceInfo.NbFrames * 2 < 300 ? resourceManager._sequenceInfo.NbFrames * 2 : 300

      if (Decoder4D._chunks4D.length < maxCache || (Decoder4D._keepChunksInCache === true && Decoder4D._chunks4D.length < resourceManager._sequenceInfo.NbFrames * 2)) {
        resourceManager._internalCacheSize = 6000000  // 6 Mo
        resourceManager.getBunchOfChunks()
      }

      this.sequenceDecodedFrames = Decoder4D._meshesCache.length
    }, dt)
  }

  stopDecoding() {
    clearInterval(this.decodeLoop)
    this.isDecoding = false
  }

  // For now, will pause any WEB4DV object created (function is generic)
  pause() {
    clearInterval(this.playbackLoop)
    this.isPlaying = false

    if (Decoder4D._meshesCache >= Decoder4D._maxCacheSize) {
      this.stopDecoding()
    }
    this.pauseAudio()
    this.frameOffset = this.currentFrame
  }

  // For now, will play any WEB4DV object created (function is generic)
  play(autoUpdate) {
    if (this.isPlaying) {  // If sequence is already playing, do nothing
      return
    }

    this.showPlaceholder = false

    // If not decoding, decode
    this.Decode()
    this.playAudio()

    this.isPlaying = true

    this.lastUpdateTime = 0

    this.startDate = Date.now() / 1000
    this.seqDuration = resourceManager._sequenceInfo.NbFrames / resourceManager._sequenceInfo.FrameRate
    this.timeOffset = this.frameOffset / resourceManager._sequenceInfo.FrameRate

    if (autoUpdate) {
      const dt = 1000.0 / (resourceManager._sequenceInfo.FrameRate)
      this.playbackLoop = setInterval(() => {
        this.update()
      }, dt)
    }
  }

  update() {
    if (!this.isPlaying) {
      return
    }

    let frameToDisplay = 0
    // if audio, base time on audio playback
    if (this.isAudioloaded) {
      if (this.isAudioplaying === true) {
        this.audioPassedTime = this.audioCtx.currentTime - this.audioStartTime

        // loop
        if ((this.audioStartOffset + this.audioPassedTime) > this.seqDuration) {
          this.audioStartTime += (this.seqDuration - this.audioStartOffset)
          this.audioPassedTime -= (this.seqDuration - this.audioStartOffset)
          this.audioStartOffset = 0
          this.currentFrame = -1
        }

        frameToDisplay = (this.audioStartOffset + this.audioPassedTime) * resourceManager._sequenceInfo.FrameRate
      }
    } else {  // no audio, base time on system
      let passedTime = (Date.now() / 1000) - this.startDate

      if ((this.timeOffset + passedTime) > this.seqDuration) {
        this.startDate += (this.seqDuration - this.timeOffset)
        passedTime -= (this.seqDuration - this.timeOffset)
        this.timeOffset = 0
        this.currentFrame = -1
      }

      frameToDisplay = (this.timeOffset + passedTime) * resourceManager._sequenceInfo.FrameRate
    }

    // get first mesh if needed
    if (this.currentMesh == null) {
      this.currentMesh = Decoder4D._meshesCache.shift()
      if (this.currentMesh) this.currentFrame = this.currentMesh.frame
    }

    while (this.currentMesh && this.currentFrame != parseInt(frameToDisplay) && Decoder4D._meshesCache.length > 0) {
      this.currentMesh = Decoder4D._meshesCache.shift()
      this.currentFrame = this.currentMesh.frame
    }

    if (this.currentFrame === -1) this.pauseAudio()
    else if (this.isAudioplaying === false) this.playAudio()

    /* update buffers for rendering */
    this.updateSequenceMesh(this.currentMesh)
  }

  loadAudio(audioFile) {
    if (typeof this.camera !== 'undefined') {
      this.model4D.initAudio(this.audioCtx)

      this.camera.add(this.model4D.audioListener)
      this.gainNode = this.audioCtx.createGain()

      if (audioFile !== '') {
        this.model4D.loadAudioFile(audioFile, this.isAudioloaded, () => {
          this.gainNode.gain.value = 1.0
          this.isAudioloaded = true
        })
      } else if (resourceManager._audioTrack !== 'undefined' && resourceManager._audioTrack !== [] && resourceManager._audioTrack !== '') {
        this.audioCtx.decodeAudioData(resourceManager._audioTrack, (buffer) => {
          this.model4D.setAudioBuffer(buffer)
          this.gainNode.gain.value = 1.0
          this.isAudioloaded = true
        })
      }
    } else {
      alert('Please add a camera to your scene or set your camera to var = camera. AudioListener not attached.')
    }
  }

  playAudio() {
    if (this.isAudioplaying === false) {
      this.audioTrack = this.audioCtx.createBufferSource()
      this.audioTrack.loop = true
      this.audioTrack.buffer = this.model4D.audioSound.buffer
      this.audioTrack.connect(this.gainNode)
      this.gainNode.connect(this.audioCtx.destination)
      if (this.isMuted) this.gainNode.gain.value = 0

      this.audioStartOffset = this.currentFrame / resourceManager._sequenceInfo.FrameRate

      this.audioTrack.start(this.audioCtx.currentTime, this.audioStartOffset)

      this.isAudioplaying = true
      this.audioStartTime = this.audioCtx.currentTime
    }
  }

  pauseAudio() {
    if (this.isAudioplaying === true) {
      if (this.audioTrack) this.audioTrack.stop()

      this.isAudioplaying = false
    }
  }

  restartAudio() {
    if (this.audioTrack) this.audioTrack.stop()
    this.isAudioplaying = false
    this.audioPassedTime = 0

    this.playAudio()
  }

  // For now, will mute any WEB4DV object created (function is generic)
  mute() {
    this.audioLevel = this.gainNode.gain.value
    this.gainNode.gain.value = 0
    this.isMuted = true
  }

  // For now, will unmute any WEB4DV object created (function is generic)
  unmute() {
    this.isMuted = false

    if (this.audioLevel) {
      this.gainNode.gain.value = this.audioLevel
    } else {
      this.gainNode.gain.value = 0.5
    }
  }

  keepsChunksInCache(booleanVal) {
//    Decoder4D._keepChunksInCache = booleanVal
     console.log('model4D', model4D); 
     console.log('this.model4D', this.model4D); 

     if (this.model4D) {   //수정
       this.model4D.keepsChunksInCache(booleanVal);    //수정
     }
  }

  setWaitingGif(url) {
	  this.waiterElemLogo.src = url
  }

  destroy(callback) {
    clearInterval(this.playbackLoop)
    this.stopDecoding()

    if (this.model4D.audioSound) {
      if (this.audioTrack) {
        this.audioTrack.stop()
      }

      this.model4D.audioLoader = null
      this.model4D.audioSound = null
      this.model4D.audioListener = null

      this.audioStartTime = 0
      this.audioStartOffset = 0
      this.audioPassedTime = 0
    }

    resourceManager.reinitResources()

    if (this.isLoaded) {
      this.scene.remove(this.model4D.mesh)
    }

    this.isLoaded = false
    this.isPlaying = false
    this.isDecoding = false
    this.isAudioplaying = false
    this.isAudioloaded = false
    this.currentMesh = null

    Decoder4D._meshesCache = []
    Decoder4D._chunks4D = []

    // Reset Sequence Infos
    this.currentFrame = 0
    this.sequenceTotalLength = 0
    this.sequenceDecodedFrames = 0

    // Callback
    if (callback) {
      callback()
    }
  }
}