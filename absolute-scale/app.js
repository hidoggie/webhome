import {changeColorComponent, absPinchScaleComponent, annotationComponent, proximityComponent, gltfMorphComponent, ignoreRaycast, followCarComponent} from './js/components.js'
AFRAME.registerComponent('change-color', changeColorComponent)
AFRAME.registerComponent('follow-car', followCarComponent)
AFRAME.registerComponent('annotation', annotationComponent)
AFRAME.registerComponent('absolute-pinch-scale', absPinchScaleComponent)
AFRAME.registerComponent('proximity', proximityComponent)
AFRAME.registerComponent('gltf-morph', gltfMorphComponent)
AFRAME.registerComponent('ignore-raycast', ignoreRaycast)

import {responsiveImmersiveComponent} from './js/responsive-immersive.js'
AFRAME.registerComponent('responsive-immersive', responsiveImmersiveComponent)

// bitmaps cause texture issues on iOS this workaround prevents black textures and crashes
const IS_IOS =
  /^(iPad|iPhone|iPod)/.test(window.navigator.platform) ||
  (/^Mac/.test(window.navigator.platform) && window.navigator.maxTouchPoints > 1)
if (IS_IOS) {
  window.createImageBitmap = undefined
}
