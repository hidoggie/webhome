const SPICE_SPAWN_DELAY_MS = 1000


const spiceSpawnerComponent = {
  init() {
    this.falling = false

    let interval = null

    const spawn = () => {
      const spice = document.createElement('a-entity')
      spice.setAttribute('spice-cloud', '')
      this.el.sceneEl.appendChild(spice)
    }

    const startSpawning = () => {
      clearInterval(interval)
      interval = setInterval(spawn, SPICE_SPAWN_DELAY_MS)
    }

    const stopSpawning = () => {
      clearInterval(interval)
    }

    this.el.sceneEl.addEventListener('spicestart', startSpawning)
    this.el.sceneEl.addEventListener('spicestop', stopSpawning)

    startSpawning()
  },

}

export {
  spiceSpawnerComponent,
}
