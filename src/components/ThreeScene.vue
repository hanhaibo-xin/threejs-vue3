<template>
  <div class="scene-container">
    <canvas 
      ref="canvasRef" 
      class="three-canvas"
      @click="onCanvasClick"
      @mousemove="onCanvasMouseMove"
    ></canvas>
    
    <!-- 信息面板 -->
    <Transition name="panel">
      <div v-if="selectedObject" class="info-panel">
        <button class="close-btn" @click="selectedObject = null">×</button>
        <h3 class="panel-title">{{ selectedObject.info.title }}</h3>
        <span class="panel-category">{{ selectedObject.info.category }}</span>
        <p class="panel-description">{{ selectedObject.info.description }}</p>
        <div class="panel-actions">
          <button class="action-btn" @click="focusObject(selectedObject)">
            聚焦模型
          </button>
        </div>
      </div>
    </Transition>

    <!-- 操作提示 -->
    <div class="hint-panel">
      <p>🖱️ 拖拽旋转 | 滚轮缩放 | 点击模型查看详情</p>
    </div>

    <!-- 模型列表 -->
    <div class="model-list">
      <h4>展品列表</h4>
      <div 
        v-for="obj in objects" 
        :key="obj.id"
        class="model-item"
        :class="{ active: selectedObject?.id === obj.id }"
        @click="selectObject(obj)"
      >
        {{ obj.name }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useThreeScene, ObjectInfo } from '../composables/useThreeScene'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const { 
  init, 
  handleMouseMove, 
  handleClick, 
  handleResize, 
  hoveredObject,
  selectedObject,
  objects 
} = useThreeScene()

onMounted(async () => {
  if (canvasRef.value) {
    await init(canvasRef.value)
    window.addEventListener('resize', handleResize)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const onCanvasMouseMove = (event: MouseEvent) => {
  handleMouseMove(event)
}

const onCanvasClick = (event: MouseEvent) => {
  handleClick(event)
}

const selectObject = (obj: ObjectInfo) => {
  selectedObject.value = obj
}

const focusObject = (obj: ObjectInfo) => {
  // 这里可以添加相机聚焦逻辑
  console.log('Focusing on:', obj.name)
}
</script>

<style scoped>
.scene-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.three-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* 信息面板样式 */
.info-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 320px;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 12px;
  padding: 24px;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 100;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 24px;
  cursor: pointer;
  transition: color 0.3s;
}

.close-btn:hover {
  color: white;
}

.panel-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #4a90e2;
}

.panel-category {
  display: inline-block;
  background: rgba(74, 144, 226, 0.2);
  color: #4a90e2;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  margin-bottom: 16px;
}

.panel-description {
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 20px;
}

.panel-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  padding: 10px 20px;
  background: linear-gradient(135deg, #4a90e2, #357abd);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
}

/* 过渡动画 */
.panel-enter-active,
.panel-leave-active {
  transition: all 0.3s ease;
}

.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* 操作提示 */
.hint-panel {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(26, 26, 46, 0.8);
  backdrop-filter: blur(10px);
  padding: 12px 24px;
  border-radius: 24px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  z-index: 100;
}

.hint-panel p {
  margin: 0;
}

/* 模型列表 */
.model-list {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(26, 26, 46, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(74, 144, 226, 0.2);
  border-radius: 12px;
  padding: 16px;
  min-width: 180px;
  z-index: 100;
}

.model-list h4 {
  color: white;
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
}

.model-item {
  padding: 10px 12px;
  margin-bottom: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.model-item:hover {
  background: rgba(74, 144, 226, 0.2);
  color: white;
}

.model-item.active {
  background: rgba(74, 144, 226, 0.3);
  color: #4a90e2;
  border-left: 3px solid #4a90e2;
}
</style>
