import {initScenePipelineModule} from './threejs-scene-init.js'

const cloudTextComponent = {
  schema: {
    content: {type: 'string'},
    fontName: {type: 'string', default: 'Verdana'},
    textureFontSize: {type: 'number', default: 60},
    fontScaleFactor: {type: 'number', default: 0.08},
  },
  init() {
    const string = this.data.content
    const {fontName, textureFontSize, fontScaleFactor} = this.data

    const scene = this.el.sceneEl.object3D
    const {camera, renderer} = this.el.sceneEl

    const onxrloaded = () => {
      XR8.addCameraPipelineModule(initScenePipelineModule(string, fontName, textureFontSize, fontScaleFactor, scene, camera, renderer))
    }
    window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)
  },
}
export {cloudTextComponent}