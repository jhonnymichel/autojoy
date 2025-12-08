<template>
  <div class="page">
    <menu type="menubar" class="menubar">
      <ul>
        <li><a href="paths.html">Paths</a></li>
        <li><a href="service.html">Service</a></li>
      </ul>
    </menu>
    <div class="content">
      <h2>AutoJoy</h2>
      <p>Welcome. Use the menu to configure paths or manage the service.</p>
    </div>
  </div>
</template>

<script setup>
</script>

<style>
.page {
  background: #ddd;
  color: #444;
  height: 100vh;
  display: flex;
  flex-direction: row;
}
.menubar {
  margin: 0px;
  padding: 10px 20px;
  border-right: 1px solid #444;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.menubar ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  text-align: right;
  gap: 10px;
}
.menubar a {
  text-decoration: none;
  color: #444;
  font-weight: 600;
  text-transform: uppercase;
}
.content {
  flex: 1;
  padding: 20px;
}
</style>
