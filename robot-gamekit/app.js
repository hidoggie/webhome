import {UI} from './ui/ui.js'
import {Debugger} from './debugger/debugger.js'

import {
  GameElementComponent,
  PlayerComponent,
  TargetComponent,
  EnemyComponent,
  CoinComponent,
  EnergyComponent,
  FloorComponent,
} from './components/sample-game-components.js'
import {Utils} from './utils.js'
import {GameKit, COLLISION_ENTER, COLLISION_EXIT, COLLIDING} from './game-kit/module.js'
// import {UIElement, Button, Bar, Label, IconBar, Icon} from 'ui-kit'

const gameElementData = 'simple-game-element'

class SampleGame {
  init() {
    this.onGameEnterFrame = this.onGameEnterFrame.bind(this)
    this.onGameCollisionEnter = this.onGameCollisionEnter.bind(this)
    this.onGameCollisionExit = this.onGameCollisionExit.bind(this)
    this.onGameStateChange = this.onGameStateChange.bind(this)
    this.onGroundTap = this.onGroundTap.bind(this)

    this.gameState = {
      energy: 1,
      score: 0,
      powerUps: 3,
    }
    this.game = new GameKit(this.gameState)

    this.modelFloor = true

    this.gameElement = document.getElementById('simpleGame')
    this.playerElement = document.getElementById('player')
    this.targetElement = document.getElementById('targetElement')
    this.enemy1Element = document.getElementById('enemy1')
    this.enemy2Element = document.getElementById('enemy2')
    this.coin1Element = document.getElementById('coin1')
    this.coin2Element = document.getElementById('coin2')
    this.powerUp1Element = document.getElementById('powerUp1')
    this.boardElement = document.getElementById('board')
    this.groundElement = document.getElementById('ground')
    this.modelFloorElement = document.getElementById('modelFloor')

    this.gameElements = [
      this.playerElement,
      this.enemy1Element,
      this.enemy2Element,
      this.powerUp1Element,
      this.coin1Element,
      this.coin2Element,
      this.targetElement,
    ]

    //
    // register the player element to the game
    // there can only be one player on the game
    //
    this.game.setPlayer('#player')

    //
    // register the powerapp actors to the game
    // -when the player collides with a powerUp actor, the "powerUps" attribute on the gameState will decrease by 1, until it reach 0
    // -when the player collides with a powerUp actor, the "score" attribute on the gameState will increase by 50
    // -when the player collides with a powerUp actor, the "energy" attribute on the gameState will increase by 1, until it reaches 1
    //
    this.game.registerActor('powerUp', 'powerUps', -1, 0)
      .registerActor('powerUp', 'score', 50)
      .registerActor('powerUp', 'energy', 1, 0, 1)
      .addActor('#powerUp1', 'powerUp')

    //
    // register the enemy actors to the game
    // -when the player collides with an enemy actor, the "energy" attribute on the gameState will decrease by 0.2 until it reaches 0
    // -on every frame, if the player is colliding with a powerup, the "energy" attribute on the gameState will decrese by 0.005 until it reaches 0
    //
    this.game.registerActor('enemy', 'energy', -0.2, 0, 1, COLLISION_ENTER)
      .registerActor('enemy', 'energy', -0.005, 0, 1, COLLIDING)
      .addActor('#enemy1', 'enemy')
      .addActor('#enemy2', 'enemy')

    //
    // register the coin actors to the game
    // -when the player collides with a coin actor, the "score" attribute on the gameState will increase by 10
    // -when the player collides with a coin actor, the "energy" attribute on the gameState will increase by 0.01 until it reaches 1
    //
    this.game.registerActor('coin', 'score', 10)
      .registerActor('coin', 'energy', 0.01, 0, 1)
      .addActor('#coin1', 'coin')
      .addActor('#coin2', 'coin')

    this.game.addActor('#targetElement', 'target')

    //
    // game event listeners
    //
    this.game.onEnterFrame(this.onGameEnterFrame)
      .onCollisionEnter(this.onGameCollisionEnter)
      .onCollisionExit(this.onGameCollisionExit)
      .onStateChange(this.onGameStateChange)

    this.camera = document.getElementById('camera')

    this.origin = this.camera.object3D.position.clone()

    this.groundElement.addEventListener('click', this.onGroundTap)

    this.initUI()
    this.initDebugger()

    this.startGame()
  }

  resetElements() {
    this.game.reset()
    this.gameElements.forEach((el) => {
      const elementData = el.getAttribute('simple-game-element')
      const {initialPosition} = elementData
      el.setAttribute('position', Utils.getVec3String(initialPosition))
    })
    this.game.setObjectVisible('#powerUp1', true)
    this.ui.setEnergy(this.game.gameState.energy)
    this.ui.setScore(this.game.gameState.score)
    this.ui.setPowerUps(this.game.gameState.powerUps)
    const playerPosition = this.playerElement.getAttribute('position')
    this.playerElement.setAttribute('simple-game-player', {
      targetPosition: {x: playerPosition.x, y: playerPosition.y, z: playerPosition.z},
      overEnergy: false,
    })
    this.modelFloorElement.setAttribute('simple-game-floor', {
      overEnergy: false,
    })
  }

  startGame() {
    this.resetElements()
    this.recenterCamera()

    this.ui.setBtnPlayVisible(false)
    this.ui.setBtnPauseVisible(true)
    this.ui.setGameOverVisible(false)

    this.gameElement.play()
    this.game.start()
  }

  onGroundTap(event) {
    if (this.game.playing) {
      const touchPoint = event.detail.intersection.point
      const boardPosition = this.boardElement.getAttribute('position')

      const px = touchPoint.x - boardPosition.x
      const pz = touchPoint.z - boardPosition.z

      const limx = Math.max(-6, Math.min(6, px))
      const limz = Math.max(-6, Math.min(6, pz))

      this.targetElement.setAttribute('position', {x: limx, y: this.targetElement.getAttribute('position').y, z: limz})

      this.playerElement.setAttribute('simple-game-player', {
        targetPosition: {x: px, y: this.playerElement.getAttribute('position').y, z: pz},
      })

      this.game.setObjectVisible('#targetElement', true)

      this.groundElement.components.sound.stopSound()
      this.groundElement.components.sound.playSound()
    }
  }

  onBtnPauseClick() {
    this.gameElement.pause()
    this.ui.setBtnPauseVisible(false)
    this.ui.setBtnPlayVisible(true)
    this._playButtonSound()
    this.game.pause()
  }

  onBtnPlayClick() {
    this.gameElement.play()
    this.ui.setBtnPlayVisible(false)
    this.ui.setBtnPauseVisible(true)
    this._playButtonSound()
    this.game.start()
  }

  gameOver() {
    this.gameElement.pause()
    this.game.end()
    this.gameElements.forEach((el) => {
    })
    const gameOverSound = document.getElementById('gameOverSound')
    gameOverSound.components.sound.stopSound()
    gameOverSound.components.sound.playSound()
    this.ui.setGameOverVisible(true)
  }

  onBtnRestartClick() {
    this.startGame()
    this._playButtonSound()
  }

  onGameEnterFrame(e) {
    if (!this.game.playing) return

    const disp = Math.sin(this.game.frames * 0.01)
    const playerPos = this.playerElement.getAttribute('position')
    const {targetPosition} = this.playerElement.getAttribute('simple-game-player')
    const lerpPos = Utils.lerp3D(playerPos, targetPosition, 0.1)
    this.playerElement.setAttribute('position', `${lerpPos.x} ${lerpPos.y} ${lerpPos.z}`)

    if (this.game.distanceToObject('#targetElement') < 1.1) {
      // this.game.setObjectVisible('#targetElement', false)
    }

    const enemy1Pos = this.enemy1Element.getAttribute('position')
    const enemy2Pos = this.enemy2Element.getAttribute('position')

    this.enemy1Element.setAttribute('position', `${0 + (disp * 6)} ${enemy1Pos.y} ${enemy1Pos.z}`)
    this.enemy2Element.setAttribute('position', `${0 - (disp * 6)} ${enemy2Pos.y} ${enemy2Pos.z}`)

    const {energy} = this.game.gameState
    if (energy > 0) {
      this.game.setGameState('energy', -0.0001, 0)
    }
  }

  onGameCollisionEnter(e) {
    if (!this.game.playing) return
    const {other} = e.detail
    if (other.type === 'powerUp') {
      const randomPos = Utils.getRandomVec2(-6, 6, -6, 6)
      other.object.setAttribute('position', `${randomPos.x} 0 ${randomPos.y}`)
      other.object.components.sound.stopSound()
      other.object.components.sound.playSound()
    } else if (other.type === 'coin') {
      const randomPos = Utils.getRandomVec2(-6, 6, -6, 6)
      other.object.setAttribute('position', `${randomPos.x} 0 ${randomPos.y}`)

      other.object.components.sound.stopSound()
      other.object.components.sound.playSound()
    } else if (other.type === 'enemy') {
      // other collided
      other.object.components.sound.playSound()
      this.playerElement.setAttribute('simple-game-player', {overEnergy: true})
      this.modelFloorElement.setAttribute('simple-game-floor', {overEnergy: true})
    }
  }

  onGameCollisionExit(e) {
    if (!this.game.playing) return
    const {other} = e.detail
    if (other.type === 'enemy') {
      other.object.components.sound.stopSound()
      this.playerElement.setAttribute('simple-game-player', {overEnergy: false})
      this.modelFloorElement.setAttribute('simple-game-floor', {overEnergy: false})
    }
  }

  onGameStateChange(e) {
    if (!this.game.playing) return
    this.ui.setEnergy(this.game.gameState.energy)
    this.ui.setScore(this.game.gameState.score)
    this.ui.setPowerUps(this.game.gameState.powerUps)

    if (this.game.gameState.powerUps === 0) {
      this.game.setObjectVisible('#powerUp1', false)
    }
    if (this.game.gameState.energy <= 0) {
      this.gameOver()
    }
  }

  _playButtonSound() {
    const buttonSound = document.getElementById('buttonSound')
    buttonSound.components.sound.stopSound()
    buttonSound.components.sound.playSound()
  }

  recenterCamera() {
    this.camera.sceneEl.emit('recenter', {origion: this.origin, facing: {w: 0, x: 0, y: 0, z: 0}})
    this.camera.setAttribute('position', `${this.origin.x} ${this.origin.y} ${this.origin.z}`)
  }

  initUI() {
    this.ui = new UI()
    this.ui.init(this.gameState)
    this.ui.onBtnPlayClick = this.onBtnPlayClick.bind(this)
    this.ui.onBtnPauseClick = this.onBtnPauseClick.bind(this)
    this.ui.onBtnRestartClick = this.onBtnRestartClick.bind(this)
  }

  initDebugger() {
    this.debugger = new Debugger()
    this.debugger.game = this.game
    this.debugger.playerElement = this.playerElement
    this.debugger.scene = this.gameElement.sceneEl.object3D  // for draw bounding boxes

    this.debugger.onRecenter = this.recenterCamera.bind(this)
    this.debugger.onBtnRestartClick = this.onBtnRestartClick.bind(this)
    this.debugger.init(this.game)
  }
}

const WindowLoadedHandler = {
  schema: {},
  init() {
    const sg = new SampleGame()
    sg.init()
  },
}

AFRAME.registerComponent(gameElementData, GameElementComponent)
AFRAME.registerComponent('simple-game-floor', FloorComponent)
AFRAME.registerComponent('simple-game-player', PlayerComponent)
AFRAME.registerComponent('simple-game-target', TargetComponent)
AFRAME.registerComponent('simple-game-enemy', EnemyComponent)
AFRAME.registerComponent('simple-game-coin', CoinComponent)
AFRAME.registerComponent('simple-game-energy', EnergyComponent)
AFRAME.registerComponent('simple-game', WindowLoadedHandler)