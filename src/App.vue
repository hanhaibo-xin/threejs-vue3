<template>
  <div class="app">
    <header class="app-header">
      <h1 class="app-title">🎨 交互式3D展示空间</h1>
      <p class="app-subtitle">Virtual Exhibition Hall</p>
    </header>
    <main class="app-main">
      <ThreeScene />
    </main>
    <footer class="app-footer">
      <p>Built with Vue 3 + Three.js</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import ThreeScene from './components/ThreeScene.vue'
</script>

<style>
.app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1a1a2e;
}

.app-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 20px;
  background: linear-gradient(to bottom, rgba(26, 26, 46, 0.9), transparent);
}

.app-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: white;
  letter-spacing: 2px;
}

.app-subtitle {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 1px;
}

.app-main {
  flex: 1;
  position: relative;
}

.app-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 15px;
  text-align: center;
  background: linear-gradient(to top, rgba(26, 26, 46, 0.9), transparent);
}

.app-footer p {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}
</style>
