const swapDofComponent = {
  init() {
    const scene = this.el.sceneEl
    const dofBtn = document.getElementById('swap-dof-btn')
    const camBtn = document.getElementById('swap-cam-btn')

    const swapDof = () => {
      // toggle 6dof <-> 3dof
      const dof = scene.getAttribute('xrweb').disableWorldTracking ? 'false' : 'true'
      // Stop xrweb
      scene.removeAttribute('xrweb')
      // Restart xrweb
      scene.setAttribute('xrweb', `disableWorldTracking: ${dof}; cameraDirection: back;`)
      dofBtn.innerHTML = `Disable World Tracking: ${dof}`
      camBtn.innerHTML = `Camera Direction: back`
    }

    dofBtn.addEventListener('click', swapDof)
  },
}

const swapCameraComponent = {
  init() {
    const scene = this.el.sceneEl
    const dofBtn = document.getElementById('swap-dof-btn')
    const camBtn = document.getElementById('swap-cam-btn')

    const swapCam = () => {
      const direction = this.el.getAttribute('xrweb').cameraDirection === 'back' ? 'front' : 'back'
      // Stop xrweb
      scene.removeAttribute('xrweb')
      // // Restart xrweb
      scene.setAttribute('xrweb', `disableWorldTracking: true; cameraDirection: ${direction}; mirroredDisplay: ${direction === 'front'};`)
      dofBtn.innerHTML = `Disable World Tracking: true`
      camBtn.innerHTML = `Camera Direction: ${direction}`
    }

    camBtn.addEventListener('click', swapCam)
  },
}

export {swapDofComponent, swapCameraComponent}