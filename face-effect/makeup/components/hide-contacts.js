const hideContactsComponent = {
  init() {
    const leftIris = document.getElementById('leftIris')
    const rightIris = document.getElementById('rightIris')

    const handleLeftClose = () => {
      leftIris.setAttribute('visible', false)
    }
    const handleLeftOpen = () => {
      leftIris.setAttribute('visible', true)
    }

    const handleRightClose = () => {
      rightIris.setAttribute('visible', false)
    }
    const handleRightOpen = () => {
      rightIris.setAttribute('visible', true)
    }

    this.el.sceneEl.addEventListener('xrlefteyeopened', handleLeftOpen)
    this.el.sceneEl.addEventListener('xrlefteyeclosed', handleLeftClose)

    this.el.sceneEl.addEventListener('xrrighteyeopened', handleRightOpen)
    this.el.sceneEl.addEventListener('xrrighteyeclosed', handleRightClose)
  },
}

export {hideContactsComponent}