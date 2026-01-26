# Word Guesser

This project uses backend functions to create a word guessing game where words are stored on the server so the player can't access them directly.

## Components

`game.js`

Component that mananges all the game state returned from the backend function along with client only state.

`letter.js`

Component responsible for managing the specific letter that it's attached to.

## Modules

### word-guesser

#### Files

`index.ts`

Server code that executes on the backend function and returns responses the client can use via `handler`.

#### Backends

`game-service`

Exports the module out to the client.
