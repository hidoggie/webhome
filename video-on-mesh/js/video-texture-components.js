const videoTextureComponent = {
  schema: {
    'video': {type: 'string'},
  },
  init() {
    const video = document.querySelector(this.data.video)
    const texture = new THREE.VideoTexture(video)
    video.play()

    const applyVideoMaterial = (mesh) => {
      if (!mesh) {
        return
      }
      if (mesh.material) {
        // replaces every material that can take a diffuse map with video texture
        mesh.material.map = texture
      }
      mesh.traverse((node) => {
        if (node.isMesh) {
          node.material.map = texture
        }
      })
    }

    this.el.addEventListener(
      'model-loaded', () => applyVideoMaterial(this.el.getObject3D('mesh'))
    )
  },
}

const videoTextureCameraRollComponent = {
  schema: {
    'video': {type: 'string'},
  },
  init() {
    const uploadBtn = document.getElementById('uploadBtn')
    const video = document.querySelector(this.data.video)
    const texture = new THREE.VideoTexture(video)
    texture.encoding = THREE.sRGBEncoding
    video.play()

    const applyVideoMaterial = (mesh) => {
      if (!mesh) {
        return
      }
      const screen = mesh.getObjectByName('Cube001_1')
      screen.material.map = texture
      screen.material.map.flipY = false
      screen.material.map.needsUpdate = true
    }

    this.el.addEventListener(
      'model-loaded', () => applyVideoMaterial(this.el.getObject3D('mesh'))
    )

    const iOS15Check = () => {
      const {os, osVersion, browser} = XR8.XrDevice.deviceEstimate()
      const errorText = ''
      if (os === 'iOS') {
        switch (osVersion) {
          case '15.0':
          case '15.0.1':
          case '15.0.2':
          case '15.1':
          case '15.1.1':
            // Video texture upload not available in iOS 15
            break
          default:
            // Show video texture upload button for other iOS versions
            uploadBtn.style.display = 'block'
            break
        }
      } else {
        // Show video texture upload button for Android
        uploadBtn.style.display = 'block'
      }
    }
    window.XR8 ? iOS15Check() : window.addEventListener('xrloaded', iOS15Check)

    document.getElementById('file').addEventListener('change', () => {
      const file = document.getElementById('file').files[0]
      const reader = new FileReader()
      reader.onload = (e) => {
        video.src = e.target.result
        const vidTex = new THREE.VideoTexture(video)
        applyVideoMaterial(this.el.getObject3D('mesh'))
        video.play()
      }
      reader.readAsDataURL(file)
    })
  },
}

export {videoTextureComponent, videoTextureCameraRollComponent}
