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

    // xrfaceloading 이벤트에서 indices 추출 시도
    this.el.sceneEl.addEventListener('xrfaceloading', (e) => {
      console.log('xrfaceloading keys:', Object.keys(e.detail))
      if (e.detail.indices) {
        console.log('xrfaceloading indices found! length:', e.detail.indices.length)
        savedIndices = new Uint32Array(e.detail.indices)
      } else {
        console.log('xrfaceloading detail:', JSON.stringify(e.detail).slice(0, 300))
      }
    })

    const buildMorphTargets = (verts, n) => {
      const x = [], y = []
      for (let i = 0; i < n; i++) { x.push(verts[i*3]); y.push(verts[i*3+1]) }
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
        big_eyes: makeDelta('big_eyes'), big_nose: makeDelta('big_nose'),
        big_mouth: makeDelta('big_mouth'), fat_face: makeDelta('fat_face'),
      }
      morphInfluences = {big_eyes:0, big_nose:0, big_mouth:0, fat_face:0}
      window._faceAnimateSetMorph = (name, value) => {
        if (name in morphInfluences) morphInfluences[name] = value
      }
      document.dispatchEvent(new CustomEvent('faceMorphReady', {
        detail: {targetNames: Object.keys(morphTargets)}
      }))
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

    const initGeometry = (vertices, uvsInCameraFrame) => {
      const n = vertices.length
      geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n*3), 3))
      geometry.setAttribute('normal',   new THREE.BufferAttribute(new Float32Array(n*3), 3))
      geometry.setAttribute('uv',       new THREE.BufferAttribute(new Float32Array(uvsInCameraFrame.length*2), 2))

      if (savedIndices && savedIndices.length > 0) {
        // savedIndices가 있으면 (xrfaceloading에서 가져온 경우) 사용
        geometry.setIndex(new THREE.BufferAttribute(savedIndices, 1))
        console.log('animate-face: using savedIndices from xrfaceloading,', savedIndices.length)
      } else {
        // [핵심 Fix] index 없이 UV 좌표로 Delaunay triangulation
        // UV는 0~1 범위의 2D 좌표 → 이걸로 삼각형 연결
        console.log('animate-face: no indices, building from UV triangulation')
        const triIndices = buildDelaunayFromUV(uvsInCameraFrame)
        if (triIndices) {
          geometry.setIndex(new THREE.BufferAttribute(triIndices, 1))
          savedIndices = triIndices
          console.log('animate-face: triangulation done,', triIndices.length/3, 'triangles')
        }
      }

      faceMesh = new THREE.Mesh(geometry, materialGltf)
      this.el.setObject3D('faceMesh', faceMesh)

      const base = new Float32Array(n*3)
      for (let i=0; i<n; i++) {
        base[i*3]=vertices[i].x; base[i*3+1]=vertices[i].y; base[i*3+2]=vertices[i].z
      }
      buildMorphTargets(base, n)
    }

    // UV 좌표 기반 Delaunay triangulation
    // ear-clipping 대신 간단한 Bowyer-Watson 알고리즘
    const buildDelaunayFromUV = (uvs) => {
      const n = uvs.length
      const pts = uvs.map((uv, i) => [uv.u, uv.v, i])

      // 간단한 구현: super-triangle에서 시작하는 Bowyer-Watson
      // Three.js r158에 포함된 기능 활용
      try {
        // pts를 Float32Array로 변환 (x,y 쌍)
        const coords = new Float32Array(n * 2)
        for (let i = 0; i < n; i++) {
          coords[i*2]   = uvs[i].u
          coords[i*2+1] = uvs[i].v
        }

        // Delaunay class (Three.js에 없으면 수동 구현)
        if (typeof THREE.Delaunay !== 'undefined') {
          const delaunay = new THREE.Delaunay(coords)
          return new Uint32Array(delaunay.triangles)
        }

        // Fallback: 직접 Bowyer-Watson
        return bowyerWatson(uvs)
      } catch(e) {
        console.error('Delaunay error:', e)
        return bowyerWatson(uvs)
      }
    }

    // Bowyer-Watson Delaunay triangulation
    const bowyerWatson = (uvs) => {
      const n = uvs.length
      const points = uvs.map((uv, i) => ({x: uv.u, y: uv.v, i}))

      // super triangle
      const minX = Math.min(...points.map(p=>p.x)) - 1
      const minY = Math.min(...points.map(p=>p.y)) - 1
      const maxX = Math.max(...points.map(p=>p.x)) + 1
      const maxY = Math.max(...points.map(p=>p.y)) + 1
      const dx = maxX - minX, dy = maxY - minY
      const deltaMax = Math.max(dx, dy) * 10

      const sp1 = {x: minX - deltaMax, y: minY - deltaMax, i: n}
      const sp2 = {x: minX + deltaMax*2, y: minY - deltaMax, i: n+1}
      const sp3 = {x: minX, y: minY + deltaMax*2, i: n+2}

      let triangles = [[sp1, sp2, sp3]]

      const circumcircle = (a, b, c) => {
        const ax = a.x - c.x, ay = a.y - c.y
        const bx = b.x - c.x, by = b.y - c.y
        const D = 2 * (ax*by - ay*bx)
        if (Math.abs(D) < 1e-10) return null
        const ux = (by*(ax*ax+ay*ay) - ay*(bx*bx+by*by)) / D
        const uy = (ax*(bx*bx+by*by) - bx*(ax*ax+ay*ay)) / D
        const cx2 = c.x + ux, cy2 = c.y + uy
        const r = Math.sqrt(ux*ux + uy*uy)
        return {x: cx2, y: cy2, r}
      }

      for (const p of points) {
        const badTris = []
        for (const tri of triangles) {
          const cc = circumcircle(...tri)
          if (cc && Math.sqrt((p.x-cc.x)**2 + (p.y-cc.y)**2) < cc.r + 1e-10) {
            badTris.push(tri)
          }
        }

        // 경계 polygon
        const boundary = []
        for (const tri of badTris) {
          for (let e = 0; e < 3; e++) {
            const edge = [tri[e], tri[(e+1)%3]]
            const shared = badTris.some(t => t !== tri &&
              t.some(v => v.i === edge[0].i) && t.some(v => v.i === edge[1].i))
            if (!shared) boundary.push(edge)
          }
        }

        triangles = triangles.filter(t => !badTris.includes(t))
        for (const edge of boundary) {
          triangles.push([edge[0], edge[1], p])
        }
      }

      // super triangle vertex 포함된 삼각형 제거
      triangles = triangles.filter(t =>
        !t.some(v => v.i >= n)
      )

      const result = new Uint32Array(triangles.length * 3)
      for (let i = 0; i < triangles.length; i++) {
        result[i*3]   = triangles[i][0].i
        result[i*3+1] = triangles[i][1].i
        result[i*3+2] = triangles[i][2].i
      }
      console.log(`Bowyer-Watson: ${n} points → ${triangles.length} triangles`)
      return result
    }

    const show = (event) => {
      const {vertices, normals, uvsInCameraFrame} = event.detail

      if (!faceInitialized) {
        faceInitialized = true
        console.log(`animate-face: init ${vertices.length} verts`)
        initGeometry(vertices, uvsInCameraFrame)
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
