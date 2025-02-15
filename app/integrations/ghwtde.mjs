function convertSDLToGameGUID(sdlGuid) {
  return sdlGuid.substring(0, 2) + "000000" + sdlGuid.substring(8);
}

// PATH TO CONFIG:
// INPUTS
// <User Documents Path>\My Games\Guitar Hero World Tour Definitive Edition\GHWTDEInput.ini"
// Can only bind 3 controllers, keyboard is always controller 1. will be vocals if in launcher settings a mic is selected.
// Input settings are as follows:
// Preferences: { Device1: "deviceGUID", Device2: "", Device3: "" }, [deviceGUID]: {...settings}, [XINPUT_DEVICE_#]: {...settings} }
// In Preferences, maybe turn FillEmptySlots to 0 since we're taking over the settings, to increase compatibility.
// in SDL mode, use convertSDLToGameGUID for IDs.
// in Xinput mode, use the XINPUT_DEVICE_# starts with 0.
// MICROPHONE
// "<User Documents Path>\My Games\Guitar Hero World Tour Definitive Edition\GHWTDE.ini"
// {Audio: MicDevice: ""}
// The String is capped at 31 characters for some reason.
