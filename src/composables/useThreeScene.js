import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'

/**
 * Three.js 场景组合式函数
 * 封装所有 Three.js 相关逻辑，与 Vue 组件解耦
 */
export function useThreeScene(canvasRef, options = {}) {
  // 状态
  const isLoading = ref(true)
  const selectedObject = ref(null)
  const hoveredObject = ref(null)
  const animationSpeed = ref(0.005)

  // Three.js 核心对象
  let scene = null
  let camera = null
  let renderer = null
  let controls = null
  let raycaster = null
  let mouse = null
  let animationId = null
  let interactableObjects = []
  let originalMaterials = new Map()

  // 事件处理器引用（用于清理）
  let onMouseMoveHandler = null
  let onClickHandler = null
  let onResizeHandler = null

  /**
   * 初始化场景
   */
  const initScene = () => {
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)
    scene.fog = new THREE.Fog(0x1a1a2e, 10, 50)
  }

  /**
   * 初始化相机
   */
  const initCamera = () => {
    camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.set(8, 6, 8)
    camera.lookAt(0, 0, 0)
  }

  /**
   * 初始化渲染器
   */
  const initRenderer = () => {
    renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.value,
      antialias: true,
      alpha: true
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
  }

  /**
   * 初始化控制器
   */
  const initControls = () => {
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 3
    controls.maxDistance = 20
    controls.maxPolarAngle = Math.PI / 2 - 0.05 // 防止穿透地面
    controls.target.set(0, 1, 0)
  }

  /**
   * 初始化 Raycaster（用于鼠标交互）
   */
  const initRaycaster = () => {
    raycaster = new THREE.Raycaster()
    mouse = new THREE.Vector2()
  }

  /**
   * 创建房间环境
   */
  const createRoom = () => {
    // 地面
    const floorGeometry = new THREE.PlaneGeometry(20, 20)
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d2d44,
      roughness: 0.8,
      metalness: 0.2
    })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    floor.name = 'floor'
    scene.add(floor)

    // 后墙
    const backWallGeometry = new THREE.PlaneGeometry(20, 10)
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d3d5c,
      roughness: 0.9,
      metalness: 0.1
    })
    const backWall = new THREE.Mesh(backWallGeometry, wallMaterial)
    backWall.position.set(0, 5, -10)
    backWall.receiveShadow = true
    backWall.name = 'backWall'
    scene.add(backWall)

    // 左墙
    const leftWallGeometry = new THREE.PlaneGeometry(20, 10)
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial)
    leftWall.position.set(-10, 5, 0)
    leftWall.rotation.y = Math.PI / 2
    leftWall.receiveShadow = true
    leftWall.name = 'leftWall'
    scene.add(leftWall)

    // 网格辅助线
    const gridHelper = new THREE.GridHelper(20, 20, 0x555577, 0x333355)
    gridHelper.position.y = 0.01
    scene.add(gridHelper)
  }

  /**
   * 创建灯光系统
   */
  const createLights = () => {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5)
    scene.add(ambientLight)

    // 主光源（模拟太阳光）
    const mainLight = new THREE.DirectionalLight(0xffffff, 1)
    mainLight.position.set(5, 10, 5)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 2048
    mainLight.shadow.mapSize.height = 2048
    mainLight.shadow.camera.near = 0.5
    mainLight.shadow.camera.far = 50
    mainLight.shadow.camera.left = -10
    mainLight.shadow.camera.right = 10
    mainLight.shadow.camera.top = 10
    mainLight.shadow.camera.bottom = -10
    scene.add(mainLight)

    // 补光（蓝色调，营造氛围）
    const fillLight = new THREE.PointLight(0x6666ff, 0.5)
    fillLight.position.set(-5, 4, 5)
    scene.add(fillLight)

    // 轮廓光（暖色调）
    const rimLight = new THREE.SpotLight(0xffaa66, 0.8)
    rimLight.position.set(0, 8, -5)
    rimLight.lookAt(0, 0, 0)
    scene.add(rimLight)

    return { mainLight, fillLight, rimLight }
  }

  /**
   * 创建示例 3D 物体（当没有 GLB 模型时使用）
   */
  const createDemoObjects = () => {
    // 创建可交互的展示物体

    // 1. 中央展台上的几何体
    const pedestalGeometry = new THREE.CylinderGeometry(1.5, 1.8, 0.5, 32)
    const pedestalMaterial = new THREE.MeshStandardMaterial({
      color: 0x444466,
      roughness: 0.3,
      metalness: 0.7
    })
    const pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial)
    pedestal.position.set(0, 0.25, 0)
    pedestal.receiveShadow = true
    pedestal.castShadow = true
    pedestal.name = 'pedestal'
    pedestal.userData = {
      name: '中央展台',
      description: '展示用圆形展台，采用金属质感材质',
      type: '展台'
    }
    scene.add(pedestal)
    interactableObjects.push(pedestal)

    // 2. 旋转展示的几何体
    const geometries = [
      { geo: new THREE.IcosahedronGeometry(0.6, 0), color: 0xff6b6b, name: '二十面体', desc: '正二十面体，代表几何的完美对称' },
      { geo: new THREE.TorusKnotGeometry(0.4, 0.15, 100, 16), color: 0x4ecdc4, name: '环形结', desc: '复杂的拓扑结构，展现数学之美' },
      { geo: new THREE.OctahedronGeometry(0.6), color: 0xffe66d, name: '八面体', desc: '正八面体，钻石切割的基础形状' }
    ]

    geometries.forEach((item, index) => {
      const material = new THREE.MeshStandardMaterial({
        color: item.color,
        roughness: 0.2,
        metalness: 0.6,
        emissive: item.color,
        emissiveIntensity: 0.1
      })
      const mesh = new THREE.Mesh(item.geo, material)
      const angle = (index / geometries.length) * Math.PI * 2
      mesh.position.set(Math.cos(angle) * 3, 1.2, Math.sin(angle) * 3)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.name = `artifact_${index}`
      mesh.userData = {
        name: item.name,
        description: item.desc,
        type: '展品',
        originalY: 1.2,
        rotationSpeed: 0.01 + index * 0.005
      }
      scene.add(mesh)
      interactableObjects.push(mesh)

      // 保存原始材质
      originalMaterials.set(mesh.uuid, material.clone())
    })

    // 3. 装饰性球体
    const sphereGeo = new THREE.SphereGeometry(0.3, 32, 32)
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0xa8dadc,
      roughness: 0.1,
      metalness: 0.9
    })
    const sphere = new THREE.Mesh(sphereGeo, sphereMat)
    sphere.position.set(2, 0.5, -2)
    sphere.castShadow = true
    sphere.name = 'crystal_sphere'
    sphere.userData = {
      name: '水晶球',
      description: '高精度渲染的金属球体，展示 PBR 材质效果',
      type: '装饰品'
    }
    scene.add(sphere)
    interactableObjects.push(sphere)
    originalMaterials.set(sphere.uuid, sphereMat.clone())
  }

  /**
   * 加载 GLB/GLTF 模型
   */
  const loadModel = (url, position = { x: 0, y: 0, z: 0 }, scale = 1) => {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader()
      loader.load(
        url,
        (gltf) => {
          const model = gltf.scene
          model.position.set(position.x, position.y, position.z)
          model.scale.set(scale, scale, scale)

          // 启用阴影
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true
              child.receiveShadow = true
              if (child.material) {
                originalMaterials.set(child.uuid, child.material.clone())
              }
            }
          })

          scene.add(model)
          interactableObjects.push(model)
          resolve(model)
        },
        (progress) => {
          console.log('Loading progress:', (progress.loaded / progress.total) * 100, '%')
        },
        (error) => {
          console.error('Error loading model:', error)
          reject(error)
        }
      )
    })
  }

  /**
   * 高亮物体
   */
  const highlightObject = (object) => {
    if (!object || !object.isMesh) return

    object.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.emissive = new THREE.Color(0x444444)
        child.material.emissiveIntensity = 0.3
      }
    })
  }

  /**
   * 取消高亮
   */
  const unhighlightObject = (object) => {
    if (!object) return

    object.traverse((child) => {
      if (child.isMesh && child.material) {
        const original = originalMaterials.get(child.uuid)
        if (original) {
          child.material.emissive = original.emissive.clone()
          child.material.emissiveIntensity = original.emissiveIntensity
        } else {
          child.material.emissive = new THREE.Color(0x000000)
          child.material.emissiveIntensity = 0
        }
      }
    })
  }

  /**
   * 鼠标移动事件处理
   */
  const onMouseMove = (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(interactableObjects, true)

    if (intersects.length > 0) {
      const object = intersects[0].object
      const rootObject = findRootInteractable(object)

      if (hoveredObject.value !== rootObject) {
        if (hoveredObject.value) {
          unhighlightObject(hoveredObject.value)
        }
        hoveredObject.value = rootObject
        highlightObject(rootObject)
        document.body.style.cursor = 'pointer'
      }
    } else {
      if (hoveredObject.value) {
        unhighlightObject(hoveredObject.value)
        hoveredObject.value = null
        document.body.style.cursor = 'default'
      }
    }
  }

  /**
   * 查找根级可交互物体
   */
  const findRootInteractable = (object) => {
    let current = object
    while (current.parent && current.parent !== scene) {
      if (interactableObjects.includes(current.parent)) {
        return current.parent
      }
      current = current.parent
    }
    return current
  }

  /**
   * 点击事件处理
   */
  const onClick = (event) => {
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(interactableObjects, true)

    if (intersects.length > 0) {
      const object = intersects[0].object
      const rootObject = findRootInteractable(object)
      selectedObject.value = rootObject
    } else {
      selectedObject.value = null
    }
  }

  /**
   * 窗口大小调整处理
   */
  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }

  /**
   * 动画循环
   */
  const animate = () => {
    animationId = requestAnimationFrame(animate)

    // 旋转展品
    interactableObjects.forEach((obj) => {
      if (obj.userData.rotationSpeed) {
        obj.rotation.y += obj.userData.rotationSpeed * (animationSpeed.value / 0.005)
        obj.position.y = obj.userData.originalY + Math.sin(Date.now() * 0.001 + obj.id) * 0.1
      }
    })

    controls.update()
    renderer.render(scene, camera)
  }

  /**
   * 初始化整个场景
   */
  const init = async () => {
    if (!canvasRef.value) return

    initScene()
    initCamera()
    initRenderer()
    initControls()
    initRaycaster()
    createRoom()
    createLights()
    createDemoObjects()

    // 绑定事件
    onMouseMoveHandler = onMouseMove
    onClickHandler = onClick
    onResizeHandler = onResize

    window.addEventListener('mousemove', onMouseMoveHandler)
    window.addEventListener('click', onClickHandler)
    window.addEventListener('resize', onResizeHandler)

    // 开始动画循环
    animate()

    isLoading.value = false
  }

  /**
   * 清理资源
   */
  const dispose = () => {
    // 停止动画
    if (animationId) {
      cancelAnimationFrame(animationId)
    }

    // 移除事件监听
    if (onMouseMoveHandler) {
      window.removeEventListener('mousemove', onMouseMoveHandler)
    }
    if (onClickHandler) {
      window.removeEventListener('click', onClickHandler)
    }
    if (onResizeHandler) {
      window.removeEventListener('resize', onResizeHandler)
    }

    // 清理 Three.js 资源
    if (renderer) {
      renderer.dispose()
    }

    // 清理材质和几何体
    interactableObjects.forEach((obj) => {
      obj.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose()
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => mat.dispose())
            } else {
              child.material.dispose()
            }
          }
        }
      })
    })

    // 清理原始材质缓存
    originalMaterials.forEach((material) => {
      material.dispose()
    })
    originalMaterials.clear()
  }

  /**
   * 重置相机视角
   */
  const resetCamera = () => {
    if (camera && controls) {
      camera.position.set(8, 6, 8)
      camera.lookAt(0, 0, 0)
      controls.target.set(0, 1, 0)
      controls.update()
    }
  }

  // 生命周期钩子
  onMounted(init)
  onUnmounted(dispose)

  return {
    isLoading,
    selectedObject,
    hoveredObject,
    animationSpeed,
    resetCamera,
    loadModel
  }
}
