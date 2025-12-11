# autojoy

Detects connected joystick and accessories and can automatically update emulators, games and other apps settings based on them.
When joysticks are different from eachother (a guitar and a drum joystick, for example) and connection order matters, this becomes useful.

## Use Case

If you play a game that uses a different type of joystick in an emulator (like rock band), you would:

- have to update the input settings every time you want to play a game that uses a regular joystick (unless you want to play Heavy Rain with a guitar)

Or when you play the same game with a variable number of players or wants to switch joystick types:

- Player 1 is a Guitar Controller, Player 2 is Drums. Next time you play, you want to play Drums but Player 1 is set as a Guitar. You'd have to reassign joysticks in the settings or keep both instruments turned on even when you're playing alone.

In some emulatoers, when you attach an USB peripheral such as a Microphone, you have to change settings again to pick that device up.

## Supported Operational Systems

Currently only supports Windows.

## Supported Emulators Games and Peripherals

| **Peripheral**                      | **RPCS3**       | **Dolphin**      | **GHWT:DE**      | **Cemu**         |
| ----------------------------------- | --------------- | ---------------- | ---------------- | ---------------- |
| **Guitars**                         |                 |                  |                  |                  |
| CRKD Les Paul (PC Mode)             | ✅              | ✅               | ✅               | ❌               |
| Xbox 360 RB & GH Guitars            | ✅              | ✅               | ✅               | ❌               |
| Santroller Guitars                  | ✅              | ✅               | ✅               | ❌               |
| PS3 GH Guitars                      | ✅ (No Tilt)    | ✅ (No Tilt)     | ✅ (No Tilt)     | ❌               |
| **Drums**                           |                 |                  |                  |                  |
| Xbox 360/Wii/PS3 Rock Band Drums \* | ✅              | ✅               | ✅               | ❌               |
| **Regular Gamepads**\*\*            | ✅ (Xinput/DS5) | ✅ (Xinput/DS5)  | ❌ Not Supported | ✅ (Xinput only) |
| **Microphones**\*\*\*               | ✅              | ❌ Not Supported | ✅               | ❌ Not Supported |

---

\* Rock Band 2 and 3 drums are validated. Rock Band 1 Drums may work but they have not been tested.  
\*\* Supports Xinput gamepads and the PS5 DualSense.  
\*\*\* Supports any recording device connected to the computer, including Rock Band/Guitar Hero mics.  
  - It's possible to filter out connected recording devices that you don't want to use. In the tray menu, uncheck unwanted devices.

## Caveats

### Dolphin

- To play Drums on Guitar Hero with rock band drums, the Green Cymbal add-on is needed.
- Pro Drums can't be played in Rock Band 3.
  - If you have a Drum Kit from Rock Band for the Wii, you can use Dolphin's USB passthrough to play Pro Drums.
- Guitar Hero Drums are not supported, but Wii drums can work with real wiimotes and that'd be the preferred way to use Guitar Hero Drums.
  - Xbox 360/PS3 Guitar Hero Drums may arrive in the future.
  - Real Wiimote auto config is planned as well.

### Guitar Hero World Tour Definitive Edition

- It's recommended to disconnect non-instrument joysticks for full band gameplay. Player 1 in this game is always the singer controlled with the computer keyboard when a microphone is setup.
- Regular joysticks: We skip supporting them since the singer player is controlled by the computer keyboard.

### Cemu

Only supports regular gamepads, no instruments. only supports Xinput devices.
Why: SDL device IDs in Cemu differ from the ones retrieved from node-sdl, making it hard to support non-xinput devices.

## How to get the app

Download from the [releases](https://github.com/jhonnymichel/autojoy/releases) page!
