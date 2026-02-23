import {swapDofComponent, swapCameraComponent} from './swap-components.js'

AFRAME.registerComponent('swap-dof', swapDofComponent)
AFRAME.registerComponent('swap-camera', swapCameraComponent)

const onxrloaded = () => {
  window.XR8.addCameraPipelineModule({
    name: 'request-gyro',
    requiredPermissions: () => ([XR8.XrPermissions.permissions().DEVICE_ORIENTATION]),
  })
}

window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)