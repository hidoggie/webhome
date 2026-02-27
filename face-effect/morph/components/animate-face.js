const animateFaceComponent = {
  init() {
    this.once = true

    const faceTextureGltf_ = new THREE.Texture()
    const materialGltf = new THREE.MeshBasicMaterial({map: faceTextureGltf_, side: THREE.DoubleSide})

    let faceMesh  // [Fix] children[0] 대신 실제 geometry가 있는 Mesh를 직접 찾아 저장

    this.el.addEventListener('model-loaded', () => {
      const faceGltf = this.el.getObject3D('mesh')

      // [Fix] traverse로 실제 geometry가 있는 첫번째 Mesh를 찾음
      faceGltf.traverse((node) => {
        if (!faceMesh && node.isMesh && node.geometry) {
          faceMesh = node
          console.log('animate-face: faceMesh found -', faceMesh.name)
          // DEBUG: morph target 구조 확인용 로그
          console.log('morphTargetInfluences:', faceMesh.morphTargetInfluences)
          console.log('morphTargetDictionary:', faceMesh.morphTargetDictionary)
          console.log('userData:', JSON.stringify(faceMesh.userData))
        }
        if (node.material) {
          node.material = materialGltf
        }
      })

      if (!faceMesh) {
        console.warn('animate-face: no mesh with geometry found in model')
      }
    })

    const onxrloaded = () => {
      window.XR8.addCameraPipelineModule({
        name: 'cameraFeedPipeline',
        onUpdate: (processCpuResult) => {
          if (!processCpuResult) return
          const result = processCpuResult.processCpuResult
          if (result.facecontroller && result.facecontroller.cameraFeedTexture) {
            const {cameraFeedTexture} = result.facecontroller
            const texPropsGltf = this.el.sceneEl.renderer.properties.get(faceTextureGltf_)
            texPropsGltf.__webglTexture = cameraFeedTexture
          }
        },
      })
    }
    window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)

    const show = (event) => {
      if (!faceMesh) return  // 모델 아직 로드 안 됨, 조용히 스킵

      const geometry = faceMesh.geometry

      // Update vertex positions.
      const vertices = new Float32Array(event.detail.vertices.length * 3)
      for (let i = 0; i < event.detail.vertices.length; ++i) {
        vertices[i * 3]     = event.detail.vertices[i].x
        vertices[i * 3 + 1] = event.detail.vertices[i].y
        vertices[i * 3 + 2] = event.detail.vertices[i].z
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
      geometry.attributes.position.needsUpdate = true

      // Update UVs.
      const {uvsInCameraFrame} = event.detail
      const uvs = new Float32Array(uvsInCameraFrame.length * 2)
      for (let i = 0; i < uvsInCameraFrame.length; ++i) {
        uvs[i * 2]     = uvsInCameraFrame[i].u
        uvs[i * 2 + 1] = uvsInCameraFrame[i].v
      }
      geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))

      // Update vertex normals.
      const normals = geometry.attributes.normal
      if (normals) {
        for (let i = 0; i < event.detail.normals.length; ++i) {
          normals.array[i * 3]     = event.detail.normals[i].x
          normals.array[i * 3 + 1] = event.detail.normals[i].y
          normals.array[i * 3 + 2] = event.detail.normals[i].z
        }
        normals.needsUpdate = true
      }
    }

    this.el.sceneEl.addEventListener('xrfacefound', show)
    this.el.sceneEl.addEventListener('xrfaceupdated', show)
  },
}

export {animateFaceComponent}
