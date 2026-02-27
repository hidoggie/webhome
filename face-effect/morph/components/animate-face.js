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
    let loadingUVs = null  // xrfaceloading에서 받은 고정 UV

    // xrfaceloading: indices + 고정 UV 모두 저장
    this.el.sceneEl.addEventListener('xrfaceloading', (e) => {
      const {indices, uvs} = e.detail
      if (indices) {
        savedIndices = indices instanceof Uint32Array ? indices : new Uint32Array(indices)
        console.log('xrfaceloading: indices', savedIndices.length, '→', savedIndices.length/3, 'triangles')
      }
      if (uvs) {
        loadingUVs = uvs  // [{u,v}, ...] 형태 또는 flat array
        console.log('xrfaceloading: uvs length', Array.isArray(uvs) ? uvs.length : 'typed:'+uvs.length)
      }
    })

    const buildMorphTargets = (verts, n) => {
      const x = [], y = []
      for (let i = 0; i < n; i++) {
        x.push(verts[i*3])
        y.push(verts[i*3+1])
      }

      const cx = x.reduce((a,b)=>a+b,0)/n
      const cy = y.reduce((a,b)=>a+b,0)/n
      const yArr = [...y], xArr = [...x]
      const fh = Math.max(...yArr) - Math.min(...yArr)
      const fw = Math.max(...xArr) - Math.min(...xArr)

      console.log(`buildMorphTargets: n=${n}, fw=${fw.toFixed(3)}, fh=${fh.toFixed(3)}, cy=${cy.toFixed(3)}`)

      // 얼굴 영역 (실제 vertex 분포 기반)
      const eye_top   = cy + fh * 0.40
      const eye_bot   = cy + fh * 0.10
      const eye_mid   = (eye_top + eye_bot) / 2
      const nose_top  = cy + fh * 0.08
      const nose_bot  = cy - fh * 0.15
      const nose_mid  = (nose_top + nose_bot) / 2
      const mouth_top = cy - fh * 0.05
      const mouth_bot = cy - fh * 0.40
      const mouth_mid = (mouth_top + mouth_bot) / 2
      const cheek_top = cy + fh * 0.25
      const cheek_bot = cy - fh * 0.10

      const makeDelta = (type) => {
        const d = new Float32Array(n * 3)
        let affected = 0
        for (let i = 0; i < n; i++) {
          const xi = x[i], yi = y[i]
          let dx = 0, dy = 0, dz = 0

          if (type === 'big_eyes') {
            // 눈 영역: 좌우 각각
            for (const [ecx, test] of [
              [cx - fw * 0.22, xi < cx],
              [cx + fw * 0.22, xi >= cx]
            ]) {
              if (!test) continue
              if (yi < eye_bot || yi > eye_top) continue
              const dist = Math.sqrt((xi - ecx) ** 2 + (yi - eye_mid) ** 2)
              const radius = fw * 0.25
              const w = Math.max(0, 1.0 - dist / radius)
              dx += w * (xi - ecx) * 1.2
              dy += w * (yi - eye_mid) * 1.2
            }
          } else if (type === 'big_nose') {
            if (yi > nose_bot && yi < nose_top && Math.abs(xi - cx) < fw * 0.22) {
              const dist = Math.sqrt((xi - cx) ** 2 + (yi - nose_mid) ** 2)
              const w = Math.max(0, 1.0 - dist / (fw * 0.22))
              dx = w * (xi - cx) * 1.5
              dy = w * (yi - nose_mid) * 0.5
              dz = -w * fh * 0.10
            }
          } else if (type === 'big_mouth') {
            if (yi > mouth_bot && yi < mouth_top) {
              const dist = Math.sqrt((xi - cx) ** 2 + (yi - mouth_mid) ** 2)
              const w = Math.max(0, 1.0 - dist / (fw * 0.45))
              dx = w * (xi - cx) * 1.6
              dy = w * (yi - mouth_mid) * 1.0
            }
          } else if (type === 'fat_face') {
            if (yi > cheek_bot && yi < cheek_top) {
              const fromCenter = Math.abs(xi - cx)
              const w = Math.min(1, fromCenter / (fw * 0.4))
              dx = Math.sign(xi - cx) * w * fw * 0.35
            } else if (yi <= cheek_bot) {
              const jw = Math.min(1, (cheek_bot - yi) / (fh * 0.2))
              dx = Math.sign(xi - cx) * jw * fw * 0.15
              dy = -jw * fh * 0.06
            }
          }

          if (dx !== 0 || dy !== 0 || dz !== 0) affected++
          d[i*3] = dx; d[i*3+1] = dy; d[i*3+2] = dz
        }
        // max delta 확인
        let maxD = 0
        for (let i = 0; i < n; i++) {
          const m = Math.sqrt(d[i*3]**2 + d[i*3+1]**2 + d[i*3+2]**2)
          if (m > maxD) maxD = m
        }
        console.log(`  ${type}: ${affected}/${n} vertices affected, maxDelta=${maxD.toFixed(4)}`)
        return d
      }

      morphTargets = {
        big_eyes:  makeDelta('big_eyes'),
        big_nose:  makeDelta('big_nose'),
        big_mouth: makeDelta('big_mouth'),
        fat_face:  makeDelta('fat_face'),
      }
      morphInfluences = {big_eyes: 0, big_nose: 0, big_mouth: 0, fat_face: 0}

      window._faceAnimateSetMorph = (name, value) => {
        if (name in morphInfluences) {
          morphInfluences[name] = value
          console.log(`setMorph: ${name} = ${value}, delta max sample: ${morphTargets[name] ? morphTargets[name][0].toFixed(4) : 'N/A'}`)
        }
      }
      // [Fix] 다음 tick에 이벤트 발송 → ui-manager 리스너가 먼저 등록되도록
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent('faceMorphReady', {
          detail: {targetNames: Object.keys(morphTargets)}
        }))
        console.log('animate-face: morphs ready', Object.keys(morphTargets))
      }, 100)
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
      const {vertices, normals, uvsInCameraFrame} = event.detail

      if (!faceInitialized) {
        faceInitialized = true
        const n = vertices.length
        console.log(`animate-face: init ${n} verts, indices: ${savedIndices ? savedIndices.length : 'none'}`)

        geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n*3), 3))
        geometry.setAttribute('normal',   new THREE.BufferAttribute(new Float32Array(n*3), 3))
        geometry.setAttribute('uv',       new THREE.BufferAttribute(new Float32Array(n*2), 2))

        if (savedIndices && savedIndices.length > 0) {
          geometry.setIndex(new THREE.BufferAttribute(savedIndices, 1))
        }

        faceMesh = new THREE.Mesh(geometry, materialGltf)
        this.el.setObject3D('faceMesh', faceMesh)

        // 기준 vertex 위치로 morph delta 계산
        const base = new Float32Array(n*3)
        for (let i = 0; i < n; i++) {
          base[i*3]   = vertices[i].x
          base[i*3+1] = vertices[i].y
          base[i*3+2] = vertices[i].z
        }
        buildMorphTargets(base, n)
      }

      if (!faceMesh) return

      const posAttr  = geometry.attributes.position
      const normAttr = geometry.attributes.normal
      const uvAttr   = geometry.attributes.uv
      const n = vertices.length

      // position = XR8 vertex + morph delta * influence
      let morphApplied = false
      for (let i = 0; i < n; i++) {
        let px = vertices[i].x
        let py = vertices[i].y
        let pz = vertices[i].z

        for (const [name, inf] of Object.entries(morphInfluences)) {
          if (inf === 0) continue
          morphApplied = true
          px += morphTargets[name][i*3]   * inf
          py += morphTargets[name][i*3+1] * inf
          pz += morphTargets[name][i*3+2] * inf
        }

        posAttr.array[i*3]   = px
        posAttr.array[i*3+1] = py
        posAttr.array[i*3+2] = pz
      }
      // 1초에 한번만 로그
      if (morphApplied && !show._logged) {
        show._logged = true
        setTimeout(() => { show._logged = false }, 1000)
        const activeInfluences = Object.entries(morphInfluences).filter(([,v])=>v>0)
        console.log('morph applying:', activeInfluences, '| vertex[0]:', posAttr.array[0].toFixed(4), posAttr.array[1].toFixed(4))
      }
      posAttr.needsUpdate = true

      for (let i = 0; i < normals.length; i++) {
        normAttr.array[i*3]   = normals[i].x
        normAttr.array[i*3+1] = normals[i].y
        normAttr.array[i*3+2] = normals[i].z
      }
      normAttr.needsUpdate = true

      for (let i = 0; i < uvsInCameraFrame.length; i++) {
        uvAttr.array[i*2]   = uvsInCameraFrame[i].u
        uvAttr.array[i*2+1] = uvsInCameraFrame[i].v
      }
      uvAttr.needsUpdate = true
    }

    this.el.sceneEl.addEventListener('xrfacefound',   show)
    this.el.sceneEl.addEventListener('xrfaceupdated', show)
  },
}

export {animateFaceComponent}
