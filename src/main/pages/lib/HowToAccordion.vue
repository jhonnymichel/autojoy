<template>
  <transition name="accordion">
    <div v-show="open" class="instructions-panel">
      <video
        ref="videoEl"
        :src="src"
        autoplay
        loop
        muted
        playsinline
        preload="auto"
      ></video>
    </div>
  </transition>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";

const props = defineProps({
  src: { type: String, required: true },
  open: { type: Boolean, default: false },
});

const videoEl = ref(null);

onMounted(() => {
  if (props.open && videoEl.value) {
    videoEl.value.play().catch(() => {});
  }
});

watch(
  () => props.open,
  (isOpen) => {
    const el = videoEl.value;
    if (!el) return;
    if (isOpen) {
      el.play().catch(() => {
        // ignore play errors
      });
    } else {
      if (typeof el.pause === "function") {
        el.pause();
      }
      el.currentTime = 0;
    }
  },
);
</script>

<style scoped>
.instructions-panel {
  overflow: hidden;
  padding: 10px;
}

.instructions-panel video {
  width: 100%;
  display: block;
  border-radius: 8px;
}

.accordion-enter-active,
.accordion-leave-active {
  transition: max-height 0.25s ease;
}
.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
}
.accordion-enter-to,
.accordion-leave-from {
  max-height: 1000px; /* large enough for content */
  opacity: 1;
}
</style>
