<template>
  <nav class="menubar">
    <ul>
      <li>
        <RouterLink to="/" active-class="active">
          <span>Dashboard</span>
        </RouterLink>
      </li>
      <li>
        <RouterLink to="/paths" active-class="active">
          <span>Paths</span>
        </RouterLink>
      </li>
      <li>
        <RouterLink to="/service" active-class="active">
          <span>Service</span>
        </RouterLink>
      </li>
      <li>
        <RouterLink to="/about" active-class="active">
          <span>About</span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
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
  display: inline-block;
  width: 100%;
  cursor: default;
}

.menubar a:hover span {
  border-bottom: 2px solid #888;
}

.menubar a.active span {
  border-bottom: 2px solid darkgoldenrod;
}
</style>
