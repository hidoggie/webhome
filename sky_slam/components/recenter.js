const recenterComponent = {
  init() {
    const recenter = () => {
      // Recenters Sky and World Scenes when Sky Pixels have been initially detected
      this.el.emit('recenter')
      this.el.removeEventListener('sky-coaching-overlay.hide', recenter)
    }
    this.el.addEventListener('sky-coaching-overlay.hide', recenter)
  },
}
export {recenterComponent}
