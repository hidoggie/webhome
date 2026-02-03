// Copyright (c) 2023 8th Wall, Inc.

// app.js is the main entry point for your 8th Wall web app. Code here will execute after head.html
// is loaded, and before body.html is loaded.
import './index.css'

import {recenterComponent} from './components/recenter'
AFRAME.registerComponent('recenter', recenterComponent)

import {skyRemoteAuthoringComponent} from './components/sky-remote-authoring'
AFRAME.registerComponent('sky-remote-authoring', skyRemoteAuthoringComponent)

import {animateBalloonComponent} from './components/animate-balloon'
AFRAME.registerComponent('animate-balloon', animateBalloonComponent)

import {transitionSceneComponent} from './components/transition-scene'
AFRAME.registerComponent('transition-scene', transitionSceneComponent)

import {hideOverlayComponent} from './components/hide-overlay'
AFRAME.registerComponent('hide-overlay', hideOverlayComponent)

import {deviceOrientationComponent} from './components/device-orientation.js'
AFRAME.registerComponent('device-orientation', deviceOrientationComponent)