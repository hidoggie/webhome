import * as ecs from '@8thwall/ecs'
import {game} from 'word-guesser-module'

let seed = ''
let wordLength = 0
let lettersGuessed = []
let remainingAttempts = 6
let maskedWord = ''
let isGameOver = false
let isGameWon = false

function printGameInfo() {
  console.log(`
    Game Information:
    -----------------
    Seed: ${seed}
    Word Length: ${wordLength}
    Letters Guessed: ${lettersGuessed.join(', ')}
    Remaining Attempts: ${remainingAttempts}
    Masked Word: ${maskedWord}
    Game Over: ${isGameOver ? 'Yes' : 'No'}
    Game Won: ${isGameWon ? 'Yes' : 'No'}
  `)
}

ecs.registerComponent({
  name: 'game',
  schema: {
    wordDisplay: ecs.eid,
    loadingUI: ecs.eid,
    onboardingUI: ecs.eid,
    guessingUI: ecs.eid,
    replayUI: ecs.eid,
    replayText: ecs.eid,
    startButton: ecs.eid,
    startButtonText: ecs.eid,
    replayButton: ecs.eid,
    keyboard: ecs.eid,
    life1: ecs.eid,
    life2: ecs.eid,
    life3: ecs.eid,
    life4: ecs.eid,
    life5: ecs.eid,
    life6: ecs.eid,
    livesElement: ecs.eid,
  },
  schemaDefaults: {
  },
  data: {
  },
  stateMachine: ({world, eid, schemaAttribute}) => {
    const startGame = ecs.defineTrigger()
    const startGuessing = ecs.defineTrigger()
    const endGame = ecs.defineTrigger()

    const {
      onboardingUI, guessingUI, replayUI,
      wordDisplay, startButton, startButtonText, replayText, replayButton,
      life1, life2, life3, life4, life5, life6, livesElement,
    } = schemaAttribute.get(eid)

    const lifeEntities = [life1, life2, life3, life4, life5, life6]

    const handleStart = () => {
      ecs.ScaleAnimation.set(world, startButton, {
        autoFrom: true,
        toX: 0,
        toY: 0,
        toZ: 0,
        loop: false,
        duration: 1000,
        easeOut: true,
        easingFunction: 'Elastic',
      })
      setTimeout(() => {
        ecs.Hidden.set(world, onboardingUI, {})
        startGame.trigger()
      }, 1000)
    }

    const handleReplay = () => {
      ecs.ScaleAnimation.set(world, replayUI, {
        fromX: 1,
        fromY: 1,
        fromZ: 1,
        toX: 0,
        toY: 0,
        toZ: 0,
        loop: false,
        duration: 1000,
        easeOut: true,
        easingFunction: 'Elastic',
      })
      setTimeout(() => {
        ecs.Hidden.set(world, replayUI, {})
      })
      startGame.trigger()
    }

    ecs.defineState('onboarding')
      .onEnter(() => {
        ecs.Ui.mutate(world, startButtonText, (cursor) => {
          cursor.text = 'loading'
        })

        ecs.Ui.mutate(world, livesElement, (cursor) => {
          cursor.text = ''
        })

        const onxrloaded = () => {
          ecs.Ui.mutate(world, startButtonText, (cursor) => {
            cursor.text = 'START'
          })

          world.events.addListener(startButton, ecs.input.SCREEN_TOUCH_START, handleStart)
        }

        window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)
      })
      .onExit(() => {
        world.events.removeListener(startButton, ecs.input.SCREEN_TOUCH_START, handleStart)
        world.deleteEntity(onboardingUI)
      })
      .initial()
      .onTrigger(startGame, 'gameStarted')

    ecs.defineState('gameStarted')
      .onEnter(() => {
        ecs.Ui.mutate(world, livesElement, (cursor) => {
          cursor.text = `Guesses Remaining: ${remainingAttempts}`
        })

        // show guessing ui
        ecs.Hidden.remove(world, guessingUI)
        ecs.ScaleAnimation.set(world, guessingUI, {
          autoFrom: true,
          toX: 1,
          toY: 1,
          toZ: 1,
          loop: false,
          duration: 1000,
          easeOut: true,
          easingFunction: 'Elastic',
        })

        // reset masked word
        ecs.Ui.mutate(world, wordDisplay, (cursor) => {
          cursor.text = ''
        })

        // reset life entities
        lifeEntities.forEach((lifeEntity) => {
          ecs.ScaleAnimation.set(world, lifeEntity, {
            autoFrom: true,
            toX: 0.12,
            toY: 0.12,
            toZ: 0.12,
            loop: false,
            duration: 1000,
            easeOut: true,
            easingFunction: 'Elastic',
          })
        })

        game('/startGame', {
          method: 'POST',
        })
          .then((body) => {
            seed = body.data.seed
            wordLength = body.data.wordLength
            lettersGuessed = []
            remainingAttempts = 6
            maskedWord = '_'.repeat(wordLength)
            isGameOver = false
            isGameWon = false

            startGuessing.trigger()
          })
          .catch((err) => {
            console.error(err)
          })
          .finally(() => {
            printGameInfo()
          })
      })
      .onTrigger(startGuessing, 'gameGuessing')

    ecs.defineState('gameGuessing')
      .onEnter(() => {
        ecs.Ui.mutate(world, wordDisplay, (cursor) => {
          cursor.text = `${maskedWord}`
        })

        world.events.dispatch(world.events.globalId, 'stateChanged', {
          newState: 'gameGuessing',
        })
      })
      .listen(world.events.globalId, 'submitLetter', (e) => {
        lettersGuessed.push(e.data.letter)

        game('/guess', {
          method: 'POST',
          body: JSON.stringify({
            remainingAttempts,
            lettersGuessed,
            seed,
          }),
        })
          .then((body) => {
            maskedWord = body.data.maskedWord
            remainingAttempts = body.data.remainingAttempts
            isGameOver = body.data.isGameOver
            isGameWon = body.data.isGameWon

            if (body.data.isCorrectGuess) {
              ecs.Ui.mutate(world, wordDisplay, (cursor) => {
                cursor.text = `${maskedWord}`
              })
            } else if (remainingAttempts >= 0 && remainingAttempts <= 5) {
              ecs.ScaleAnimation.set(world, lifeEntities[5 - remainingAttempts], {
                autoFrom: true,
                toX: 0,
                toY: 0,
                toZ: 0,
                loop: false,
                duration: 1000,
                easeOut: true,
                easingFunction: 'Elastic',
              })
            }

            if (isGameWon) {
              endGame.trigger()
            } else if (isGameOver) {
              endGame.trigger()
            }
          })
          .catch((err) => {
            console.error(err)
          })
          .finally(() => {
            ecs.Ui.mutate(world, livesElement, (cursor) => {
              cursor.text = `Guesses Remaining: ${remainingAttempts}`
            })

            printGameInfo()
          })
      })
      .onTrigger(endGame, 'gameOver')

    ecs.defineState('gameOver')
      .onEnter(() => {
        world.events.dispatch(world.events.globalId, 'stateChanged', {
          newState: 'gameOver',
        })

        // hide guessing ui
        ecs.ScaleAnimation.set(world, guessingUI, {
          autoFrom: true,
          toX: 0,
          toY: 0,
          toZ: 0,
          loop: false,
          duration: 1000,
          easeOut: true,
          easingFunction: 'Elastic',
        })

        if (isGameWon) {
          ecs.Ui.mutate(world, replayText, (cursor) => {
            cursor.text = 'CONGRATULATIONS! YOU WIN.'
            cursor.width = 512 + Math.round(cursor.text.length * 5.3)
          })
        } else {
          ecs.Ui.mutate(world, replayText, (cursor) => {
            cursor.text = 'BETTER LUCK NEXT TIME...'
            cursor.width = 512 + Math.round(cursor.text.length * 5.3)
          })
        }

        // show replay button
        ecs.Hidden.remove(world, replayUI)
        ecs.ScaleAnimation.set(world, replayUI, {
          autoFrom: true,
          toX: 1,
          toY: 1,
          toZ: 1,
          loop: false,
          duration: 1000,
          easeOut: true,
          easingFunction: 'Elastic',
        })
        world.events.addListener(replayButton, ecs.input.SCREEN_TOUCH_START, handleReplay)
      })
      .onExit(() => {
        world.events.removeListener(replayButton, ecs.input.SCREEN_TOUCH_START, handleReplay)
      })
      .onTrigger(startGame, 'gameStarted')
  },
  add: (world, component) => {
    ecs.Ui.set(world, component.schema.loadingUI, {
      width: window.innerWidth, height: window.innerHeight,
    })
  },
  tick: (world, component) => {
  },
  remove: (world, component) => {
  },
})
