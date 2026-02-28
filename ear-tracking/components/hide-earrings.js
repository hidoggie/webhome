const hideEarringsComponent = {
  init() {
    const leftEarringMid = document.getElementById('leftEarringMid')
    const leftEarringLow = document.getElementById('leftEarringLow')

    const rightEarringMid = document.getElementById('rightEarringMid')
    const rightEarringLow = document.getElementById('rightEarringLow')

    const leftStud = document.getElementById('leftStud')
    const arrowIn = document.getElementById('arrowIn')

    const hideEarrings = () => {
      if (leftEarringMid.getAttribute('visible')) {
        leftEarringMid.setAttribute('visible', false)
        leftEarringLow.setAttribute('visible', false)

        rightEarringMid.setAttribute('visible', false)
        rightEarringLow.setAttribute('visible', false)
      }
    }

    const showEarrings = () => {
      if (!arrowIn.getAttribute('visible') && !leftStud.getAttribute('visible')) {
        leftEarringMid.setAttribute('visible', true)
        leftEarringLow.setAttribute('visible', true)

        rightEarringMid.setAttribute('visible', true)
        rightEarringLow.setAttribute('visible', true)
      }
    }

    setTimeout(() => {
      this.el.sceneEl.addEventListener('xrfacelost', hideEarrings)
    }, 1000)
    this.el.sceneEl.addEventListener('xrfacefound', showEarrings)
  },
}

export {hideEarringsComponent}