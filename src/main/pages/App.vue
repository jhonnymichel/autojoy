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
import MainNav from "./lib/MainNav.vue";
import { ref, onMounted } from "vue";
import SetupNav from "./setup/SetupNav.vue";
import { useRouter } from "vue-router";

const isSetup = ref(false);
const ready = ref(false);

const toggleTutorial = async () => {
  const state = await window.electron.getStoreState();

  isSetup.value = !state.setupComplete;

  ready.value = true;
};

onMounted(toggleTutorial);
const router = useRouter();
router.afterEach(toggleTutorial);
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
  height: 100%;
  overflow: auto;
}
</style>
