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
    let uvDeltaTargets = {}
    let geometry = null
    let faceInitialized = false
    let savedIndices = null
    let baseUVs = null

    this.el.sceneEl.addEventListener('xrfaceloading', (e) => {
      const {indices, uvs} = e.detail
      if (indices) {
        savedIndices = indices instanceof Uint32Array ? indices : new Uint32Array(indices)
      }
      if (uvs) {
        baseUVs = Array.isArray(uvs) ? uvs : (() => {
          const arr = []
          for (let i=0;i<uvs.length;i+=2) arr.push({u:uvs[i],v:uvs[i+1]})
          return arr
        })()
      }
      console.log(`xrfaceloading: ${savedIndices?.length} indices, ${baseUVs?.length} uvs`)
    })

    const buildMorphTargets = (verts, n) => {
      const x = [], y = []
      for (let i=0;i<n;i++) { x.push(verts[i*3]); y.push(verts[i*3+1]) }

      const cx = x.reduce((a,b)=>a+b,0)/n
      const cy = y.reduce((a,b)=>a+b,0)/n
      const fh = Math.max(...y) - Math.min(...y)
      const fw = Math.max(...x) - Math.min(...x)

      // UV 범위
      const uArr = (baseUVs||[]).map(uv=>uv.u)
      const vArr = (baseUVs||[]).map(uv=>uv.v)
      const uCx = uArr.length ? uArr.reduce((a,b)=>a+b,0)/uArr.length : 0.5
      const vCy = vArr.length ? vArr.reduce((a,b)=>a+b,0)/vArr.length : 0.5
      const uvFW = uArr.length ? (Math.max(...uArr)-Math.min(...uArr)) : 0.5
      const uvFH = vArr.length ? (Math.max(...vArr)-Math.min(...vArr)) : 0.5

      // 3D→UV 변환 스케일
      const scaleU = uvFW / fw
      const scaleV = uvFH / fh

      console.log(`buildMorphTargets: fw=${fw.toFixed(3)}, fh=${fh.toFixed(3)}`)
      console.log(`UV: uvFW=${uvFW.toFixed(3)}, uvFH=${uvFH.toFixed(3)}, scaleU=${scaleU.toFixed(4)}, scaleV=${scaleV.toFixed(4)}`)

      const eye_top   = cy+fh*0.40, eye_bot  = cy+fh*0.10, eye_mid  = (cy+fh*0.40+cy+fh*0.10)/2
      const nose_top  = cy+fh*0.08, nose_bot = cy-fh*0.15, nose_mid = (cy+fh*0.08+cy-fh*0.15)/2
      const mouth_top = cy-fh*0.05, mouth_bot= cy-fh*0.40, mouth_mid= (cy-fh*0.05+cy-fh*0.40)/2
      const cheek_top = cy+fh*0.25, cheek_bot= cy-fh*0.10

      const makeDelta = (type) => {
        const d = new Float32Array(n*3)
        for (let i=0;i<n;i++) {
          const xi=x[i], yi=y[i]
          let dx=0,dy=0,dz=0
          if (type==='big_eyes') {
            for (const [ecx,test] of [[cx-fw*0.22,xi<cx],[cx+fw*0.22,xi>=cx]]) {
              if (!test||yi<eye_bot||yi>eye_top) continue
              const dist=Math.sqrt((xi-ecx)**2+(yi-eye_mid)**2)
              const w=Math.max(0,1-dist/(fw*0.25))
              dx+=w*(xi-ecx)*1.2; dy+=w*(yi-eye_mid)*1.2
            }
          } else if (type==='big_nose') {
            if (yi>nose_bot&&yi<nose_top&&Math.abs(xi-cx)<fw*0.22) {
              const dist=Math.sqrt((xi-cx)**2+(yi-nose_mid)**2)
              const w=Math.max(0,1-dist/(fw*0.22))
              dx=w*(xi-cx)*1.5; dy=w*(yi-nose_mid)*0.5; dz=-w*fh*0.10
            }
          } else if (type==='big_mouth') {
            if (yi>mouth_bot&&yi<mouth_top) {
              const dist=Math.sqrt((xi-cx)**2+(yi-mouth_mid)**2)
              const w=Math.max(0,1-dist/(fw*0.45))
              dx=w*(xi-cx)*1.6; dy=w*(yi-mouth_mid)*1.0
            }
          } else if (type==='fat_face') {
            if (yi>cheek_bot&&yi<cheek_top) {
              const w=Math.min(1,Math.abs(xi-cx)/(fw*0.4))
              dx=Math.sign(xi-cx)*w*fw*0.35
            } else if (yi<=cheek_bot) {
              const jw=Math.min(1,(cheek_bot-yi)/(fh*0.2))
              dx=Math.sign(xi-cx)*jw*fw*0.15; dy=-jw*fh*0.06
            }
          }
          d[i*3]=dx; d[i*3+1]=dy; d[i*3+2]=dz
        }
        return d
      }

      const makeUVDelta = (pd) => {
        const uvd = new Float32Array(n*2)
        let maxUV = 0
        for (let i=0;i<n;i++) {
          // vertex가 늘어나면 UV는 반대방향 → 텍스처가 늘어 보임
          uvd[i*2]   = -pd[i*3]   * scaleU
          uvd[i*2+1] = -pd[i*3+1] * scaleV
          maxUV = Math.max(maxUV, Math.abs(uvd[i*2]), Math.abs(uvd[i*2+1]))
        }
        return {uvd, maxUV}
      }

      const types = ['big_eyes','big_nose','big_mouth','fat_face']
      for (const type of types) {
        morphTargets[type] = makeDelta(type)
        const {uvd, maxUV} = makeUVDelta(morphTargets[type])
        uvDeltaTargets[type] = uvd
        console.log(`  ${type}: maxUVDelta=${maxUV.toFixed(4)}`)
      }

      morphInfluences = {big_eyes:0,big_nose:0,big_mouth:0,fat_face:0}

      window._faceAnimateSetMorph = (name, value) => {
        if (name in morphInfluences) morphInfluences[name] = value
      }

      setTimeout(() => {
        document.dispatchEvent(new CustomEvent('faceMorphReady', {
          detail: {targetNames: Object.keys(morphTargets)}
        }))
        console.log('animate-face: morphs ready')
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
        console.log(`animate-face: init ${n} verts`)

        geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n*3), 3))
        geometry.setAttribute('normal',   new THREE.BufferAttribute(new Float32Array(n*3), 3))
        geometry.setAttribute('uv',       new THREE.BufferAttribute(new Float32Array(n*2), 2))
        if (savedIndices?.length > 0) {
          geometry.setIndex(new THREE.BufferAttribute(savedIndices, 1))
        }

        faceMesh = new THREE.Mesh(geometry, materialGltf)
        this.el.setObject3D('faceMesh', faceMesh)

        const base = new Float32Array(n*3)
        for (let i=0;i<n;i++) {
          base[i*3]=vertices[i].x; base[i*3+1]=vertices[i].y; base[i*3+2]=vertices[i].z
        }
        buildMorphTargets(base, n)
      }

      if (!faceMesh) return

      const posAttr  = geometry.attributes.position
      const normAttr = geometry.attributes.normal
      const uvAttr   = geometry.attributes.uv
      const n = vertices.length
      const anyActive = Object.values(morphInfluences).some(v=>v>0)

      for (let i=0;i<n;i++) {
        let px=vertices[i].x, py=vertices[i].y, pz=vertices[i].z
        if (anyActive) {
          for (const [name,inf] of Object.entries(morphInfluences)) {
            if (inf===0) continue
            px+=morphTargets[name][i*3]*inf
            py+=morphTargets[name][i*3+1]*inf
            pz+=morphTargets[name][i*3+2]*inf
          }
        }
        posAttr.array[i*3]=px; posAttr.array[i*3+1]=py; posAttr.array[i*3+2]=pz
      }
      posAttr.needsUpdate = true

      for (let i=0;i<normals.length;i++) {
        normAttr.array[i*3]=normals[i].x
        normAttr.array[i*3+1]=normals[i].y
        normAttr.array[i*3+2]=normals[i].z
      }
      normAttr.needsUpdate = true

      for (let i=0;i<uvsInCameraFrame.length;i++) {
        let u=uvsInCameraFrame[i].u
        let v=uvsInCameraFrame[i].v
        if (anyActive) {
          for (const [name,inf] of Object.entries(morphInfluences)) {
            if (inf===0) continue
            u+=uvDeltaTargets[name][i*2]*inf
            v+=uvDeltaTargets[name][i*2+1]*inf
          }
        }
        uvAttr.array[i*2]=u; uvAttr.array[i*2+1]=v
      }
      uvAttr.needsUpdate = true
    }

    this.el.sceneEl.addEventListener('xrfacefound',   show)
    this.el.sceneEl.addEventListener('xrfaceupdated', show)
  },
}

export {animateFaceComponent}
