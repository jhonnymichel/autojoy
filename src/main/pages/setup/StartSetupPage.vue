<template>
  <h2>Welcome</h2>
  <p>
    Configure your settings using the menu above. Check the Finish step when
    you're done.
  </p>
  <ActionButton @click="router.push('/paths')">Get Started</ActionButton>
</template>

<script setup>
import { useRouter } from "vue-router";
import ActionButton from "../lib/ActionButton.vue";
const router = useRouter();
</script>
