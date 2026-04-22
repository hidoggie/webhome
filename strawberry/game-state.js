// Component that detects and emits events for touch gestures
export const gameStateComponent = () => ({
  schema: {
    gameLengthMS: {default: 200000},
  },
  gameOver(event) {
    console.log("game over")

    const {sceneEl} = this.el
    sceneEl.emit('spicestop')
    
    const scoreAmount = document.querySelector('#scoreBox')
    scoreAmount.textContent = `Thanks for playing! You won a 15% off coupon for collecting 6 pumpkins!`
  },
  init: function() {
    console.log("game start")
    
    this.gameOver = this.gameOver.bind(this)
    
    const {sceneEl} = this.el
    let caughtSpices = 0
    

    setTimeout(this.gameOver, this.data.gameLengthMS)
 
    const scoreAmount = document.querySelector('#scoreAmount')
    
    const updateInterface = () => {
      scoreAmount.textContent = `${caughtSpices}`
    }
    
    sceneEl.addEventListener('spicecaught', () => {
      caughtSpices++
      updateInterface()
    })
  },
  remove: function() {
    
  },
})

