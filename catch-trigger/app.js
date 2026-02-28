import {characterMoveComponent, characterRecenterComponent} from './components.js'
AFRAME.registerComponent('character-move', characterMoveComponent)
AFRAME.registerComponent('character-recenter', characterRecenterComponent)

import {proximityTriggerComponent} from './proximity-trigger.js'
AFRAME.registerComponent('proximity-trigger', proximityTriggerComponent)