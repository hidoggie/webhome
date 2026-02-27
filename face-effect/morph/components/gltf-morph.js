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
      if (!o.isMesh || !o.morphTargetInfluences) return

      // [Fix] Three.js r158+: morphTargetDictionary 우선, 없으면 userData.targetNames fallback
      let pos = -1
      if (o.morphTargetDictionary && this.data.morphTarget in o.morphTargetDictionary) {
        pos = o.morphTargetDictionary[this.data.morphTarget]
      } else if (o.userData.targetNames) {
        pos = o.userData.targetNames.indexOf(this.data.morphTarget)
      }

      if (pos !== -1 && pos < o.morphTargetInfluences.length) {
        o.morphTargetInfluences[pos] = this.data.value
      }
    })
  },
}

export {gltfMorphComponent}
