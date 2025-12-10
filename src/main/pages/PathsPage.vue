<template>
  <div class="header">
    <h2>Set Your Paths</h2>
    <p>Provide the path to each software you want AutoJoy to integrate with.</p>
    <p>
      For software you don't have or don't want to integrate with, leave it
      blank.
    </p>
    <p>Click <b>Clear</b> to stop integrating with specific software.</p>
  </div>

  <form class="form" :class="{ active: ready }" @submit.prevent="saveConfig">
    <template v-for="field in fields" :key="field.key">
      <div class="field">
        <div class="label-wrapper">
          <label>{{ field.label }}</label>
          <span>
            <button
              type="button"
              class="tooltip"
              @click="showTooltip(field.key)"
            >
              ?
            </button>
          </span>
        </div>
        <div class="field-input">
          <span class="path-display">{{ paths[field.key] || "Not set" }}</span>
          <div class="buttons">
            <InlineButton type="button" @click="selectFolder(field.key)">
              Browse
            </InlineButton>
            <InlineButton type="button" @click="clearField(field.key)">
              Clear
            </InlineButton>
          </div>
        </div>
      </div>
    </template>
    <ActionButton type="submit">Save</ActionButton>
  </form>
</template>

<script setup>
import { ref, reactive, onMounted, toRaw } from "vue";
import ActionButton from "./app/ActionButton.vue";
import InlineButton from "./app/InlineButton.vue";

const ready = ref(false);

const fields = [
  { key: "rpcs3", label: "RPCS3" },
  { key: "dolphin", label: "Dolphin" },
  { key: "cemu", label: "Cemu" },
  { key: "ghwtde", label: "Guitar Hero World Tour: Definitive Edition" },
];

const paths = reactive({ rpcs3: "", dolphin: "", cemu: "", ghwtde: "" });
const tooltips = {
  rpcs3:
    "The RPCS3 installation folder. If using EmuDeck, it's by default inside %AppData%/emudeck/Emulators ",
  cemu: "The Cemu installation folder. If using EmuDeck, it's by default inside %AppData%/emudeck/Emulators ",
  dolphin:
    "If using EmuDeck, it's the installation folder by default inside %AppData%/emudeck/Emulators.\nIf using standalone Dolphin, it's the Dolphin Emulator folder inside your Documents.",
  ghwtde:
    "It's the game settings folder by default inside your Documents/My Games folder.",
};

onMounted(async () => {
  try {
    const state = await window.electron.getStoreState();
    Object.assign(paths, { ...(state?.paths ?? {}) });
  } catch (_) {
    // noop
  } finally {
    ready.value = true;
  }
});

async function selectFolder(key) {
  const folderPath = await window.electron.selectFolder();
  if (folderPath) paths[key] = folderPath;
}

function clearField(key) {
  paths[key] = "";
}

function showTooltip(key) {
  alert(tooltips[key]);
}

async function saveConfig() {
  try {
    const plain = toRaw(paths);
    const state = await window.electron.getStoreState();
    window.electron.dispatchAction("setPaths", { ...plain });
    alert(
      `Settings saved! ${
        state.setupComplete ? "" : "You can proceed to the next step."
      }`,
    );
  } catch (e) {
    console.error(e);
    alert(
      "Failed to save settings, please try again and report a bug if issue continues",
    );
  }
}
</script>

<style>
.form {
  visibility: hidden;
}

.form.active {
  visibility: visible;
}

.field {
  background: #bbb;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field label {
  font-weight: 600;
  text-transform: uppercase;
}

.field .field-input {
  width: 100%;
  display: flex;
  gap: 10px;
}

.buttons {
  flex-shrink: 0;
  display: flex;
  gap: 5px;
}

.field .path-display {
  width: 100%;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
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

.label-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.label-wrapper span {
  display: flex;
  align-items: center;
}

button[type="submit"] {
  margin-top: 10px;
}
</style>
