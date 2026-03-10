const configTargetsComponent = {
  schema: {
    targets: {type: 'array', default: ['']},
  },
  ensureImageTargetsConfigured() {
    if (this.configured || !this.configOk) {
      return
    }
    console.log(`Scanning for targets: ${JSON.stringify(this.data.targets)}`)
    XR8.XrController.configure({imageTargets: this.data.targets})
    this.configured = true
  },
  init() {
    this.configured = false
    this.configOk = false
    this.el.sceneEl.addEventListener('realityready', () => {
      this.configOk = true
      this.ensureImageTargetsConfigured()
    })
  },
  update() {
    this.configured = false
    this.ensureImageTargetsConfigured()
  },
}

const smartTargetComponent = {
  schema: {
    name: {type: 'string'},
  },
  init() {
    const scene = this.el.sceneEl
    const {object3D} = this.el
    const {name} = this.data
    const promptText = document.getElementById('prompt')
    object3D.visible = false

    const showImage = ({detail}) => {
      if (name !== detail.name) {
        return
      }

      if (detail.name === 'rooster') {
        promptText.innerHTML = 'Looking for flightless birds...'
        scene.setAttribute('config-targets', {targets: 'rooster, roadrunner, penguin, ostrich'})
      }

      object3D.position.copy(detail.position)
      object3D.quaternion.copy(detail.rotation)
      object3D.scale.set(detail.scale, detail.scale, detail.scale)
      object3D.visible = true
    }

    const hideImage = ({detail}) => {
      if (name !== detail.name) {
        return
      }
      object3D.visible = false
    }

    this.el.sceneEl.addEventListener('xrimagefound', showImage)
    this.el.sceneEl.addEventListener('xrimageupdated', showImage)
    this.el.sceneEl.addEventListener('xrimagelost', hideImage)
  },
}

export {configTargetsComponent, smartTargetComponent}