export const initScenePipelineModule = (string, fontName, textureFontSize, fontScaleFactor, scene, camera, renderer) => {
  let instancedMesh
  const dummy = new THREE.Object3D()
  let textureCoordinates = []

  // Parameters of whole string per 2D canvas and 3D scene
  const stringBox = {
    wTexture: 0,
    wScene: 0,
    hTexture: 0,
    hScene: 0,
  }

  const initScene = () => {
    // Create canvas to sample the text
    const textCanvas = document.createElement('canvas')
    const textCtx = textCanvas.getContext('2d')
    document.body.appendChild(textCanvas)

    // Instanced geometry and material
    const particleGeometry = new THREE.PlaneGeometry(1, 1)
    const texture = new THREE.TextureLoader().load('https://ksenia-k.com/img/threejs/smoke.png')
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      alphaMap: texture,
      depthTest: false,
      opacity: 0.3,
      transparent: true,
    })

    function sampleCoordinates() {
      // Parse text
      const lines = string.split('\n')
      const linesMaxLength = [...lines].sort((a, b) => b.length - a.length)[0]
        .length
      stringBox.wTexture = textureFontSize * 0.7 * linesMaxLength
      stringBox.hTexture = lines.length * textureFontSize

      // Draw text
      const linesNumber = lines.length
      textCanvas.width = stringBox.wTexture
      textCanvas.height = stringBox.hTexture
      textCtx.font = `100 ${textureFontSize}px ${fontName}`
      textCtx.fillStyle = '#2a9d8f'
      textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height)
      for (let i = 0; i < linesNumber; i++) {
        textCtx.fillText(
          lines[i],
          0,
          ((i + 0.8) * stringBox.hTexture) / linesNumber
        )
      }

      // Sample coordinates
      if (stringBox.wTexture > 0) {
        const imageData = textCtx.getImageData(
          0,
          0,
          textCanvas.width,
          textCanvas.height
        )
        for (let i = 0; i < textCanvas.height; i++) {
          for (let j = 0; j < textCanvas.width; j++) {
            if (imageData.data[(j + i * textCanvas.width) * 4] > 0) {
              textureCoordinates.push({
                x: j,
                y: i,
              })
            }
          }
        }
      }
    }

    function createInstancedMesh() {
      instancedMesh = new THREE.InstancedMesh(particleGeometry, particleMaterial, textureCoordinates.length)
      scene.add(instancedMesh)

      // manually position text
      instancedMesh.position.x = -0.5 * stringBox.wScene
      instancedMesh.position.z = -10
      // instancedMesh.position.y = -0.5 * stringBox.hScene
    }

    function updateParticlesMatrices() {
      let idx = 0
      textureCoordinates.forEach((p) => {
        // we apply samples coordinates like before + some random rotation
        dummy.rotation.set(2 * Math.random(), 2 * Math.random(), 2 * Math.random())
        dummy.position.set(p.x, stringBox.hScene - p.y, Math.random())

        dummy.updateMatrix()
        instancedMesh.setMatrixAt(idx, dummy.matrix)

        idx++
      })
      instancedMesh.instanceMatrix.needsUpdate = true
    }

    function refreshText() {
      sampleCoordinates()
      textureCoordinates = textureCoordinates.map(c => ({x: c.x * fontScaleFactor, y: c.y * fontScaleFactor}))
      const sortedX = textureCoordinates.map(v => v.x).sort((a, b) => b - a)[0]
      const sortedY = textureCoordinates.map(v => v.y).sort((a, b) => b - a)[0]
      stringBox.wScene = sortedX
      stringBox.hScene = sortedY

      createInstancedMesh()
      updateParticlesMatrices()
    }

    refreshText()
  }

  return {
    name: 'threejsscene',
    onStart: () => {
      initScene()
    },
    onUpdate: () => {
      // add call to something that needs to happen on render()
    },
  }
}
