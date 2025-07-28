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

## Supported Emulators and Games, Peripherals and Features

### RPCS3

- Guitars:
  - Xbox 360 Guitar Hero and Rock Band Guitars.
  - Wii Guitar Hero Guitars via Wiitar thing.
  - Santroller Guitars in default mode.
  - PS3 Guitar Hero guitar (incl. CRKD Les Paul in P3 mode) -- No Tilt
  - NOT SUPPORTED YET: other dinput and mmjoystick guitars (such as Wii Rock Band and Raphnet adapter instruments).
  - NOT SUPPORTED YET: PS4 and Xbox One Rock Band Guitars.
  - NOT SUPPORTED YET: Riffmaster.
- Drums:
  - Xbox 360 Rock Band 2 and 3 Rock Band Drums. \*\*\*
  - Wii Rock Band 2 and 3 Drums.\*\* \*\*\*
  - PS3 Rock Band 2 and 3 Drums.\*\* \*\*\*
- Regular Controllers: Supports any Xinput device and DualSense controllers\*\*.
- Microphones: Supports any recording device connected to the computer, including Rock Band/Guitar Hero mics.
  - It's possible to filter out connected recording devices that you don't want to use. In the tray menu, uncheck unwanted devices.

\*\* SDL joystick mode needs to be selected for non-xinput devices to work.

\*\*\* Rock Band 2 and 3 drums are validated. Rock Band 1 Drums may work but they have not been tested.

### Dolphin

- Guitars:
  - Xbox 360 Guitar Hero and Rock Band Guitars.
  - Wii Guitars Hero Guitars via Wiitar thing.
  - Santroller Guitars in default mode.
  - PS3 Guitar Hero guitar (incl. CRKD Les Paul in P3 mode) -- No Tilt
  - NOT SUPPORTED YET: other non-xinput guitars (such as Wii Rock Band and Raphnet adapter instruments).
  - NOT SUPPORTED YET: PS4 and Xbox One Rock Band Guitars.
  - NOT SUPPORTED YET: Riffmaster.
- Drums:
  - Xbox 360 Rock Band Drums. \* \*\*\*
  - Wii Rock Band 2 and 3 Drums.\* \*\* \*\*\*
  - PS3 Rock Band 2 and 3 Drums.\* \*\* \*\*\*
- Regular Controllers: Supports any Xinput device and DualSense controllers\*\*.
- Microphones: NOT SUPPORTED YET.

\* Drum settings were tested in Rock Band and Guitar Hero games. Dolphin does not emulate Rock Band Drums, only Guitar Hero Drums. This causes some limitations:

- To play Guitar Hero, the Green Cymbal add-on is needed.
- Pro Drums can't be played in Rock Band 3.
  - If you have a Drum Kit from Rock Band for the Wii, you can use Dolphin's USB passthrough to play Pro Drums.
- Guitar Hero Drums are not supported, but Wii drums can work with real wiimotes and that'd be the preferred way to use Guitar Hero Drums.
  - Xbox 360/PS3 Guitar Hero Drums may arrive in the future.
  - Real Wiimote auto config is planned as well.

\*\* SDL joystick mode needs to be selected for non-xinput devices to work.

\*\*\* Rock Band 2 and 3 drums are validated. Rock Band 1 Drums may work but they have not been tested.

### Guitar Hero World Tour Definitive Edition

It's recommended to disconnect non-instrument controllers for full band gameplay. Player 1 in this game is always the singer controlled with the computer keyboard when a microphone is setup.

- Guitars:
  - Xbox 360 Guitar Hero and Rock Band Guitars.
  - Wii Guitar Hero Guitars via Wiitar thing.
  - Santroller Guitars in default mode.
  - PS3 Guitar Hero guitar (incl. CRKD Les Paul in P3 mode) -- No Tilt
  - NOT SUPPORTED YET: dinput and mmjoystick guitars (such as Wii Rock Band and Raphnet adapter instruments).
  - NOT SUPPORTED YET: PS4 and Xbox One Rock Band Guitars.
  - NOT SUPPORTED YET: Riffmaster.
- Drums:
  - Xbox 360 Rock Band 2 and 3 Rock Band Drums.** \***
  - Wii Rock Band 2 and 3 Drums.** \***
  - PS3 Rock Band 2 and 3 Drums.** \***
  - Guitar Hero Drums are not supported.
- Regular Controllers: We skip supporting controllers since the singer player is controlled by the computer keyboard.
- Microphones: Supports any recording device connected to the computer, including Rock Band/Guitar Hero mics.
  - It's possible to filter out connected recording devices that you don't want to use. In the tray menu, uncheck unwanted devices.

\*\* SDL joystick mode needs to be selected for non-xinput devices to work.

\*\*\* Rock Band 2 and 3 drums are validated. Rock Band 1 Drums may work but they have not been tested.

### Cemu

- Regular Controllers: Supports Xinput devices.

SDL mode is not supported on Cemu yet, and may never be due to how the SDL device IDs in Cemu differ from the ones retrieved from node-sdl.

## How to get the app

Download from the [releases](https://github.com/jhonnymichel/autojoy/releases) page!

## Settings

#### joystickMode

what input API to use. possible values are `xinput` and `sdl`. xinput is straight forward although limited. SDL supports more controllers, but it's experimental and Cemu currently does not work with it. please open issues with you run in any problems.
