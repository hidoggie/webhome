const animateFaceComponent = {
  init() {
    this.once = true

    const faceTextureGltf_ = new THREE.Texture()
    const materialGltf = new THREE.MeshBasicMaterial({map: faceTextureGltf_, side: THREE.DoubleSide})

    let faceGltf
    this.el.addEventListener('model-loaded', () => {
      faceGltf = this.el.getObject3D('mesh')
      let materialReplaced = false
      faceGltf.traverse((node) => {
        if (!materialReplaced || node.material) {
          node.material = materialGltf
          materialReplaced = true
        }
      })
    })

    const onxrloaded = () => {
      window.XR8.addCameraPipelineModule({
        name: 'cameraFeedPipeline',
        onUpdate: (processCpuResult) => {
          if (!processCpuResult) {
            console.log('no processCpuResult')
            return
          }
          const result = processCpuResult.processCpuResult
          if (result.facecontroller && result.facecontroller.cameraFeedTexture) {
            const {cameraFeedTexture} = processCpuResult.processCpuResult.facecontroller
            const texPropsGltf = this.el.sceneEl.renderer.properties.get(faceTextureGltf_)
            texPropsGltf.__webglTexture = cameraFeedTexture
          }
        },
      })
    }
    window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)

    const show = (event) => {
      // [Fix 1] faceGltf 또는 children[0]이 아직 준비되지 않은 경우 방어
      if (!faceGltf || !faceGltf.children || !faceGltf.children[0]) {
        console.warn('animate-face: faceGltf not ready yet, skipping frame.')
        return
      }

      const geometry = faceGltf.children[0].geometry
      if (!geometry) {
        console.warn('animate-face: geometry not found on faceGltf.children[0]')
        return
      }

      const {uvsInCameraFrame} = event.detail

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
      const uvs = new Float32Array(uvsInCameraFrame.length * 2)
      for (let i = 0; i < uvsInCameraFrame.length; ++i) {
        uvs[i * 2]     = uvsInCameraFrame[i].u
        uvs[i * 2 + 1] = uvsInCameraFrame[i].v
      }
      geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))

      // Update vertex normals.
      // [Fix 2] normals.array 를 통해 실제 Float32Array에 접근해야 함
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
