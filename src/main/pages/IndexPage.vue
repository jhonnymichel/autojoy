<template>
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
      v-else-if="storeState.serverStatus !== 'running'"
      level="warning"
    >
      <template #title>Joystick backend service is not running </template>
      <template #content>
        <p>
          AutoJoy won't work without the joystick backend service. Go to the
          Service menu to start the it.
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

  <ConnectedDevices
    :joysticks="[
      ...(storeState.joystickList ?? []),
      ...(storeState.joystickList ?? []),
    ]"
  />
</template>

<script setup>
import { useRouter } from "vue-router";
import ActionButton from "./lib/ActionButton.vue";
import { usePlatform, useStoreState } from "./lib/composables";
import MessageBanner from "./lib/MessageBanner.vue";
import ConnectedDevices from "./dashboard/ConnectedDevices.vue";

const storeState = useStoreState();
const platform = usePlatform();
const router = useRouter();
</script>

<style scoped></style>
