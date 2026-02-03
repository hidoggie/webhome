const uiManagerComponent = {
  init() {
    const nextButton = document.getElementById('nextButton')
    const diamondRing = document.getElementById('diamondRingEntity')
    const watch = document.getElementById('watchEntity')
    const handMesh = document.getElementById('handMesh')
    const orb = document.getElementById('orbEntity')

    let counter = 0
    nextButton.addEventListener('click', () => {
      if (counter === 0) {
        orb.setAttribute('visible', false)
        handMesh.setAttribute('material', {opacity: 0.5})
        handMesh.components.material.material.wireframe = true
      } else if (counter === 1) {
        diamondRing.setAttribute('visible', true)
        handMesh.setAttribute('material', {opacity: 0})
      } else if (counter === 2) {
        diamondRing.setAttribute('visible', false)
        watch.setAttribute('visible', true)
      } else if (counter === 3) {
        watch.setAttribute('visible', false)
        orb.setAttribute('visible', true)
      }
      if (counter < 3) {
        counter += 1
      } else {
        counter = 0
      }
    })
  },
}

export {uiManagerComponent}
