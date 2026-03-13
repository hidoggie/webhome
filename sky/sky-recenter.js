/* globals AFRAME */
AFRAME.registerComponent('sky-recenter', {
  init() {
    const recenter = () => {
      this.el.emit('recenter')
      this.el.removeEventListener('sky-coaching-overlay.hide', recenter)
    }
    this.el.addEventListener('sky-coaching-overlay.hide', recenter)
  },
})

   const model = document.getElementById('model')

    this.el.addEventListener('sky-coaching-overlay.hide', () => {
      model.setAttribute('visible', true)
    })

    this.el.addEventListener('sky-coaching-overlay.show', () => {
       model.setAttribute('visible', false)
    })
