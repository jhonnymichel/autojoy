<template>
  <MessageBanner
    v-if="storeState.steamInputNoticeDismissed === false"
    level="warning"
  >
    <template #title>Disable Steam Input</template>
    <template #content>
      <p>
        If you open games through Steam, make sure to disable Steam Input for
        games you want autojoy to work with.
      </p>
      <ActionButton @click="toggleInstructions()">
        {{ showInstructions ? "Hide Instructions" : "Show Me How" }}
      </ActionButton>
      <ActionButton secondary @click="dismissSteamInputNotice()">
        Got it
      </ActionButton>
    </template>
    <template #footer>
      <HowToAccordion :src="disableSteamVideo" :open="showInstructions" />
    </template>
  </MessageBanner>
  <template v-if="platform === 'linux'">
    <MessageBanner
      v-if="storeState.serverStatus === 'pending-install'"
      level="danger"
    >
      <template #title>Joystick backend service installation pending </template>
      <template #content>
        <p>
          AutoJoy won't work without the joystick backend service. Go to the
          Service menu to complete the installation.
        </p>
        <ActionButton @click="router.push('/service')">
          Manage Service
        </ActionButton>
      </template>
    </MessageBanner>
    <MessageBanner
      v-else-if="
        storeState.serverStatus !== 'running' &&
        storeState.serverStatus !== 'restarting'
      "
      level="warning"
    >
      <template #title>Joystick backend service is not running </template>
      <template #content>
        <p>
          AutoJoy won't work without the joystick backend service. Go to the
          Service menu to start it.
        </p>
        <ActionButton @click="router.push('/service')">
          Manage Service
        </ActionButton>
      </template>
    </MessageBanner>
  </template>
  <template v-else>
    <MessageBanner v-if="storeState.serverStatus === 'crashed'" level="danger">
      <template #title>Joystick backend crashed </template>
      <template #content>
        <p>
          The joystick backend is a subprocess that AutoJoy depends on to work.
          Restart autojoy (exit from the tray). if the message persists, report
          a bug from the Help menu.
        </p>
        <ActionButton @click="router.push('/help')">Open Help </ActionButton>
      </template>
    </MessageBanner>
  </template>
  <MessageBanner v-if="allPathsEmpty" level="warning">
    <template #title>Paths not set</template>
    <template #content>
      <p>
        No path to emulator or game is provided. Go to the paths menu to choose
        what software you want Autojoy to integrate with.
      </p>
      <ActionButton @click="router.push('/paths')"> Set Paths </ActionButton>
    </template>
  </MessageBanner>

  <ConnectedJoysticks :joysticks="storeState.joystickList ?? []" />
  <ConnectedMicrophones
    :microphones="storeState.microphoneList ?? []"
    :unused-microphones="storeState.unusedMicrophones ?? []"
    :manage-microphones="storeState.manageMicrophones ?? false"
  />
  <h3>Sync Input Settings</h3>

  <ActionableText>
    <template #text
      >Emulators and games settings are synced automatically. If needed, you can
      manually sync them here.</template
    >
    <template #action>
      <ActionButton @click="syncSettings()">Sync Manually</ActionButton>
    </template>
  </ActionableText>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import ActionButton from "./lib/ActionButton.vue";
import { usePlatform, useStoreState } from "./lib/composables";
import MessageBanner from "./lib/MessageBanner.vue";
import ConnectedJoysticks from "./dashboard/ConnectedJoysticks.vue";
import ConnectedMicrophones from "./dashboard/ConnectedMicrophones.vue";
import ActionableText from "./lib/ActionableText.vue";
import HowToAccordion from "./lib/HowToAccordion.vue";
import disableSteamVideo from "./assets/disable-steam-input-instructions.mp4";

const storeState = useStoreState();
const platform = usePlatform();
const router = useRouter();
const showInstructions = ref(false);
const allPathsEmpty = computed(() => {
  if (!storeState.value.paths) {
    return false;
  }

  return Object.values(storeState.value.paths).every(
    (p) => !p || p.length === 0,
  );
});

async function syncSettings() {
  await window.autojoy("dispatchAction", {
    action: "manualSync",
  });

  alert("Settings synced successfully.");
}

function toggleInstructions() {
  showInstructions.value = !showInstructions.value;
}

function dismissSteamInputNotice() {
  window.autojoy("dispatchAction", {
    action: "dismissSteamInputNotice",
  });
}
</script>

<style scoped>
/* Accordion styles handled by HowToAccordion component */
</style>
