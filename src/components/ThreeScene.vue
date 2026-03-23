<template>
  <div class="three-scene-container">
    <div ref="containerRef" class="scene-canvas"></div>
    
    <Transition name="panel">
      <div v-if="selectedObject" class="info-panel">
        <div class="panel-header">
          <h3>{{ selectedObject.userData.title || '选中对象' }}</h3>
          <button class="close-btn" @click="closePanel">&times;</button>
        </div>
        <div class="panel-content">
          <p class="description">
            {{ selectedObject.userData.description || '这是一个3D对象' }}
          </p>
          <div v-if="selectedObject.userData.type" class="info-item">
            <span class="label">类型:</span>
            <span class="value">{{ selectedObject.userData.type }}</span>
          </div>
          <div class="info-item">
            <span class="label">位置:</span>
            <span class="value">
              X: {{ selectedObject.position.x.toFixed(2) }},
              Y: {{ selectedObject.position.y.toFixed(2) }},
              Z: {{ selectedObject.position.z.toFixed(2) }}
            </span>
          </div>
          <div v-if="selectedObject.userData.rotationSpeed" class="info-item">
            <span class="label">旋转速度:</span>
            <span class="value">{{ selectedObject.userData.rotationSpeed.toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </Transition>
    
    <div class="controls-hint">
      <div class="hint-item">
        <span class="icon">🖱️</span>
        <span>拖拽旋转视角</span>
      </div>
      <div class="hint-item">
        <span class="icon">🔍</span>
        <span>滚轮缩放</span>
      </div>
      <div class="hint-item">
        <span class="icon">👆</span>
        <span>点击查看详情</span>
      </div>
    </div>
    
    <div v-if="!isInitialized" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>正在初始化3D场景...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useThreeScene } from '../composables/useThreeScene'

const containerRef = ref(null)
const {
  isInitialized,
  selectedObject,
  init
} = useThreeScene(containerRef)

function closePanel() {
  selectedObject.value = null
}

onMounted(() => {
  init()
})
</script>

<style scoped>
.three-scene-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #0a0a14;
}

.scene-canvas {
  width: 100%;
  height: 100%;
}

.info-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 320px;
  background: rgba(22, 33, 62, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(78, 205, 196, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  color: #e0e0e0;
  overflow: hidden;
}

.panel-enter-active,
.panel-leave-active {
  transition: all 0.3s ease;
}

.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(78, 205, 196, 0.1);
  border-bottom: 1px solid rgba(78, 205, 196, 0.2);
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #4ecdc4;
}

.close-btn {
  background: none;
  border: none;
  color: #e0e0e0;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
}

.panel-content {
  padding: 20px;
}

.description {
  margin: 0 0 16px 0;
  font-size: 14px;
  line-height: 1.6;
  color: #b0b0c0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 13px;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  color: #8888a0;
  font-weight: 500;
}

.info-item .value {
  color: #4ecdc4;
  font-family: 'Courier New', monospace;
}

.controls-hint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 24px;
  background: rgba(22, 33, 62, 0.9);
  backdrop-filter: blur(10px);
  padding: 12px 24px;
  border-radius: 50px;
  border: 1px solid rgba(78, 205, 196, 0.2);
}

.hint-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #b0b0c0;
}

.hint-item .icon {
  font-size: 18px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(10, 10, 20, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(78, 205, 196, 0.2);
  border-top-color: #4ecdc4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-overlay p {
  color: #4ecdc4;
  font-size: 16px;
  margin: 0;
}
</style>
