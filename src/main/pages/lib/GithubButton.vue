<template>
  <button
    class="github-button"
    :class="{
      secondary,
      red: error,
      loading,
    }"
    :disabled="disabled || loading"
    :type="type"
    @click="$emit('click')"
  >
    <span
      ><img src="../assets/github-icon.svg" alt="GitHub" width="24px" /></span
    ><span><slot /></span>
  </button>
</template>

<script setup>
import { defineEmits } from "vue";

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
.github-button {
  border-radius: 2px;
  padding: 6px 10px;
  background: white;
  color: black;
  font-weight: 600;
  border: none;
  text-transform: uppercase;
  transition: filter 150ms;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.github-button:hover {
  filter: brightness(0.95);
}

.github-button:disabled {
  background: #888;
  cursor: not-allowed;
}

span {
  display: inline-flex;
}
</style>
