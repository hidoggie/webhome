const changeSceneComponent = {
  init() {
    const scene = this.el.sceneEl
    const changeSceneButton = document.getElementById('changeView')
    const flipBg = document.getElementById('blackFade')

    this.model = document.getElementById('target')
    this.camera = document.getElementById('camera')
    this.sky = document.getElementById('sky')
    this.toggle = document.getElementById('toggle')

    // Fade In & Out Scenes
    scene.addEventListener('realityready', () => {
      // fade from black
      flipBg.classList.add('fade-out')
      setTimeout(() => {
        flipBg.classList.remove('fade-out')
        flipBg.style.opacity = 0
      }, 500)
    })

    // Toggle AR/3D Views Logic
    changeSceneButton.addEventListener('click', () => {
      if (changeSceneButton.checked) {
        // Disable button as scene loads
        this.toggle.classList.add('disable-button')
        // Change to 3D View
        scene.removeAttribute('xrweb')
        this.model.removeAttribute('xrextras-hold-drag')
        this.model.setAttribute('scale', {x: 1, y: 1, z: 1})
        this.model.setAttribute('position', {x: 0, y: 0, z: 0})
        this.camera.setAttribute('position', {x: 0, y: 4, z: 4})
        // Set Attributes For Orbit Scene
        this.camera.setAttribute('orbit-controls', {
          enabled: true,
          autoRotate: true,
          autoRotateSpeed: 1,
          minDistance: 2,
          maxDistance: 10,
          zoomSpeed: 0.5,
        })
        this.sky.setAttribute('visible', true)
        // Re-enable button after scene loaded
        setTimeout(() => {
          this.toggle.classList.remove('disable-button')
        }, 1500)
      } else {
        // Disable button as scene loads
        this.toggle.classList.add('disable-button')
        // Change To AR View
        flipBg.style.opacity = 1
        scene.setAttribute('xrweb', '')
        this.model.setAttribute('xrextras-hold-drag', '')
        this.model.setAttribute('scale', {x: 1, y: 1, z: 1})
        this.model.setAttribute('position', {x: 0, y: 0, z: 0})
        this.model.setAttribute('rotation', {x: 0, y: 30, z: 0})
        this.camera.setAttribute('orbit-controls', {enabled: false})
        // Re-set Model To Center
        scene.emit('recenter')
        const reset = () => {
          scene.emit('recenter', {
            origin: {x: 0, y: 4, z: 4},
            facing: {w: 1, x: 0, y: 0, z: 0},
          })
          this.toggle.classList.remove('disable-button')
        }
        scene.addEventListener('realityready', reset)
        this.sky.setAttribute('visible', false)
      }
    })
  },
}
export {changeSceneComponent}
