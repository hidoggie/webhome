const responsiveImmersiveComponent = {
  init() {
    const onAttach = ({sessionAttributes}) => {
      const car = document.getElementById('car')
      const hotspots = document.getElementById('hotspot-group')
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
        hotspots.parentNode.removeChild(hotspots)  // remove hotspots
        const addComponents = () => {
          car.setAttribute('change-color', '')
          car.setAttribute('reflections', 'type: static')
          car.setAttribute('xrextras-pinch-scale', '')
        }
        car.getObject3D('mesh') ? addComponents() : car.addEventListener('model-loaded', addComponents)
      } else if (
        s.cameraLinkedToViewer &&
        s.controlsCamera &&
        !s.fillsCameraTexture &&
        s.supportsHtmlEmbedded &&
        !s.supportsHtmlOverlay &&
        !s.usesMediaDevices &&
        s.usesWebXr
      ) {  // HMD-specific behavior goes here
        hotspots.parentNode.removeChild(hotspots)  // remove hotspots
        if (this.el.sceneEl.xrSession.environmentBlendMode === 'opaque') {
          // VR HMD (i.e. Oculus Quest) behavior goes here
          car.setAttribute('ignore-raycast', '')
          const addComponents = () => {
            car.setAttribute('change-color', '')
            car.setAttribute('reflections', 'type: static')
          }
          car.getObject3D('mesh') ? addComponents() : car.addEventListener('model-loaded', addComponents)
        } else if (this.el.sceneEl.xrSession.environmentBlendMode === 'additive' || 'alpha-blend') {
          // AR HMD (i.e. Hololens) behavior goes here
          car.setAttribute('ignore-raycast', '')
          const addComponents = () => {
            car.setAttribute('change-color', '')
            car.setAttribute('reflections', 'type: static')
          }
          car.getObject3D('mesh') ? addComponents() : car.addEventListener('model-loaded', addComponents)
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
        const container = document.getElementById('container')
        this.el.addEventListener('coaching-overlay.show', (e) => {
          car.object3D.scale.set(0.001, 0.001, 0.001)
          container.style.display = 'none'
        })
        this.el.addEventListener('coaching-overlay.hide', (e) => {
          container.style.display = 'block'
          car.object3D.scale.set(1, 1, 1)
          car.setAttribute('absolute-pinch-scale', '')
        })
        const addComponents = () => {
          car.setAttribute('change-color', '')
          car.setAttribute('reflections', 'type: realtime')
        }
        car.getObject3D('mesh') ? addComponents() : car.addEventListener('model-loaded', addComponents)
      }
    }

    const onxrloaded = () => {
      XR8.addCameraPipelineModules([{'name': 'responsiveImmersive', onAttach}])
    }
    window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)
  },
}

export {responsiveImmersiveComponent}
