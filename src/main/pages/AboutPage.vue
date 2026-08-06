<template>
  <div class="about-page">
    <h2>About AutoJoy</h2>
    <p>App version: {{ appVersion }}</p>
    <p>
      AutoJoy is an open-source application that helps you manage and configure
      joystick mappings for various emulators and games on your system.
    </p>
    <p>
      It is meant to simplify the process of setting up controllers in
      emulators.
    </p>
    <p>
      Initially created for Rock Band and Guitar Hero games and its various
      instruments controllers from different consoles that can all work on PC
      but setting up is quite a chore, and settings need to be constantly
      changed if you use different instruments.
    </p>
    <p>
      AutoJoy is developed and maintained by Jhonny Michel Costa.
      <a
        href="https://github.com/jhonnymichel/autojoy"
        target="_blank"
        rel="noopener noreferrer"
        >GitHub repository</a
      >.
    </p>
    <p>
      <a
        target="_blank"
        href="https://www.flaticon.com/free-icons/joystick"
        title="joystick icons"
        >Joystick icons created by Freepik - Flaticon</a
      >
    </p>
  </div>
</template>
<script setup>
import { useAppVersion } from "./lib/composables";

const appVersion = useAppVersion();
</script>
