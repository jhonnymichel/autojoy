import { onMounted, onUnmounted, computed, ref } from "vue";
import { useRouter } from "vue-router";

export function useStoreState() {
  const store = ref({});

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

export function useSetupProgress() {
  const router = useRouter();
  const platform = usePlatform();
  const storeState = useStoreState();
  const pathsComplete = computed(() => {
    return (
      storeState.value.paths &&
      Object.values(storeState.value.paths).some((p) => p && p.length > 0)
    );
  });

  const serviceComplete = computed(
    () => storeState.value.serverStatus !== "pending-install",
  );

  const allDone = computed(
    () =>
      pathsComplete.value &&
      (serviceComplete.value || platform.value !== "linux"),
  );

  async function finishSetup() {
    if (window.confirm("Are you sure you want to finish the setup?")) {
      await window.autojoy("dispatchAction", {
        action: "completeSetup",
        payload: undefined,
      });
      const state = await window.autojoy("getStoreState");
      if (state.setupComplete) {
        router.push("/");
      }
    }
  }

  function getNextSetupStep(fallback = "/finish-setup") {
    if (pathsComplete.value === false) {
      return "/paths";
    }

    console.log(serviceComplete.value, storeState.value.serverStatus);

    if (platform.value === "linux" && serviceComplete.value === false) {
      return "/service";
    }

    return fallback;
  }

  return {
    platform,
    pathsComplete,
    allDone,
    serviceComplete,
    getNextSetupStep,
    finishSetup,
  };
}
