const mirrorXComponent = {
  init() {
    // Store the initial position
    const initialPosition = this.el.getAttribute('position')
    const initialX = initialPosition.x
    const initialY = initialPosition.y
    const initialZ = initialPosition.z

    this.el.sceneEl.addEventListener('xrhandswitched', (e) => {
      const {hand} = e.detail
      if (hand === 'left') {
        // Flip the X position if it's the left hand
        this.el.setAttribute('position', `${-initialX} ${initialY} ${initialZ}`)
        // initialPosition.x = -initialPosition.x
      } else if (hand === 'right') {
        // Restore the initial position if it's the right hand
        this.el.setAttribute('position', `${initialX} ${initialY} ${initialZ}`)
      }
    })
  },
}

export {mirrorXComponent}