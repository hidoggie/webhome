class EventListener {
  constructor() {
    this._listeners = {}
  }

  bind(eventName, cb) {
    if (!this._listeners[eventName]) {
      this._listeners[eventName] = []
    }
    this._listeners[eventName].push(cb)
    return this
  }

  unbind(eventName, cb) {
    if (!this._listeners[eventName]) {
      return
    }
    if (cb) {
      for (let i = 0, l = this._listeners[eventName].length; i < l; i++) {
        if (this._listeners[eventName][i] === cb) {
          if (l === 1) delete (this._listeners[eventName])
          else this._listeners[eventName].splice(i, 1)
          break
        }
      }
    } else {
      delete (this._listeners[eventName])
    }
  }

  dispatch(event) {
    const {_listeners} = this
    const {type} = event
    let arr = _listeners[type]
    if (!arr) return
    arr = arr.slice()
    for (let i = 0, l = arr.length; i < l; i++) {
      if (arr[i]) {
        const func = arr[i]
        func.call(this, event)
      }
    }
  }
}

export {
  EventListener,
}