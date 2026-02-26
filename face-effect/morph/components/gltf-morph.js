const gltfMorphComponent = {
  multiple: true,
  schema: {
    morphTarget: {type: 'string', default: ''},
    value: {type: 'number', default: 0},
  },
  init() {
    this.el.addEventListener('object3dset', () => {
      this.morpher()
    })
  },
  update() {
    this.morpher()
  },
  morpher() {
    const mesh = this.el.object3D
    mesh.traverse((o) => {
      if (o.morphTargetInfluences && o.userData.targetNames) {
        const pos = o.userData.targetNames.indexOf(this.data.morphTarget)
        // o.morphTargetInfluences[pos] = Math.min(this.data.value, 1.0) // to max morph target values at 1
        o.morphTargetInfluences[pos] = this.data.value
      }
    })
  },
}

export {gltfMorphComponent}
