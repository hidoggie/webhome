const deviceOrientationComponent = {
  init() {
    const overlayDiv = document.getElementById('orientationOverlay')
    const checkOrientation = (orientation) => {
      // portrait mode
      if (orientation === 0) {
        // hide overlay
        overlayDiv.style.display = 'none'
      }
      // landscape mode
      if (orientation === 90 || orientation === -90) {
        // show overlay
        overlayDiv.style.display = 'flex'
      }
    }
    XR8.addCameraPipelineModule({
      name: 'orientation',
      onStart: ({orientation}) => {
        checkOrientation(orientation)
      },
      onDeviceOrientationChange: ({orientation}) => {
        checkOrientation(orientation)
      },
    })
  },
}
export {deviceOrientationComponent}