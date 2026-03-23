你是一名资深前端图形工程师，请帮我构建一个基于 Vue 3 + Three.js 的中等复杂度 3D 可视化 Demo 项目。

【技术栈要求】
- Vue 3（Composition API）
- Vite 构建
- Three.js 最新稳定版本
- 使用 ES Modules
- 可选：使用 @vueuse/core 或简单状态管理
- 不使用过重框架（如不引入大型UI库）

【项目目标】
实现一个“交互式3D展示空间”，类似一个小型虚拟展厅，包含以下功能：

【核心功能】
1. 场景构建
   - 创建一个3D房间（墙壁、地面、灯光）
   - 使用 PBR 材质（MeshStandardMaterial）
   - 添加 HDR 或环境光增强真实感

2. 模型加载
   - 使用 GLTFLoader 加载至少一个 glb/gltf 模型
   - 模型支持缩放、旋转、位置调整

3. 相机控制
   - 使用 OrbitControls 实现拖拽旋转、缩放
   - 限制最大最小距离

4. 交互功能（重点）
   - 鼠标 hover 高亮模型
   - 点击模型弹出 Vue UI 信息面板
   - 使用 Raycaster 实现点击检测

5. 动画系统
   - 使用 requestAnimationFrame
   - 至少一个动画（例如模型旋转 / 灯光移动）

6. 响应式设计
   - 监听窗口 resize，自适应 canvas

【Vue 集成要求】
- 封装 Three.js 场景为一个 Vue 组件（如 <ThreeScene />）
- 使用 onMounted 初始化，onUnmounted 清理资源
- UI 面板使用 Vue 控制显示/隐藏
- 状态与 Three.js 解耦（例如 selectedObject）

【代码结构要求】
- /components/ThreeScene.vue
- /composables/useThreeScene.js（封装逻辑）
- /assets/models/
- 清晰模块划分（scene / camera / renderer / controls）

【进阶加分（可选）】
- 添加后期处理（EffectComposer，如 Bloom）
- 添加阴影（castShadow / receiveShadow）
- 添加简单 GUI（如 dat.GUI 或 lil-gui）
- 使用 InstancedMesh 提升性能

【输出要求】
- 给出完整代码结构
- 关键文件完整实现（不是伪代码）
- 每一步附带简要说明
- 保证可以直接运行（npm install + npm run dev）

【风格要求】
- 代码清晰、现代、工程化
- 注释简洁但关键点要解释