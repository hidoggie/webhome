class Utils {
  static getObjectElement(obj) {
    let ret = null
    if (typeof obj === 'string') {
      ret = document.querySelector(obj)
      if (!ret) {
        ret = document.getElementById(obj)
      }
    } else {
      ret = obj
    }
    return ret
  }
}

export {
  Utils,
}

