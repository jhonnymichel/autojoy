<template>
  <h2>Finish setup</h2>
  <p>All set? Review your settings and click Finish to complete the setup</p>
  <ul>
    <li>
      Paths are
      <b :class="{ pending: !pathsComplete }">{{
        pathsComplete ? "configured!" : "not configured."
      }}</b>
    </li>
    <li v-if="platform === 'linux'">
      Backend service is
      <b :class="{ pending: !serviceComplete }">{{
        serviceComplete ? "configured!" : "not configured."
      }}</b>
    </li>
  </ul>
  <ActionButton
    :disabled="!allDone"
    :title="allDone ? 'Finish setup' : 'Complete all steps to finish setup'"
    @click="finishSetup()"
  >
    Finish Setup
  </ActionButton>
</template>

<script setup>
import { onMounted, ref, computed } from "vue";
import ActionButton from "../lib/ActionButton.vue";
import { useRouter } from "vue-router";

const router = useRouter();
const pathsComplete = ref(false);
const serviceComplete = ref(false);
const ready = ref(false);
const allDone = computed(
  () =>
    ready.value &&
    pathsComplete.value &&
    (serviceComplete.value || platform.value !== "linux"),
);

const platform = ref("");

onMounted(async () => {
  platform.value = await window.electron.getPlatform();
});

onMounted(async () => {
  const storeState = await window.electron.getStoreState();

  pathsComplete.value =
    storeState.paths &&
    Object.values(storeState.paths).some((p) => p && p.length > 0);

  serviceComplete.value = storeState.serverStatus !== "pending-install";

  ready.value = true;
});

async function finishSetup() {
  if (window.confirm("Are you sure you want to finish the setup?")) {
    window.electron.dispatchAction("completeSetup");
    const state = await window.electron.getStoreState();
    if (state.setupComplete) {
      router.push("/");
    }
  }
}
</script>

<style scoped>
b {
  color: green;
}
.pending {
  color: rgb(122, 7, 7);
}
</style>
