import uiHTML from './ui.html?raw'
import { UIElement, Button, Bar, Label, IconBar, Icon } from './../ui-kit/module.js'

const powerUpImageOn = './../assets/img/powerup.png'
const powerUpImageOff = './../assets/img/powerup--consumed.png'

const energyIconImage = './../assets/img/energybar--icon.png'

class UI {
  init(gameState) {
    document.getElementById('uiHolder').innerHTML = uiHTML

    this.btnPlay = new Button('#btnPlay').onClick(() => this.onBtnPlayClick())
    this.btnPause = new Button('#btnPause').onClick(() => this.onBtnPauseClick())
    this.btnRestart = new Button('#btnRestart').onClick(() => this.onBtnRestartClick())

    this.gameOver_card = new UIElement('#gameOver_card')

    this.energyBar = new Bar('#energyBarProgress')
    this.scoreLabel = new Label('#scoreLabel')
    this.scoreEndedLabel = new Label('#gameOverScore')
    this.powerUpsIcons = new IconBar('#powerUps', powerUpImageOn, gameState.powerUps, 'powerups__item').setInactiveImage(powerUpImageOff)

    this.energyIcon = new Icon('#energyIcon').set(energyIconImage)
  }

  setBtnPlayVisible(val) {
    if (this.btnPlay) this.btnPlay.setVisible(val)
  }

  setBtnPauseVisible(val) {
    if (this.btnPause) this.btnPause.setVisible(val)
  }

  setGameOverVisible(val) {
    if (this.gameOver_card) this.gameOver_card.setVisible(val)
  }

  setEnergy(val) {
    if (this.energyBar) this.energyBar.set(val)
  }

  setScore(val) {
    if (this.scoreLabel) this.scoreLabel.set(val)
    if (this.scoreEndedLabel) this.scoreEndedLabel.set(val)
  }

  setPowerUps(val) {
    if (this.powerUpsIcons) this.powerUpsIcons.set(val)
  }
}
export {
  UI,
}

