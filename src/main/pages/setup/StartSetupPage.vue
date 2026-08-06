<template>
  <h2>
    {{
      router.currentRoute.value.hash === "#updated"
        ? "Autojoy updated!"
        : "Welcome to Autojoy!"
    }}
  </h2>
  <p v-if="router.currentRoute.value.hash === '#updated'">
    You're opening a new version of Autojoy. Most settings are kept from
    previous version, others may need review.
  </p>
  <p v-else>
    Configure your settings using the menu above. Check the Finish step when
    you're done.
  </p>
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
  <div class="actions">
    <ActionButton @click="router.push(getNextSetupStep('/paths'))"
      >Start Setup</ActionButton
    >
    <ActionButton v-if="allDone" @click="finishSetup()"
      >All good. skip setup</ActionButton
    >
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import ActionButton from "../lib/ActionButton.vue";

import { useSetupProgress } from "../lib/composables";

const {
  platform,
  pathsComplete,
  allDone,
  serviceComplete,
  finishSetup,
  getNextSetupStep,
} = useSetupProgress();
const router = useRouter();
</script>

<style scoped>
.actions {
  display: flex;
  gap: 10px;
}
b {
  color: green;
}
.pending {
  color: rgb(122, 7, 7);
}
</style>
