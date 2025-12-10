<template>
  <h2>Help</h2>
  <h3>
    Joystick is detected by AutoJoy, settings were updated, but game is not
    responding to button presses?
  </h3>
  <p>
    Most emulators and games need to be restarted after joystick settings are
    updated.
  </p>
  <h3>Joystick is not detected by AutoJoy?</h3>
  <div class="actionable-text">
    <p>
      If you want AutoJoy to support the joystick you're using, please open a
      feature request on Github.
    </p>
    <div>
      <GithubButton @click="openFeatureRequestPage()"
        >Request a Feature</GithubButton
      >
    </div>
  </div>
  <h3>Want to report a bug?</h3>
  <div class="actionable-text">
    <p>
      Open a bug report on Github including steps to reproduce the issue and
      logs from the app
      {{ platform === "linux" ? "and the backend service" : "" }} (see below).
    </p>
    <div>
      <GithubButton @click="openBugReportPage()">Report a Bug</GithubButton>
    </div>
  </div>
  <h3>App Logs</h3>
  <div class="actionable-text">
    <p>
      The user folder contains a <b>logs.txt</b> file for troubleshooting and
      support. Please provide logs when reporting a bug.
    </p>
    <div>
      <ActionButton @click="openUserFolder()">Open User Folder</ActionButton>
    </div>
  </div>
  <div v-if="platform === 'linux'" class="actionable-text">
    <p>
      On Linux, the AutoJoy backend service runs separately from the app. The
      logs can be found on the Service Menu.
    </p>
    <div>
      <ActionButton @click="router.push('/service')"
        >Manage service</ActionButton
      >
    </div>
  </div>
  <h3>Change bindings</h3>
  <div class="actionable-text">
    <p>
      You can find the joystick bindings in the files inside the
      <b>config-templates</b> folder, located inside the user folder. Exit and
      reopen the app
      <span v-if="platform === 'linux'"> and the autojoy backend service</span>
      after editing the files.
    </p>
    <div>
      <ActionButton @click="openUserFolder()">Open User Folder</ActionButton>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from "vue";
import ActionButton from "./lib/ActionButton.vue";
import { useRouter } from "vue-router";
import GithubButton from "./lib/GithubButton.vue";
const platform = ref("");

onMounted(async () => {
  platform.value = await window.autojoy("getPlatform");
});

const router = useRouter();

function openUserFolder() {
  window.autojoy("openUserFolder");
}

function openFeatureRequestPage() {
  window.autojoy(
    "openExternalLink",
    "https://github.com/jhonnymichel/autojoy/issues/new#feature-request",
  );
}

function openBugReportPage() {
  window.autojoy(
    "openExternalLink",
    "https://github.com/jhonnymichel/autojoy/issues/new#bug-report",
  );
}
</script>
<style>
.actionable-text {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 10px;
  text-align: left;
}

.actionable-text p {
  margin-top: 0px;
  flex: 2;
}

.actionable-text div {
  flex: 1;
}
</style>
