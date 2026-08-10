# Integrations

An **integration** teaches AutoJoy how to translate the list of currently
connected joysticks (and, optionally, microphones) into the config file
format a specific emulator or game expects, and write it to disk so that app
picks up the right devices the next time it starts.

Every integration lives in [`src/autojoy-backend/integrations/`](.) as a
single `.mjs` file (e.g. [`dolphin.mjs`](dolphin.mjs), [`cemu.mjs`](cemu.mjs),
[`rpcs3.mjs`](rpcs3.mjs), [`ghwtde.mjs`](ghwtde.mjs)), plus a couple of
files shared with the rest of the app:

- `config-templates/win32/<name>.<ext>` and `config-templates/linux/<name>.<ext>`
  — one config "skeleton" per joystick type, checked into the repo.
- `user/paths.template.json` — the default (empty) path entry for the app.
- [`shared.mjs`](shared.mjs) — helpers reused by more than one integration
  (device name fixes, xinput fallback ordering, etc).

## Data flow

```
sdl.joystick events
        │
        ▼
joystick-listener.mjs  ──creates──▶  joystick.mjs#createJoystick()
        │                                  │
        │                     { name, type, raw, hidInfo? }
        ▼
subscribers (one per active integration)
        │
        ▼
integration.handleJoystickListUpdate(joystickList)
        │
        ├─ normalize device names/order to match what the target app expects
        ├─ pick a config template per player slot, keyed by joystick.type
        ├─ fill in the device name/identifier
        └─ write the file(s) back with savers.<format>()
```

[`index.mjs`](../index.mjs) is the wiring point: on startup, for every
integration it checks whether the user configured a path for it
(`user.paths.<name>`), and if so, dynamically imports the integration module
and subscribes its `handleJoystickListUpdate` (and `handleMicrophoneListUpdate`,
if the integration supports microphones) to the listeners:

```js
if (user.paths.dolphin) {
  const dolphin = (await import("./integrations/dolphin.mjs")).default;
  joystickListener.onListChange(dolphin.handleJoystickListUpdate);
}
```

This means an integration that has no path configured is never imported —
integrations must be side-effect-free at import time beyond resolving their
own template/config paths.

`handleJoystickListUpdate` fires on every joystick connect/disconnect, and
once unconditionally on startup (even with an empty list) — so an integration
must always fully re-derive its config from the current `joystickList` and
`user.settings`, not patch a previous state.

## The building blocks integrations are made of

- **`joystick.type`** — one of the values in `joystickTypes`
  ([`common/joystick.mjs`](../../common/joystick.mjs)): `GAMEPAD`,
  `XINPUT_GUITAR`, `XINPUT_SANTROLLER_GUITAR`, `PS3_GUITARHERO_GUITAR`,
  `CRKD_GUITAR_PC_MODE`, `XINPUT_ROCKBAND_DRUM_KIT`,
  `WII_PS3_ROCKBAND_DRUM_KIT`. This is the key every config template is
  looked up by.
- **`joystick.raw`** — the raw SDL (or xinput-shaped) device, with
  `vendor`/`product`/`guid` used for identity matching (e.g.
  `hardwareInfo` lookups in `common/joystick.mjs`).
- **`loaders`/`savers`** ([`common/file.mjs`](../../common/file.mjs)) — read
  and write `.ini`, `.xml`, `.yml` and `.json` files, resolved relative to
  the user's AutoJoy data folder. Config templates are loaded once at module
  scope; actual target files are loaded/saved per update.
- **`user.paths.<name>`** and **`user.settings`**
  ([`common/settings.mjs`](../../common/settings.mjs)) — the install path the
  user configured for the integration, and any integration-specific user
  preference (e.g. `dolphinWiimoteMode`).
- **`config-templates/<win32|linux>/<name>.<ext>`** — one file per
  integration, containing one section/key per `joystickTypes` value (plus a
  fallback such as `GAMEPAD` or `Empty`) with the button mapping already
  filled in. These are copied into the user's data folder on first run (see
  `migrateUserFile` in `common/settings.mjs`) and loaded from there — so an
  integration should never read `config-templates/` directly, only through
  `loaders.*` against the user-folder path baked in by `resolvePathFromUserFolder`.

## The pattern

Every integration follows the same shape:

1. **Resolve paths at module scope.** Load the config templates for the
   current platform, and resolve the target install/config path from
   `user.paths.<name>`, handling any install-flavor quirks (portable vs.
   Flatpak vs. installer, or a `config/` subfolder that may or may not
   exist) — see `resolveDolphinPath()` in `dolphin.mjs` or
   `resolveConfigPath()` in `rpcs3.mjs`.

2. **Export a default object** with a `handleJoystickListUpdate(joystickList)`
   method (required), and a `handleMicrophoneListUpdate(microphoneList)`
   method if the app supports picking a microphone
   (`rpcs3.mjs`, `ghwtde.mjs`).

3. **Inside `handleJoystickListUpdate`, normalize the device list first.**
   The name/identifier a joystick is known by rarely matches 1:1 across
   apps:
   - SDL names often need a per-app counter suffix/prefix so duplicate
     controller models resolve unambiguously (`SDL/0/Xbox Series X Controller`
     in Dolphin, `Xbox Series X Controller 1` in RPCS3, `n_<guid>` in Cemu).
   - On Windows, SDL3 silently routes some pads through xinput and renames
     them; several integrations fall back to enumerating `xinput-ffi`
     directly and re-matching by vendor/product/type
     (`addXinputNameToDevices` — duplicated in `dolphin.mjs` and `rpcs3.mjs`;
     consider extracting to `shared.mjs` if you need it again).
   - Hardware-specific name fixes (PS5 pad, Wii/PS3 licensed peripherals,
     Linux evdev names for devices that don't work over SDL) live in
     `shared.mjs` (`getFixedOldDeviceSDLName`, `getEvdevName`) — reuse these
     instead of re-deriving them.

4. **Iterate fixed player slots**, not the raw joystick list order. Every
   app has its own set of identifiers for "player N" (`GCPad1..4`,
   `Wiimote1..4`, `Player 1 Input`.. `Player 7 Input`, `controller0.xml`..,
   `XINPUT_DEVICE_0..3`). Map `joystickList[position]` onto each identifier:
   - Pick the template with `configTemplates[joystick.type] ?? configTemplates.<FALLBACK>`
     and **`structuredClone`** it before mutating — the loaded template
     object is shared across every call and every slot.
   - Set the device name/identifier field(s) on the clone.
   - For an empty slot (no controller connected), either write the
     `Empty`/disabled template, or delete the file entirely — match the
     target app's own convention for "no controller here" instead of
     leaving stale config behind (`cemu.mjs` deletes `controllerN.xml`;
     `rpcs3.mjs` writes `configTemplates.Empty`).

5. **Save and log.** Write with `savers.<format>()` and `console.log` a
   one-line `"<NAME> - <what> saved at <path>"` message — every existing
   integration does this, and it's the main debugging aid when a user
   reports a config not being picked up.

6. **Microphones (optional).** If the app supports selecting an input
   device, add `handleMicrophoneListUpdate(microphoneList)` following the
   same load → mutate a clone → save shape. `index.mjs` only wires this up
   when `user.settings.manageMicrophones === true`, and passes the list
   through `getMicrophonesInUse()` (respects the user's per-device
   unused-microphone opt-outs) before calling your handler.

## Recipe: adding a new integration

1. **Add the path setting.**
   - Add a `"<name>": ""` key to [`user/paths.template.json`](../../../user/paths.template.json).
   - Add a field entry (`{ key: "<name>", label: "..." }`) and a tooltip
     string (win32 + linux) to `fields`/`tooltips` in
     [`src/main/pages/PathsPage.vue`](../../main/pages/PathsPage.vue) so the
     user can browse to/clear the path from the UI.
   - Optionally add auto-detection candidate paths per platform in
     `autoDetectPaths` in [`src/main/window.mjs`](../../main/window.mjs).

2. **Add config template(s).**
   Create `config-templates/win32/<name>.<ext>` and
   `config-templates/linux/<name>.<ext>` (ini/xml/yml — pick whatever format
   the target app itself uses) with one top-level section per
   `joystickTypes` value you intend to support, plus a fallback
   (`GAMEPAD`/`Empty`). Register both in `migrateUserFile(...)` calls inside
   `migrateUserSettings()` in [`common/settings.mjs`](../../common/settings.mjs)
   so they get copied into the user's data folder on first run/update.

3. **Write `src/autojoy-backend/integrations/<name>.mjs`** following the
   pattern above:

   ```js
   import path from "path";
   import { loaders, savers } from "../../common/file.mjs";
   import { user } from "../../common/settings.mjs";

   const configTemplates = loaders.<format>("config-templates/<name>.<ext>");
   const targetPath = user.paths.<name>;
   const playerIdentifiers = [/* whatever the app calls its player slots */];

   function handleJoystickListUpdate(joystickList) {
     const newConfig = {};

     playerIdentifiers.forEach((identifier, position) => {
       const joystick = joystickList[position];

       if (!joystick) {
         newConfig[identifier] = configTemplates.Empty; // or delete the file
         return;
       }

       newConfig[identifier] = structuredClone(
         configTemplates[joystick.type] ?? configTemplates.GAMEPAD,
       );
       newConfig[identifier].Device = joystick.name; // field name varies per app
     });

     savers.<format>(newConfig, path.resolve(targetPath, "<config file>"));
     console.log("<NAME> - Input settings saved at", targetPath);
   }

   const <name> = { handleJoystickListUpdate };
   export default <name>;
   ```

4. **Register it in [`index.mjs`](../index.mjs)**, gated on the configured
   path, same as the other four:

   ```js
   if (user.paths.<name>) {
     const <name> = (await import("./integrations/<name>.mjs")).default;
     joystickListener.onListChange(<name>.handleJoystickListUpdate);
   }
   ```

5. **Optional: per-integration user settings.** If the app needs a user
   choice beyond "which devices are plugged in" (see `dolphinWiimoteMode`),
   add a default to `user/settings.template.json`, a `store.actions.<name>`
   entry in [`src/main/store.mjs`](../../main/store.mjs) that writes
   `user.settings` and returns the new state slice, and a settings component
   under `src/main/pages/dashboard/` wired up conditionally on
   `storeState.paths?.<name>` in
   [`src/main/pages/IndexPage.vue`](../../main/pages/IndexPage.vue) (see
   `DolphinSettings.vue` for the shape).

6. **Update the compatibility table** in the root [`README.md`](../../../README.md)
   and, if the app has quirks worth calling out, a short "Caveats" entry.

## Gotchas learned from existing integrations

- **Never mutate a loaded template in place** — it's shared across every
  slot/call. Always `structuredClone()` before setting fields.
- **The SDL device-count suffix/prefix format is app-specific** — don't
  assume the convention from one integration (e.g. Dolphin's
  `SDL/<n>/<name>`) applies to another (RPCS3's `<name> <n>`, Cemu's
  `<n>_<guid>`).
- **On Windows, SDL3 may report a pad through xinput naming instead of its
  real name.** If your target app cares about the exact device string,
  check whether you need the same xinput fallback/remap `dolphin.mjs` and
  `rpcs3.mjs` use before assuming SDL names are reliable.
- **`handleJoystickListUpdate` must be idempotent and stateless across
  calls** — it can run with an empty list on startup and must fully
  regenerate config every time, not diff against a previous run.
- **Prefer the app's own "no device" representation** for empty slots
  (delete the file / write its `Empty` template / disable the slot in a main
  config) over leaving a previous device's config in place.
