const punchTapComponent = {
  schema: {
    yOffset: {type: 'number', default: -1},
    zOffset: {type: 'number', default: -1},
  },

  init() {
    this.punchAnimation = () => {
      this.el.removeAttribute('animation')
      this.el.setAttribute('animation', `property: position; dur: 125; from: 0 ${this.data.yOffset} ${this.data.zOffset}; to: 0 ${this.data.yOffset} -3; dir: alternate; loop: 2; easing: easeInOutQuad`)
    }

    this.el.sceneEl.addEventListener('click', this.punchAnimation)

    this.handleKeyDown = (e) => {
      if (e.key === ' ') {
        this.punchAnimation()
      }
    }
    window.addEventListener('keydown', this.handleKeyDown)
  },
}

const resetButtonComponent = {
  init() {
    const {sceneEl} = this.el
    const resetButton = document.getElementById('resetButton')
    const pin1 = document.getElementById('pin1')
    const pin2 = document.getElementById('pin2')
    const pin3 = document.getElementById('pin3')
    const pin4 = document.getElementById('pin4')
    const pin5 = document.getElementById('pin5')
    const pin6 = document.getElementById('pin6')
    const ball = document.getElementById('soccer-ball')

    const handleClickEvent = (e) => {
      resetButton.classList.add('pulse-once')

      ball.setAttribute('ammo-body', {
        type: 'kinematic',
      })
      ball.object3D.position.set(0, 0.75, -3)

      pin1.object3D.children[0].el.setAttribute('ammo-body', {
        type: 'kinematic',
      })
      pin1.object3D.children[0].el.object3D.position.set(0, 3, -7)
      pin1.object3D.children[0].el.object3D.rotation.set(0, 0, 0)

      pin2.object3D.children[0].el.setAttribute('ammo-body', {
        type: 'kinematic',
      })
      pin2.object3D.children[0].el.object3D.position.set(-0.5, 3, -8.5)
      pin2.object3D.children[0].el.object3D.rotation.set(0, 0, 0)

      pin3.object3D.children[0].el.setAttribute('ammo-body', {
        type: 'kinematic',
      })
      pin3.object3D.children[0].el.object3D.position.set(0.5, 3, -8.5)
      pin3.object3D.children[0].el.object3D.rotation.set(0, 0, 0)

      pin4.object3D.children[0].el.setAttribute('ammo-body', {
        type: 'kinematic',
      })
      pin4.object3D.children[0].el.object3D.position.set(0, 3, -10)
      pin4.object3D.children[0].el.object3D.rotation.set(0, 0, 0)

      pin5.object3D.children[0].el.setAttribute('ammo-body', {
        type: 'kinematic',
      })
      pin5.object3D.children[0].el.object3D.position.set(-1, 3, -10)
      pin5.object3D.children[0].el.object3D.rotation.set(0, 0, 0)

      pin6.object3D.children[0].el.setAttribute('ammo-body', {
        type: 'kinematic',
      })
      pin6.object3D.children[0].el.object3D.position.set(1, 3, -10)
      pin6.object3D.children[0].el.object3D.rotation.set(0, 0, 0)

      setTimeout(() => {
        pin1.object3D.children[0].el.setAttribute('ammo-body', {
          type: 'dynamic',
        })
        pin2.object3D.children[0].el.setAttribute('ammo-body', {
          type: 'dynamic',
        })
        pin3.object3D.children[0].el.setAttribute('ammo-body', {
          type: 'dynamic',
        })
        pin4.object3D.children[0].el.setAttribute('ammo-body', {
          type: 'dynamic',
        })
        pin5.object3D.children[0].el.setAttribute('ammo-body', {
          type: 'dynamic',
        })
        pin6.object3D.children[0].el.setAttribute('ammo-body', {
          type: 'dynamic',
        })
        ball.setAttribute('ammo-body', {
          type: 'dynamic',
        })
        resetButton.classList.remove('pulse-once')
      }, 200)
    }
    resetButton.addEventListener('click', handleClickEvent, true)
  },
}

export {punchTapComponent, resetButtonComponent}