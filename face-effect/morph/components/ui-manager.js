const uiManagerComponent = {
  init() {
    const leftArrow   = document.getElementById('leftArrow')
    const rightArrow  = document.getElementById('rightArrow')
    const targetName  = document.querySelector('#target-name')
    const slider      = document.querySelector('.slider')
    const resetButton = document.getElementById('reset')

    let targetNames = []
    let currentIndex = 0
    const sliderValues = {}

    const updateUI = () => {
      if (targetNames.length === 0) return
      const name = targetNames[currentIndex]
      targetName.textContent = name
      slider.value = sliderValues[name] || 0
    }

    const applyMorph = (name, value) => {
      if (window._faceAnimateSetMorph) {
        window._faceAnimateSetMorph(name, value)
      }
    }

    // animate-face.js가 준비되면 이 이벤트를 발생시킴
    document.addEventListener('faceMorphReady', (e) => {
      targetNames = e.detail.targetNames
      console.log('ui-manager: received targetNames:', targetNames)

      targetNames.forEach(name => {
        sliderValues[name] = 0
      })

      currentIndex = 0
      updateUI()

      leftArrow.addEventListener('click', () => {
        sliderValues[targetNames[currentIndex]] = parseFloat(slider.value)
        currentIndex = (currentIndex - 1 + targetNames.length) % targetNames.length
        updateUI()
      })

      rightArrow.addEventListener('click', () => {
        sliderValues[targetNames[currentIndex]] = parseFloat(slider.value)
        currentIndex = (currentIndex + 1) % targetNames.length
        updateUI()
      })

      slider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value)
        const name = targetNames[currentIndex]
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
    })
  },
}

export {uiManagerComponent}
