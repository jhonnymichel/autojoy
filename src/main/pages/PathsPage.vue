<template>
  <div class="header">
    <h2>Set Your Paths</h2>
    <p>Provide the path to each software you want AutoJoy to integrate with.</p>
    <p>
      For software you don't have or don't want to integrate with, leave it
      blank.
    </p>
    <p>Click <b>Clear</b> to stop integrating with specific software.</p>

    <ActionableText>
      <template #text>
        Autojoy can try to detect the paths for the empty entries.
        automatically, and you can manually point to the ones it can't
        find.</template
      >
      <template #action>
        <ActionButton @click="autoDetectPaths()"
          >Auto Fill Empty Paths</ActionButton
        ></template
      >
    </ActionableText>
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
import ActionButton from "./lib/ActionButton.vue";
import InlineButton from "./lib/InlineButton.vue";
import { useRouter } from "vue-router";
import { usePlatform, useSetupProgress } from "./lib/composables";
import ActionableText from "./lib/ActionableText.vue";

const ready = ref(false);

const router = useRouter();
const setupProgress = useSetupProgress();
const platform = usePlatform();

const fields = [
  { key: "rpcs3", label: "RPCS3" },
  { key: "dolphin", label: "Dolphin" },
  { key: "cemu", label: "Cemu" },
  { key: "ghwtde", label: "Guitar Hero World Tour: Definitive Edition" },
];

const paths = reactive({ rpcs3: "", dolphin: "", cemu: "", ghwtde: "" });
const tooltips = {
  win32: {
    rpcs3:
      "The RPCS3 installation folder.\nIf using EmuDeck, it's by default inside %AppData%/emudeck/Emulators.",
    cemu: "The Cemu installation folder.\nIf using EmuDeck, it's by default inside %AppData%/emudeck/Emulators ",
    dolphin:
      "If using EmuDeck, it's the installation folder by default inside %AppData%/emudeck/Emulators.\nIf using standalone Dolphin, it's the Dolphin Emulator folder inside your Documents.",
    ghwtde:
      "It's the game settings folder by default inside your Documents/My Games folder.",
  },
  linux: {
    rpcs3: "The RPCS3 config folder. Usually ~/.config/rpcs3/",
    cemu: "The Cemu config folder. Usually ~/.config/cemu/",
    dolphin:
      "The Dolphin install folder. When using the flatpack image, it's usually ~/.var/app/org.DolphinEmu.dolphin-emu/",
    ghwtde:
      "It's the game settings folder by default inside your Documents/My Games directory.",
  },
};

onMounted(async () => {
  try {
    const state = await window.autojoy("getStoreState");
    Object.assign(paths, { ...(state?.paths ?? {}) });
  } catch (e) {
    console.error(e);
  } finally {
    ready.value = true;
  }
});

async function selectFolder(key) {
  const folderPath = await window.autojoy("openFolderDialog");
  if (folderPath) paths[key] = folderPath;
}

function clearField(key) {
  paths[key] = "";
}

function showTooltip(key) {
  alert(tooltips[platform.value][key]);
}

async function autoDetectPaths() {
  const autoDetectionResults = await window.autojoy(
    "autoDetectPaths",
    toRaw(paths),
  );

  if (autoDetectionResults.success) {
    alert("Paths were found! Review them below and click Save when ready.");
  } else {
    alert("Auto-detection did not find any paths. Please set them manually.");
  }
  Object.assign(paths, autoDetectionResults.paths);
}

async function saveConfig() {
  try {
    const plain = toRaw(paths);
    const state = await window.autojoy("getStoreState");
    console.log("Saving paths:", plain);
    await window.autojoy("dispatchAction", {
      action: "setPaths",
      payload: { ...plain },
    });
    alert(
      `Settings saved! ${
        state.setupComplete ? "" : "You can proceed to the next step."
      }`,
    );

    if (!state.setupComplete) {
      router.push(setupProgress.getNextSetupStep());
    }
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
