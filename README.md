# autojoy

Detects connected devices and can automatically update emulators, games and other apps settings based on them.
When controllers are different from eachother (a guitar and a drum controller, for example) and connection order matters, this becomes useful.

## Use Case

If you play a game that uses a different type of controller in an emulator (like rock band), you would:

- have to update the input settings every time you want to play a game that uses a regular controller (unless you want to play Heavy Rain with a guitar)

Or when you play the same game with a variable number of players or wants to switch controller types:

- Player 1 is a Guitar Controller, Player 2 is Drums. Next time you play, you want to play Drums but Player 1 is set as a Guitar. You'd have to reassign controllers in the settings or keep both instruments turned on even when you're playing alone.

In some emulatoers, when you attach an USB peripheral such as a Microphone, you have to change settings again to pick that device up.

## Supported Operational Systems

Currently only supports Windows.

## Supported Emulators and Controllers

### RPCS3

- In xinput mode, detects Guitars, any regular Xbox controllers and Drum Kits.
- In SDL mode, detects all of the above + DualSense controllers.
- Manage Microphones mode can be turned on.

Automatically assigns the right player to the right settings based on the connected controllers in the right order.

Settings were tested with Guitar Hero Guitars and Rock Band Pro Drums, in Rock Band Games (rpcs3 docs state that tilt in GH guitars will not work on RB games but the config provided in this repository actually has tilt working on Rock Band. the hacky mapping results in Guitar Hero games not working that well. you can remap the settings from `config-templates/rpcs3` to what's indicated [here](https://wiki.rpcs3.net/index.php?title=Help:Peripherals_and_accessories) if you want to play Guitar Hero)

## How to run it

Right now there is no executable to run or to initialize with the system. this is coming later.

create a `user/paths.json` file following the template.
create a `user/settings.json` file following the template.

### Settings

#### joystickMode

what input API to use. possible values are `xinput` and `sdl`.

run `npm install` and `node index.mjs`. Now the app will take care of everything for you.
