const colorPickerComponent = {
  schema: {
    makeup: {type: 'string'},
  },
  init() {
    const container = document.getElementById('palette')
    const colorInput = document.getElementById('color-input')
    const colorParent = document.getElementById('colorParent')
    const rightEye = document.getElementById('rightIris')
    const leftEye = document.getElementById('leftIris')
    this.currentMakeup = document.getElementById(this.data.makeup)
    // custom texture variables
    const noneIcon = './../../assets/alpha-masks/noneIcon.png'
    const dropperIcon = './../../assets/alpha-masks/dropper.svg'

    this.offset = 0
    this.textureSelected = false
    this.once = false

    const setColorList = () => {
      // These hex colors are used by the UI buttons for each makeup piece
      const {makeup} = this.data
      if (makeup === 'lipstick') {
        this.colorList = ['none', '#8b3737', '#641824', '#841E43', '#441419', '#A72934', 'dropper']
      } else if (makeup === 'blush') {
        this.colorList = ['none', '#a84856', '#f2b4ae', '#9e492f', '#ca8082', '#f25f69', 'dropper']
      } else if (makeup === 'lowerLashes') {
        this.colorList = ['none', '#000000', '#36454F', '#964B00', 'dropper']
      } else if (makeup === 'contacts') {
        this.colorList = ['none', '#A9D6EA', '#DDBD56', '#FF8DD2', '#7EDBA9', '#BC9CFF', 'dropper']
      } else if (makeup === 'eyeshadow') {
        this.colorList = ['none', '#B36A64', '#EFD5C8', '#916A58', '#b56984', '#4F393D', 'dropper']
      } else if (makeup === 'eyebrows') {
        this.colorList = ['none', '#4e372d', '#564036', '#9D8372', '#C1A07D', '#876D5C', 'dropper']
      } else if (makeup === 'eyeliner') {
        this.colorList = ['none', '#4e372d', '#4559D2', '#ffffff', '#DD5247', '#669A34', 'dropper']
      }
    }

    this.colorInput = colorInput
    this.setColorInput = () => {
      const selectedColor = this.colorInput.value
      if (this.currentMakeup === 'contacts') {
        rightEye.setAttribute('material', {color: selectedColor})
        leftEye.setAttribute('material', {color: selectedColor})
      } else {
        this.currentMakeup.setAttribute('material', {color: selectedColor})
      }
      this.dropperButton.style.background = `${selectedColor} url(${dropperIcon}) no-repeat center center`
      this.dropperButton.style.backgroundSize = '1.7rem'
    }

    const setColor = ({newColor, button}) => {
      if (this.currentMakeup === 'contacts' && (newColor === 'none')) {
        rightEye.setAttribute('material', {visible: false})
        leftEye.setAttribute('material', {visible: false})
      } else if (this.currentMakeup === 'contacts') {
        rightEye.setAttribute('material', {visible: true, color: newColor})
        leftEye.setAttribute('material', {visible: true, color: newColor})
      } else if (newColor === 'none') {
        // sets no visibility
        this.currentMakeup.setAttribute('material', {visible: false})
      } else {
        // no custom texture
        this.currentMakeup.setAttribute('material', {visible: true, color: newColor})
        this.textureSelected = false
      }
      button.focus()
    }
    this.createButtons = () => {
      setColorList()
      // create a UI button for each color in the list
      for (let i = 0; i < this.colorList.length; i++) {
        const colorButton = document.createElement('button')
        colorButton.classList.add('carousel')
        if (this.colorList[i] === 'none') {
        // sets button background to none icon
          colorButton.style.background = `rgba(255, 255, 255, 0.1) url(${noneIcon}) no-repeat center center`
          colorButton.style.backdropFilter = 'blur(30px)'
          colorButton.style.webkitBackdropFilter = 'blur(30px)'
        } else if (this.colorList[i] === 'dropper') {
        // sets button background to dropper icon
          colorButton.style.background = `rgb(255,255,255) url(${dropperIcon}) no-repeat center center`
          colorButton.style.backgroundSize = '1.7rem'
          colorInput.style.top = '12px'
          colorInput.style.right = '11px'
          colorInput.addEventListener('input', this.setColorInput)

          this.dropperButton = colorButton  // get a handle so I can remove it when switching tabs

          colorParent.appendChild(colorButton)
          container.appendChild(colorParent)
          return
        } else {
        // sets button background to hex color
          colorButton.style.backgroundColor = this.colorList[i]
        }
        container.appendChild(colorButton)
        colorButton.addEventListener('click', () => setColor({
          newColor: this.colorList[i],
          button: colorButton,
        }))
      }
    }

    this.createButtons()

    this.removeButtons = () => {
      colorParent.removeChild(this.dropperButton)
      while (container.firstChild) {
        container.removeChild(container.firstChild)
      }
    }
    this.el.sceneEl.addEventListener('realityready', () => {
      // Select first button in list
      const secondButton = container.getElementsByTagName('button')[1]
      // set car to first button's color
      setColor({newColor: this.colorList[1], button: secondButton})
    })
    // support horizontal scroll for more than 5 colors
    if (this.colorList.length > 5) {
      container.style.pointerEvents = 'auto'
    }
  },
  update() {
    if (this.data.makeup === 'contacts') {
      this.currentMakeup = 'contacts'
    } else {
      this.currentMakeup = document.getElementById(this.data.makeup)
    }
    // Execute code after the first update() is run after init()
    if (this.once) {
      this.removeButtons()
      this.createButtons()
    } else {
      this.once = true
    }
  },
}

export {colorPickerComponent}
