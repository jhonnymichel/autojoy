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
  xinput: {
    label: "XInput",
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
  if (joystick.type.toLowerCase().includes("xinput")) {
    return badges.xinput;
  }

  if (joystick.name.toLowerCase().includes("xbox")) {
    return badges.xinput;
  }

  if (joystick.name.toLowerCase().includes("wii")) {
    return badges.wii;
  }

  if (
    joystick.name.toLowerCase().includes("playstation") ||
    joystick.name.toLowerCase().includes("ps ")
  ) {
    return badges.ps;
  }

  return null;
}

function getIcon(joystick) {
  switch (joystick.type) {
    case joystickTypes.crkdGuitarPCMode:
    case joystickTypes.ps3GuitarHeroGuitar:
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
  console.log(joystick);
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
}

img {
  max-width: 100%;
  height: auto;
}

.joystick-badge {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}
</style>
