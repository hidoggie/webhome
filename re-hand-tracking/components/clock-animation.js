function truncateDecimal(number, decimalPlaces) {
  const factor = 10 ** decimalPlaces
  return Math.trunc(number * factor) / factor
}

const clockAnimationComponent = {
  init() {
    this.el.addEventListener('model-loaded', () => {
      const model = this.el.getObject3D('mesh')
      model.traverse((node) => {
        if (node.name.includes('handSeconds')) {
          this.secondHand = node
        }
        if (node.name.includes('handLarge')) {
          this.minutesHand = node
        }
        if (node.name.includes('handSmall')) {
          this.hoursHand = node
        }
        if (node.name.includes('dates')) {
          this.datesWheel = node
        }
      })
    })
  },
  tick() {
    // Update the watch rotation based on real-time
    const currentTime = new Date()
    const milliseconds = currentTime.getMilliseconds()
    const seconds = currentTime.getSeconds()
    const granularSeconds = truncateDecimal((seconds + milliseconds / 1000), 1)
    const minutes = currentTime.getMinutes()
    const hours = currentTime.getHours()
    const date = currentTime.getDate()

    const secondsMechanicalRotation = ((Math.PI * 2) / 60) * granularSeconds
    const secondsQuartzRotation = ((Math.PI * 2) / 60) * seconds
    const minutesRotation = ((Math.PI * 2) / 60) * minutes
    const hoursRotation = ((Math.PI * 2) / 12) * hours + (((Math.PI * 2) / 12) / 60) * minutes

    if (this.secondHand) {
      this.secondHand.rotation.x = -secondsMechanicalRotation
    }
    if (this.minutesHand) {
      this.minutesHand.rotation.x = -minutesRotation
    }
    if (this.hoursHand) {
      this.hoursHand.rotation.x = -hoursRotation
    }
    if (this.datesWheel) {
      this.datesWheel.rotation.z = -0.2025 * (date - 1)
    }
  },
}

export {clockAnimationComponent}
