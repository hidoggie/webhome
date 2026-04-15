const wristAttachment = new THREE.Object3D()
const ringAttachment = new THREE.Object3D()
const palmAttachment = new THREE.Object3D()
let watch
let orb
const modelArray = []
let reflectionsTexture
const DEFAULT_DRACO_DECODER_LOCATION = 'https://cdn.8thwall.com/web/aframe/draco-decoder-1.5.6/'

const loader = new GLTFLoader()
// Provide a DRACOLoader instance to decode compressed mesh data
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath(DEFAULT_DRACO_DECODER_LOCATION)
// Optional: Pre-fetch Draco WASM/JS module.
dracoLoader.preload()
loader.setDRACOLoader(dracoLoader)

const addRealtimeReflections = (model) => {
  const applyEnvMap = (mesh, envMap) => {
    if (!mesh) return
    mesh.traverse((node) => {
      if (node.isMesh) {
        const materials = Array.isArray(node.material) ? node.material : [node.material]

        materials.forEach((material) => {
          if (material && !('envMap' in material)) return

          material.envMap = envMap
        })
      }
    })
  }

  modelArray.push(model)
  if (modelArray.length === 2) {
    for (let i = 0; i < modelArray.length; i++) {
      applyEnvMap(modelArray[i], reflectionsTexture)
    }
  } else {
    const {renderer} = XR8.Threejs.xrScene()  // Get the 3js scene from XR8.Threejs

    const camTexture_ = new THREE.Texture()
    const refMat = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      color: 0xffffff,
      map: camTexture_,
    })

    const renderTarget = new THREE.WebGLCubeRenderTarget(256, {
      format: THREE.RGBFormat,
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
      colorSpace: THREE.SRGBColorSpace,
    })

    // cubemap scene
    const cubeMapScene = new THREE.Scene()
    const cubeCamera = new THREE.CubeCamera(1, 1000, renderTarget)
    const sphere = new THREE.SphereGeometry(100, 15, 15)
    const sphereMesh = new THREE.Mesh(sphere, refMat)
    sphereMesh.scale.set(-1, 1, 1)
    sphereMesh.rotation.set(Math.PI, -Math.PI / 2, 0)
    cubeMapScene.add(sphereMesh)

    window.XR8.addCameraPipelineModule({
      name: 'cubemap-process',
      onUpdate: () => {
        cubeCamera.update(renderer, cubeMapScene)
      },

      onProcessCpu: ({frameStartResult}) => {
        const {cameraTexture} = frameStartResult
        // force initialization\
        const texProps = renderer.properties.get(camTexture_)
        texProps.__webglTexture = cameraTexture
      },
    })

    reflectionsTexture = cubeCamera.renderTarget.texture
  }
}

// Builds a scene object with a mesh, and manages state updates to each component.
const buildHand = (modelGeometry) => {
  const hand = new THREE.Object3D()
  hand.visible = false

  let handKind = 2
  const left = 1
  const right = 2

  let ringEntity
  let watchEntity
  let orbEntity

  // load watch
  const buildWatch = () => {
    loader.load(require('./assets/watch.glb'), (watchObj) => {
      watch = watchObj.scene
      watch.scale.set(1.3, 1.3, 1.3)
      watch.position.set(0, -0.013, 0)
      watch.rotation.set(0, 1.5708, 0)
      wristAttachment.add(watch)
      hand.add(wristAttachment)
      addRealtimeReflections(watch)
      watch.visible = false
      watchEntity = watch
    })
  }
  buildWatch()

  // load orb
  const buildOrb = () => {
    loader.load(require('./assets/orb.glb'), (orbObj) => {
      orb = orbObj.scene
      orb.scale.set(0.11, 0.11, 0.11)
      orb.position.set(0, 0.01, 0)
      orb.rotation.set(0, 0, 0)
      palmAttachment.add(orb)
      hand.add(palmAttachment)
      orb.visible = true
      orbEntity = orb
    })
  }
  buildOrb()

  // create wrist occluder
  const wristOccluderGeometry = new THREE.CylinderGeometry(1, 1, 0.1, 32)
  const wristOccluderMaterial = new THREE.MeshBasicMaterial({color: '#F5F5F5', transparent: false, colorWrite: false})
  const wristOccluder = new THREE.Mesh(wristOccluderGeometry, wristOccluderMaterial)
  wristAttachment.add(wristOccluder)
  wristOccluder.position.set(0.002, -0.055, 0.003)

  // load ring
  const buildRing = () => {
    let ring
    loader.load(require('./assets/diamondRing.glb'), (ringObj) => {
      ring = ringObj.scene
      ring.scale.set(0.13, 0.13, 0.13)
      ring.position.set(0, -0.004, 0)
      ring.rotation.set(-1.5708, 0, 0)
      ringAttachment.add(ring)
      hand.add(ringAttachment)
      addRealtimeReflections(ring)
      ring.visible = false
      ringEntity = ring
    })
  }
  buildRing()

  // build hand mesh
  const geometry = new THREE.BufferGeometry()
  const meshVertices = new Float32Array(3 * modelGeometry.pointsPerDetection)
  geometry.setAttribute('position', new THREE.BufferAttribute(meshVertices, 3))

  const rightIndices = new Array(3 * modelGeometry.rightIndices.length)
  for (let i = 0; i < modelGeometry.rightIndices.length; i++) {
    rightIndices[3 * i] = modelGeometry.rightIndices[i].a
    rightIndices[3 * i + 1] = modelGeometry.rightIndices[i].b
    rightIndices[3 * i + 2] = modelGeometry.rightIndices[i].c
  }
  geometry.setIndex(rightIndices)

  const leftIndices = new Array(3 * modelGeometry.leftIndices.length)
  for (let i = 0; i < modelGeometry.leftIndices.length; i++) {
    leftIndices[3 * i] = modelGeometry.leftIndices[i].a
    leftIndices[3 * i + 1] = modelGeometry.leftIndices[i].b
    leftIndices[3 * i + 2] = modelGeometry.leftIndices[i].c
  }

  // Wireframe material
  const material = new THREE.MeshBasicMaterial({color: 0x7611B6, opacity: 0, transparent: true, wireframe: true})
  const handMesh = new THREE.Mesh(geometry, material)
  hand.add(handMesh)

  // build hand occluder
  const occluderGeometry = new THREE.BufferGeometry()
  const occluderVertices = new Float32Array(3 * modelGeometry.pointsPerDetection)
  occluderGeometry.setAttribute('position', new THREE.BufferAttribute(occluderVertices, 3))

  const occluderRightIndices = new Array(3 * modelGeometry.rightIndices.length)
  for (let i = 0; i < modelGeometry.rightIndices.length; i++) {
    occluderRightIndices[3 * i] = modelGeometry.rightIndices[i].a
    occluderRightIndices[3 * i + 1] = modelGeometry.rightIndices[i].b
    occluderRightIndices[3 * i + 2] = modelGeometry.rightIndices[i].c
  }
  occluderGeometry.setIndex(occluderRightIndices)

  const occluderLeftIndices = new Array(3 * modelGeometry.leftIndices.length)
  for (let i = 0; i < modelGeometry.leftIndices.length; i++) {
    occluderLeftIndices[3 * i] = modelGeometry.leftIndices[i].a
    occluderLeftIndices[3 * i + 1] = modelGeometry.leftIndices[i].b
    occluderLeftIndices[3 * i + 2] = modelGeometry.leftIndices[i].c
  }

  // Fill occluder with default normals.
  const occluderNormals = new Float32Array(modelGeometry.pointsPerDetection * 3)
  occluderGeometry.setAttribute('normal', new THREE.BufferAttribute(occluderNormals, 3))
  const occluderMaterial = new THREE.MeshBasicMaterial({color: '#F5F5F5', transparent: false, colorWrite: false})
  const handOccluder = new THREE.Mesh(occluderGeometry, occluderMaterial)
  hand.add(handOccluder)

  // add next button functionality
  const nextButton = document.createElement('div')
  document.body.appendChild(nextButton)
  nextButton.id = 'nextButton'
  nextButton.textContent = 'Next'

  let counter = 0
  nextButton.addEventListener('click', () => {
    if (counter === 0) {
      orbEntity.visible = false
      handMesh.material.opacity = 0.5
      handMesh.material.wireframe = true
    } else if (counter === 1) {
      ringEntity.visible = true
      handMesh.material.opacity = 0
    } else if (counter === 2) {
      ringEntity.visible = false
      watchEntity.visible = true
    } else if (counter === 3) {
      watchEntity.visible = false
      orbEntity.visible = true
    }
    // Update the counter for the next click
    counter = (counter + 1) % 4
  })

  const found = (event) => {
    const apt = event.detail.attachmentPoints.wrist
    const {minorRadius} = apt
    const {majorRadius} = apt
    // set cylinder scale as radii to create oval occluder
    wristOccluder.scale.set(majorRadius, 1, minorRadius)
  }

  // Update geometry on each frame with new info from the hand controller.
  const show = (event) => {
    const {transform, vertices, normals, attachmentPoints} = event.detail

    // Update mesh indices
    if (handKind !== event.detail.handKind) {
      handKind = event.detail.handKind
      if (handKind === left) {
        handMesh.geometry.setIndex(leftIndices)
        handOccluder.geometry.setIndex(occluderLeftIndices)
        if (watch) {
          watch.rotation.set(0, -1.5708, 3.14159)
        }
      } else if (handKind === right) {
        handMesh.geometry.setIndex(rightIndices)
        handOccluder.geometry.setIndex(occluderRightIndices)
        if (watch) {
          watch.rotation.set(0, 1.5708, 0)
        }
      }
    }

    // Update the overall hand position.
    hand.position.copy(transform.position)
    hand.scale.set(transform.scale, transform.scale, transform.scale)

    // Update the wrist position.
    wristAttachment.position.copy(attachmentPoints.wrist.position)
    wristAttachment.quaternion.copy(attachmentPoints.wrist.rotation)

    // Update the ring position.
    ringAttachment.position.copy(attachmentPoints.ringLower.position)
    ringAttachment.quaternion.copy(attachmentPoints.ringLower.rotation)

    // Update the palm position.
    palmAttachment.position.copy(attachmentPoints.palm.position)
    palmAttachment.quaternion.copy(attachmentPoints.palm.rotation)

    // Update the hand mesh vertex positions.
    const {position} = handMesh.geometry.attributes
    for (let i = 0; i < vertices.length; i++) {
      position.setXYZ(i, vertices[i].x, vertices[i].y, vertices[i].z)
    }
    position.needsUpdate = true

    // Update the hand occluder vertex positions.
    const occluderPosition = handOccluder.geometry.attributes.position
    for (let i = 0; i < vertices.length; i++) {
      occluderPosition.setXYZ(i, vertices[i].x, vertices[i].y, vertices[i].z)
    }
    occluderPosition.needsUpdate = true

    // Update hand occluder normals.
    for (let i = 0; i < normals.length; ++i) {
      occluderNormals[i * 3] = normals[i].x
      occluderNormals[i * 3 + 1] = normals[i].y
      occluderNormals[i * 3 + 2] = normals[i].z
    }
    occluderNormals.needsUpdate = true

    // Update vertex positions along the normal to make occluder smaller and prevent z-fighting
    for (let i = 0; i < vertices.length; ++i) {
      const normal = normals[i]

      // Shift the position along the normal.
      const shiftAmount = 0.002  // Adjust this value as needed to make occluder larger/smaller
      occluderVertices[i * 3] += normal.x * shiftAmount
      occluderVertices[i * 3 + 1] += normal.y * shiftAmount
      occluderVertices[i * 3 + 2] += normal.z * shiftAmount
    }
    occluderPosition.needsUpdate = true

    // Show the hand mesh and occluder
    handMesh.frustumCulled = false
    handMesh.visible = true
    handOccluder.frustumCulled = false
    handOccluder.visible = true
    hand.visible = true
  }

  // Hide all objects.
  const hide = () => {
    hand.visible = false
    handMesh.visible = false
    handOccluder.visible = false
  }

  return {
    object3d: hand,
    show,
    hide,
    found,
  }
}

// Build a pipeline module that initializes and updates the three.js scene based on handcontroller
// events.
const handScenePipelineModule = () => {
  // Start loading mesh url early.
  let canvas_
  let modelGeometry_

  // track one hand
  let handMesh_ = null

  // init is called by onAttach and by handcontroller.handloading. It needs to be called by both
  // before we can start.
  const init = ({canvas, detail}) => {
    canvas_ = canvas_ || canvas
    modelGeometry_ = modelGeometry_ || detail

    if (!(canvas_ && modelGeometry_)) {
      return
    }

    // Get the 3js scene from XR
    const {scene, camera, renderer} = XR8.Threejs.xrScene()  // Get the 3js scene from XR8.Threejs
    THREE.ColorManagement.enabled = false
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace

    // sets render sort order to the order of objects added to scene (for alpha rendering).
    THREE.WebGLRenderer.sortObjects = false

    // add lights.
    const targetObject = new THREE.Object3D()
    targetObject.position.set(0, 0, 0)
    scene.add(targetObject)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.castShadow = true
    directionalLight.position.set(0, 0.25, 0)
    directionalLight.target = targetObject
    scene.add(directionalLight)

    const bounceLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.5)
    scene.add(bounceLight)

    // add hand mesh to the scene
    handMesh_ = buildHand(modelGeometry_)
    scene.add(handMesh_.object3d)

    // prevent scroll/pinch gestures on canvas.
    canvas_.addEventListener('touchmove', event => event.preventDefault())
  }

  const onDetach = () => {
    canvas_ = null
    modelGeometry_ = null
  }

  const found = (event) => {
    handMesh_.found(event)
  }

  // Update the corresponding hand mesh
  const show = (event) => {
    handMesh_.show(event)
  }
  const hide = (event) => {
    handMesh_.hide()
  }

  return {
    name: 'handscene',
    onAttach: init,
    onDetach,
    listeners: [
      {event: 'handcontroller.handloading', process: init},
      {event: 'handcontroller.handfound', process: found},
      {event: 'handcontroller.handfound', process: show},
      {event: 'handcontroller.handupdated', process: show},
      {event: 'handcontroller.handlost', process: hide},
    ],
  }
}

export {handScenePipelineModule}
