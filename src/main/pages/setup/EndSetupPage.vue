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
import ActionButton from "../lib/ActionButton.vue";
import { useSetupProgress } from "../lib/composables";

const { platform, pathsComplete, allDone, serviceComplete, finishSetup } =
  useSetupProgress();
</script>

<style scoped>
b {
  color: green;
}
.pending {
  color: rgb(122, 7, 7);
}
</style>
