import { createRequire } from "module";
const require = createRequire(import.meta.url);
const sdl3Native = require("../../../build/Release/sdl3.node");

export class SDL3Controller {
  constructor() {
    this.native = sdl3Native;
  }

  getJoysticks() {
    return this.native.getJoysticks();
  }
}
