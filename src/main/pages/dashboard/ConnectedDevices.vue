<template>
  <div class="connected-devices">
    <h2>Connected Joysticks</h2>
    <div v-if="props.joysticks.length === 0">
      <p>No joysticks connected.</p>
    </div>
    <div v-else class="joystick-list">
      <div
        v-for="(joystick, index) in props.joysticks"
        :key="index"
        :title="getName(joystick)"
        class="joystick-item"
      >
        <img :src="`../assets/${getIcon(joystick)}`" class="joystick-icon" />
        <div class="joystick-badge-container">
          <div class="joystick-badge" :title="getName(joystick)">
            {{ getName(joystick) }}
          </div>
        </div>
        <div class="joystick-badge-container badge-top">
          <div
            v-if="getBadge(joystick)"
            class="joystick-badge"
            :title="getBadge(joystick).title"
          >
            {{ getBadge(joystick).label }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { getHardwareInfo, joystickTypes } from "../../../common/joystick.mjs";

const props = defineProps({
  joysticks: {
    type: Array,
    required: true,
  },
});

const icons = {
  gamepad: "gamepad-icon.png",
  guitar: "guitar-icon.png",
  drums: "drums-icon.png",
};

const badges = {
  xbox: {
    label: "Xbox",
    title: "An xinput device. Made for Xbox and/or PC.",
  },
  pc: {
    label: "PC",
    title: "An xinput device. Made for Xbox and/or PC.",
  },
  ps: {
    label: "PS",
    title: "A PlayStation compatible device.",
  },
  wii: {
    label: "Wii",
    title: "A device made for the wii.",
  },
};

function getBadge(joystick) {
  const name = getName(joystick).toLowerCase();
  if (name.includes("xbox")) {
    return badges.xbox;
  }

  if (joystick.type.toLowerCase().includes("xinput")) {
    return badges.pc;
  }

  if (getName(joystick).toLowerCase().includes("wii")) {
    return badges.wii;
  }

  if (
    name.includes("playstation") ||
    name.includes("sony computer") ||
    name.includes("dualshock") ||
    name.includes("dualsense")
  ) {
    return badges.ps;
  }

  return null;
}

function getIcon(joystick) {
  switch (joystick.type) {
    case joystickTypes.crkdGuitarPCMode:
    case joystickTypes.ps3GuitarHeroGuitar:
    case joystickTypes.santrollerGuitar:
    case joystickTypes.xinputGuitar:
      return icons.guitar;
    case joystickTypes.wiiAndPs3RockBandDrumKit:
    case joystickTypes.xinputRockBandDrumKit:
      return icons.drums;
    default:
      return icons.gamepad;
  }
}

function getName(joystick) {
  const hardwareInfo = getHardwareInfo({
    manufacturerId: joystick.raw.vendor,
    productId: joystick.raw.product,
  });

  return hardwareInfo?.name || joystick.name;
}
</script>

<style scoped>
.joystick-list {
  display: flex;
  width: 100%;
  overflow: auto;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
}

.joystick-item {
  position: relative;
  width: calc(25% - 10px);
  max-width: 200px;
}

img {
  max-width: 100%;
  height: auto;
}

.joystick-badge-container {
  position: absolute;
  width: 100%;
  bottom: 8px;
  left: 0px;
  display: flex;
  justify-content: center;
}

.joystick-badge-container.badge-top {
  top: 8px;
  justify-content: flex-start;
  bottom: initial;
}

.joystick-badge {
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  max-width: 100%;
  box-sizing: border-box;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
