const uiManagerComponent = {
  init() {
    const morphTargetModel = document.getElementById('morphTargetModel')

    const handleUI = () => {
      const morphTargetMesh = morphTargetModel.getObject3D('mesh')
      if (!morphTargetMesh) {
        console.warn('ui-manager: mesh not ready')
        return
      }

      // [Fix] Three.js r158: morphTargetDictionary 우선, userData.targetNames fallback
      const targetNames = []
      morphTargetMesh.traverse((object) => {
        if (!object.isMesh || !object.morphTargetInfluences) return
        if (object.morphTargetDictionary) {
          // morphTargetDictionary는 {name: index} 형태 → index 순으로 정렬
          const entries = Object.entries(object.morphTargetDictionary)
            .sort((a, b) => a[1] - b[1])
            .map(e => e[0])
          targetNames.push(...entries)
        } else if (object.userData.targetNames) {
          targetNames.push(...object.userData.targetNames)
        }
      })

      console.log('Morph targets:', targetNames)

      if (targetNames.length === 0) {
        console.warn('ui-manager: no morph targets found')
        return
      }

      const leftArrow   = document.getElementById('leftArrow')
      const rightArrow  = document.getElementById('rightArrow')
      const targetName  = document.querySelector('#target-name')
      const slider      = document.querySelector('.slider')
      const resetButton = document.getElementById('reset')

      let currentTargetIndex = 0
      const sliderValues = {}

      const applyMorph = (name, value) => {
        morphTargetModel.setAttribute(`gltf-morph__${name}`, `morphTarget: ${name}; value: ${value}`)
      }

      // 모든 타겟 0으로 초기 등록
      targetNames.forEach(name => {
        sliderValues[name] = 0
        applyMorph(name, 0)
      })

      const updateUI = () => {
        const name = targetNames[currentTargetIndex]
        targetName.textContent = name
        slider.value = sliderValues[name] || 0
      }
      updateUI()

      leftArrow.addEventListener('click', () => {
        sliderValues[targetNames[currentTargetIndex]] = parseFloat(slider.value)
        currentTargetIndex = (currentTargetIndex - 1 + targetNames.length) % targetNames.length
        updateUI()
      })

      rightArrow.addEventListener('click', () => {
        sliderValues[targetNames[currentTargetIndex]] = parseFloat(slider.value)
        currentTargetIndex = (currentTargetIndex + 1) % targetNames.length
        updateUI()
      })

      slider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value)
        const name = targetNames[currentTargetIndex]
        sliderValues[name] = value
        applyMorph(name, value)
      })

      resetButton.addEventListener('click', () => {
        slider.value = 0
        Object.keys(sliderValues).forEach(key => {
          sliderValues[key] = 0
          applyMorph(key, 0)
        })
        updateUI()
      })
    }

    // object3dset 이벤트: gltf-model이 mesh를 set할 때 발생
    morphTargetModel.addEventListener('object3dset', (e) => {
      if (e.detail.type === 'mesh') handleUI()
    })
  },
}

export {uiManagerComponent}
