<template>
  <div class="app" :class="{ active: ready }">
    <div v-if="!serviceStatus.installed">
      <div class="header">
        <h2>AutoJoy Backend Service</h2>
        <p>
          The AutoJoy backend service is responsible for listening to controller
          connections and applying the appropriate joystick mappings to the
          emulators and games.
        </p>
        <p>
          In Linux, we install it as a system service, this way the process
          survives on Gaming Mode (SteamOS, Bazzite).
        </p>
        <p>
          The service runs on user mode (no admin privileges) and must be
          installed for AutoJoy to work.
        </p>
        <p class="message">
          <span
            class="status-indicator-container"
            :class="{ loading: pending }"
          >
            <span
              aria-hidden="true"
              class="status-indicator"
              :class="{ active: serviceStatus.active }"
            />
          </span>
          {{ pending ? "Service is installing" : "Service is not installed" }}
        </p>
      </div>

      <div class="buttons-container">
        <ActionButton
          v-if="serviceStatus.result"
          :loading="pending"
          :disabled="pending"
          @click="openLogs"
        >
          Check Logs
        </ActionButton>
        <ActionButton
          :loading="pending"
          :disabled="pending"
          @click="installService"
        >
          Install Service
        </ActionButton>
      </div>
    </div>

    <div v-else>
      <div class="header">
        <h2>AutoJoy Backend Service</h2>
        <p>
          The AutoJoy backend service is responsible for listening to controller
          connections and applying the appropriate joystick mappings to the
          emulators and games.
        </p>
        <p>
          In Linux, we install it as a system service, this way the process
          survives on Gaming Mode (SteamOS, Bazzite).
        </p>
        <p>
          Uninstall the service if you want to stop using AutoJoy on your
          system.
        </p>
        <p class="message">
          <span
            class="status-indicator-container"
            :class="{ loading: pending }"
          >
            <span
              aria-hidden="true"
              class="status-indicator"
              :class="{ active: serviceStatus.active }"
            />
          </span>
          {{
            serviceStatus.active ? "Service is running" : "Service is stopped"
          }}
        </p>
      </div>
      <div class="buttons-container">
        <ActionButton :loading="pending" :disabled="pending" @click="openLogs">
          Check Logs
        </ActionButton>
        <ActionButton
          :disabled="pending"
          :loading="pending"
          :secondary="serviceStatus.active"
          @click="restartService"
        >
          {{ serviceStatus.active ? "Restart" : "Start" }} Service
        </ActionButton>
        <ActionButton
          v-if="serviceStatus.active"
          :disabled="pending"
          :loading="pending"
          :secondary="true"
          @click="stopService"
        >
          Stop Service
        </ActionButton>
        <ActionButton
          :loading="pending"
          :disabled="pending"
          :error="true"
          @click="uninstallService"
        >
          Uninstall Service
        </ActionButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import ActionButton from "./lib/ActionButton.vue";

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
  const status = await window.electron.getSystemServiceStatus();
  if (status.installed) {
    alert("Service installed successfully! You can proceed to the next step.");
  } else {
    alert(
      "Failed to install the AutoJoy backend service. We recommend trying again.\nPlease check the logs for more details.",
    );
  }
  Object.assign(serviceStatus, { ...status, result });
  pending.value = false;
}

async function uninstallService() {
  if (
    !window.confirm(
      "Are you sure you want to uninstall the AutoJoy backend service?",
    )
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

function openLogs() {
  window.electron.openServiceLogs();
}
</script>

<style>
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
  display: flex;
  justify-content: flex-start;
  gap: 10px;
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

.status-indicator-container {
  display: inline-flex;
  align-items: center;
}

.status-indicator-container.loading {
  width: 40px;
}

.status-indicator-container.loading .status-indicator {
  animation:
    loading 500ms steps(2) infinite alternate,
    pulse 200ms infinite alternate;
  background-color: #222;
}

@keyframes loading {
  0% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(20px);
  }
  100% {
    transform: translateX(40px);
  }
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
