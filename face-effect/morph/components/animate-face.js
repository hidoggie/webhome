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

    let faceGeometry = null   // GLB에서 가져온 geometry (원본 방식)
    let morphTargets = {}
    let morphInfluences = {}
    let savedIndices = null
    let indicesReplaced = false

    // xrfaceloading: XR8의 올바른 face indices 저장
    this.el.sceneEl.addEventListener('xrfaceloading', (e) => {
      const {indices} = e.detail
      if (indices) {
        savedIndices = indices instanceof Uint32Array ? indices : new Uint32Array(indices)
        console.log(`xrfaceloading: ${savedIndices.length} indices`)
      }
    })

    // 원본과 동일: model-loaded 후 GLB geometry + material 교체
    this.el.addEventListener('model-loaded', () => {
      const mesh = this.el.getObject3D('mesh')
      if (!mesh) { console.error('no mesh after model-loaded'); return }

      mesh.traverse((node) => {
        if (node.isMesh) {
          node.material = materialGltf
          faceGeometry = node.geometry
          console.log('animate-face: GLB geometry captured,', faceGeometry.attributes.position.count, 'verts')
        }
      })
    })

    const buildMorphTargets = (verts, n) => {
      const x=[], y=[]
      for (let i=0;i<n;i++) { x.push(verts[i*3]); y.push(verts[i*3+1]) }
      const cx=x.reduce((a,b)=>a+b,0)/n
      const cy=y.reduce((a,b)=>a+b,0)/n
      const fh=Math.max(...y)-Math.min(...y)
      const fw=Math.max(...x)-Math.min(...x)

      const eye_top=cy+fh*0.40,eye_bot=cy+fh*0.10,eye_mid=(eye_top+eye_bot)/2
      const nose_top=cy+fh*0.08,nose_bot=cy-fh*0.15,nose_mid=(nose_top+nose_bot)/2
      const mouth_top=cy-fh*0.05,mouth_bot=cy-fh*0.40,mouth_mid=(mouth_top+mouth_bot)/2
      const cheek_top=cy+fh*0.25,cheek_bot=cy-fh*0.10

      const makeDelta=(type)=>{
        const d=new Float32Array(n*3)
        for (let i=0;i<n;i++){
          const xi=x[i],yi=y[i];let dx=0,dy=0,dz=0
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

      morphTargets={
        big_eyes:makeDelta('big_eyes'), big_nose:makeDelta('big_nose'),
        big_mouth:makeDelta('big_mouth'), fat_face:makeDelta('fat_face'),
      }
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

    const show=(event)=>{
      if (!faceGeometry) return  // GLB 아직 로드 안 됨

      const {vertices, normals, uvsInCameraFrame} = event.detail
      const n = vertices.length

      // 첫 프레임: GLB index를 XR8 index로 교체 + morph 빌드
      if (!indicesReplaced && savedIndices?.length > 0) {
        indicesReplaced = true
        faceGeometry.setIndex(new THREE.BufferAttribute(savedIndices, 1))
        console.log(`animate-face: replaced GLB index with XR8 index (${savedIndices.length})`)
      }

      // 첫 프레임: vertex 크기가 맞으면 morph 빌드
      if (!morphBuilt && n === faceGeometry.attributes.position.count) {
        morphBuilt = true
        const base = new Float32Array(n*3)
        for (let i=0;i<n;i++){
          base[i*3]=vertices[i].x; base[i*3+1]=vertices[i].y; base[i*3+2]=vertices[i].z
        }
        buildMorphTargets(base, n)
        console.log(`animate-face: morphs built for ${n} verts`)
      }

      // position 업데이트
      const posAttr = faceGeometry.attributes.position
      for (let i=0;i<n && i<posAttr.count;i++){
        let px=vertices[i].x, py=vertices[i].y, pz=vertices[i].z
        for (const [name,inf] of Object.entries(morphInfluences)){
          if (inf===0) continue
          px+=morphTargets[name]?.[i*3]*inf||0
          py+=morphTargets[name]?.[i*3+1]*inf||0
          pz+=morphTargets[name]?.[i*3+2]*inf||0
        }
        posAttr.array[i*3]=px; posAttr.array[i*3+1]=py; posAttr.array[i*3+2]=pz
      }
      posAttr.needsUpdate=true

      // normal 업데이트
      if (faceGeometry.attributes.normal) {
        const normAttr=faceGeometry.attributes.normal
        for (let i=0;i<normals.length && i<normAttr.count;i++){
          normAttr.array[i*3]=normals[i].x
          normAttr.array[i*3+1]=normals[i].y
          normAttr.array[i*3+2]=normals[i].z
        }
        normAttr.needsUpdate=true
      }

      // UV 업데이트
      if (faceGeometry.attributes.uv) {
        const uvAttr=faceGeometry.attributes.uv
        for (let i=0;i<uvsInCameraFrame.length && i<uvAttr.count;i++){
          uvAttr.array[i*2]=uvsInCameraFrame[i].u
          uvAttr.array[i*2+1]=uvsInCameraFrame[i].v
        }
        uvAttr.needsUpdate=true
      }
    }

    this.el.sceneEl.addEventListener('xrfacefound',  show)
    this.el.sceneEl.addEventListener('xrfaceupdated',show)
  },
}

export {animateFaceComponent}
