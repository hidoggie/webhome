import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'letter',
  schema: {
    letter: ecs.string,
  },
  schemaDefaults: {
    letter: 'a',
  },
  data: {
    enabled: ecs.boolean,
  },
  add: (world, component) => {
    const {eid, schemaAttribute, dataAttribute} = component

    world.events.addListener(world.events.globalId, 'stateChanged', (e) => {
      if (e.data.newState === 'gameGuessing') {
        dataAttribute.mutate(eid, (cursor) => {
          cursor.enabled = true
          return false
        })

        const click = () => {
          if (!dataAttribute.get(eid).enabled) {
            return
          }

          dataAttribute.mutate(eid, (cursor) => {
            cursor.enabled = false
            return false
          })

          world.events.dispatch(world.events.globalId, 'submitLetter', {
            letter: schemaAttribute.get(eid).letter,
          })

          ecs.ScaleAnimation.set(world, eid, {
            autoFrom: true,
            toX: 0.7,
            toY: 0.7,
            toZ: 1,
            loop: false,
            duration: 1000,
            easeOut: true,
            easingFunction: 'Elastic',
          })
        }

        world.events.addListener(eid, ecs.input.SCREEN_TOUCH_START, click)
      } else if (e.data.newState === 'gameOver') {
        dataAttribute.mutate(eid, (cursor) => {
          cursor.enabled = false
          return false
        })

        ecs.ScaleAnimation.set(world, eid, {
          autoFrom: true,
          toX: 1,
          toY: 1,
          toZ: 1,
          loop: false,
          duration: 1000,
          easeOut: true,
          easingFunction: 'Elastic',
        })
      }
    })
  },
  tick: (world, component) => {
  },
  remove: (world, component) => {
  },
})
