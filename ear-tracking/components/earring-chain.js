const earringChainComponent = {
  schema: {
    mass: {type: 'number', default: 20},
    linearDamping: {type: 'number', default: 0.2},
    angularDamping: {type: 'number', default: 0.85},
  },
  init() {
    const leftEarringTop = document.getElementById('leftEarringTop')
    const leftEarringMid = document.getElementById('leftEarringMid')
    const leftEarringLow = document.getElementById('leftEarringLow')

    const rightEarringTop = document.getElementById('rightEarringTop')
    const rightEarringMid = document.getElementById('rightEarringMid')
    const rightEarringLow = document.getElementById('rightEarringLow')

    this.el.sceneEl.addEventListener('xrfacefound', () => {
      setTimeout(() => {
        leftEarringTop.setAttribute('ammo-body', {type: 'static'})  // The first object serves as the anchor.
        leftEarringTop.setAttribute('ammo-shape', {type: 'box'})

        leftEarringMid.setAttribute('ammo-body', {
          type: 'dynamic',
          mass: this.data.mass,
          linearDamping: this.data.linearDamping,
          angularDamping: this.data.angularDamping,
          activationState: 'disableDeactivation',
        })
        leftEarringMid.setAttribute('ammo-shape', {type: 'box', offset: '0 -.014 0', fit: 'manual', halfExtents: '.013 .012 .0015'})
        leftEarringMid.setAttribute('ammo-constraint', {
          target: '#leftEarringTop',
          type: 'pointToPoint',
          pivot: '0 0.005 0',
          targetPivot: '0 -.0085 0',
        })

        leftEarringLow.setAttribute('ammo-body', {
          type: 'dynamic',
          mass: this.data.mass,
          linearDamping: this.data.linearDamping,
          angularDamping: this.data.angularDamping,
          activationState: 'disableDeactivation',
        })
        leftEarringLow.setAttribute('ammo-shape', {type: 'box', offset: '0 -.015 0'})
        leftEarringLow.setAttribute('ammo-constraint', {
          target: '#leftEarringMid',
          type: 'pointToPoint',
          pivot: '0 0.01 0',
          targetPivot: '0 -.02 0',
        })

        // right ear
        rightEarringTop.setAttribute('ammo-body', {type: 'static'})  // The first object serves as the anchor.
        rightEarringTop.setAttribute('ammo-shape', {type: 'box'})

        rightEarringMid.setAttribute('ammo-body', {
          type: 'dynamic',
          mass: this.data.mass,
          linearDamping: this.data.linearDamping,
          angularDamping: this.data.angularDamping,
          activationState: 'disableDeactivation',
        })
        rightEarringMid.setAttribute('ammo-shape', {type: 'box', offset: '0 -.014 0', fit: 'manual', halfExtents: '.013 .012 .0015'})
        rightEarringMid.setAttribute('ammo-constraint', {
          target: '#rightEarringTop',
          type: 'pointToPoint',
          pivot: '0 0.005 0',
          targetPivot: '0 -.0085 0',
        })

        rightEarringLow.setAttribute('ammo-body', {
          type: 'dynamic',
          mass: this.data.mass,
          linearDamping: this.data.linearDamping,
          angularDamping: this.data.angularDamping,
          activationState: 'disableDeactivation',
        })
        rightEarringLow.setAttribute('ammo-shape', {type: 'box', offset: '0 -.015 0'})
        rightEarringLow.setAttribute('ammo-constraint', {
          target: '#rightEarringMid',
          type: 'pointToPoint',
          pivot: '0 0.01 0',
          targetPivot: '0 -.02 0',
        })
      }, 0)
    })
  },
}

export {earringChainComponent}