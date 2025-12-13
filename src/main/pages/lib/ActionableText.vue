<template>
  <div class="actionable-text" :class="{ cols: useCols }">
    <p>
      <slot name="text"></slot>
    </p>
    <div>
      <slot name="action"></slot>
    </div>
  </div>
</template>
<script setup>
defineProps({
  useCols: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped>
.actionable-text {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 10px;
  text-align: left;
}

.actionable-text div {
  flex: none;
  flex-shrink: 0;
}

.actionable-text p {
  margin-top: 0px;
  flex: 2;
}

.actionable-text.cols div {
  flex: 1;
}
</style>
