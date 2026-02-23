const responsiveImmersiveComponent = {
  init() {
    const onAttach = ({sessionAttributes}) => {
      const glove = document.getElementById('glove-model')
      const promptText = document.getElementById('promptText')
      const resetButton = document.getElementById('resetButton')
      const s = sessionAttributes
      if (
        !s.cameraLinkedToViewer &&
        !s.controlsCamera &&
        !s.fillsCameraTexture &&
        !s.supportsHtmlEmbedded &&
        s.supportsHtmlOverlay &&
        !s.usesMediaDevices &&
        !s.usesWebXr
      ) {  // Desktop-specific behavior goes here
        promptText.innerHTML = 'Space Bar or Click to Punch!'
      } else if (
        s.cameraLinkedToViewer &&
        s.controlsCamera &&
        !s.fillsCameraTexture &&
        s.supportsHtmlEmbedded &&
        !s.supportsHtmlOverlay &&
        !s.usesMediaDevices &&
        s.usesWebXr
      ) {  // HMD-specific behavior goes here
        glove.object3D.position.set(0, 0, -0.5)
        glove.object3D.scale.set(-1, 1, 1)
        glove.object3D.rotation.set(Math.PI / 2, Math.PI, 0)
        glove.setAttribute('punch-tap', {
          yOffset: 0,
          zOffset: -0.5,
        })
        promptText.style.fontSize = '4em'
        promptText.style.width = '100%'
        resetButton.style.width = '20vw'
        if (this.el.sceneEl.xrSession.environmentBlendMode === 'opaque') {
          // VR HMD (i.e. Oculus Quest) behavior goes here
          promptText.innerHTML = 'Pull Trigger to Punch!'
        } else if (this.el.sceneEl.xrSession.environmentBlendMode === 'additive' || 'alpha-blend') {
          // AR HMD (i.e. Hololens) behavior goes here
          promptText.innerHTML = 'Pinch to Punch!'
        }
      } else if (
        !s.cameraLinkedToViewer &&
        !s.controlsCamera &&
        s.fillsCameraTexture &&
        !s.supportsHtmlEmbedded &&
        s.supportsHtmlOverlay &&
        s.usesMediaDevices &&
        !s.usesWebXr
      ) {  // Mobile-specific behavior goes here
        promptText.innerHTML = 'Tap to Punch!'
      }
    }
    const onxrloaded = () => {
      XR8.addCameraPipelineModules([{'name': 'responsiveImmersive', onAttach}])
    }
    window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)
  },
}
export {responsiveImmersiveComponent}