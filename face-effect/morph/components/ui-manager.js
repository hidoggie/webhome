const uiManagerComponent = {
  init() {
    // Get a reference to the GLTF model
    const morphTargetModel = document.getElementById('morphTargetModel')
    let morphTargetMesh = morphTargetModel.getObject3D('mesh')

    const handleUI = () => {
      // Grab Array of Morph Targets //
      morphTargetMesh = morphTargetModel.getObject3D('mesh')

      // Define an array to store the target names
      const targetNames = []

      // Traverse the mesh object to find the morph targets and target names
      morphTargetMesh.traverse((object) => {
        if (object.morphTargetInfluences && object.userData.targetNames) {
          targetNames.push(...object.userData.targetNames)
        }
      })

      // Log the target names to the console
      console.log(targetNames)

      // Arrow Functionality //
      // Get the arrow elements
      const leftArrow = document.getElementById('leftArrow')
      const rightArrow = document.getElementById('rightArrow')

      // Get the target name element
      const targetName = document.querySelector('#target-name')

      // Get the slider element
      const slider = document.querySelector('.slider')

      // Initialize the index of the current target
      let currentTargetIndex = 0

      // Object to store the slider values for each morph target
      const sliderValues = {}

      // Function to update the target name and slider value
      function updateTargetNameAndSliderValue() {
        // Get the name of the current morph target
        const currentTargetName = targetNames[currentTargetIndex]

        // Get the current slider value for the current morph target from the sliderValues object
        const currentSliderValue = sliderValues[currentTargetName] || 0

        // Update the target name and slider value
        targetName.textContent = currentTargetName
        slider.value = currentSliderValue
      }

      updateTargetNameAndSliderValue()  // Set initial morph target

      // When the user clicks the left arrow, go to the previous target
      leftArrow.addEventListener('click', () => {
        // Save the current slider value for the current morph target in the sliderValues object
        const currentTargetName = targetNames[currentTargetIndex]
        sliderValues[currentTargetName] = slider.value

        // Go to the previous target
        currentTargetIndex--
        if (currentTargetIndex < 0) {
          // If we've reached the beginning of the array, wrap around to the end
          currentTargetIndex = targetNames.length - 1
        }

        updateTargetNameAndSliderValue()
      })

      // When the user clicks the right arrow, go to the next target
      rightArrow.addEventListener('click', () => {
        // Save the current slider value for the current morph target in the sliderValues object
        const currentTargetName = targetNames[currentTargetIndex]
        sliderValues[currentTargetName] = slider.value

        // Go to the next target
        currentTargetIndex++
        if (currentTargetIndex >= targetNames.length) {
          // If we've reached the end of the array, wrap around to the beginning
          currentTargetIndex = 0
        }

        updateTargetNameAndSliderValue()
      })

      // Slider Functionality //
      slider.addEventListener('input', (event) => {
        const value = parseFloat(event.target.value)
        const name = targetNames[currentTargetIndex]
        const attributeName = `gltf-morph__${name}`
        morphTargetModel.setAttribute(attributeName, {morphTarget: name, value})
      })

      // Add an event listener to the reset button
      const resetButton = document.getElementById('reset')
      resetButton.addEventListener('click', () => {
        // Reset current slider to 0

        slider.value = 0

        // Reset the other sliders to 0
        Object.keys(sliderValues).forEach((key) => {
          sliderValues[key] = 0
        })

        // Reset Morph Target Values to 0
        morphTargetMesh.traverse((object) => {
          if (object.morphTargetInfluences) {
            for (let i = 0; i < object.morphTargetInfluences.length; i++) {
              object.morphTargetInfluences[i] = 0
            }
          }
        })
      })
    }

    if (morphTargetMesh) {
      handleUI()
    } else {
      // Wait for the model to load
      morphTargetModel.addEventListener('model-loaded', handleUI)
    }
  },
}

export {uiManagerComponent}
