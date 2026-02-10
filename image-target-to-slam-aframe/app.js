// Copyright (c) 2022 8th Wall, Inc.
//
// app.js is the main entry point for your 8th Wall app. Code here will execute after head.html
// is loaded, and before body.html is loaded.

import './main.css'
import {physicsImageTargetComponent} from './physics-image-target'

AFRAME.registerComponent('physics-image-target', physicsImageTargetComponent)
