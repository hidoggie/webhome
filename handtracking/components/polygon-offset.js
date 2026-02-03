const polygonOffsetComponent = {
  init() {
    function applyOffset(obj) {
      obj.material.polygonOffset = true
      obj.material.polygonOffsetFactor = -10
      obj.material.polygonOffsetUnits = 1
      obj.material.needsUpdate = true
    }

    this.el.sceneEl.addEventListener('xrhandfound', () => {
      // apply polygon offset
      if (this.el.object3D.children.length > 0) {
        this.el.object3D.traverse((child) => {
          if (child.isMesh) applyOffset(child)
        })
      }

      this.el.addEventListener('model-loaded', () => {
        this.el.object3D.traverse((child) => {
          if (child.isMesh) applyOffset(child)
        })
      })
    })
  },
}

export {polygonOffsetComponent}
