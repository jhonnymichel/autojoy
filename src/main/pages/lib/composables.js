import { onMounted, onUnmounted, ref } from "vue";

export function useStoreState() {
  const store = ref();

  const updateStore = (newState) => {
    store.value = newState;
  };

  onMounted(async () => {
    window.autojoy("subscribeToStore", updateStore);

    // fill in first state
    store.value = await window.autojoy("getStoreState");
  });

  onUnmounted(() => {
    window.autojoy("unsubscribeFromStore", updateStore);
  });

  return store;
}

export function useAppVersion() {
  const appVersion = ref("");
  onMounted(async () => {
    appVersion.value = await window.autojoy("getAppVersion");
  });

  return appVersion;
}

export function usePlatform() {
  const platform = ref("");
  onMounted(async () => {
    platform.value = await window.autojoy("getPlatform");
  });

  return platform;
}
