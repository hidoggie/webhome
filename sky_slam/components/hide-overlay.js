const hideOverlayComponent = {
  init() {
    const onHide = () => {
      // Disable the Sky Coaching Overlay after sky pixels have been detected once
      SkyCoachingOverlay.control.setAutoShowHide(false)  
      this.el.sceneEl.removeEventListener('sky-coaching-overlay.hide', onHide)
    }
    this.el.sceneEl.addEventListener('sky-coaching-overlay.hide', onHide)
  },
}
export {hideOverlayComponent}
