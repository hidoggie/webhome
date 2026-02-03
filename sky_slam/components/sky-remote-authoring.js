const skyRemoteAuthoringComponent = {
  schema: {
    foreground: {type: 'boolean', default: true},
  },
  init() {
    this.internalState = {
      cylinder: null,
    }
    // Reparent elements from the Sky Scene to the World Scene
    const skyScene = document.querySelector('[xrlayerscene]')
    Array.from(skyScene.children).forEach((child) => {
      this.el.object3D.add(child.object3D)
    })

    // Remove XR Engine components from the scene
    // Add a timeout b/c 8th Wall XR8 components are initialized later in the lifecycle
    setTimeout(() => {
      this.el.removeAttribute('xrlayers')
      this.el.removeAttribute('xrweb')
      this.el.removeAttribute('xrconfig')
    }, 0)

    this.el.removeAttribute('xrextras-loading')
    this.el.removeAttribute('xrextras-runtime-error')
    this.el.removeAttribute('landing-page')
    this.el.removeAttribute('sky-coaching-overlay')

    // Create the cylinder element that the foreground is attached to
    this.internalState.cylinder = document.createElement('a-cylinder')
    this.internalState.cylinder.setAttribute('open-ended', true)
    this.internalState.cylinder.setAttribute('material', 'depthTest:false; fog:false; opacity:.96')
    this.internalState.cylinder.setAttribute('transparent', true)
    this.internalState.cylinder.setAttribute('src', 'https://cdn.8thwall.com/web/projects/foreground.svg')
    this.internalState.cylinder.setAttribute('side', 'back')
    this.internalState.cylinder.setAttribute('position', '0 -.5 0')
    this.internalState.cylinder.setAttribute('scale', '100 350 100')

    // Create the Tiled Ground Plane
    const plane = document.createElement('a-plane')
    plane.setAttribute('material', 'src: https://cdn.8thwall.com/web/projects/ground.svg; repeat:1500 15000;')
    plane.setAttribute('color', '#808080')
    plane.setAttribute('height', '1000')
    plane.setAttribute('width', '100')
    plane.setAttribute('scale', '100 100 100')
    plane.setAttribute('rotation', '-90 0 0')
    plane.setAttribute('position', '0 0 0')

    // Raise camera to human height to mimic eye-level
    const camera = document.querySelector('a-camera')
    camera.setAttribute('position', '0 2 0')

    // Add fog element
    this.el.setAttribute('fog', 'type: exponential; color: #AAA; density:0.01')

    // Attach the elements to the scene
    this.el.appendChild(this.internalState.cylinder)
    this.el.appendChild(plane)
  },
  update(oldData) {
    // Allows you to toggle foreground in the aframe inspector
    if (this.data.foreground !== oldData.foreground) {
      if (this.data.foreground) {
        this.internalState.cylinder.setAttribute('visible', true)
      } else {
        this.internalState.cylinder.setAttribute('visible', false)
      }
    }
  },
}
export {skyRemoteAuthoringComponent}