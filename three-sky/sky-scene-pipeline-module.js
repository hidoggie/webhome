// Returns a pipeline module that initializes a sky scene with models and textures
// along with simple interactivity and debug options.
import * as THREE from './../xr_st/r123-three-min.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export const skySampleScenePipelineModule = () => {
  const textureLoader = new THREE.TextureLoader();
  const TEXTURE = textureLoader.load('./assets/sky-textures/space.png');

//  const TEXTURE = require('./assets/sky-textures/space.png')
//  const DOTY_MODEL = require('./assets/sky-models/doty.glb')
//  const AIRSHIP_MODEL = require('./assets/sky-models/airship.glb')

  const loader = new THREE.GLTFLoader()  // This comes from GLTFLoader.js.
  const dracoLoader = new THREE.DRACOLoader()  // DRACOLoader for Draco Compressed Models
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.3.6/')
  dracoLoader.preload()  // Pre-fetch Draco WASM/JS module.
  loader.setDRACOLoader(dracoLoader)

  loader.load('./assets/sky-models/doty.glb', (gltf) => { 
     const DOTY_MODEL = gltf.scene; 
  });

  loader.load('./assets/sky-models/airship.glb', (gltf) => { 
     const AIRSHIP_MODEL = gltf.scene; 
  });

  let dotyAnimationMixer
  let airshipAnimationMixer

  let skyBox

  const dotyPositioningPivot = new THREE.Group()
  const airshipPositioningPivot = new THREE.Group()

  let airshipLoadedModel
  let dotyLoadedModel

  let idleClipAction
  let walkingClipAction
  let rightWalkingInterval
  let leftWalkingInterval

  let invertMaskBoolean = false
  const skyDebugMode = true  // TOGGLE SKY DEBUG MODE HERE

  const clock = new THREE.Clock()

  if (skyDebugMode) {
  // create debug UI elements if debugMode is true
    const debugOptions = document.createElement('div')
    document.body.appendChild(debugOptions)
    debugOptions.id = 'debugOptions'

    const swapTextureGrid = document.createElement('div')
    swapTextureGrid.id = 'swapTextureGrid'
    debugOptions.appendChild(swapTextureGrid)

    const swapTextureImg = document.createElement('div')
    swapTextureGrid.appendChild(swapTextureImg)

    const swapTextureTxt = document.createElement('p')
    swapTextureGrid.appendChild(swapTextureTxt)
    swapTextureTxt.innerHTML = 'Swap <br> Texture'

    const invertMaskGrid = document.createElement('div')
    invertMaskGrid.id = 'invertMaskGrid'
    debugOptions.appendChild(invertMaskGrid)

    const invertMaskImg = document.createElement('div')
    invertMaskGrid.appendChild(invertMaskImg)

    const invertMaskTxt = document.createElement('p')
    invertMaskGrid.appendChild(invertMaskTxt)
    invertMaskTxt.innerHTML = 'Invert <br> Mask'

    const recenterGrid = document.createElement('div')
    debugOptions.appendChild(recenterGrid)
    recenterGrid.id = 'recenterGrid'

    const recenterImg = document.createElement('div')
    recenterGrid.appendChild(recenterImg)

    const recenterTxt = document.createElement('p')
    recenterGrid.appendChild(recenterTxt)
    recenterTxt.innerHTML = 'Recenter<br> Scene'

    // UI Button Functions
    const handleInvertMask = () => {
      invertMaskBoolean = !invertMaskBoolean
      XR8.LayersController.configure({layers: {sky: {invertLayerMask: invertMaskBoolean}}})
    }

    const handleRecenter = () => {
      XR8.LayersController.recenter()
    }

    invertMaskGrid.addEventListener('touchstart', handleInvertMask)
    recenterGrid.addEventListener('touchstart', handleRecenter)
    swapTextureGrid.addEventListener('touchstart', () => {
      skyBox.visible = !skyBox.visible
    })
  }

  // create UI arrows
  const bottomBar = document.createElement('div')
  bottomBar.id = 'bottomBar'
  document.body.appendChild(bottomBar)

  const leftButton = document.createElement('div')
  leftButton.id = 'leftButton'
  bottomBar.appendChild(leftButton)

  const rightButton = document.createElement('div')
  rightButton.id = 'rightButton'
  bottomBar.appendChild(rightButton)

  // Create a sky scene
  const initSkyScene = ({scene, renderer}) => {
    renderer.outputEncoding = THREE.sRGBEncoding

    // Add soft white light to the scene.
    scene.add(new THREE.AmbientLight(0x404040, 7))

    // Add sky dome.
    const skyGeo = new THREE.SphereGeometry(1000, 25, 25)

    const textureLoader = new THREE.TextureLoader()
    const texture = textureLoader.load(TEXTURE)
    texture.encoding = THREE.sRGBEncoding
    texture.mapping = THREE.EquirectangularReflectionMapping
    const skyMaterial = new THREE.MeshPhongMaterial({
      map: texture,
      toneMapped: true,
    })

    skyBox = new THREE.Mesh(skyGeo, skyMaterial)
    skyBox.material.side = THREE.BackSide
    scene.add(skyBox)
    skyBox.visible = false

    // Load Airship
    loader.load(
      // Resource URL
      AIRSHIP_MODEL,
      // Called when the resource is loaded
      (gltf) => {
        airshipLoadedModel = gltf.scene
        // Animate the model
        airshipAnimationMixer = new THREE.AnimationMixer(airshipLoadedModel)
        const idleClip = gltf.animations[0]
        idleClipAction = airshipAnimationMixer.clipAction(idleClip.optimize())
        idleClipAction.play()

        // Add the model to a pivot to help position it within the circular sky dome
        airshipPositioningPivot.add(airshipLoadedModel)
        scene.add(airshipPositioningPivot)

        const horizontalDegrees = -25  // Higher number moves model right (in degrees)
        const verticalDegrees = 30  // Higher number moves model up (in degrees)
        const modelDepth = 35  // Higher number is further depth.

        airshipLoadedModel.position.set(0, 0, -modelDepth)
        airshipLoadedModel.rotation.set(0, 0, 0)
        airshipLoadedModel.scale.set(10, 10, 10)
        airshipLoadedModel.castShadow = true

        // Converts degrees into radians and adds a negative to horizontalDegrees to rotate in the direction we want
        airshipPositioningPivot.rotation.y = -horizontalDegrees * (Math.PI / 180)
        airshipPositioningPivot.rotation.x = verticalDegrees * (Math.PI / 180)
      }
    )

    // Load Doty
    loader.load(
      // Resource URL
      DOTY_MODEL,
      // Called when the resource is loaded
      (gltf) => {
        dotyLoadedModel = gltf.scene
        // Animate the model
        dotyAnimationMixer = new THREE.AnimationMixer(dotyLoadedModel)
        const idleClip = gltf.animations[0]
        const walkingClip = gltf.animations[1]
        idleClipAction = dotyAnimationMixer.clipAction(idleClip.optimize())
        walkingClipAction = dotyAnimationMixer.clipAction(walkingClip.optimize())
        idleClipAction.play()

        // Add the model to a pivot to help position it within the circular sky dome
        dotyPositioningPivot.add(dotyLoadedModel)
        dotyPositioningPivot.rotation.set(0, 0, 0)
        dotyPositioningPivot.position.set(0, 0, 0)
        scene.add(dotyPositioningPivot)

        const horizontalDegrees = 0  // Higher number moves model right (in degrees)
        const verticalDegrees = 0  // Higher number moves model up (in degrees)
        const modelDepth = 25  // Higher number is further depth.

        dotyLoadedModel.position.set(0, 0, -modelDepth)
        dotyLoadedModel.rotation.set(0, 0, 0)
        dotyLoadedModel.scale.set(100, 100, 100)
        dotyLoadedModel.castShadow = true

        // Converts degrees into radians and adds a negative to horizontalDegrees to rotate in the direction we want
        dotyPositioningPivot.rotation.y = -horizontalDegrees * (Math.PI / 180)
        dotyPositioningPivot.rotation.x = verticalDegrees * (Math.PI / 180)

        // Need to apply the pivot's rotation to the model's position and reset the pivot's rotation
        // So that you can use the rotation to move Doty in a straight and not a tilted walking path
        const modelPos = new THREE.Vector3(0, 0, -modelDepth).applyEuler(dotyPositioningPivot.rotation)
        dotyLoadedModel.position.copy(modelPos)
        dotyPositioningPivot.rotation.set(0, 0, 0)
      }
    )

    // Moving Doty
    // const bottomBar = document.getElementById('bottomBar')
    bottomBar.style.display = 'grid'

    // const rightButton = document.getElementById('rightButton')
    rightButton.addEventListener('touchstart', (e) => {
      rightWalkingInterval = setInterval(() => {
        dotyPositioningPivot.rotation.y -= 0.01
      }, 25)
      dotyLoadedModel.rotation.y = Math.PI / 3
      idleClipAction.stop()
      walkingClipAction.play()
      e.returnValue = false
    })

    rightButton.addEventListener('touchend', () => {
      walkingClipAction.stop()
      idleClipAction.play()
      dotyLoadedModel.rotation.y = 0
      clearInterval(rightWalkingInterval)
    })

    // const leftButton = document.getElementById('leftButton')
    leftButton.addEventListener('touchstart', (e) => {
      leftWalkingInterval = setInterval(() => {
        dotyPositioningPivot.rotation.y += 0.01
      }, 25)
      dotyLoadedModel.rotation.y = -(Math.PI / 3)
      idleClipAction.stop()
      walkingClipAction.play()
      e.returnValue = false
    })

    leftButton.addEventListener('touchend', () => {
      walkingClipAction.stop()
      clearInterval(leftWalkingInterval)
      idleClipAction.play()
      dotyLoadedModel.rotation.y = 0
    })
  }

  const layerFound = ({detail}) => {
    if (detail?.name === 'sky') {
      XR8.LayersController.recenter()
    }
  }

  return {
    // Pipeline modules need a name. It can be whatever you want but must be unique within your app.
    name: 'sky-scene',

    // onStart is called once when the camera feed begins. In this case, we need to wait for the
    // XR8.Threejs scene to be ready before we can access it to add content. It was created in
    // XR8.Threejs.pipelineModule()'s onStart method.
    onStart: ({canvas}) => {
      const {layerScenes, camera, renderer} = XR8.Threejs.xrScene()
      initSkyScene({scene: layerScenes.sky.scene, camera, renderer})

      // Set the initial camera position
      camera.position.set(0, 0, 0)

      // Sync the xr controller's 6DoF position and camera paremeters with our scene.
      XR8.LayersController.configure({
        coordinates: {
          origin: {
            position: camera.position,
            rotation: camera.quaternion,
          },
        },
      })

      // Prevent scroll/pinch gestures on canvas
      canvas.addEventListener('touchmove', (event) => {
        event.preventDefault()
      })

      // Prevent double tap zoom
      document.ondblclick = function (e) {
        e.preventDefault()
      }
    },
    onUpdate: () => {
      const delta = clock.getDelta()

      // Animate the models.
      if (dotyAnimationMixer && airshipAnimationMixer) {
        dotyAnimationMixer.update(delta)
        airshipAnimationMixer.update(delta)
      }
    },

    listeners: [
      {event: 'layerscontroller.layerfound', process: layerFound},
    ],
  }
}
