<template>
  <div class="three-scene-container">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>正在加载 3D 场景...</p>
    </div>

    <!-- 3D Canvas -->
    <canvas ref="canvasRef" class="three-canvas"></canvas>

    <!-- 信息面板 -->
    <Transition name="slide">
      <div v-if="selectedObject" class="info-panel">
        <button class="close-btn" @click="closePanel">&times;</button>
        <h3>{{ selectedObject.userData.name || '未命名物体' }}</h3>
        <span class="type-badge">{{ selectedObject.userData.type || '未知' }}</span>
        <p>{{ selectedObject.userData.description || '暂无描述' }}</p>
        <div class="object-stats">
          <div class="stat">
            <span class="stat-label">位置</span>
            <span class="stat-value">
              {{ selectedObject.position.x.toFixed(2) }},
              {{ selectedObject.position.y.toFixed(2) }},
              {{ selectedObject.position.z.toFixed(2) }}
            </span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 悬浮提示 -->
    <div v-if="hoveredObject && !selectedObject" class="tooltip">
      {{ hoveredObject.userData.name || '点击查看详情' }}
    </div>

    <!-- 控制面板 -->
    <div class="controls-panel">
      <h4>场景控制</h4>
      <div class="control-item">
        <label>旋转速度</label>
        <input
          v-model.number="animationSpeed"
          type="range"
          min="0"
          max="0.02"
          step="0.001"
        />
        <span>{{ animationSpeed.toFixed(3) }}</span>
      </div>
      <div class="control-item">
        <button @click="resetCamera">重置视角</button>
      </div>
    </div>

    <!-- 操作提示 -->
    <div class="hints">
      <p>🖱️ 左键拖拽旋转 | 滚轮缩放 | 右键平移</p>
      <p>👆 点击物体查看详情</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useThreeScene } from '../composables/useThreeScene.js'

const canvasRef = ref(null)

const {
  isLoading,
  selectedObject,
  hoveredObject,
  animationSpeed,
  resetCamera
} = useThreeScene(canvasRef)

// 关闭信息面板
const closePanel = () => {
  selectedObject.value = null
}

// 监听 ESC 键关闭面板
const handleKeydown = (e) => {
  if (e.key === 'Escape') {
    closePanel()
  }
}

// 添加键盘监听
window.addEventListener('keydown', handleKeydown)
</script>

<style scoped>
.three-scene-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.three-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* 加载遮罩 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(26, 26, 46, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
  color: #fff;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #4ecdc4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 信息面板 */
.info-panel {
  position: absolute;
  top: 50%;
  right: 2rem;
  transform: translateY(-50%);
  width: 320px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  z-index: 50;
}

.info-panel h3 {
  margin: 0 0 0.5rem 0;
  color: #1a1a2e;
  font-size: 1.5rem;
}

.type-badge {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.info-panel p {
  color: #555;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.object-stats {
  border-top: 1px solid #eee;
  padding-top: 1rem;
}

.stat {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #888;
  font-size: 0.875rem;
}

.stat-value {
  color: #333;
  font-family: monospace;
  font-size: 0.875rem;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #888;
  cursor: pointer;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #333;
}

/* 悬浮提示 */
.tooltip {
  position: absolute;
  bottom: 120px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  pointer-events: none;
  z-index: 40;
}

/* 控制面板 */
.controls-panel {
  position: absolute;
  top: 2rem;
  left: 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 1.25rem;
  color: white;
  z-index: 40;
  min-width: 200px;
}

.controls-panel h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
}

.control-item {
  margin-bottom: 1rem;
}

.control-item:last-child {
  margin-bottom: 0;
}

.control-item label {
  display: block;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  color: rgba(255, 255, 255, 0.8);
}

.control-item input[type='range'] {
  width: 100%;
  margin-bottom: 0.25rem;
}

.control-item span {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

.control-item button {
  width: 100%;
  padding: 0.5rem 1rem;
  background: rgba(78, 205, 196, 0.8);
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}

.control-item button:hover {
  background: rgba(78, 205, 196, 1);
}

/* 操作提示 */
.hints {
  position: absolute;
  bottom: 2rem;
  left: 2rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  z-index: 40;
}

.hints p {
  margin: 0.25rem 0;
}

/* 过渡动画 */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateY(-50%) translateX(20px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateY(-50%) translateX(20px);
}

/* 响应式 */
@media (max-width: 768px) {
  .info-panel {
    right: 1rem;
    left: 1rem;
    width: auto;
    top: auto;
    bottom: 1rem;
    transform: none;
  }

  .controls-panel {
    top: 1rem;
    left: 1rem;
    right: 1rem;
  }

  .slide-enter-from,
  .slide-leave-to {
    transform: translateY(20px);
  }
}
</style>
