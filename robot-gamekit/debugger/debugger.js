const debuggerHTML = await fetch('./debugger.html').then(r => r.text());

import {UIElement, Button, Bar, Label, IconBar, Icon} from '../ui-kit/module.js'

class Debugger {
  init() {
    this._modelFloor = true
    document.getElementById('debuggerHolder').innerHTML = debuggerHTML
    this.loop = this.loop.bind(this)

    this.btnBoundingBoxes = new Button('#btnBoundingBoxes').onClick(this.onToggleBoundingBoxes.bind(this))
    this.btnFloor = new Button('#btnFloor').onClick(this.onToggleFloor.bind(this))
    this.btnDebug = new Button('#btnDebug').onClick(() => this.onToggleDebug())
    this.btnRecenter = new Button('#btnRecenter').onClick(() => this.onRecenter())
    this.btnRestart = new Button('#btnDebugRestart').onClick(() => this.onBtnRestartClick())
    this.debugHolder = new UIElement('#debugHolder').setVisible(false)
    this.debugText = new Label('#debugText')

    const debugButtons = document.querySelector('.debugButtons')
    const checkClose = (e) => {
      if (debugButtons.contains(e.target)) {
      } else {
        closeDebugButtons()
      }
    }
    const closeDebugButtons = () => {
      if (debugButtons.classList.contains('active')) {
        window.removeEventListener('click', checkClose)
        debugButtons.classList.remove('active')
      }
    }
    const openDebugButtons = () => {
      if (!debugButtons.classList.contains('active')) {
        debugButtons.classList.add('active')
        window.addEventListener('click', checkClose)
      }
    }
    debugButtons.addEventListener('mouseenter', openDebugButtons)
    debugButtons.addEventListener('mousemove', openDebugButtons)
    debugButtons.addEventListener('mouseleave', closeDebugButtons)
    debugButtons.addEventListener('touchstart', openDebugButtons)
    debugButtons.addEventListener('touchmove', openDebugButtons)

    this.game.scene = this.scene

    this.loop()
  }

  onToggleFloor() {
    this._modelFloor = !this._modelFloor
    document.getElementById('modelFloor').setAttribute('visible', this._modelFloor)
    document.getElementById('simpleFloor').setAttribute('visible', !this._modelFloor)
  }

  onToggleBoundingBoxes() {
    this.game.showBoundingBoxes = !this.game.showBoundingBoxes
  }

  onToggleDebug() {
    this.debugHolder.visible = !this.debugHolder.visible
  }

  loop() {
    requestAnimationFrame(this.loop)

    let txt = `Ellapsed Time: ${((this.game.ellapsedTime) / 1000).toFixed(2)}s; Frames: ${this.game.frames}<br/>`
    txt += `Player Pos: ${this.playerElement.getAttribute('position').x.toFixed(2)} ${this.playerElement.getAttribute('position').z.toFixed(2)}<br/>`
    txt += `Playing: ${this.game.playing} Paused: ${this.game.paused} Ended: ${this.game.ended}<br/>`
    txt += `Game State: ${JSON.stringify(this.game.gameState)}<br/>`
    txt += `Distance to Enemy 1: ${this.game.distanceToObject('#enemy1')}<br/>`
    txt += `Distance to Target: ${this.game.distanceToObject('#targetElement')}<br/>`

    this.debugText.set(txt)
  }
}
export {
  Debugger,
}