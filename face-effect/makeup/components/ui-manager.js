/* global LunaTab */
/* eslint no-use-before-define: ["error", { "variables": false }] */

const uiManagerComponent = {
  init() {
    const container = document.getElementById('container')
    const faceAnchorEntity = document.getElementById('face-anchor')
    const tab = new LunaTab(container, {
      height: 30,
    })
    tab.append({
      id: 'lipstick',
      title: 'Lips',
    })
    tab.append({
      id: 'blush',
      title: 'Blush',
    })
    tab.append({
      id: 'lowerLashes',
      title: 'Mascara',
    })
    tab.append({
      id: 'contacts',
      title: 'Contacts',
    })
    tab.append({
      id: 'eyeliner',
      title: 'Liner',
    })
    tab.append({
      id: 'eyeshadow',
      title: 'Shadow',
    })

    tab.append({
      id: 'eyebrows',
      title: 'Brows',
    })

    tab.select('lipstick')
    tab.on('select', (id) => {
      faceAnchorEntity.setAttribute('color-picker', {makeup: id})
    })
  },
}
export {uiManagerComponent}