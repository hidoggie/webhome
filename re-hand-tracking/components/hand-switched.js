const handSwitchedComponent = {
  init() {
    let handKind = 2
    const left = 1
    const right = 2
    let hand
    const detectHandSwitched = ({detail}) => {
      if (handKind !== detail.handKind) {
        handKind = detail.handKind
        if (handKind === left) {
          hand = 'left'
        } else if (handKind === right) {
          hand = 'right'
        }
        this.el.sceneEl.emit('xrhandswitched', {hand})
      }
    }
    this.el.sceneEl.addEventListener('xrhandfound', detectHandSwitched)
    this.el.sceneEl.addEventListener('xrhandswitched', (e) => {
      console.log(e.detail.hand, 'hand found')
    })
  },
}

export {handSwitchedComponent}