import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js'; 
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

export const skySampleScenePipelineModule = () => {
  const textureLoader = new THREE.TextureLoader();
  
  // 텍스처와 모델 경로를 문자열로 정의
  const TEXTURE_PATH = './assets/sky-textures/space.png';
  const DOTY_MODEL_PATH = './assets/sky-models/doty.glb';
  const AIRSHIP_MODEL_PATH = './assets/sky-models/airship.glb';

  const loader = new GLTFLoader();
  const dracoLoader = new THREE.DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.3.6/');
  dracoLoader.preload();
  loader.setDRACOLoader(dracoLoader);

  let dotyAnimationMixer;
  let airshipAnimationMixer;

  let skyBox;

  const dotyPositioningPivot = new THREE.Group();
  const airshipPositioningPivot = new THREE.Group();

  let airshipLoadedModel;
  let dotyLoadedModel;

  let idleClipAction;
  let walkingClipAction;
  let rightWalkingInterval;
  let leftWalkingInterval;

  let invertMaskBoolean = false;
  const skyDebugMode = true;  // TOGGLE SKY DEBUG MODE HERE

  const clock = new THREE.Clock();

  if (skyDebugMode) {
    // create debug UI elements if debugMode is true
    const debugOptions = document.createElement('div');
    document.body.appendChild(debugOptions);
    debugOptions.id = 'debugOptions';

    const swapTextureGrid = document.createElement('div');
    swapTextureGrid.id = 'swapTextureGrid';
    debugOptions.appendChild(swapTextureGrid);

    const swapTextureImg = document.createElement('div');
    swapTextureGrid.appendChild(swapTextureImg);

    const swapTextureTxt = document.createElement('p');
    swapTextureGrid.appendChild(swapTextureTxt);
    swapTextureTxt.innerHTML = 'Swap <br> Texture';

    const invertMaskGrid = document.createElement('div');
    invertMaskGrid.id = 'invertMaskGrid';
    debugOptions.appendChild(invertMaskGrid);

    const invertMaskImg = document.createElement('div');
    invertMaskGrid.appendChild(invertMaskImg);

    const invertMaskTxt = document.createElement('p');
    invertMaskGrid.appendChild(invertMaskTxt);
    invertMaskTxt.innerHTML = 'Invert <br> Mask';

    const recenterGrid = document.createElement('div');
    debugOptions.appendChild(recenterGrid);
    recenterGrid.id = 'recenterGrid';

    const recenterImg = document.createElement('div');
    recenterGrid.appendChild(recenterImg);

    const recenterTxt = document.createElement('p');
    recenterGrid.appendChild(recenterTxt);
    recenterTxt.innerHTML = 'Recenter<br> Scene';

    // UI Button Functions
    const handleInvertMask = () => {
      invertMaskBoolean = !invertMaskBoolean;
      XR8.LayersController.configure({layers: {sky: {invertLayerMask: invertMaskBoolean}}});
    };

    const handleRecenter = () => {
      XR8.LayersController.recenter();
    };

    invertMaskGrid.addEventListener('touchstart', handleInvertMask);
    recenterGrid.addEventListener('touchstart', handleRecenter);
    swapTextureGrid.addEventListener('touchstart', () => {
      if (skyBox) {
        skyBox.visible = !skyBox.visible;
      }
    });
  }

  // create UI arrows
  const bottomBar = document.createElement('div');
  bottomBar.id = 'bottomBar';
  document.body.appendChild(bottomBar);

  const leftButton = document.createElement('div');
  leftButton.id = 'leftButton';
  bottomBar.appendChild(leftButton);

  const rightButton = document.createElement('div');
  rightButton.id = 'rightButton';
  bottomBar.appendChild(rightButton);

  // Create a sky scene
  const initSkyScene = ({scene, renderer}) => {
    renderer.outputEncoding = THREE.sRGBEncoding;

    // Add soft white light to the scene.
    scene.add(new THREE.AmbientLight(0x404040, 7));

    // Add sky dome.
    const skyGeo = new THREE.SphereGeometry(1000, 25, 25);

    const texture = textureLoader.load(TEXTURE_PATH);
    texture.encoding = THREE.sRGBEncoding;
    texture.mapping = THREE.EquirectangularReflectionMapping;
    const skyMaterial = new THREE.MeshPhongMaterial({
      map: texture,
      toneMapped: true,
    });

    skyBox = new THREE.Mesh(skyGeo, skyMaterial);
    skyBox.material.side = THREE.BackSide;
    scene.add(skyBox);
    skyBox.visible = false;

    // Load Airship
    loader.load(
      AIRSHIP_MODEL_PATH,
      (gltf) => {
        airshipLoadedModel = gltf.scene;
        // Animate the model
        airshipAnimationMixer = new THREE.AnimationMixer(airshipLoadedModel);
        
        if (gltf.animations && gltf.animations.length > 0) {
          const idleClip = gltf.animations[0];
          const airshipIdleClipAction = airshipAnimationMixer.clipAction(idleClip.optimize());
          airshipIdleClipAction.play();
        }

        // Add the model to a pivot to help position it within the circular sky dome
        airshipPositioningPivot.add(airshipLoadedModel);
        scene.add(airshipPositioningPivot);

        const horizontalDegrees = -25;
        const verticalDegrees = 30;
        const modelDepth = 35;

        airshipLoadedModel.position.set(0, 0, -modelDepth);
        airshipLoadedModel.rotation.set(0, 0, 0);
        airshipLoadedModel.scale.set(10, 10, 10);
        airshipLoadedModel.castShadow = true;

        airshipPositioningPivot.rotation.y = -horizontalDegrees * (Math.PI / 180);
        airshipPositioningPivot.rotation.x = verticalDegrees * (Math.PI / 180);
      },
      (xhr) => {
        console.log(`Airship ${(xhr.loaded / xhr.total * 100).toFixed(2)}% loaded`);
      },
      (error) => {
        console.error('Error loading airship model:', error);
      }
    );

    // Load Doty
    loader.load(
      DOTY_MODEL_PATH,
      (gltf) => {
        dotyLoadedModel = gltf.scene;
        // Animate the model
        dotyAnimationMixer = new THREE.AnimationMixer(dotyLoadedModel);
        
        if (gltf.animations && gltf.animations.length > 1) {
          const idleClip = gltf.animations[0];
          const walkingClip = gltf.animations[1];
          idleClipAction = dotyAnimationMixer.clipAction(idleClip.optimize());
          walkingClipAction = dotyAnimationMixer.clipAction(walkingClip.optimize());
          idleClipAction.play();
        }

        // Add the model to a pivot to help position it within the circular sky dome
        dotyPositioningPivot.add(dotyLoadedModel);
        dotyPositioningPivot.rotation.set(0, 0, 0);
        dotyPositioningPivot.position.set(0, 0, 0);
        scene.add(dotyPositioningPivot);

        const horizontalDegrees = 0;
        const verticalDegrees = 0;
        const modelDepth = 25;

        dotyLoadedModel.position.set(0, 0, -modelDepth);
        dotyLoadedModel.rotation.set(0, 0, 0);
        dotyLoadedModel.scale.set(100, 100, 100);
        dotyLoadedModel.castShadow = true;

        dotyPositioningPivot.rotation.y = -horizontalDegrees * (Math.PI / 180);
        dotyPositioningPivot.rotation.x = verticalDegrees * (Math.PI / 180);

        const modelPos = new THREE.Vector3(0, 0, -modelDepth).applyEuler(dotyPositioningPivot.rotation);
        dotyLoadedModel.position.copy(modelPos);
        dotyPositioningPivot.rotation.set(0, 0, 0);
        
        setupDotyControls();
      },
      (xhr) => {
        console.log(`Doty ${(xhr.loaded / xhr.total * 100).toFixed(2)}% loaded`);
      },
      (error) => {
        console.error('Error loading doty model:', error);
      }
    );
  };

  const setupDotyControls = () => {
    if (!dotyLoadedModel) return;

    bottomBar.style.display = 'grid';

    rightButton.addEventListener('touchstart', (e) => {
      if (!dotyLoadedModel || !walkingClipAction || !idleClipAction) return;
      
      rightWalkingInterval = setInterval(() => {
        dotyPositioningPivot.rotation.y -= 0.01;
      }, 25);
      dotyLoadedModel.rotation.y = Math.PI / 3;
      idleClipAction.stop();
      walkingClipAction.play();
      e.returnValue = false;
    });

    rightButton.addEventListener('touchend', () => {
      if (!dotyLoadedModel || !walkingClipAction || !idleClipAction) return;
      
      walkingClipAction.stop();
      idleClipAction.play();
      dotyLoadedModel.rotation.y = 0;
      clearInterval(rightWalkingInterval);
    });

    leftButton.addEventListener('touchstart', (e) => {
      if (!dotyLoadedModel || !walkingClipAction || !idleClipAction) return;
      
      leftWalkingInterval = setInterval(() => {
        dotyPositioningPivot.rotation.y += 0.01;
      }, 25);
      dotyLoadedModel.rotation.y = -(Math.PI / 3);
      idleClipAction.stop();
      walkingClipAction.play();
      e.returnValue = false;
    });

    leftButton.addEventListener('touchend', () => {
      if (!dotyLoadedModel || !walkingClipAction || !idleClipAction) return;
      
      walkingClipAction.stop();
      clearInterval(leftWalkingInterval);
      idleClipAction.play();
      dotyLoadedModel.rotation.y = 0;
    });
  };

  const layerFound = ({detail}) => {
    if (detail?.name === 'sky') {
      XR8.LayersController.recenter();
    }
  };

  return {
    name: 'sky-scene',

    onStart: ({canvas}) => {
      const {layerScenes, camera, renderer} = XR8.Threejs.xrScene();
      initSkyScene({scene: layerScenes.sky.scene, camera, renderer});

      camera.position.set(0, 0, 0);

      XR8.LayersController.configure({
        coordinates: {
          origin: {
            position: camera.position,
            rotation: camera.quaternion,
          },
        },
      });

      canvas.addEventListener('touchmove', (event) => {
        event.preventDefault();
      });

      document.ondblclick = function (e) {
        e.preventDefault();
      };
    },
    
    onUpdate: () => {
      const delta = clock.getDelta();

      if (dotyAnimationMixer) {
        dotyAnimationMixer.update(delta);
      }
      
      if (airshipAnimationMixer) {
        airshipAnimationMixer.update(delta);
      }
    },

    listeners: [
      {event: 'layerscontroller.layerfound', process: layerFound},
    ],
  };
};