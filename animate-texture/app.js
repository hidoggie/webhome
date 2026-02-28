AFRAME.registerComponent('animate-texture', {
  init() {
    this.offset = 0
  },
  tick() {
    const mesh = this.el.getObject3D('mesh')
    if (!mesh) {
      return
    }
    mesh.traverse((node) => {
      if (node.isMesh) {
        node.material.map.offset.x = this.offset
        node.material.needsUpdate = true
      }
    })
    this.offset += 0.001
  },
})

AFRAME.registerComponent('animate-cape', {
  init() {
    this.offset = 0
    this.capeMesh = null
  },
  tick() {
    const mesh = this.el.getObject3D('mesh')
    if (!mesh) {
      return
    }

    // 처음 한 번만 cape mesh를 찾아서 캐싱
    if (!this.capeMesh) {
      // GLB 실제 mesh 이름: 'Plane_Teddy Bear_0'
      this.capeMesh = mesh.getObjectByName('Plane_Teddy Bear_0')
      if (!this.capeMesh) {
        return
      }
    }

    const mat = this.capeMesh.material
    if (!mat || !mat.map) {
      return
    }

    mat.map.repeat.x = 0.5
    mat.map.repeat.y = 0.5
    mat.map.offset.x = this.offset
    mat.needsUpdate = true
    this.offset += 0.002
  },
})
