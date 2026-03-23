# 3D 模型资源目录

此目录用于存放 GLB/GLTF 格式的 3D 模型文件。

## 使用说明

1. 将你的 `.glb` 或 `.gltf` 文件放入此目录
2. 在组件中使用 `loadModel()` 方法加载：

```javascript
const { loadModel } = useThreeScene(canvasRef)

// 在 onMounted 中加载
onMounted(async () => {
  await loadModel('/src/assets/models/your-model.glb', 
    { x: 0, y: 0, z: 0 }, // 位置
    1 // 缩放比例
  )
})
```

## 推荐模型资源网站

- [Sketchfab](https://sketchfab.com) - 大量免费/付费模型
- [Poly Haven](https://polyhaven.com) - 免费 CC0 资源
- [Google Poly (Archive)](https://poly.pizza) - 归档的 Poly 模型

## 当前项目

本项目默认使用程序化生成的几何体作为展示，无需外部模型文件即可运行。
