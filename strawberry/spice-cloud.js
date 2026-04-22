const PATCH_WIDTH = 10
const PATCH_DEPTH = 10
const START_HEIGHT = 10
const FALL_DURATION_MS = 4000

const MAX_CATCH_HEIGHT = 0.1
const MAX_CATCH_DIST_SQ = 4

const rand = (min, max) => min + Math.random() * (max - min)

const spiceCloudComponent = {
  init() {
    this.el.setAttribute('particle-system', {
      color: '#ffa500,#ffa500,#ffa500',
      positionSpread: '0.15 0.15 0.15',
      rotationAxis: 'x',
      direction: '0',
      particleCount: '250',
      maxParticleCount: '500',
      maxAge: '0.45',
      accelerationValue: '-0.01, -0.01, -0.01',
      accelerationSpread: '0 0 0',
      velocityValue: '0 0 0',
    })
    
    const x = rand(-PATCH_WIDTH, PATCH_WIDTH)
    const z = rand(-PATCH_WIDTH, PATCH_WIDTH)
    
    this.x = x
    
    this.z = z
    
    this.start = Date.now()
 
 
 this.el.object3D.position.set(x, START_HEIGHT, z)
    
    
    this.hitGroundTimeout = setTimeout(() => {
      this.el.sceneEl.removeChild(this.el)
    }, FALL_DURATION_MS)
    
    this.pumpkins = Array.from(document.querySelectorAll('.pumpkin'))
  },
  tick() {
    
    this.el.object3D.position.y = START_HEIGHT * (1 - ((Date.now() - this.start) / FALL_DURATION_MS))
    
    if (this.el.object3D.position.y < MAX_CATCH_HEIGHT ) {
      const caughtPumpkin = this.pumpkins.find(e => {
        const distSq = e.object3D.position.lengthSq(this.el.object3D.position)
        
        return distSq < MAX_CATCH_DIST_SQ
      })
      
      if (caughtPumpkin) {
        this.el.sceneEl.emit('spicecaught')
        this.el.sceneEl.removeChild(this.el)
        clearTimeout(this.hitGroundTimeout)
      }
    }
  }
}

export {
  spiceCloudComponent,
}
