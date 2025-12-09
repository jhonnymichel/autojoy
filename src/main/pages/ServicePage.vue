<template>
  <div class="app" :class="{ active: ready }">
    <div v-if="!serviceStatus.installed">
      <div class="header">
        <h2>Install AutoJoy Backend Service</h2>
        <p>
          We need to install the autojoy backend service to watch for when
          controllers are connected and disconnected, and update settings based
          on them.
        </p>
        <p v-if="serviceStatus.result" class="message">
          Service is not installed.
        </p>
      </div>
      <div class="buttons-container">
        <button
          class="action-button"
          :class="{ loading: pending }"
          :disabled="pending"
          type="button"
          @click="installService"
        >
          Install Service
        </button>
      </div>
    </div>

    <div v-else>
      <div class="header">
        <h2>AutoJoy Backend Service</h2>
        <p>Here you can check the service status and uninstall it.</p>
        <p class="message">
          <span
            aria-hidden="true"
            class="status-indicator"
            :class="{ active: serviceStatus.active }"
          />
          {{
            serviceStatus.active ? "Service is running" : "Service is stopped"
          }}
        </p>
      </div>
      <div class="buttons-container">
        <button
          class="action-button"
          :disabled="pending"
          :class="{ loading: pending, secondary: serviceStatus.active }"
          type="button"
          @click="restartService"
        >
          {{ serviceStatus.active ? "Restart" : "Start" }} Service
        </button>
        <button
          v-if="serviceStatus.active"
          class="action-button secondary"
          :disabled="pending"
          :class="{ loading: pending }"
          type="button"
          @click="stopService"
        >
          Stop Service
        </button>
        <button
          class="action-button red"
          :class="{ loading: pending }"
          :disabled="pending"
          type="button"
          @click="uninstallService"
        >
          Uninstall Service
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";

const pending = ref(false);
const ready = ref(false);
const serviceStatus = reactive({
  installed: false,
  active: false,
  supported: false,
  details: null,
});

onMounted(async () => {
  try {
    const status = await window.electron.getSystemServiceStatus();
    Object.assign(serviceStatus, status);
  } finally {
    ready.value = true;
  }
});

async function installService() {
  pending.value = true;
  const result = await window.electron.installAutojoyService();
  await new Promise((r) => setTimeout(r, 1000));
  const status = await window.electron.getSystemServiceStatus();
  Object.assign(serviceStatus, { ...status, result });
  pending.value = false;
}

async function uninstallService() {
  if (
    !window.confirm("Are you sure you want to uninstall the AutoJoy service?")
  ) {
    return;
  }
  pending.value = true;
  await window.electron.uninstallAutojoyService();
  const status = await window.electron.getSystemServiceStatus();
  Object.assign(serviceStatus, status);
  pending.value = false;
}

async function restartService() {
  pending.value = true;
  const result = await window.electron.restartAutojoyService();
  const status = await window.electron.getSystemServiceStatus();
  Object.assign(serviceStatus, { ...status, result });
  pending.value = false;
}

async function stopService() {
  pending.value = true;
  const result = await window.electron.stopAutojoyService();
  const status = await window.electron.getSystemServiceStatus();
  Object.assign(serviceStatus, { ...status, result });
  pending.value = false;
}
</script>

<style>
.header {
  padding: 10px;
  padding-bottom: 10px;
}

.header h2 {
  margin-bottom: 0px;
  font-size: 40px;
  font-weight: 600;
  color: #555;
  margin-top: 0px;
  text-transform: uppercase;
}

.tooltip {
  font-size: 12px;
  line-height: 0;
  margin: 0;
  aspect-ratio: 1/1;
  padding: 4px;
  border-radius: 50%;
  font-weight: 600;
  background: darkgoldenrod;
  border-style: solid;
  border: 2;
}

.tooltip:hover {
  background: rgb(255, 255, 255);
}

.buttons-container {
  padding: 10px;
  display: flex;
  justify-content: flex-start;
  gap: 10px;
}

.action-button {
  border-radius: 2px;
  padding: 10px;
  background: #04cc90;
  color: white;
  font-weight: 600;
  border: none;
  text-transform: uppercase;
  transition: filter 150ms;
}

.action-button:hover {
  filter: brightness(0.95);
}

.action-button.secondary {
  padding: 10px;
  background: #ffffff;
  color: #222;
  font-weight: 600;
  border: none;
  text-transform: uppercase;
}

.action-button.red {
  background: #cc0404;
  margin-left: auto;
}

.action-button.loading:disabled {
  background: #888;
  cursor: progress;
}

.status-indicator {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 5px;
  background: red;
  animation: pulse 4000ms infinite alternate;
}

@keyframes pulse {
  from {
    opacity: 1;
  }
  to {
    opacity: 0.5;
  }
}

.status-indicator.active {
  background: green;
  animation: pulse 2000ms infinite alternate;
}

.message {
  font-weight: 600;
  font-size: 24px;
  padding: 10px;
  align-items: center;
  gap: 10px;
  justify-content: center;
  display: flex;
}
</style>
