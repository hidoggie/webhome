class UIElement {
  constructor(object) {
    this.object = object
    this.visible = true
  }

  setVisible(val) {
    this.visible = val
    return this
  }

  set object(val) {
    // this._object = getObjectElement(val)
    if (typeof val === 'string') {
      this._object = document.querySelector(val)
      if (!this._object) {
        this._object = document.getElementById(val)
      }
    } else {
      this._object = val
    }
    if (!this._object) {
      console.error('UI Element Not found: ', val)
    }
  }

  get object() {
    return this._object
  }

  set visible(val) {
    this._visible = val
    if (this._visible) {
      this.object.style.display = ''
    } else {
      this.object.style.display = 'none'
    }
  }

  get visible() {
    return this._visible
  }
}

class Button extends UIElement {
  constructor(object) {
    super(object)
    this.type = 'button'
  }

  onClick(cb) {
    this.object.addEventListener('click', cb)
    return this
  }
}

class Bar extends UIElement {
  constructor(object) {
    super(object)
    this.type = 'bar'
    this.setCurrentProperty('width')
  }

  setCurrentProperty(property) {
    this.currentProperty = property
    return this
  }

  set(value) {
    this._value = Math.max(0, Math.min(1, value))
    this.object.style[this.currentProperty] = `${100 * this._value}%`
    return this
  }

  get() {
    return this._value
  }
}

class Label extends UIElement {
  constructor(object) {
    super(object)
    this.type = 'label'
  }

  set(value) {
    this._value = value
    this.object.innerHTML = value
    return this
  }

  get() {
    return this._value
  }
}

class IconBar extends UIElement {
  constructor(object, imageSrc, total, iconClass) {
    super(object)
    this.type = 'iconBar'
    this.icons = []
    this.total = total
    this.activeClass = 'active'
    this.activeImageSrc = imageSrc
    this.inactiveImageSrc = ''
    this.iconClass = iconClass

    for (let i = 0; i < total; i++) {
      const el = document.createElement('img')
      if (this.iconClass) el.classList.add(this.iconClass)
      this.icons.push(el)
      this.object.appendChild(el)
    }
  }

  setActiveClass(val) {
    this.activeClass = val
    return this
  }

  setInactiveImage(src) {
    this.inactiveImageSrc = src
    return this
  }

  set(value) {
    this._value = value
    for (let i = 0; i < this.total; i++) {
      const el = this.icons[i]
      if (this.activeClass) {
        el.classList.toggle(this.activeClass, (this._value > i))
      }
      if (this._value > i) {
        el.setAttribute('src', this.activeImageSrc)
      } else if (this.inactiveImageSrc) {
        el.setAttribute('src', this.inactiveImageSrc)
      }
    }
    return this
  }

  get() {
    return this._value
  }
}

class Icon extends UIElement {
  constructor(object) {
    super(object)
    this.type = 'icon'
  }

  set(value) {
    if (this._value !== value) {
      if (this._img) {
        this.object.removeChild(this._img)
      }
      this._value = value
      if (this._value) {
        this._img = document.createElement('img')
        this._img.classList.add('icon')
        this._img.setAttribute('src', this._value)
        this.object.appendChild(this._img)
      }
    }
  }

  get() {
    return this._value
  }
}

export {
  UIElement,
  Button,
  Bar,
  Label,
  IconBar,
  Icon,
}

