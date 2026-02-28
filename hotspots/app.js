import {recenterButtonComponent} from './components/recenter.js'
import {tapHotspotComponent} from './components/tap-hotspot.js'
import {tapCloseComponent} from './components/tap-close.js'

window.hideAll = () => {
  document.getElementById('container').classList.add('collapsed')
  const hotspotChildren = document.querySelectorAll('a-text')
  hotspotChildren.forEach(element => element.setAttribute('visible', false))
}

AFRAME.registerComponent('recenter-button', recenterButtonComponent)
AFRAME.registerComponent('tap-hotspot', tapHotspotComponent)
AFRAME.registerComponent('tap-close', tapCloseComponent)
