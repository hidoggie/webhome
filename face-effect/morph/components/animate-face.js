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
    let savedIndices = null

    // 인접 vertex 맵 구축 (index 기반)
    const buildAdjacency = (indices, vertCount) => {
      const adj = Array.from({length: vertCount}, () => new Set())
      for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i], b = indices[i+1], c = indices[i+2]
        adj[a].add(b); adj[a].add(c)
        adj[b].add(a); adj[b].add(c)
        adj[c].add(a); adj[c].add(b)
      }
      return adj.map(s => Array.from(s))
    }

    // delta를 인접 vertex 기준으로 여러 번 평활화
    const smoothDelta = (delta, adj, iterations = 3) => {
      const n = delta.length / 3
      const out = new Float32Array(delta)
      const tmp = new Float32Array(n * 3)
      for (let iter = 0; iter < iterations; iter++) {
        for (let i = 0; i < n; i++) {
          const neighbors = adj[i]
          if (neighbors.length === 0) {
            tmp[i*3]=out[i*3]; tmp[i*3+1]=out[i*3+1]; tmp[i*3+2]=out[i*3+2]
            continue
          }
          // 자신 + 이웃 평균 (자신 가중치 2배)
          let sx = out[i*3]*2, sy = out[i*3+1]*2, sz = out[i*3+2]*2
          for (const j of neighbors) {
            sx += out[j*3]; sy += out[j*3+1]; sz += out[j*3+2]
          }
          const cnt = neighbors.length + 2
          tmp[i*3]=sx/cnt; tmp[i*3+1]=sy/cnt; tmp[i*3+2]=sz/cnt
        }
        out.set(tmp)
      }
      return out
    }

    const buildMorphTargets = (verts, indices) => {
      const n = verts.length / 3
      const x = [], y = []
      for (let i = 0; i < n; i++) {
        x.push(verts[i*3])
        y.push(verts[i*3+1])
      }

      const cy = y.reduce((a,b)=>a+b,0)/n
      const fh = Math.max(...y) - Math.min(...y)
      const fw = Math.max(...x) - Math.min(...x)

      // 영역 정의
      const eye_top  = cy+fh*0.42, eye_bot  = cy+fh*0.12, eye_mid  = (cy+fh*0.42+cy+fh*0.12)/2
      const nose_top = cy+fh*0.10, nose_bot = cy-fh*0.12, nose_mid = (cy+fh*0.10+cy-fh*0.12)/2
      const mouth_top= cy-fh*0.05, mouth_bot= cy-fh*0.38, mouth_mid= (cy-fh*0.05+cy-fh*0.38)/2
      const cheek_top= cy+fh*0.20, cheek_bot= cy-fh*0.15

      // [Fix] 배율을 줄여서 mesh 뒤집힘 방지
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
              // [Fix] 배율 1.4 → 0.6
              dx += w*(xi-ecx)*0.6; dy += w*(yi-eye_mid)*0.6
            }
          } else if (type === 'big_nose') {
            if (yi > nose_bot && yi < nose_top && Math.abs(xi) < fw*0.25) {
              const dist = Math.sqrt(xi**2 + (yi-nose_mid)**2)
              const w = Math.max(0, 1.0 - dist/(fw*0.25))
              // [Fix] 배율 2.0 → 0.8, z돌출 줄임
              dx=w*xi*0.8; dy=w*(yi-nose_mid)*0.3; dz=-w*fh*0.06
            }
          } else if (type === 'big_mouth') {
            if (yi > mouth_bot && yi < mouth_top) {
              const dist = Math.sqrt(xi**2 + (yi-mouth_mid)**2)
              const w = Math.max(0, 1.0 - dist/(fw*0.48))
              // [Fix] 배율 2.2 → 0.9
              dx=w*xi*0.9; dy=w*(yi-mouth_mid)*0.6
            }
          } else if (type === 'fat_face') {
            if (yi > cheek_bot && yi < cheek_top) {
              // [Fix] 배율 0.5 → 0.25
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

      // 인접 맵 구축 후 smoothing 적용
      const adj = buildAdjacency(indices, n)

      morphTargets = {
        big_eyes:  smoothDelta(makeDelta('big_eyes'),  adj, 4),
        big_nose:  smoothDelta(makeDelta('big_nose'),  adj, 4),
        big_mouth: smoothDelta(makeDelta('big_mouth'), adj, 4),
        fat_face:  smoothDelta(makeDelta('fat_face'),  adj, 4),
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
        console.log(`animate-face: init ${vertices.length} verts, ${indices ? indices.length/3 : '?'} faces`)
        faceInitialized = true

        if (indices && indices.length > 0) {
          savedIndices = new Uint32Array(indices)
        }

        geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices.length*3), 3))
        geometry.setAttribute('normal',   new THREE.BufferAttribute(new Float32Array(vertices.length*3), 3))
        geometry.setAttribute('uv',       new THREE.BufferAttribute(new Float32Array(uvsInCameraFrame.length*2), 2))
        if (savedIndices) {
          geometry.setIndex(new THREE.BufferAttribute(savedIndices, 1))
        }

        faceMesh = new THREE.Mesh(geometry, materialGltf)
        this.el.setObject3D('faceMesh', faceMesh)

        const base = new Float32Array(vertices.length*3)
        for (let i=0; i<vertices.length; i++) {
          base[i*3]=vertices[i].x; base[i*3+1]=vertices[i].y; base[i*3+2]=vertices[i].z
        }
        // [Fix] indices를 buildMorphTargets에 전달해서 smoothing에 활용
        buildMorphTargets(base, savedIndices || [])
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
