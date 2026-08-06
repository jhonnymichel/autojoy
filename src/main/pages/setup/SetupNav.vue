<template>
  <nav class="menubar">
    <h1>Setup Wizard</h1>
    <ul>
      <li>
        <RouterLink to="/start-setup" active-class="active">
          <span>Start</span>
        </RouterLink>
      </li>
      <li>
        <RouterLink to="/paths" active-class="active">
          <span>Paths</span>
        </RouterLink>
      </li>
      <li v-if="platform === 'linux'">
        <RouterLink to="/service" active-class="active">
          <span>Service</span>
        </RouterLink>
      </li>
      <li>
        <RouterLink to="/finish-setup" active-class="active">
          <span>Finish</span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<script setup>
import { onMounted, ref } from "vue";

const platform = ref("");

onMounted(async () => {
  platform.value = await window.autojoy("getPlatform");
});
</script>

<style scoped>
.menubar {
  margin: 0px;
  padding: 10px 20px;
  border-bottom: 1px solid #444;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  flex-shrink: 0;
}

.menubar h1 {
  margin: 0px;
  padding: 0px;
  font-size: 18px;
  flex: 1;
  text-transform: uppercase;
}

.menubar ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: row;
  text-align: right;
  gap: 10px;
  flex-shrink: 0;
}

.menubar a {
  text-decoration: none;
  color: #444;
  font-weight: 600;
  text-transform: uppercase;
  display: inline-block;
  width: 100%;
  cursor: default;
}

.menubar a:hover span {
  border-bottom: 2px solid #888;
}

.menubar a.active span {
  border-bottom: 2px solid darkgoldenrod;
}
</style>
