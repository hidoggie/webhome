const ensureMaterialArray = (material) => {
  if (!material) return []
  if (Array.isArray(material)) return material
  if (material.materials) return material.materials
  return [material]
}

const applyEnvMap = (mesh, envMap) => {
  if (!mesh) return
  mesh.traverse((node) => {
    if (!node.isMesh) return
    const meshMaterials = ensureMaterialArray(node.material)
    meshMaterials.forEach((material) => {
      if (material && !('envMap' in material)) return
      material.envMap = envMap
      material.needsUpdate = true
    })
  })
}

const cubeMapRealtimeComponent = {
  schema: {},

  init() {
    const scene = this.el.sceneEl

    this._xr8ModuleName = 'cubemap-process'
    this._xr8ModuleAdded = false
    this._onModelLoaded = null

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

    const cubeMapScene = new THREE.Scene()
    const cubeCamera = new THREE.CubeCamera(1, 1000, renderTarget)

    const sphere = new THREE.SphereGeometry(100, 15, 15)
    const sphereMesh = new THREE.Mesh(sphere, refMat)
    sphereMesh.scale.set(-1, 1, 1)
    sphereMesh.rotation.set(Math.PI, -Math.PI / 2, 0)
    cubeMapScene.add(sphereMesh)

    const startXR8Module = () => {
      // 이미 등록된 경우 중복 방지
      if (this._xr8ModuleAdded) return

      try {
        window.XR8.removeCameraPipelineModule?.(this._xr8ModuleName)
      } catch (e) {}

      window.XR8.addCameraPipelineModule({
        name: this._xr8ModuleName,
        onBeforeRun: () => {
          // ✅ XR 세션이 완전히 시작된 뒤 configure 호출
          try {
            window.XR8.XrController.configure({ enableLighting: true })
          } catch (e) {
            console.warn('[cubemap-realtime] configure failed:', e)
          }
        },
        onUpdate: () => {
          cubeCamera.update(scene.renderer, cubeMapScene)
        },
        onProcessCpu: ({ frameStartResult }) => {
          const { cameraTexture } = frameStartResult
          const texProps = scene.renderer.properties.get(camTexture_)
          texProps.__webglTexture = cameraTexture
        },
      })

      this._xr8ModuleAdded = true
    }

    // ✅ xrloaded 이벤트만 사용 (XR8.XrController 즉시 접근 금지)
    //    xrloaded 시점에도 XrController가 null일 수 있으므로
    //    실제 configure는 onBeforeRun(첫 프레임 직전)으로 지연
    const tryStart = () => {
      if (window.XR8) {
        startXR8Module()
      } else {
        window.addEventListener('xrloaded', startXR8Module, { once: true })
      }
    }

    // A-Frame scene이 로드된 뒤 시작
    if (scene.hasLoaded) {
      tryStart()
    } else {
      scene.addEventListener('loaded', tryStart, { once: true })
    }

    // 모델 로드 후 envMap 적용
    this._onModelLoaded = () => {
      applyEnvMap(this.el.getObject3D('mesh'), cubeCamera.renderTarget.texture)
    }
    this.el.addEventListener('model-loaded', this._onModelLoaded)
  },

  remove() {
    if (this._onModelLoaded) {
      this.el.removeEventListener('model-loaded', this._onModelLoaded)
      this._onModelLoaded = null
    }
    if (this._xr8ModuleAdded && window.XR8?.removeCameraPipelineModule) {
      try {
        window.XR8.removeCameraPipelineModule(this._xr8ModuleName)
      } catch (e) {}
    }
    this._xr8ModuleAdded = false
  },
}

export { cubeMapRealtimeComponent }
