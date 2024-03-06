# autojoy

Detects connected xinput devices and can automatically update emulators, games and other apps settings based on them.
When controllers are different from eachother (a guitar and a drum controller, for example), this becomes useful.

## Use Case

If you play a game that uses a different type of controller in an emulator (like rock band), you would:

- have to update the input settings every time you want to play a game that uses a regular controller (unless you want to play Heavy Rain with a guitar)

Or when you play the same game with a variable number of players or wants to switch controller types:

- Player 1 is a Guitar Controller, Player 2 is Drums. Next time you play, you want to play Drums but Player 1 is set as a Guitar. You'd have to reassign controllers in the settings or keep both instruments turned on even when you're playing alone.

## Supported Operational Systems

Currently only supports Windows.

## Supported Emulators and Controllers

### RPCS3

- In xinput mode, detects Guitars, any regular Xbox controllers and Drum Kits.
- In SDL mode, detects all of the above + DualSense controllers.

Automatically assigns the right player to the right settings based on the connected controllers in the right order.

Settings were tested with Guitar Hero Guitars and Rock Band Pro Drums.

## How to run it

Right now there is no executable to run or to initialize with the system. this is coming later.

create a `user/paths.json` file following the template.
create a `user/settings.json` file following the template.

### Settings

#### joystickMode

what input API to use. possible values are `xinput` and `sdl`.

run `npm install` and `node index.mjs`. Now the app will take care of everything for you.
