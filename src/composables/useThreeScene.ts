import { ref, onUnmounted, markRaw } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export interface ObjectInfo {
  id: string
  name: string
  info: {
    title: string
    description: string
    category: string
  }
}

// 存储所有 Three.js 对象，避免被 Vue 响应式代理
const meshRegistry = new Map<string, THREE.Mesh | THREE.Group>()

export function useThreeScene() {
  // Three.js 核心对象 (非响应式)
  let scene: THREE.Scene | null = null
  let camera: THREE.PerspectiveCamera | null = null
  let renderer: THREE.WebGLRenderer | null = null
  let controls: OrbitControls | null = null
  let animationId = 0
  let canvasElement: HTMLCanvasElement | null = null

  // 工具对象
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()
  const clock = new THREE.Clock()

  // Vue 响应式状态 (仅用于UI)
  const objects = ref<ObjectInfo[]>([])
  const hoveredObject = ref<ObjectInfo | null>(null)
  const selectedObject = ref<ObjectInfo | null>(null)

  const init = async (canvas: HTMLCanvasElement) => {
    if (!canvas) return
    
    canvasElement = canvas
    meshRegistry.clear()
    objects.value = []

    // 1. 创建场景
    scene = markRaw(new THREE.Scene())
    scene.background = new THREE.Color(0x1a1a2e)
    scene.fog = new THREE.Fog(0x1a1a2e, 10, 50)

    // 2. 创建相机
    camera = markRaw(new THREE.PerspectiveCamera(
      60,
      canvasElement.clientWidth / canvasElement.clientHeight,
      0.1,
      1000
    ))
    camera.position.set(0, 3, 8)

    // 3. 创建渲染器
    renderer = markRaw(new THREE.WebGLRenderer({
      canvas: canvasElement,
      antialias: true,
      alpha: true
    }))
    renderer.setSize(canvasElement.clientWidth, canvasElement.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2

    // 4. 添加控制器
    controls = markRaw(new OrbitControls(camera, renderer.domElement))
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 3
    controls.maxDistance = 20
    controls.maxPolarAngle = Math.PI / 2.1
    controls.target.set(0, 1, 0)

    // 5. 添加光源
    addLights()

    // 6. 创建房间
    createRoom()

    // 7. 添加展示模型
    addExhibitModels()

    // 8. 开始动画循环
    animate()
  }

  const addLights = () => {
    if (!scene) return

    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    // 主光源（模拟太阳光）
    const mainLight = new THREE.DirectionalLight(0xffffff, 1)
    mainLight.position.set(5, 10, 5)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 2048
    mainLight.shadow.mapSize.height = 2048
    mainLight.shadow.camera.near = 0.5
    mainLight.shadow.camera.far = 50
    mainLight.shadow.camera.left = -15
    mainLight.shadow.camera.right = 15
    mainLight.shadow.camera.top = 15
    mainLight.shadow.camera.bottom = -15
    scene.add(mainLight)

    // 填充光
    const fillLight = new THREE.DirectionalLight(0x4a90e2, 0.5)
    fillLight.position.set(-5, 5, -5)
    scene.add(fillLight)

    // 点光源装饰
    const pointLight1 = new THREE.PointLight(0xff6b6b, 1, 15)
    pointLight1.position.set(-4, 3, 0)
    scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0x4ecdc4, 1, 15)
    pointLight2.position.set(4, 3, 0)
    scene.add(pointLight2)
  }

  const createRoom = () => {
    if (!scene) return

    const roomSize = 12
    const wallHeight = 6
    const floorY = 0

    // 地面
    const floorGeometry = new THREE.PlaneGeometry(roomSize, roomSize)
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d3436,
      roughness: 0.8,
      metalness: 0.2
    })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = floorY
    floor.receiveShadow = true
    scene.add(floor)

    // 墙壁材质
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x636e72,
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.DoubleSide
    })

    // 后墙
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(roomSize, wallHeight),
      wallMaterial
    )
    backWall.position.set(0, wallHeight / 2, -roomSize / 2)
    backWall.receiveShadow = true
    scene.add(backWall)

    // 左墙
    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(roomSize, wallHeight),
      wallMaterial
    )
    leftWall.rotation.y = Math.PI / 2
    leftWall.position.set(-roomSize / 2, wallHeight / 2, 0)
    leftWall.receiveShadow = true
    scene.add(leftWall)

    // 右墙
    const rightWall = new THREE.Mesh(
      new THREE.PlaneGeometry(roomSize, wallHeight),
      wallMaterial
    )
    rightWall.rotation.y = -Math.PI / 2
    rightWall.position.set(roomSize / 2, wallHeight / 2, 0)
    rightWall.receiveShadow = true
    scene.add(rightWall)

    // 添加装饰线条
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x4a90e2 })
    const points = [
      new THREE.Vector3(-roomSize/2, 0.02, -roomSize/2),
      new THREE.Vector3(roomSize/2, 0.02, -roomSize/2),
      new THREE.Vector3(roomSize/2, 0.02, roomSize/2),
      new THREE.Vector3(-roomSize/2, 0.02, roomSize/2),
      new THREE.Vector3(-roomSize/2, 0.02, -roomSize/2)
    ]
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
    const line = new THREE.Line(lineGeometry, lineMaterial)
    scene.add(line)
  }

  const registerMesh = (id: string, name: string, mesh: THREE.Mesh | THREE.Group, info: ObjectInfo['info']) => {
    meshRegistry.set(id, mesh)
    objects.value.push({
      id,
      name,
      info
    })
  }

  const addExhibitModels = () => {
    if (!scene) return

    // 模型1: 科技立方体
    const cubeGroup = new THREE.Group()
    const cubeGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5)
    const cubeMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a90e2,
      metalness: 0.8,
      roughness: 0.2
    })
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial)
    cube.castShadow = true
    cube.receiveShadow = true
    cubeGroup.add(cube)

    // 添加边框
    const edges = new THREE.EdgesGeometry(cubeGeometry)
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff })
    const wireframe = new THREE.LineSegments(edges, lineMaterial)
    cubeGroup.add(wireframe)

    cubeGroup.position.set(-3, 1, -3)
    scene.add(cubeGroup)
    registerMesh('tech-cube', '科技立方体', cubeGroup, {
      title: '科技立方体',
      description: '这是一个展示 PBR 材质效果的立方体模型，具有金属质感和高光反射。',
      category: '几何展示'
    })

    // 模型2: 宝石多面体
    const gemGeometry = new THREE.IcosahedronGeometry(0.8, 1)
    const gemMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6b6b,
      metalness: 0.9,
      roughness: 0.1,
      envMapIntensity: 1.5
    })
    const gem = new THREE.Mesh(gemGeometry, gemMaterial)
    gem.position.set(0, 1.2, -3)
    gem.castShadow = true
    gem.receiveShadow = true
    scene.add(gem)
    registerMesh('gem', '宝石多面体', gem, {
      title: '宝石多面体',
      description: '二十面体几何体，展示反射和折射效果，模拟宝石的光泽质感。',
      category: '宝石展示'
    })

    // 模型3: 螺旋塔
    const towerGroup = new THREE.Group()
    for (let i = 0; i < 5; i++) {
      const radius = 1 - i * 0.15
      const height = 0.3
      const cylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius * 0.9, height, 32),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color().setHSL(0.3 + i * 0.1, 0.7, 0.5),
          metalness: 0.6,
          roughness: 0.3
        })
      )
      cylinder.position.y = i * height + height / 2
      cylinder.castShadow = true
      cylinder.receiveShadow = true
      towerGroup.add(cylinder)
    }
    towerGroup.position.set(3, 0.15, -3)
    scene.add(towerGroup)
    registerMesh('spiral-tower', '螺旋塔', towerGroup, {
      title: '螺旋塔',
      description: '由多个圆柱体堆叠而成的塔状结构，展示渐变色彩和层次感。',
      category: '建筑展示'
    })

    // 模型4: 悬浮球体
    const sphereGeometry = new THREE.SphereGeometry(0.6, 32, 32)
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: 0x4ecdc4,
      metalness: 0.7,
      roughness: 0.1,
      transparent: true,
      opacity: 0.9
    })
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    sphere.position.set(0, 3, 0)
    sphere.castShadow = true
    scene.add(sphere)
    registerMesh('floating-sphere', '悬浮球体', sphere, {
      title: '悬浮球体',
      description: '悬浮在空中的透明球体，展示透明材质和悬浮动画效果。',
      category: '动态展示'
    })

    // 模型5: 圆环展示
    const torusGroup = new THREE.Group()
    const torusGeometry = new THREE.TorusGeometry(0.8, 0.2, 16, 100)
    const torusMaterial = new THREE.MeshStandardMaterial({
      color: 0xf39c12,
      metalness: 0.8,
      roughness: 0.2
    })
    const torus = new THREE.Mesh(torusGeometry, torusMaterial)
    torus.rotation.x = Math.PI / 2
    torus.castShadow = true
    torusGroup.add(torus)

    // 内部小球
    const innerSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0xe74c3c,
        metalness: 0.9,
        roughness: 0.1
      })
    )
    innerSphere.castShadow = true
    torusGroup.add(innerSphere)

    torusGroup.position.set(-3, 2.5, 2)
    scene.add(torusGroup)
    registerMesh('torus-display', '能量环', torusGroup, {
      title: '能量环',
      description: '圆环与内部球体的组合，展示复杂几何体的组合效果。',
      category: '能量展示'
    })
  }

  const animate = () => {
    animationId = requestAnimationFrame(animate)

    const elapsedTime = clock.getElapsedTime()

    // 模型动画
    objects.value.forEach((obj) => {
      const mesh = meshRegistry.get(obj.id)
      if (!mesh) return

      if (obj.id === 'tech-cube') {
        mesh.rotation.y = elapsedTime * 0.5
      } else if (obj.id === 'gem') {
        mesh.rotation.y = elapsedTime * 0.8
        mesh.rotation.x = Math.sin(elapsedTime * 0.5) * 0.3
      } else if (obj.id === 'floating-sphere') {
        mesh.position.y = 3 + Math.sin(elapsedTime * 1.5) * 0.3
        mesh.rotation.y = elapsedTime * 0.3
      } else if (obj.id === 'torus-display') {
        mesh.rotation.z = elapsedTime * 0.6
      }
    })

    // 更新控制器
    if (controls) {
      controls.update()
    }

    // 渲染场景
    if (renderer && scene && camera) {
      renderer.render(scene, camera)
    }
  }

  const findObjectByMesh = (mesh: THREE.Mesh): ObjectInfo | null => {
    for (const [id, registeredMesh] of meshRegistry) {
      if (registeredMesh === mesh) {
        return objects.value.find(obj => obj.id === id) || null
      }
      if (registeredMesh instanceof THREE.Group && registeredMesh.children.includes(mesh)) {
        return objects.value.find(obj => obj.id === id) || null
      }
    }
    return null
  }

  const handleMouseMove = (event: MouseEvent) => {
    if (!canvasElement || !camera || !scene) return

    const rect = canvasElement.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera)

    // 收集所有可交互的 mesh
    const allMeshes: THREE.Mesh[] = []
    meshRegistry.forEach((mesh) => {
      if (mesh instanceof THREE.Group) {
        mesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            allMeshes.push(child)
          }
        })
      } else if (mesh instanceof THREE.Mesh) {
        allMeshes.push(mesh)
      }
    })

    const intersects = raycaster.intersectObjects(allMeshes)

    // 重置所有物体材质的发光
    meshRegistry.forEach((mesh) => {
      if (mesh instanceof THREE.Group) {
        mesh.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
            child.material.emissive = new THREE.Color(0x000000)
            child.material.emissiveIntensity = 0
          }
        })
      } else if (mesh instanceof THREE.Mesh && mesh.material instanceof THREE.MeshStandardMaterial) {
        mesh.material.emissive = new THREE.Color(0x000000)
        mesh.material.emissiveIntensity = 0
      }
    })

    if (intersects.length > 0) {
      const intersectedMesh = intersects[0].object as THREE.Mesh
      const objInfo = findObjectByMesh(intersectedMesh)

      if (objInfo) {
        hoveredObject.value = objInfo
        // 高亮效果
        const mesh = meshRegistry.get(objInfo.id)
        if (mesh instanceof THREE.Group) {
          mesh.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
              child.material.emissive = new THREE.Color(0x4a90e2)
              child.material.emissiveIntensity = 0.3
            }
          })
        } else if (mesh instanceof THREE.Mesh && mesh.material instanceof THREE.MeshStandardMaterial) {
          mesh.material.emissive = new THREE.Color(0x4a90e2)
          mesh.material.emissiveIntensity = 0.3
        }
      }
    } else {
      hoveredObject.value = null
    }
  }

  const handleClick = (event: MouseEvent): ObjectInfo | null => {
    if (!canvasElement || !camera || !scene) return null

    const rect = canvasElement.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera)

    const allMeshes: THREE.Mesh[] = []
    meshRegistry.forEach((mesh) => {
      if (mesh instanceof THREE.Group) {
        mesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            allMeshes.push(child)
          }
        })
      } else if (mesh instanceof THREE.Mesh) {
        allMeshes.push(mesh)
      }
    })

    const intersects = raycaster.intersectObjects(allMeshes)

    if (intersects.length > 0) {
      const intersectedMesh = intersects[0].object as THREE.Mesh
      const objInfo = findObjectByMesh(intersectedMesh)
      
      if (objInfo) {
        selectedObject.value = objInfo
      }
      return objInfo
    }

    selectedObject.value = null
    return null
  }

  const handleResize = () => {
    if (!canvasElement || !camera || !renderer) return

    camera.aspect = canvasElement.clientWidth / canvasElement.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(canvasElement.clientWidth, canvasElement.clientHeight)
  }

  const dispose = () => {
    cancelAnimationFrame(animationId)

    if (renderer) {
      renderer.dispose()
    }

    // 释放几何体和材质
    meshRegistry.forEach((mesh) => {
      if (mesh instanceof THREE.Group) {
        mesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.geometry) child.geometry.dispose()
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose())
              } else {
                child.material.dispose()
              }
            }
          }
        })
      } else if (mesh instanceof THREE.Mesh) {
        if (mesh.geometry) mesh.geometry.dispose()
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m => m.dispose())
          } else {
            mesh.material.dispose()
          }
        }
      }
    })

    meshRegistry.clear()
    objects.value = []
  }

  onUnmounted(() => {
    dispose()
  })

  return {
    init,
    handleMouseMove,
    handleClick,
    handleResize,
    hoveredObject,
    selectedObject,
    objects
  }
}
