export const tapPlaySound = {
  init() {
    const button = document.getElementById('btn-obj')
    const btnPos = button.object3D.position

    const buttonDown = () => {
      const sound = new window.Howl({
        src: [require('./assets/sound.mp3')],
      })
      sound.play()

      button.setAttribute('animation__press', {
        property: 'position',
        from: '0 0 0',
        to: `${btnPos.x} ${btnPos.y - 0.1} ${btnPos.z}`,
        easing: 'easeInElastic',
        dir: 'reverse',
        dur: 800,
      })

      button.removeEventListener('click', buttonDown)

      setTimeout(() => {
        button.removeAttribute('animation__press')
        button.addEventListener('click', buttonDown)
      }, 250)
    }

    button.addEventListener('click', buttonDown)
  },
}
