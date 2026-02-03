const rotateWatchComponent = {
  init() {
    let handKind = 2
    const left = 1
    const right = 2
    const watch = document.getElementById('watchEntity')
    const rotateWatch = ({detail}) => {
      // Rotate watch based on which hand is in view
      if (handKind !== detail.handKind) {
        handKind = detail.handKind
        if (handKind === left) {
          watch.setAttribute('rotation', '0 -90 180')
        } else if (handKind === right) {
          watch.setAttribute('rotation', '0 90 0')
        }
      }
    }
    this.el.sceneEl.addEventListener('xrhandfound', rotateWatch)
  },
}

export {rotateWatchComponent}