const openIcon = './assets/open-mouth.svg'
const closeIcon = './assets/closed-mouth.svg'
const notTrackingIcon = './assets/not-tracking.svg'

const faceEventsComponent = {
  schema: {
    icon: {},
  },
  init() {
    this.data.icon = document.getElementById('icon')

    const hide = () => {
      this.data.icon.src = notTrackingIcon
    }
    this.el.sceneEl.addEventListener('xrfacelost', hide)

    this.el.sceneEl.addEventListener('xrmouthopened', () => {
      this.data.icon.src = openIcon
    })
    this.el.sceneEl.addEventListener('xrmouthclosed', () => {
      this.data.icon.src = closeIcon
    })
  },
  tick() {
  },
}

export {faceEventsComponent}