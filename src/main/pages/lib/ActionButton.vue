<template>
  <button
    class="action-button"
    :class="{
      secondary,
      red: error,
      loading,
    }"
    :disabled="disabled || loading"
    :type="type"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";

defineProps({
  type: { type: String, default: "button" },
  secondary: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});
defineEmits(["click"]);
</script>

<style scoped>
.action-button {
  border-radius: 2px;
  padding: 10px;
  background: #04cc90;
  color: white;
  font-weight: 600;
  border: none;
  text-transform: uppercase;
  transition: filter 150ms;
}
.action-button:hover {
  filter: brightness(0.95);
}
.action-button.secondary {
  padding: 10px;
  background: #ffffff;
  color: #222;
  font-weight: 600;
  border: none;
  text-transform: uppercase;
}
.action-button.red {
  background: #cc0404;
  margin-left: auto;
}
.action-button.loading:disabled {
  background: #888;
  cursor: progress;
}
</style>
