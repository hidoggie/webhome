const tapCloseComponent = {
  init() {
    const handleClickEvent = (e) => {
      hideAll()
    }

    this.el.addEventListener('click', handleClickEvent, true)
  },
}

export {tapCloseComponent}
