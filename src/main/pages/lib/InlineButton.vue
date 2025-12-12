<template>
  <button
    class="button"
    :type="type"
    :class="{
      primary,
      red: error,
      loading,
    }"
    :disabled="disabled || loading"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup>
import { defineEmits } from "vue";
defineProps({
  type: { type: String, default: "button" },
  primary: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});
defineEmits(["click"]);
</script>

<style scoped>
.button {
  border-radius: 2px;
  padding: 5px;
  background: #ffffff;
  color: #222;
  border: none;
  font-size: 11px;
  text-transform: uppercase;
  transition: filter 150ms;
}
.button:hover {
  filter: brightness(0.95);
}
.button.primary {
  background: #04cc90;
  color: white;
}
.button.red {
  background: #cc0404;
  margin-left: auto;
}
.button.loading:disabled {
  background: #888;
  cursor: progress;
}
</style>
