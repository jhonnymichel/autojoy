<template>
  <div class="connected-devices">
    <h3>Connected Microphones</h3>
    <div v-if="props.manageMicrophones">
      <div v-if="props.microphones.length === 0">
        <p>No microphones connected.</p>
      </div>
    </div>
    <div class="input-container">
      <input
        id="manage-microphones"
        type="checkbox"
        :checked="props.manageMicrophones"
        @click="toggleMicrophoneManagement()"
      />
      <label for="manage-microphones">Use Microphones</label>
    </div>
    <div>
      <ul>
        <li v-for="(mic, index) in props.microphones" :key="index">
          <input
            :id="`manage-microphones-${mic.name}-${index}`"
            type="checkbox"
            :checked="checkMicrophoneInUse(mic, index)"
            @click="toggleMicrophoneInUse(mic, index)"
          />
          <label :for="`manage-microphones-${mic.name}-${index}`">{{
            mic.name
          }}</label>
        </li>
      </ul>
    </div>
  </div>
</template>
<script setup>
import { toRaw } from "vue";
import { isMicrophoneInUse } from "../../../common/device-filters.mjs";

const props = defineProps({
  microphones: {
    type: Array,
    required: true,
  },
  unusedMicrophones: {
    type: Array,
    required: true,
  },
  manageMicrophones: {
    type: Boolean,
    required: true,
  },
});

function toggleMicrophoneManagement() {
  window.autojoy("dispatchAction", {
    action: "toggleMicrophoneManagement",
  });
}

function toggleMicrophoneInUse(mic, position) {
  window.autojoy("dispatchAction", {
    action: "toggleMicrophoneUse",
    payload: { device: toRaw(mic), position },
  });
}

function checkMicrophoneInUse(mic, position) {
  return isMicrophoneInUse(
    toRaw(mic),
    position,
    toRaw(props.microphones),
    toRaw(props.unusedMicrophones),
  );
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
