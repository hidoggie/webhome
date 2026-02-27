const animateFaceComponent = {
  init() {
    const faceTextureGltf_ = new THREE.Texture()
    const materialGltf = new THREE.MeshBasicMaterial({
      map: faceTextureGltf_,
      side: THREE.DoubleSide,
      color: 0xffffff,
      toneMapped: false,
    })

    const renderer = this.el.sceneEl.renderer
    if (renderer) {
      renderer.toneMapping = THREE.NoToneMapping
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace
    }

    let posArr = null   // Float32Array for position
    let normArr = null  // Float32Array for normal
    let geometry = null
    let faceMesh = null
    let morphTargets = {}
    let morphInfluences = {}
    let savedLoadingDetail = null  // xrfaceloading 전체 detail 저장

    // xrextras faceMesh와 동일하게 xrfaceloading detail 저장
    this.el.sceneEl.addEventListener('xrfaceloading', ({detail}) => {
      savedLoadingDetail = detail
      console.log('xrfaceloading: indices', detail.indices?.length, 'uvs', detail.uvs?.length)

      // xrextras faceMesh 방식 그대로: loading 시점에 geometry 생성
      const n = detail.pointsPerDetection
      const geo = new THREE.BufferGeometry()

      posArr  = new Float32Array(3 * n)
      normArr = new Float32Array(3 * n)
      geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3))
      geo.setAttribute('normal',   new THREE.BufferAttribute(normArr, 3))

      // UV 설정 (xrextras와 동일)
      const uvFlat = new Float32Array(2 * detail.uvs.length)
      for (let i = 0; i < detail.uvs.length; i++) {
        uvFlat[2*i]   = detail.uvs[i].u
        uvFlat[2*i+1] = detail.uvs[i].v
      }
      geo.setAttribute('uv', new THREE.BufferAttribute(uvFlat, 2))

      // indices: [{a,b,c}] → flat array (xrextras 방식)
      const idxFlat = new Array(3 * detail.indices.length)
      for (let i = 0; i < detail.indices.length; i++) {
        idxFlat[3*i]   = detail.indices[i].a
        idxFlat[3*i+1] = detail.indices[i].b
        idxFlat[3*i+2] = detail.indices[i].c
      }
      geo.setIndex(idxFlat)
      console.log('geometry built:', n, 'verts,', idxFlat.length/3, 'triangles')

      geometry = geo
      faceMesh = new THREE.Mesh(geo, materialGltf)
      faceMesh.frustumCulled = false

      // xrextras와 동일: setObject3D('mesh') + emit('model-loaded')
      this.el.setObject3D('mesh', faceMesh)
      this.el.emit('model-loaded')
      console.log('faceMesh set via setObject3D + model-loaded emitted')
    })

    const buildMorphTargets = (verts, n) => {
      const x=[], y=[]
      for (let i=0;i<n;i++) { x.push(verts[i*3]); y.push(verts[i*3+1]) }
      const cx=x.reduce((a,b)=>a+b,0)/n
      const cy=y.reduce((a,b)=>a+b,0)/n
      const fh=Math.max(...y)-Math.min(...y)
      const fw=Math.max(...x)-Math.min(...x)

      const eye_top=cy+fh*0.40, eye_bot=cy+fh*0.10, eye_mid=(eye_top+eye_bot)/2
      const nose_top=cy+fh*0.08, nose_bot=cy-fh*0.15, nose_mid=(nose_top+nose_bot)/2
      const mouth_top=cy-fh*0.05, mouth_bot=cy-fh*0.40, mouth_mid=(mouth_top+mouth_bot)/2
      const cheek_top=cy+fh*0.25, cheek_bot=cy-fh*0.10

      const makeDelta=(type)=>{
        const d=new Float32Array(n*3)
        for (let i=0;i<n;i++){
          const xi=x[i],yi=y[i]; let dx=0,dy=0,dz=0
          if (type==='big_eyes'){
            for (const [ecx,test] of [[cx-fw*0.22,xi<cx],[cx+fw*0.22,xi>=cx]]){
              if (!test||yi<eye_bot||yi>eye_top) continue
              const dist=Math.sqrt((xi-ecx)**2+(yi-eye_mid)**2)
              const w=Math.max(0,1-dist/(fw*0.25))
              dx+=w*(xi-ecx)*1.2; dy+=w*(yi-eye_mid)*1.2
            }
          } else if (type==='big_nose'){
            if (yi>nose_bot&&yi<nose_top&&Math.abs(xi-cx)<fw*0.22){
              const dist=Math.sqrt((xi-cx)**2+(yi-nose_mid)**2)
              const w=Math.max(0,1-dist/(fw*0.22))
              dx=w*(xi-cx)*1.5; dy=w*(yi-nose_mid)*0.5; dz=-w*fh*0.10
            }
          } else if (type==='big_mouth'){
            if (yi>mouth_bot&&yi<mouth_top){
              const dist=Math.sqrt((xi-cx)**2+(yi-mouth_mid)**2)
              const w=Math.max(0,1-dist/(fw*0.45))
              dx=w*(xi-cx)*1.6; dy=w*(yi-mouth_mid)*1.0
            }
          } else if (type==='fat_face'){
            if (yi>cheek_bot&&yi<cheek_top){
              dx=Math.sign(xi-cx)*Math.min(1,Math.abs(xi-cx)/(fw*0.4))*fw*0.35
            } else if (yi<=cheek_bot){
              const jw=Math.min(1,(cheek_bot-yi)/(fh*0.2))
              dx=Math.sign(xi-cx)*jw*fw*0.15; dy=-jw*fh*0.06
            }
          }
          d[i*3]=dx; d[i*3+1]=dy; d[i*3+2]=dz
        }
        return d
      }

      morphTargets={big_eyes:makeDelta('big_eyes'),big_nose:makeDelta('big_nose'),
                    big_mouth:makeDelta('big_mouth'),fat_face:makeDelta('fat_face')}
      morphInfluences={big_eyes:0,big_nose:0,big_mouth:0,fat_face:0}

      window._faceAnimateSetMorph=(name,value)=>{
        if (name in morphInfluences) morphInfluences[name]=value
      }
      setTimeout(()=>{
        document.dispatchEvent(new CustomEvent('faceMorphReady',{detail:{targetNames:Object.keys(morphTargets)}}))
        console.log('animate-face: morphs ready')
      },100)
    }

    const onxrloaded=()=>{
      window.XR8.addCameraPipelineModule({
        name:'cameraFeedPipeline',
        onUpdate:(processCpuResult)=>{
          if (!processCpuResult) return
          const result=processCpuResult.processCpuResult
          if (result.facecontroller&&result.facecontroller.cameraFeedTexture){
            const texProps=renderer.properties.get(faceTextureGltf_)
            texProps.__webglTexture=result.facecontroller.cameraFeedTexture
          }
        },
      })
    }
    window.XR8?onxrloaded():window.addEventListener('xrloaded',onxrloaded)

    let morphBuilt = false

    const show = ({detail}) => {
      if (!posArr || !geometry) return

      const {vertices, normals, uvsInCameraFrame} = detail
      const n = vertices.length

      // 첫 프레임: morph 빌드
      if (!morphBuilt) {
        morphBuilt = true
        const base = new Float32Array(n*3)
        for (let i=0;i<n;i++){
          base[i*3]=vertices[i].x; base[i*3+1]=vertices[i].y; base[i*3+2]=vertices[i].z
        }
        buildMorphTargets(base, n)
      }

      // position 업데이트 (xrextras show()와 동일 방식)
      for (let i=0;i<n;i++){
        let px=vertices[i].x, py=vertices[i].y, pz=vertices[i].z
        for (const [name,inf] of Object.entries(morphInfluences)){
          if (inf===0||!morphTargets[name]) continue
          px+=morphTargets[name][i*3]  *inf
          py+=morphTargets[name][i*3+1]*inf
          pz+=morphTargets[name][i*3+2]*inf
        }
        posArr[3*i]=px; posArr[3*i+1]=py; posArr[3*i+2]=pz
      }
      geometry.attributes.position.needsUpdate = true

      // normal 업데이트
      for (let i=0;i<normals.length;i++){
        normArr[3*i]=normals[i].x; normArr[3*i+1]=normals[i].y; normArr[3*i+2]=normals[i].z
      }
      geometry.attributes.normal.needsUpdate = true

      // UV: 카메라 피드 UV로 교체 (xrextras는 UV를 고정하지만 우리는 카메라 UV 사용)
      const uvAttr = geometry.attributes.uv
      for (let i=0;i<uvsInCameraFrame.length;i++){
        uvAttr.array[2*i]=uvsInCameraFrame[i].u
        uvAttr.array[2*i+1]=uvsInCameraFrame[i].v
      }
      uvAttr.needsUpdate = true

      faceMesh.visible = true
    }

    this.el.sceneEl.addEventListener('xrfacefound',  show)
    this.el.sceneEl.addEventListener('xrfaceupdated',show)
    this.el.sceneEl.addEventListener('xrfacelost', ()=>{
      if (faceMesh) faceMesh.visible = false
    })
  },
}

export {animateFaceComponent}
