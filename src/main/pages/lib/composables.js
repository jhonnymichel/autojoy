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
