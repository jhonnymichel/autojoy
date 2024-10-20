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

## Supported Emulators and Features

### RPCS3

- Detects connected devices and updates settings in the emulator automatically:
  - Guitars: Supports Xinput (Xbox, Wiitar thing, Santroller guitars in default mode) Guitar Hero guitars\*
    - dinput and mmjoystick guitars (such as PS3 and Raphnet adapter instruments) not supported yet.
  - Drums: Supports Xinput (Xbox) and dinput/mmjoystick\*\* (tested with Wii Rock Band 2 drums) Rock Band Drums.
  - Regular Controllers: Supports any Xinput device and DualSense controllers\*\*.
  - Microphones: Supports any recording device connected to the computer, including Rock Band/Guitar Hero mics.
    - It's possible to filter out connected recording devices that you don't want to use. In the tray menu, uncheck unwanted devices.

\*Guitar settings were tested with Xbox and Santroller (default mode) Guitar Hero Guitars in Rock Band Games. rpcs3 docs state that tilt in GH guitars will not work in RB games but the config provided in this app actually has tilt working on Rock Band. the hacky mapping results in Guitar Hero games not working that well. you can remap the settings from `config-templates/rpcs3` to what's indicated [here](https://wiki.rpcs3.net/index.php?title=Help:Peripherals_and_accessories) if you want to play Guitar Hero.

\*\*SDL joystick mode needs to be selected for non-xinput devices to work.

## How to get the app

Download from the [releases](https://github.com/jhonnymichel/autojoy/releases) page!

## Settings

#### joystickMode

what input API to use. possible values are `xinput` and `sdl`. xinput is straight forward although limited. SDL supports more controllers, but it's a less stable mode. please open issues with you run in any problems.
