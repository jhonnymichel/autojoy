<template>
  <div class="banner" :class="level">
    <div class="banner-header">
      <img :src="icons[level]" width="24" :alt="level" />
      <h3><slot name="title"></slot></h3>
    </div>
    <div class="banner-content">
      <slot name="content"></slot>
    </div>
    <div class="banner-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
// import infoIcon from "../assets/info-icon.png";
import warningIcon from "../assets/warning-icon.png";
import dangerIcon from "../assets/danger-icon.png";
// import successIcon from "../assets/success-icon.png";

defineProps({
  level: {
    default: "info",
    type: String,
    validator: (value) =>
      ["info", "warning", "danger", "success"].includes(value),
  },
});

const icons = {
  info: null,
  warning: warningIcon,
  danger: dangerIcon,
  success: null,
};
</script>

<style scoped>
.banner {
  border: solid 1px rgb(37, 37, 37);
  background-color: #ccc;
  border-radius: 5px;
  padding: 10px;
  margin: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.banner h3 {
  margin: 0px;
}

.banner-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.banner :deep(p) {
  margin: 0;
}

.banner.danger {
  border-color: #eb181c;
}

.banner.warning {
  border-color: #b87d11;
}

.banner.info {
  border-color: #1e9be8;
}

.banner-content {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 10px;
}
</style>
