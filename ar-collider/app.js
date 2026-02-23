import {responsiveImmersiveComponent} from './responsive-immersive.js'
AFRAME.registerComponent('responsive-immersive', responsiveImmersiveComponent)

import {punchTapComponent, resetButtonComponent} from './game-logic.js'
AFRAME.registerComponent('punch-tap', punchTapComponent)
AFRAME.registerComponent('reset-button', resetButtonComponent)

import {gltfPhysicsObjectComponent} from './glb-physics-object.js'
AFRAME.registerComponent('physics-object', gltfPhysicsObjectComponent)