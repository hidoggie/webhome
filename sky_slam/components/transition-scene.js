const transitionSceneComponent = {
  schema: {
    direction: {
      type: 'string', default: 'skyToSlam',
    },
    id: {
      type: 'string',
    },
  },
  init() {
    const newEntity = document.createElement('a-entity')

    // Transition to the SLAM Scene if direction is set to 'skyToSlam'
    const newScene = this.data.direction === 'skyToSlam'
      ? document.querySelector('a-scene') : document.querySelector('[xrlayerscene]')

    if (this.data.direction !== 'skyToSlam' && this.data.direction !== 'slamToSky') {
      console.warn('[transition-scene.js] Direction was not set to slamToSky or skyToSlam. Defaulting to slamToSky')
    }

    const mesh = this.el.getObject3D('mesh')  // Grab the A-Frame Entity's Object3D
    newScene.appendChild(newEntity)

    // Bake the Entity's Local Position, Rotation, and Scale into the Object3D
    this.el.object3D.updateMatrix()
    // Create a new Matrix4 and clone the Object3D's Position, Rotation, and Scale
    const matrix = this.el.object3D.matrix.clone()
    this.el.removeObject3D('mesh')  // Remove Original Entity from the A-Frame Scene
    newEntity.setObject3D('mesh', mesh)  // Apply the original Object3D to the New Entity's Object3D

    // Apply the Original Object3D's Local Position, Rotation, and Scale to the new Entity
    newEntity.object3D.applyMatrix4(matrix)
    // Emit a custom event and attach a handle to the transitioned New Entity
    this.el.sceneEl.emit('transition-end', {newEntity, id: this.data.id}, false)
  },
}
export {transitionSceneComponent}