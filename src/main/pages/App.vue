<template>
  <div v-if="ready" class="page" :class="{ setup: isSetup }">
    <SetupNav v-if="isSetup" />
    <MainNav v-else />
    <main>
      <div class="content">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<script setup>
import MainNav from "./app/MainNav.vue";
import { ref, onMounted } from "vue";
import SetupNav from "./setup/SetupNav.vue";

const isSetup = ref(false);
const ready = ref(false);

const toggleTutorial = async () => {
  const state = await window.electron.getStoreState();

  if (!state.setupComplete) {
    isSetup.value = true;
  }

  ready.value = true;
};

onMounted(toggleTutorial);
</script>

<style>
.page {
  background: #ddd;
  color: #444;
  height: 100vh;
  display: flex;
  flex-direction: row;
}

.page.setup {
  flex-direction: column;
}

.page.setup main {
  flex: 1;
  overflow: auto;
}

.content {
  flex: 1;
  padding: 20px;
}

main {
  width: 100%;
}
</style>
