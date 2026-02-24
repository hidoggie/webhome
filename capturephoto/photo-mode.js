// add 'Tap + Hold to Add to Photos' prompt when user takes a photo
window.addEventListener('mediarecorder-photocomplete', () => {
  document.getElementById('overlay') ? document.getElementById('overlay').style.display = 'block'
    : document.body.insertAdjacentHTML('beforeend',
      '<div id="overlay"><div id="savePrompt">클릭하여 사진을 저장하세요</div></div>')
})

// hide 'Tap + Hold to Add to Photos' prompt when user dismisses preview modal
window.addEventListener('mediarecorder-previewclosed', () => {
  if (document.getElementById('overlay')) {
    document.getElementById('overlay').style.display = 'none'
  }
})

const onxrloaded = () => {
  XR8.CanvasScreenshot.configure({maxDimension: 1920, jpgCompression: 100})
}

window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)
