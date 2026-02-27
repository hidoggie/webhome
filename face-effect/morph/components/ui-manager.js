const uiManagerComponent = {
  init() {
    const morphTargetModel = document.getElementById('morphTargetModel')

    const handleUI = () => {
      const morphTargetMesh = morphTargetModel.getObject3D('mesh')
      if (!morphTargetMesh) {
        console.warn('ui-manager: mesh not ready')
        return
      }

      // Grab morph target names
      const targetNames = []
      morphTargetMesh.traverse((object) => {
        if (object.morphTargetInfluences && object.userData.targetNames) {
          targetNames.push(...object.userData.targetNames)
        }
      })
      console.log('Morph targets:', targetNames)

      if (targetNames.length === 0) {
        console.warn('ui-manager: no morph targets found')
        return
      }

      const leftArrow = document.getElementById('leftArrow')
      const rightArrow = document.getElementById('rightArrow')
      const targetName = document.querySelector('#target-name')
      const slider = document.querySelector('.slider')

      let currentTargetIndex = 0
      const sliderValues = {}

      // [Fix] gltf-morph 컴포넌트를 모든 타겟에 대해 미리 등록해 둠
      // setAttribute만으로는 multiple 컴포넌트가 처음 등록 안 될 수 있어서
      const registerMorphComponent = (name, value) => {
        const attributeName = `gltf-morph__${name}`
        // 이미 등록된 컴포넌트면 update, 없으면 새로 등록
        morphTargetModel.setAttribute(attributeName, `morphTarget: ${name}; value: ${value}`)
      }

      // 모든 타겟을 0으로 초기 등록
      targetNames.forEach((name) => {
        sliderValues[name] = 0
        registerMorphComponent(name, 0)
      })

      function updateTargetNameAndSliderValue() {
        const currentTargetName = targetNames[currentTargetIndex]
        const currentSliderValue = sliderValues[currentTargetName] || 0
        targetName.textContent = currentTargetName
        slider.value = currentSliderValue
      }

      updateTargetNameAndSliderValue()

      leftArrow.addEventListener('click', () => {
        sliderValues[targetNames[currentTargetIndex]] = parseFloat(slider.value)
        currentTargetIndex = (currentTargetIndex - 1 + targetNames.length) % targetNames.length
        updateTargetNameAndSliderValue()
      })

      rightArrow.addEventListener('click', () => {
        sliderValues[targetNames[currentTargetIndex]] = parseFloat(slider.value)
        currentTargetIndex = (currentTargetIndex + 1) % targetNames.length
        updateTargetNameAndSliderValue()
      })

      slider.addEventListener('input', (event) => {
        const value = parseFloat(event.target.value)
        const name = targetNames[currentTargetIndex]
        sliderValues[name] = value
        registerMorphComponent(name, value)
      })

      const resetButton = document.getElementById('reset')
      resetButton.addEventListener('click', () => {
        slider.value = 0
        Object.keys(sliderValues).forEach((key) => {
          sliderValues[key] = 0
          registerMorphComponent(key, 0)
        })
      })
    }

    // [Fix] 모델 로드 타이밍 문제: 이미 로드됐을 수도 있으므로 양쪽 모두 처리
    const mesh = morphTargetModel.getObject3D('mesh')
    if (mesh) {
      handleUI()
    } else {
      morphTargetModel.addEventListener('model-loaded', handleUI, {once: true})
    }
  },
}

export {uiManagerComponent}
