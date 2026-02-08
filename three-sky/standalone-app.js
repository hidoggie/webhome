// Standalone Three.js application - No 8th Wall dependencies
// ES6 module imports
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const TEXTURE_PATH = './assets/sky-textures/space.png';
const DOTY_MODEL_PATH = './assets/sky-models/doty.glb';
const AIRSHIP_MODEL_PATH = './assets/sky-models/airship.glb';

const skyDebugMode = true; // TOGGLE DEBUG MODE HERE

// Scene setup
let scene, camera, renderer;
let skyBox;
let dotyAnimationMixer, airshipAnimationMixer;
let dotyLoadedModel, airshipLoadedModel;
let idleClipAction, walkingClipAction;
let rightWalkingInterval, leftWalkingInterval;

const dotyPositioningPivot = new THREE.Group();
const airshipPositioningPivot = new THREE.Group();
const clock = new THREE.Clock();

// UI Elements
let bottomBar, leftButton, rightButton;
let loadingDiv;

function init() {
    const canvas = document.getElementById('canvas');
    loadingDiv = document.getElementById('loading');

    // Create scene
    scene = new THREE.Scene();

    // Create camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        2000
    );
    camera.position.set(0, 0, 0);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ 
        canvas: canvas,
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Load sky dome
    loadSkyDome();

    // Load models
    loadModels();

    // Create UI
    createUI();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // Prevent default touch behaviors
    canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('dblclick', (e) => e.preventDefault());

    // Start animation loop
    animate();
}

function loadSkyDome() {
    const skyGeo = new THREE.SphereGeometry(1000, 25, 25);
    const textureLoader = new THREE.TextureLoader();
    
    const texture = textureLoader.load(
        TEXTURE_PATH,
        () => console.log('Sky texture loaded'),
        undefined,
        (error) => console.error('Error loading sky texture:', error)
    );
    
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
}

function loadModels() {
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.3.6/');
    dracoLoader.preload();
    loader.setDRACOLoader(dracoLoader);

    let modelsLoaded = 0;
    const totalModels = 2;

    function checkAllModelsLoaded() {
        modelsLoaded++;
        if (modelsLoaded === totalModels) {
            loadingDiv.classList.add('hidden');
        }
    }

    // Load Airship
    loader.load(
        AIRSHIP_MODEL_PATH,
        (gltf) => {
            airshipLoadedModel = gltf.scene;
            airshipAnimationMixer = new THREE.AnimationMixer(airshipLoadedModel);
            
            if (gltf.animations && gltf.animations.length > 0) {
                const idleClip = gltf.animations[0];
                const airshipIdleClipAction = airshipAnimationMixer.clipAction(idleClip);
                airshipIdleClipAction.play();
            }

            airshipPositioningPivot.add(airshipLoadedModel);
            scene.add(airshipPositioningPivot);

            const horizontalDegrees = -25;
            const verticalDegrees = 30;
            const modelDepth = 35;

            airshipLoadedModel.position.set(0, 0, -modelDepth);
            airshipLoadedModel.rotation.set(0, 0, 0);
            airshipLoadedModel.scale.set(10, 10, 10);

            airshipPositioningPivot.rotation.y = -horizontalDegrees * (Math.PI / 180);
            airshipPositioningPivot.rotation.x = verticalDegrees * (Math.PI / 180);

            console.log('Airship model loaded');
            checkAllModelsLoaded();
        },
        (xhr) => {
            console.log(`Airship ${(xhr.loaded / xhr.total * 100).toFixed(2)}% loaded`);
        },
        (error) => {
            console.error('Error loading airship model:', error);
            checkAllModelsLoaded();
        }
    );

    // Load Doty
    loader.load(
        DOTY_MODEL_PATH,
        (gltf) => {
            dotyLoadedModel = gltf.scene;
            dotyAnimationMixer = new THREE.AnimationMixer(dotyLoadedModel);
            
            if (gltf.animations && gltf.animations.length > 1) {
                const idleClip = gltf.animations[0];
                const walkingClip = gltf.animations[1];
                idleClipAction = dotyAnimationMixer.clipAction(idleClip);
                walkingClipAction = dotyAnimationMixer.clipAction(walkingClip);
                idleClipAction.play();
            }

            dotyPositioningPivot.add(dotyLoadedModel);
            scene.add(dotyPositioningPivot);

            const horizontalDegrees = 0;
            const verticalDegrees = 0;
            const modelDepth = 25;

            dotyLoadedModel.position.set(0, 0, -modelDepth);
            dotyLoadedModel.rotation.set(0, 0, 0);
            dotyLoadedModel.scale.set(100, 100, 100);

            dotyPositioningPivot.rotation.y = -horizontalDegrees * (Math.PI / 180);
            dotyPositioningPivot.rotation.x = verticalDegrees * (Math.PI / 180);

            const modelPos = new THREE.Vector3(0, 0, -modelDepth).applyEuler(dotyPositioningPivot.rotation);
            dotyLoadedModel.position.copy(modelPos);
            dotyPositioningPivot.rotation.set(0, 0, 0);

            setupDotyControls();
            console.log('Doty model loaded');
            checkAllModelsLoaded();
        },
        (xhr) => {
            console.log(`Doty ${(xhr.loaded / xhr.total * 100).toFixed(2)}% loaded`);
        },
        (error) => {
            console.error('Error loading doty model:', error);
            checkAllModelsLoaded();
        }
    );
}

function createUI() {
    // Create bottom control bar
    bottomBar = document.createElement('div');
    bottomBar.id = 'bottomBar';
    document.body.appendChild(bottomBar);

    leftButton = document.createElement('div');
    leftButton.id = 'leftButton';
    bottomBar.appendChild(leftButton);

    rightButton = document.createElement('div');
    rightButton.id = 'rightButton';
    bottomBar.appendChild(rightButton);

    if (skyDebugMode) {
        createDebugUI();
    }
}

function createDebugUI() {
    const debugOptions = document.createElement('div');
    debugOptions.id = 'debugOptions';
    document.body.appendChild(debugOptions);

    // Swap Texture Button
    const swapTextureGrid = document.createElement('div');
    swapTextureGrid.id = 'swapTextureGrid';
    debugOptions.appendChild(swapTextureGrid);

    const swapTextureTxt = document.createElement('p');
    swapTextureTxt.innerHTML = 'Swap<br>Texture';
    swapTextureGrid.appendChild(swapTextureTxt);

    swapTextureGrid.addEventListener('click', () => {
        if (skyBox) {
            skyBox.visible = !skyBox.visible;
        }
    });

    // Recenter Button
    const recenterGrid = document.createElement('div');
    recenterGrid.id = 'recenterGrid';
    debugOptions.appendChild(recenterGrid);

    const recenterTxt = document.createElement('p');
    recenterTxt.innerHTML = 'Recenter<br>Camera';
    recenterGrid.appendChild(recenterTxt);

    recenterGrid.addEventListener('click', () => {
        camera.position.set(0, 0, 0);
        camera.rotation.set(0, 0, 0);
        if (dotyPositioningPivot) {
            dotyPositioningPivot.rotation.set(0, 0, 0);
        }
    });
}

function setupDotyControls() {
    if (!dotyLoadedModel) return;

    bottomBar.classList.add('active');

    // Right button
    const handleRightTouchStart = (e) => {
        if (!dotyLoadedModel || !walkingClipAction || !idleClipAction) return;
        
        rightWalkingInterval = setInterval(() => {
            dotyPositioningPivot.rotation.y -= 0.01;
        }, 25);
        dotyLoadedModel.rotation.y = Math.PI / 3;
        idleClipAction.stop();
        walkingClipAction.play();
        e.preventDefault();
    };

    const handleRightTouchEnd = () => {
        if (!dotyLoadedModel || !walkingClipAction || !idleClipAction) return;
        
        walkingClipAction.stop();
        idleClipAction.play();
        dotyLoadedModel.rotation.y = 0;
        clearInterval(rightWalkingInterval);
    };

    rightButton.addEventListener('touchstart', handleRightTouchStart);
    rightButton.addEventListener('touchend', handleRightTouchEnd);
    rightButton.addEventListener('mousedown', handleRightTouchStart);
    rightButton.addEventListener('mouseup', handleRightTouchEnd);

    // Left button
    const handleLeftTouchStart = (e) => {
        if (!dotyLoadedModel || !walkingClipAction || !idleClipAction) return;
        
        leftWalkingInterval = setInterval(() => {
            dotyPositioningPivot.rotation.y += 0.01;
        }, 25);
        dotyLoadedModel.rotation.y = -(Math.PI / 3);
        idleClipAction.stop();
        walkingClipAction.play();
        e.preventDefault();
    };

    const handleLeftTouchEnd = () => {
        if (!dotyLoadedModel || !walkingClipAction || !idleClipAction) return;
        
        walkingClipAction.stop();
        clearInterval(leftWalkingInterval);
        idleClipAction.play();
        dotyLoadedModel.rotation.y = 0;
    };

    leftButton.addEventListener('touchstart', handleLeftTouchStart);
    leftButton.addEventListener('touchend', handleLeftTouchEnd);
    leftButton.addEventListener('mousedown', handleLeftTouchStart);
    leftButton.addEventListener('mouseup', handleLeftTouchEnd);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    // Update animations
    if (dotyAnimationMixer) {
        dotyAnimationMixer.update(delta);
    }
    
    if (airshipAnimationMixer) {
        airshipAnimationMixer.update(delta);
    }

    renderer.render(scene, camera);
}

// Start the application
init();
