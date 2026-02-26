// Patched to be resilient to timing (model not yet loaded) and glTF scene graph differences.
// - Avoids assuming children[0] is the mesh
// - Guards against null/undefined before touching geometry
// - Writes normals via BufferAttribute.array (the safe Three.js way)

const animateFaceComponent = {
  init() {
    // Texture that will be backed by XR8's camera feed WebGL texture.
    const faceTextureGltf = new THREE.Texture()
    const materialGltf = new THREE.MeshBasicMaterial({ map: faceTextureGltf, side: THREE.DoubleSide })

    // We will resolve the first Mesh with a geometry inside the loaded glTF.
    let faceRoot = null
    let faceMesh = null

    const resolveFaceMesh = () => {
      if (faceMesh) return faceMesh
      if (!faceRoot) return null

      faceRoot.traverse((node) => {
        // Pick the first renderable mesh that has geometry.
        if (!faceMesh && node && node.isMesh && node.geometry) {
          faceMesh = node
        }
        // Replace material on meshes (keep behaviour close to original).
        if (node && node.isMesh) {
          node.material = materialGltf
        }
      })

      return faceMesh
    }

    // Wait for the model to load before attempting to update geometry.
    this.el.addEventListener('model-loaded', () => {
      faceRoot = this.el.getObject3D('mesh') || null
      faceMesh = null // reset and re-resolve from the new root
      resolveFaceMesh()
    })

    // XR8 camera-feed → Three texture bridge.
    const onxrloaded = () => {
      if (!window.XR8) return

      window.XR8.addCameraPipelineModule({
        name: 'cameraFeedPipeline',
        onUpdate: (processCpuResult) => {
          if (!processCpuResult || !processCpuResult.processCpuResult) return

          const result = processCpuResult.processCpuResult
          const cameraFeedTexture = result?.facecontroller?.cameraFeedTexture
          if (!cameraFeedTexture) return

          // A-Frame renderer may not be ready on the first few frames.
          const renderer = this.el?.sceneEl?.renderer
          if (!renderer || !renderer.properties) return

          const texProps = renderer.properties.get(faceTextureGltf)
          if (!texProps) return

          // This is how 8th Wall samples hook XR8 WebGL textures into Three textures.
          texProps.__webglTexture = cameraFeedTexture
        },
      })
    }

    window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)

    const show = (event) => {
      // Ensure we have a mesh/geometry to write into.
      const mesh = resolveFaceMesh()
      const geom = mesh?.geometry
      if (!geom) return

      const detail = event?.detail
      if (!detail || !detail.vertices || !detail.normals || !detail.uvsInCameraFrame) return

      const { uvsInCameraFrame } = detail

      // --- Positions ---
      const verts = detail.vertices
      const positions = new Float32Array(verts.length * 3)
      for (let i = 0; i < verts.length; i++) {
        positions[i * 3] = verts[i].x
        positions[i * 3 + 1] = verts[i].y
        positions[i * 3 + 2] = verts[i].z
      }
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      if (geom.attributes.position) geom.attributes.position.needsUpdate = true

      // --- UVs ---
      const uvs = new Float32Array(uvsInCameraFrame.length * 2)
      for (let i = 0; i < uvsInCameraFrame.length; i++) {
        uvs[i * 2] = uvsInCameraFrame[i].u
        uvs[i * 2 + 1] = uvsInCameraFrame[i].v
      }
      geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
      if (geom.attributes.uv) geom.attributes.uv.needsUpdate = true

      // --- Normals ---
      // Prefer updating an existing normal attribute to avoid reallocations every frame.
      const nrmAttr = geom.attributes.normal
      const nrms = detail.normals

      if (nrmAttr && nrmAttr.array) {
        const arr = nrmAttr.array
        const n = Math.min(nrms.length, arr.length / 3)
        for (let i = 0; i < n; i++) {
          arr[i * 3] = nrms[i].x
          arr[i * 3 + 1] = nrms[i].y
          arr[i * 3 + 2] = nrms[i].z
        }
        nrmAttr.needsUpdate = true
      } else {
        const normals = new Float32Array(nrms.length * 3)
        for (let i = 0; i < nrms.length; i++) {
          normals[i * 3] = nrms[i].x
          normals[i * 3 + 1] = nrms[i].y
          normals[i * 3 + 2] = nrms[i].z
        }
        geom.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
        if (geom.attributes.normal) geom.attributes.normal.needsUpdate = true
      }
    }

    // Listen for face events emitted by XR8 / 8frame.
    this.el.sceneEl.addEventListener('xrfacefound', show)
    this.el.sceneEl.addEventListener('xrfaceupdated', show)
  },
}

export { animateFaceComponent }
