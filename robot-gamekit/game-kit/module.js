import {EventListener} from './event-listener.js'
import {Utils} from './utils.js'

const COLLISION_ENTER = 'collisionEnter'
const COLLISION_EXIT = 'collisionExit'
const COLLIDING = 'colliding'
const EVENT_ENTER_FRAME = 'enterFrame'
const EVENT_STATE_CHANGE = 'stateChange'

class GameKit extends EventListener {
  /**
   * @param {object} gameState
   * @returns {GameKit}
   */
  constructor(gameState) {
    super()

    this._player = null
    this._elements = []
    this._actorsModifiers = []
    this._actors = []
    this._showBoundingBoxes = false
    this.playing = false
    this.paused = false
    this.ended = false
    this.frames = 0
    this.ellapsedTime = 0
    this.scene = null

    this._loop = this._loop.bind(this)
    this.gameState = {
      ...gameState,
    }
    this.initialState = {
      ...this.gameState,
    }
    this._loop()
    return this
  }

  /**
   * @param {THREE.Object3D | AFRAME.Entity} object
   * @returns {GameKit}
   */
  setPlayer(object) {
    this._player = new GameKitElement('player', object)
    this._elements.push(this._player)
    return this
  }

  /**
   * @param {string} type
   * @param {string} property
   * @param {number} modifier
   * @param {number} min [default=undefined]
   * @param {number} max [default=undefined]
   * @param {string} actionType [default='collisionEnter']
   * @returns {GameKit}
   */
  registerActor(type, property, modifier, min, max, actionType) {
    const am = new GameKitActorModifier(type, property, modifier, min, max, actionType)
    this._actorsModifiers.push(am)
    return this
  }

  /**
   * @param {THREE.Object3D | AFRAME.Entity} object
   * @param {string} type
   * @returns {GameKit}
   */
  addActor(object, type) {
    const ac = new GameKitElement(type, object)
    this._actors.push(ac)
    this._elements.push(ac)
    return this
  }

  /**
   * @returns {GameKit}
   */
  start() {
    this.playing = true
    this.paused = false
    this.ended = false
    return this
  }

  /**
   * @returns {GameKit}
   */
  reset() {
    const oldState = {
      ...this.gameState,
    }
    this.gameState = {
      ...this.initialState,
    }
    this.frames = 0
    this.ellapsedTime = 0
    this._elements.forEach((el) => {
      el.reset()
    })
    this._dispatchGameStateChanged(oldState)
    return this
  }

  /**
   * @returns {GameKit}
   */
  pause() {
    if (this.playing) {
      this.paused = true
      this.playing = false
    }
    return this
  }

  /**
   * @returns {GameKit}
   */
  end() {
    this.ended = true
    this.playing = false
    this.paused = false
    return this
  }

  /**
   * @param {string} property
   * @param {number} increase
   * @param {number} min [default=undefined]
   * @param {number} max [default=undefined]
   * @returns {GameKit}
   */
  setGameState(property, increase, min, max) {
    const oldState = {...this.gameState}
    const prevVal = this.gameState[property]
    if (prevVal !== undefined) {
      let newVal = prevVal + increase
      if (min !== undefined) newVal = Math.max(newVal, min)
      if (max !== undefined) newVal = Math.min(newVal, max)

      this.gameState[property] = newVal

      if (prevVal !== newVal) {
        this._dispatchGameStateChanged(oldState)
      }
    }
    return this
  }

  /**
   * @param {Function} cb
   * @returns {GameKit}
   */
  onEnterFrame(cb) {
    this.bind(EVENT_ENTER_FRAME, cb)
    return this
  }

  /**
   * @param {Function} cb
   * @returns {GameKit}
   */
  onCollisionEnter(cb) {
    this.bind(COLLISION_ENTER, cb)
    return this
  }

  /**
   * @param {Function} cb
   * @returns {GameKit}
   */
  onCollisionExit(cb) {
    this.bind(COLLISION_EXIT, cb)
    return this
  }

  /**
   * @param {Function} cb
   * @returns {GameKit}
   */
  onStateChange(cb) {
    this.bind(EVENT_STATE_CHANGE, cb)
    return this
  }

  /**
   * @param {THREE.Object3D | AFRAME.Entity} obj
   * @returns {number}
   */
  distanceToObject(obj) {
    const el = this._getElementByObject(obj)
    if (el) {
      return el.distanceToElement(this._player)
    }
    return Infinity
  }

  /**
   * @param {THREE.Object3D | AFRAME.Entity} obj
   * @param {boolean} active
   * @returns {GameKit}
   */
  setObjectActive(obj, active) {
    const el = this._getElementByObject(obj)
    if (obj) {
      el.active = active
    }
    return this
  }

  /**
   * @param {THREE.Object3D | AFRAME.Entity} obj
   * @param {boolean} visible
   * @returns {GameKit}
   */
  setObjectVisible(obj, visible) {
    const el = this._getElementByObject(obj)
    if (obj) {
      el.visible = visible
    }
    return this
  }

  _loop(ts) {
    if (this.tsPrev === undefined) {
      this.tsPrev = ts
    }
    const tsEllapsed = ts - this.tsPrev
    this.tsPrev = ts

    if (this.playing && !this.paused && !this.ended) {
      this.frames++
      this.ellapsedTime += tsEllapsed

      this._refreshElementsBoundingBoxes()
      this._checkCollisions()

      this._dispatchEnterFrameEvent()
    }
    requestAnimationFrame(this._loop)
  }

  _refreshElementsBoundingBoxes() {
    this._elements.forEach((el) => {
      el.refreshBoundingBox()
    })
  }

  _checkCollisions() {
    this._actors.forEach((actor) => {
      if (actor.active) {
        const colliding = this._player.isColliding(actor)
        const wasColliding = this._player.isInCollisionList(actor)
        // actor.visible = !colliding
        if (colliding && !wasColliding) {
          this._player.addToCollisionList(actor)
          this._applyModifiers(actor.type, COLLISION_ENTER)
          this._dispatchCollisionEnter(actor)
        } else if (colliding && wasColliding) {
          this._applyModifiers(actor.type, COLLIDING)
        } else if (!colliding && wasColliding) {
          this._player.removeFromCollisionList(actor)
          this._applyModifiers(actor.type, COLLISION_EXIT)
          this._dispatchCollisionExit(actor)
        }
      }
    })
  }

  _applyModifiers(type, actionType) {
    const modifiers = this._actorsModifiers.filter(am => am.type === type && am.actionType === actionType)
    modifiers.forEach((am) => {
      this.setGameState(am.property, am.increase, am.min, am.max)
    })
  }

  set showBoundingBoxes(val) {
    if (val !== this._showBoundingBoxes) {
      this._showBoundingBoxes = val
      if (this.scene) {
        this._elements.forEach((element) => {
          if (this._showBoundingBoxes) {
            this.scene.add(element.boundingBoxHelper)
          } else {
            this.scene.remove(element.boundingBoxHelper)
          }
        })
      }
    }
  }

  get showBoundingBoxes() {
    return this._showBoundingBoxes
  }

  _getElementByObject(obj) {
    const object = Utils.getObjectElement(obj)
    for (let i = 0; i < this._elements.length; i++) {
      const _el = this._elements[i]
      if (_el.object == object) {
        return _el
      }
    }
    return null
  }

  _dispatchEnterFrameEvent() {
    this.dispatch(new CustomEvent(EVENT_ENTER_FRAME))
  }

  _dispatchCollisionEnter(otherElement) {
    const evt = new CustomEvent(COLLISION_ENTER, {detail: {other: otherElement}})
    this.dispatch(evt)
  }

  _dispatchCollisionExit(otherElement) {
    const evt = new CustomEvent(COLLISION_EXIT, {detail: {other: otherElement}})
    this.dispatch(evt)
  }

  _dispatchGameStateChanged(oldGameState) {
    const evt = new CustomEvent(EVENT_STATE_CHANGE, {detail: {oldGameState}})
    this.dispatch(evt)
  }
}

class GameKitElement extends EventListener {
  constructor(type, object) {
    super()

    this.id = null

    this.type = type
    this.object = object
    this.object3d = this.get3DObject()

    this.createBoundingBoxHelper()
    this.boundingBox = new THREE.Box3()

    this.refreshBoundingBox()

    this.reset()
  }

  reset() {
    this.collisionList = []
    this.visible = true
    this.active = true
  }

  get3DObject() {
    if (this.object && this.object.isObject3D) {  // THREEJS
      return this.object
    } else if (this.object && this.object.object3D && this.object.object3D.isObject3D) {  // AFRAME
      return this.object.object3D
    } else {
      return null
    }
  }

  refreshBoundingBox() {
    if (this.object3d) {
      this.boundingBox.setFromObject(this.object3d)

      this.boundingBoxHelper.update()
    }
  }

  createBoundingBoxHelper() {
    if (this.object3d) {
      this.boundingBoxHelper = new THREE.BoxHelper(this.object3d, 0xFF0000)
    }
  }

  isColliding(otherGameKitElement) {
    if (this.boundingBox && otherGameKitElement.boundingBox) {
      return this.boundingBox.intersectsBox(otherGameKitElement.boundingBox)
    }
    return false
  }

  addToCollisionList(otherGameKitElement) {
    this.collisionList.push(otherGameKitElement)
  }

  removeFromCollisionList(otherGameKitElement) {
    for (let i = 0; i < this.collisionList.length; i++) {
      if (this.collisionList[i] == otherGameKitElement) {
        this.collisionList.splice(i, 1)
        i--
      }
    }
  }

  isInCollisionList(otherGameKitElement) {
    for (let i = 0; i < this.collisionList.length; i++) {
      if (this.collisionList[i] === otherGameKitElement) {
        return true
      }
    }
    return false
  }

  distanceToElement(otherGameKitElement) {
    const c1 = new THREE.Vector3()
    this.boundingBox.getCenter(c1)
    const c2 = new THREE.Vector3()
    otherGameKitElement.boundingBox.getCenter(c2)
    const d = c1.distanceTo(c2)
    return d
  }

  set object(val) {
    this._object = Utils.getObjectElement(val)
    if (!this._object) {
      console.error('Game Element Not found: ', val)
    } else {
      this.id = this._object.getAttribute('id')
    }
  }

  get object() {
    return this._object
  }

  set visible(value) {
    this._visible = value
    if (this.object3d) {
      this.object3d.visible = this._visible
    }
  }

  get visible() {
    return this._visible
  }
}

class GameKitActorModifier {
  constructor(type, property, increase, min, max, actionType) {
    this.type = type
    this.property = property
    this.increase = increase
    this.min = min
    this.max = max
    this.actionType = actionType
    if (!this.actionType) {
      this.actionType = COLLISION_ENTER
    }
  }
}

export {
  GameKit,
  GameKitElement,
  EVENT_ENTER_FRAME,
  EVENT_STATE_CHANGE,
  COLLISION_ENTER,
  COLLISION_EXIT,
  COLLIDING,
}

