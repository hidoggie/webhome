const ShowHideComponent = {
  init() {
    const {el} = this
    const model = el.object3D
    const scene = this.el.sceneEl
    const pivot = this.el.parentNode

    const DotyM = document.getElementById('dotyModel')

    scene.addEventListener('sky-coaching-overlay.hide', () => {
      DotyM.setAttribute('visible', true)
    })

    scene.addEventListener('sky-coaching-overlay.show', () => {
       DotyM.setAttribute('visible', false)
    })

    // The current value of the pivot's 'rotation' attribute
    let currentSkyPosition
    // The updated value of the pivot's 'rotation' attribute
    let updatedSkyPosition


    // Prevent double tap zoom
    document.ondblclick = function (e) {
      e.preventDefault()
    }
  },
}

export {ShowHideComponent}
