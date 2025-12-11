<template>
  <h2>AutoJoy</h2>
  <p>Welcome. Use the menu to configure paths or manage the service.</p>

  {{ JSON.stringify(storeState, null, 2) }}
</template>

<script setup>
import { useStoreState } from "./lib/composables";

const storeState = useStoreState();
</script>
