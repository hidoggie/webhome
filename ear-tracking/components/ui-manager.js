const uiManagerComponent = {
  init() {
    const nextButton = document.getElementById('nextButton')
    const leftEarringTop = document.getElementById('leftEarringTop')
    const leftEarringMid = document.getElementById('leftEarringMid')
    const leftEarringLow = document.getElementById('leftEarringLow')

    const rightEarringTop = document.getElementById('rightEarringTop')
    const rightEarringMid = document.getElementById('rightEarringMid')
    const rightEarringLow = document.getElementById('rightEarringLow')

    const arrowOut = document.getElementById('arrowOutEntity')
    const arrowIn = document.getElementById('arrowInEntity')

    const leftStud = document.getElementById('leftStud')
    const rightStud = document.getElementById('rightStud')

    let counter = 1
    nextButton.addEventListener('click', () => {
      if (counter === 0) {
        leftEarringTop.setAttribute('visible', true)
        leftEarringMid.setAttribute('visible', true)
        leftEarringLow.setAttribute('visible', true)

        rightEarringTop.setAttribute('visible', true)
        rightEarringMid.setAttribute('visible', true)
        rightEarringLow.setAttribute('visible', true)

        leftStud.setAttribute('visible', false)
        rightStud.setAttribute('visible', false)
      } else if (counter === 1) {
        arrowOut.setAttribute('visible', true)
        arrowIn.setAttribute('visible', true)

        leftEarringTop.setAttribute('visible', false)
        leftEarringMid.setAttribute('visible', false)
        leftEarringLow.setAttribute('visible', false)

        rightEarringTop.setAttribute('visible', false)
        rightEarringMid.setAttribute('visible', false)
        rightEarringLow.setAttribute('visible', false)
      } else if (counter === 2) {
        leftStud.setAttribute('visible', true)
        rightStud.setAttribute('visible', true)

        arrowOut.setAttribute('visible', false)
        arrowIn.setAttribute('visible', false)
      }
      counter = (counter + 1) % 3
    })
  },
}

export {uiManagerComponent}