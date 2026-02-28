const ensureMaterialArray = (material) => {
  if (!material) {
    return []
  }
  if (Array.isArray(material)) {
    return material
  }
  if (material.materials) {
    return material.materials
  }
  return [material]
}

const applyEnvMap = (mesh, envMap) => {
  if (!mesh) return
  mesh.traverse((node) => {
    if (!node.isMesh) {
      return
    }
    const meshMaterials = ensureMaterialArray(node.material)
    meshMaterials.forEach((material) => {
      if (material && !('envMap' in material)) return
      material.envMap = envMap
      material.needsUpdate = true
    })
  })
}

// Wait until XR8 is available (avoids: Cannot read properties of undefined (reading 'XrController'))
const runWhenXR8Ready = (cb) => {
  if (window.XR8?.XrController) {
    cb()
    return
  }
  // 8th Wall XR8 is usually safe to access after this event
  window.addEventListener(
    'xrloaded',
    () => {
      if (window.XR8?.XrController) cb()
      else console.error('[cubemap-realtime] xrloaded fired but XR8 is still unavailable')
    },
    {once: true}
  )
}

const cubeMapRealtimeComponent = {
  schema: {},

  init() {
    const scene = this.el.sceneEl

    // Track handlers so we can clean up on remove()
    this._xr8ModuleName = 'cubemap-process'
    this._xr8ModuleAdded = false
    this._onModelLoaded = null
    this._onXRLoaded = null

    const camTexture_ = new THREE.Texture()
    const refMat = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      color: 0xffffff,
      map: camTexture_,
    })

    const renderTarget = new THREE.WebGLCubeRenderTarget(256, {
      format: THREE.RGBFormat,
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
      encoding: THREE.sRGBEncoding,
    })

    // cubemap scene
    const cubeMapScene = new THREE.Scene()
    const cubeCamera = new THREE.CubeCamera(1, 1000, renderTarget)

    const sphere = new THREE.SphereGeometry(100, 15, 15)
    const sphereMesh = new THREE.Mesh(sphere, refMat)
    sphereMesh.scale.set(-1, 1, 1)
    sphereMesh.rotation.set(Math.PI, -Math.PI / 2, 0)
    cubeMapScene.add(sphereMesh)

    const startXR8 = () => {
      // Configure lighting once XR8 is ready
      window.XR8.XrController.configure({enableLighting: true})

      // Avoid duplicate modules if component re-inits
      try {
        window.XR8.removeCameraPipelineModule?.(this._xr8ModuleName)
      } catch (e) {
        // ignore if not supported
      }

      window.XR8.addCameraPipelineModule({
        name: this._xr8ModuleName,
        onUpdate: () => {
          cubeCamera.update(scene.renderer, cubeMapScene)
        },
        onProcessCpu: ({frameStartResult}) => {
          const {cameraTexture} = frameStartResult
          // Force initialization: bind XR8 cameraTexture into the THREE texture's WebGLTexture slot
          const texProps = scene.renderer.properties.get(camTexture_)
          texProps.__webglTexture = cameraTexture
        },
      })

      this._xr8ModuleAdded = true
    }

    // Run XR8 code only when ready
    runWhenXR8Ready(startXR8)

    // Apply the cubemap to loaded model
    this._onModelLoaded = () => {
      applyEnvMap(this.el.getObject3D('mesh'), cubeCamera.renderTarget.texture)
    }
    this.el.addEventListener('model-loaded', this._onModelLoaded)
  },

  remove() {
    // Clean up event listener
    if (this._onModelLoaded) {
      this.el.removeEventListener('model-loaded', this._onModelLoaded)
      this._onModelLoaded = null
    }

    // Remove pipeline module if it was added
    if (this._xr8ModuleAdded && window.XR8?.removeCameraPipelineModule) {
      try {
        window.XR8.removeCameraPipelineModule(this._xr8ModuleName)
      } catch (e) {
        // ignore
      }
    }

    this._xr8ModuleAdded = false
  },
}

export {cubeMapRealtimeComponent}
