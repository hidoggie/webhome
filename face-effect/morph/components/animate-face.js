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
      const {uvsInCameraFrame} = event.detail

      const vertices = new Float32Array(event.detail.vertices.length * 3)
      // Update vertex positions.
      for (let i = 0; i < event.detail.vertices.length; ++i) {
        vertices[i * 3] = event.detail.vertices[i].x
        vertices[i * 3 + 1] = event.detail.vertices[i].y
        vertices[i * 3 + 2] = event.detail.vertices[i].z
      }
      faceGltf.children[0].geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
      faceGltf.children[0].geometry.attributes.position.needsUpdate = true

      const uvs = new Float32Array(uvsInCameraFrame.length * 2)
      for (let i = 0; i < uvsInCameraFrame.length; ++i) {
        uvs[i * 2] = uvsInCameraFrame[i].u
        uvs[i * 2 + 1] = uvsInCameraFrame[i].v
      }

      faceGltf.children[0].geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))

      // Update vertex normals.
      const normals = faceGltf.children[0].geometry.attributes.normal
      for (let i = 0; i < event.detail.normals.length; ++i) {
        normals[i * 3] = event.detail.normals[i].x
        normals[i * 3 + 1] = event.detail.normals[i].y
        normals[i * 3 + 2] = event.detail.normals[i].z
      }
      faceGltf.children[0].geometry.attributes.normal.needsUpdate = true
    }

    this.el.sceneEl.addEventListener('xrfacefound', show)
    this.el.sceneEl.addEventListener('xrfaceupdated', show)
  },
}

export {animateFaceComponent}