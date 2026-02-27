import {Utils} from './../utils.js'

const GameElementComponent = {
  schema: {
    initialPosition: {type: 'vec3', default: {x: 0, y: 0, z: 0}},
  },
  init() {
    this.data.initialPosition = {...this.el.getAttribute('position')}
  },
}

const TargetComponent = {
  schema: {
  },
  init() {
    // const model = document.createElement('a-cylinder')
    // model.setAttribute('radius', 0.2)
    // model.setAttribute('height', 0.1)
    // model.setAttribute('color', '#459245')
    // this.el.appendChild(model)
  },
  update() {
    console.log('update target position')
  },
}

const PlayerComponent = {
  schema: {
    targetPosition: {type: 'vec3', default: {x: 0, y: 0, z: 0}},
    maxPosition: {type: 'vec2', default: {x: 6, y: 6}},
    minPosition: {type: 'vec2', default: {x: -6, y: -6}},
    overEnergy: {type: 'boolean', defaul: false},
  },
  init() {
    this.data.targetPosition = {...this.el.getAttribute('position')}
    const model = document.createElement('a-entity')
    model.setAttribute('position', '0 0 0')
    model.setAttribute('rotation', '0 -90 0')
    model.setAttribute('scale', '0.5 0.5 0.5')
    this.el.appendChild(model)
    model.setAttribute('gltf-model', '#playerModel')
    model.addEventListener('model-loaded', () => {
      this.el.object3D.traverse((obj) => {
        // console.log(obj)
        if (obj.name === 'Robot_1') {
          this.objectMaterial = obj.material
          this.defaultObjectColor = this.objectMaterial.color
          this.overColor = new THREE.Color(1, 0, 0)
        }
      })
    })
    this.model = model
  },
  update(oldData) {
    const pos = this.el.getAttribute('position')
    const tgpos = this.data.targetPosition
    const angle = 180 + Utils.angleDeg(tgpos.x, tgpos.z, pos.x, pos.z)

    this.model.setAttribute('rotation', `0 ${angle} 0`)
    this.data.targetPosition.x = Math.max(this.data.minPosition.x, Math.min(this.data.maxPosition.x, this.data.targetPosition.x))
    this.data.targetPosition.z = Math.max(this.data.minPosition.y, Math.min(this.data.maxPosition.y, this.data.targetPosition.z))

    if (this.objectMaterial) {
      if (this.data.overEnergy) {
        this.objectMaterial.color = this.overColor
      } else {
        this.objectMaterial.color = this.defaultObjectColor
      }
    }
  },
  tick() {

  },
}

const EnemyComponent = {
  schema: {
  },
  init() {
    const model = document.createElement('a-entity')
    model.setAttribute('position', '0 0 0')
    model.setAttribute('rotation', '0 0 0')
    model.setAttribute('scale', '0.5 0.5 0.5')
    this.el.appendChild(model)
    model.setAttribute('gltf-model', '#enemyModel')
    model.addEventListener('model-loaded', () => {
    })
  },
}

const CoinComponent = {
  schema: {

  },
  init() {
    const model = document.createElement('a-entity')
    model.setAttribute('position', '0 0 0')
    model.setAttribute('rotation', '0 0 0')
    model.setAttribute('scale', '0.3 0.3 0.3')

    model.setAttribute('animation', {
      property: 'rotation',
      to: '0 360 0',
      loop: true,
      dur: 5000,
      easing: 'linear',
    })
    this.el.appendChild(model)
    model.setAttribute('gltf-model', '#coinModel')
    model.addEventListener('model-loaded', () => {
    })
  },
}

const EnergyComponent = {
  schema: {

  },
  init() {
    const model = document.createElement('a-entity')
    model.setAttribute('position', '0 0 0')
    model.setAttribute('rotation', '0 0 0')
    model.setAttribute('scale', '0.3 0.3 0.3')

    model.setAttribute('animation', {
      property: 'rotation',
      to: '0 360 0',
      loop: true,
      dur: 5000,
      easing: 'linear',
    })
    this.el.appendChild(model)
    model.setAttribute('gltf-model', '#energyModel')
    model.addEventListener('model-loaded', () => {
    })
  },
}

const FloorComponent = {
  schema: {
    overEnergy: {type: 'boolean', default: 'false'}
  },
  init() {
    const model = document.createElement('a-entity')
    model.setAttribute('position', '0 1 0')
    model.setAttribute('rotation', '0 0 0')
    model.setAttribute('scale', '1 1 1')
    this.el.appendChild(model)
    model.setAttribute('gltf-model', '#floorModel')
    model.addEventListener('model-loaded', () => {
      this.el.object3D.traverse((obj) => {
        if (obj.name === 'Floor001') {
          this.objectMaterial = obj.material
          this.defaultObjectColor = this.objectMaterial.color
          this.overColor = new THREE.Color(1, 0, 0)
        }
      })
    })
  },
  update(oldData) {
    if (this.objectMaterial) {
      if (this.data.overEnergy) {
        this.objectMaterial.color = this.overColor
      } else {
        this.objectMaterial.color = this.defaultObjectColor
      }
    }
  },
}

export {
  GameElementComponent,
  PlayerComponent,
  TargetComponent,
  EnemyComponent,
  CoinComponent,
  EnergyComponent,
  FloorComponent,
}
