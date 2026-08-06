<template>
  <div class="connected-devices">
    <h3>Dolphin Wiimote Mode</h3>
    <div class="input-container">
      <input
        id="wiimote-mode-emulated"
        type="radio"
        value="emulated"
        :checked="props.mode === 'emulated'"
        @change="setMode('emulated')"
      />
      <label for="wiimote-mode-emulated">Emulated Controller</label>
    </div>
    <div class="input-container">
      <input
        id="wiimote-mode-real"
        type="radio"
        value="real"
        :checked="props.mode === 'real'"
        @change="setMode('real')"
      />
      <label for="wiimote-mode-real">Real Wiimote (Dolphin Bar)</label>
    </div>
  </div>
</template>
<script setup>
const props = defineProps({
  mode: {
    type: String,
    required: true,
  },
});

function setMode(mode) {
  window.autojoy("dispatchAction", {
    action: "setDolphinWiimoteMode",
    payload: mode,
  });
}
</script>
