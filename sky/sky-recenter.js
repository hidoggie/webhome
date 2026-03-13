/* globals AFRAME */
AFRAME.registerComponent('sky-recenter', {
  init() {
    const recenter = () => {
      this.el.emit('recenter')
      this.el.removeEventListener('sky-coaching-overlay.hide', recenter)
    }
    this.el.addEventListener('sky-coaching-overlay.hide', recenter)
  },
})


AFRAME.registerComponent('hide-show', {
  init() {
    const model = document.getElementById('model')

    // ✅ 하늘 인식 성공 → 리센터 + 모델 표시
    this.el.addEventListener('sky-coaching-overlay.hide', () => {
      if (model) model.setAttribute('visible', true)
    })

    // ✅ 하늘 이탈 → 모델 숨김
    this.el.addEventListener('sky-coaching-overlay.show', () => {
      if (model) model.setAttribute('visible', false)
    })
  },
})