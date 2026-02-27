const animateFaceComponent = {
  init() {
    const faceTextureGltf_ = new THREE.Texture()
    const materialGltf = new THREE.MeshBasicMaterial({
      map: faceTextureGltf_,
      side: THREE.DoubleSide,
      color: 0xffffff,
      toneMapped: false,
      depthWrite: false,
    })

    const renderer = this.el.sceneEl.renderer
    if (renderer) {
      renderer.toneMapping = THREE.NoToneMapping
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace
    }

    let faceMesh = null
    let morphTargets = {}
    let morphInfluences = {}
    let geometry = null
    let faceInitialized = false

    const buildMorphTargets = (verts, n) => {
      const x = [], y = []
      for (let i = 0; i < n; i++) {
        x.push(verts[i*3])
        y.push(verts[i*3+1])
      }
      const cy = y.reduce((a,b)=>a+b,0)/n
      const fh = Math.max(...y) - Math.min(...y)
      const fw = Math.max(...x) - Math.min(...x)

      const eye_top  = cy+fh*0.42, eye_bot  = cy+fh*0.12, eye_mid  = (eye_top+eye_bot)/2
      const nose_top = cy+fh*0.10, nose_bot = cy-fh*0.12, nose_mid = (nose_top+nose_bot)/2
      const mouth_top= cy-fh*0.05, mouth_bot= cy-fh*0.38, mouth_mid= (mouth_top+mouth_bot)/2
      const cheek_top= cy+fh*0.20, cheek_bot= cy-fh*0.15

      const makeDelta = (type) => {
        const d = new Float32Array(n*3)
        for (let i = 0; i < n; i++) {
          const xi = x[i], yi = y[i]
          let dx=0, dy=0, dz=0
          if (type === 'big_eyes') {
            for (const [ecx, test] of [[-fw*0.22, xi<0], [fw*0.22, xi>=0]]) {
              if (!test || yi < eye_bot || yi > eye_top) continue
              const dist = Math.sqrt((xi-ecx)**2 + (yi-eye_mid)**2)
              const w = Math.max(0, 1.0 - dist/(fw*0.30))
              dx += w*(xi-ecx)*0.6; dy += w*(yi-eye_mid)*0.6
            }
          } else if (type === 'big_nose') {
            if (yi > nose_bot && yi < nose_top && Math.abs(xi) < fw*0.25) {
              const dist = Math.sqrt(xi**2 + (yi-nose_mid)**2)
              const w = Math.max(0, 1.0 - dist/(fw*0.25))
              dx=w*xi*0.8; dy=w*(yi-nose_mid)*0.3; dz=-w*fh*0.06
            }
          } else if (type === 'big_mouth') {
            if (yi > mouth_bot && yi < mouth_top) {
              const dist = Math.sqrt(xi**2 + (yi-mouth_mid)**2)
              const w = Math.max(0, 1.0 - dist/(fw*0.48))
              dx=w*xi*0.9; dy=w*(yi-mouth_mid)*0.6
            }
          } else if (type === 'fat_face') {
            if (yi > cheek_bot && yi < cheek_top) {
              dx = Math.sign(xi)*Math.min(1,Math.abs(xi)/(fw*0.5))*fw*0.25
            } else if (yi <= cheek_bot) {
              const jw = Math.min(1,(cheek_bot-yi)/(fh*0.25))
              dx=Math.sign(xi)*jw*fw*0.12; dy=-jw*fh*0.04
            }
          }
          d[i*3]=dx; d[i*3+1]=dy; d[i*3+2]=dz
        }
        return d
      }

      morphTargets = {
        big_eyes:  makeDelta('big_eyes'),
        big_nose:  makeDelta('big_nose'),
        big_mouth: makeDelta('big_mouth'),
        fat_face:  makeDelta('fat_face'),
      }
      morphInfluences = {big_eyes:0, big_nose:0, big_mouth:0, fat_face:0}

      window._faceAnimateSetMorph = (name, value) => {
        if (name in morphInfluences) morphInfluences[name] = value
      }
      document.dispatchEvent(new CustomEvent('faceMorphReady', {
        detail: {targetNames: Object.keys(morphTargets)}
      }))
      console.log('animate-face: morphs ready', Object.keys(morphTargets))
    }

    const onxrloaded = () => {
      window.XR8.addCameraPipelineModule({
        name: 'cameraFeedPipeline',
        onUpdate: (processCpuResult) => {
          if (!processCpuResult) return
          const result = processCpuResult.processCpuResult
          if (result.facecontroller && result.facecontroller.cameraFeedTexture) {
            const texProps = this.el.sceneEl.renderer.properties.get(faceTextureGltf_)
            texProps.__webglTexture = result.facecontroller.cameraFeedTexture
          }
        },
      })
    }
    window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)

    const show = (event) => {
      const {vertices, normals, uvsInCameraFrame, indices} = event.detail

      if (!faceInitialized) {
        faceInitialized = true

        // 첫 프레임 구조 로그
        console.log('=== XR8 face event detail keys:', Object.keys(event.detail))
        console.log('vertices count:', vertices ? vertices.length : 'none')
        console.log('vertices[0]:', vertices ? JSON.stringify(vertices[0]) : 'none')
        console.log('indices type:', indices ? (Array.isArray(indices) ? 'Array' : indices.constructor.name) : 'none')
        console.log('indices length:', indices ? indices.length : 'none')
        console.log('indices[0..5]:', indices ? Array.from(indices.slice ? indices.slice(0,6) : [indices[0],indices[1],indices[2],indices[3],indices[4],indices[5]]) : 'none')
        console.log('uvsInCameraFrame[0]:', uvsInCameraFrame ? JSON.stringify(uvsInCameraFrame[0]) : 'none')

        const n = vertices.length
        geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n*3), 3))
        geometry.setAttribute('normal',   new THREE.BufferAttribute(new Float32Array(n*3), 3))
        geometry.setAttribute('uv',       new THREE.BufferAttribute(new Float32Array(uvsInCameraFrame.length*2), 2))

        // indices 처리 - 타입에 따라 다르게
        if (indices) {
          let idxArr
          if (indices instanceof Uint16Array || indices instanceof Uint32Array) {
            idxArr = indices
          } else if (Array.isArray(indices)) {
            idxArr = new Uint32Array(indices)
          } else {
            // flat number array object
            idxArr = new Uint32Array(Object.values(indices))
          }
          console.log('setIndex with', idxArr.length, 'indices, max=', Math.max(...Array.from(idxArr).slice(0,100)))
          geometry.setIndex(new THREE.BufferAttribute(idxArr, 1))
        } else {
          console.warn('indices is null/undefined - no index buffer set')
        }

        faceMesh = new THREE.Mesh(geometry, materialGltf)
        this.el.setObject3D('faceMesh', faceMesh)

        const base = new Float32Array(n*3)
        for (let i=0; i<n; i++) {
          base[i*3]=vertices[i].x; base[i*3+1]=vertices[i].y; base[i*3+2]=vertices[i].z
        }
        buildMorphTargets(base, n)
      }

      if (!faceMesh) return

      const posAttr  = geometry.attributes.position
      const normAttr = geometry.attributes.normal
      const uvAttr   = geometry.attributes.uv
      const n = vertices.length

      for (let i=0; i<n; i++) {
        let px=vertices[i].x, py=vertices[i].y, pz=vertices[i].z
        for (const [name, inf] of Object.entries(morphInfluences)) {
          if (inf===0) continue
          px += morphTargets[name][i*3]   * inf
          py += morphTargets[name][i*3+1] * inf
          pz += morphTargets[name][i*3+2] * inf
        }
        posAttr.array[i*3]=px; posAttr.array[i*3+1]=py; posAttr.array[i*3+2]=pz
      }
      posAttr.needsUpdate = true

      for (let i=0; i<normals.length; i++) {
        normAttr.array[i*3]=normals[i].x
        normAttr.array[i*3+1]=normals[i].y
        normAttr.array[i*3+2]=normals[i].z
      }
      normAttr.needsUpdate = true

      for (let i=0; i<uvsInCameraFrame.length; i++) {
        uvAttr.array[i*2]=uvsInCameraFrame[i].u
        uvAttr.array[i*2+1]=uvsInCameraFrame[i].v
      }
      uvAttr.needsUpdate = true
    }

    this.el.sceneEl.addEventListener('xrfacefound',   show)
    this.el.sceneEl.addEventListener('xrfaceupdated', show)
  },
}

export {animateFaceComponent}
