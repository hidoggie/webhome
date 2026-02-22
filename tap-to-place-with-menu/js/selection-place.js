const selectionPlaceComponent = {
  init() {
    const container = document.getElementById('container')
    const ground = document.getElementById('ground')
    const scene = document.querySelector('a-scene')
    const entries = [
      {id: '#benchModel', img: './../assets/icons/bench.jpg'},
      {id: '#trashcanModel', img: './../assets/icons/trash.jpg'},
      {id: '#lanternModel', img: './../assets/icons/lamp.jpg'},
      {id: 'eraser', img: './../assets/icons/eraser.jpg'},
    ]

    let currentEntry = null
    let focusedButton = null
    let isErasing = false
    let canCreateObject = true  // Timeout control flag

    function setEntry(index, button) {
      currentEntry = index
      isErasing = entries[index].id === 'eraser'
      if (focusedButton) {
        focusedButton.classList.remove('focused')
      }
      focusedButton = button
      focusedButton.classList.add('focused')
    }

    entries.forEach((entry, index) => {
      const videoButton = document.createElement('button')
      videoButton.classList.add('carousel')
      videoButton.style.backgroundImage = `url(${entry.img})`
      videoButton.addEventListener('click', (event) => {
        event.preventDefault()
        setEntry(index, videoButton)
      })

      container.appendChild(videoButton)
    })

    if (entries.length >= 5) {
      container.style.pointerEvents = 'auto'
    }

    document.addEventListener('click', (event) => {
      if (!event.target.closest('.carousel')) {
        if (focusedButton) {
          event.preventDefault()
          focusedButton.focus()
        }
      }
    })

    scene.addEventListener('click', (event) => {
      if (!canCreateObject) return  // Prevent object creation if within cooldown period
      const {intersectedEl} = event.detail

      if (isErasing) {
        // Eraser mode: remove clicked object with animation
        if (intersectedEl && intersectedEl !== ground && intersectedEl.classList.contains('cantap')) {
          intersectedEl.setAttribute('animation', {
            property: 'scale',
            to: '0.0001 0.0001 0.0001',
            easing: 'easeInQuad',
            dur: 300,
          })

          setTimeout(() => {
            if (intersectedEl.parentNode) {
              intersectedEl.parentNode.removeChild(intersectedEl)
            }
          }, 300)
        }
      } else if (entries[currentEntry] && entries[currentEntry].id !== 'eraser') {
        // Normal mode: add new object
        const {intersection} = event.detail
        if (intersection && intersection.point) {
          const newElement = document.createElement('a-entity')
          newElement.setAttribute('position', intersection.point)
          newElement.setAttribute('gltf-model', entries[currentEntry].id)
          newElement.setAttribute('visible', 'false')
          newElement.setAttribute('scale', '0.0001 0.0001 0.0001')
          newElement.setAttribute('shadow', {receive: false})
          newElement.setAttribute('class', 'cantap')

          scene.appendChild(newElement)
          newElement.addEventListener('model-loaded', () => {
            newElement.setAttribute('visible', 'true')
            newElement.setAttribute('animation', {
              property: 'scale',
              to: '1 1 1',
              easing: 'easeOutElastic',
              dur: 800,
            })
          })
          console.log('Made one')

          // Set a 200ms timeout before allowing the next object creation
          canCreateObject = false
          setTimeout(() => {
            canCreateObject = true
          }, 200)
        }
      }
    })

    const camera = document.querySelector('a-camera')
    if (camera) {
      const raycaster = camera.getAttribute('raycaster')
      camera.setAttribute('raycaster', 'objects', `${raycaster.objects}, .cantap`)
    }
  },
}

export {selectionPlaceComponent}
