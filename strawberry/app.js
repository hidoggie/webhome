// Copyright (c) 2020 8th Wall, Inc.
//
// app.js is the main entry point for your 8th Wall web app. Code here will execute after head.html
// is loaded, and before body.html is loaded.

import {gameStateComponent} from './game-state'
import {gestureDetectorComponent} from './gesture-detector'
import {holdDragComponent} from './hold-drag'
import {pinchScaleComponent} from './pinch-scale'
import {twoFingerSpinComponent} from './two-finger-spin'


import {spiceCloudComponent} from './spice-cloud'
import {spiceSpawnerComponent} from './spice-spawner'


AFRAME.registerComponent('game-state', gameStateComponent())
AFRAME.registerComponent('gesture-detector', gestureDetectorComponent())
AFRAME.registerComponent('hold-drag', holdDragComponent())
AFRAME.registerComponent('pinch-scale', pinchScaleComponent())
AFRAME.registerComponent('two-finger-spin', twoFingerSpinComponent())

AFRAME.registerComponent('spice-cloud', spiceCloudComponent)
AFRAME.registerComponent('spice-spawner', spiceSpawnerComponent)

console.warn = () => {}

// These components are also available from xrextras as:
// xrextras-gesture-detector
// xrextras-hold-drag
// xrextras-pinch-scale
// xrextras-one-finger-rotate
// xrextras-two-finger-rotate

// Check them out at: 8th.io/xrextras-components


