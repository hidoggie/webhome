const tapHotspotComponent = {
  init() {
    const id = this.el.getAttribute('id')
    const contents = document.getElementById('contents')
    const container = document.getElementById('container')
    const childElement = document.getElementById(`${id}-child`)

    const handleClickEvent = (e) => {
      hideAll()
      container.classList.remove('collapsed')
      childElement.setAttribute('visible', true)
      childElement.setAttribute('class', 'cantap')

      const title = childElement.getAttribute('value')
      contents.innerHTML = `<h1>${title}</h1>More info about ${title} goes here.`
    }

    this.el.addEventListener('click', handleClickEvent, true)
  },
}

export {tapHotspotComponent}