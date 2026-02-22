import {ChromaKeyMaterial} from './chromakey-material.js'
const {dat} = window

const chromaKeyComponent = {
  schema: {
    'src': {type: 'string'},
    'color': {default: 0x19ae31},
    'width': {default: 1920},
    'height': {default: 1080},
    'similarity': {default: 0.159},
    'smoothness': {default: 0.082},
    'spill': {default: 0.214},
  },
  init() {
    const {src, color, width, height, similarity, smoothness, spill} = this.data
    if (src === '') {
      console.error('No video src')
    }

    const greenScreenMaterial = new ChromaKeyMaterial(src, color, width, height, similarity, smoothness, spill)
    this.el.getObject3D('mesh').material = greenScreenMaterial

    // set up gui
    const gui = new dat.GUI({width: 250})
    gui.addColor({color: 0x19ae31}, 'color').onChange((e) => {
      greenScreenMaterial.uniforms.keyColor.value.set(e)
    }).name('Color')
    gui.add(greenScreenMaterial.uniforms.similarity, 'value', 0, 1, 0.001)
      .name('Similarity')
    gui.add(greenScreenMaterial.uniforms.smoothness, 'value', 0, 1, 0.001)
      .name('Smoothness')
    gui.add(greenScreenMaterial.uniforms.spill, 'value', 0, 1, 0.001)
      .name('Spill')
  },
}
export {chromaKeyComponent}
