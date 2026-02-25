const srcFromAttr = (scene, v) => {
  if (!v) {
    return v
  }
  const el = scene.querySelector(v)
  if (!el) {
    return v
  }
  return el.getAttribute('src') || v
}

const alphaMapComponent = {
  schema: {
    type: 'string',
  },
  init() {
    const alphaImage = srcFromAttr(this.el.sceneEl, this.data)
    const alphaMap = new THREE.TextureLoader().load(alphaImage)

    this.el.sceneEl.addEventListener('xrfacefound', () => {
      this.el.getObject3D('mesh').material.alphaMap = alphaMap
    })
  },
}

export {alphaMapComponent}