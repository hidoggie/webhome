const selection = {
  init() {
    const left = document.getElementById('left')
    const right = document.getElementById('right')
    const leftImg = document.getElementById('left-img')
    const rightImg = document.getElementById('right-img')
    let updating = false  // if the options are updating

    const options = [['mcdonalds', 'cfa'], ['tesla', 'mercedes'], ['chanel', 'lvmh']]
    let optionIdx = 0

    // handle options update
    const update = () => {
      setTimeout(() => {
        // restore card colors
        left.setAttribute('color', '#7611B6')
        right.setAttribute('color', '#7611B6')

        // update options
        optionIdx = (optionIdx + 1) % options.length
        const newOptions = options[optionIdx]
        leftImg.setAttribute('material', `src: #${newOptions[0]}`)
        rightImg.setAttribute('material', `src: #${newOptions[1]}`)

        // update state
        updating = false
      }, 1000)
    }

    // handle option selection
    const show = ({detail}) => {
      if (!updating) {
        updating = true
        const xRot = detail.transform.rotation.x
        if (xRot < -0.1) {
          left.setAttribute('color', '#34c759')
          update()
        } else if (xRot > 0.1) {
          right.setAttribute('color', '#34c759')
          update()
        } else {
          updating = false
        }
      }
      // detail.transform.rotation = {w: 0, x: 0, y: 0, z: 0}
    }

    this.el.sceneEl.addEventListener('xrfacefound', show)
    this.el.sceneEl.addEventListener('xrfaceupdated', show)
  },
}

AFRAME.registerComponent('head-rotation-as-input', selection)