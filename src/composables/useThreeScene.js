import { ref, shallowRef, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

export function useThreeScene(containerRef) {
  const scene = shallowRef(null)
  const camera = shallowRef(null)
  const renderer = shallowRef(null)
  const controls = shallowRef(null)
  const composer = shallowRef(null)
  
  const isInitialized = ref(false)
  const hoveredObject = shallowRef(null)
  const selectedObject = shallowRef(null)
  const loadedModels = shallowRef([])
  
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()
  
  const interactiveObjects = []
  let animationId = null
  const clock = new THREE.Clock()
  
  const originalMaterials = new Map()

  function init() {
    if (!containerRef.value || isInitialized.value) return
    
    const container = containerRef.value
    const width = container.clientWidth
    const height = container.clientHeight
    
    scene.value = new THREE.Scene()
    scene.value.background = new THREE.Color(0x1a1a2e)
    scene.value.fog = new THREE.Fog(0x1a1a2e, 10, 50)
    
    camera.value = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
    camera.value.position.set(0, 5, 12)
    
    renderer.value = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    })
    renderer.value.setSize(width, height)
    renderer.value.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.value.shadowMap.enabled = true
    renderer.value.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.value.toneMapping = THREE.ACESFilmicToneMapping
    renderer.value.toneMappingExposure = 1.2
    renderer.value.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(renderer.value.domElement)
    
    controls.value = new OrbitControls(camera.value, renderer.value.domElement)
    controls.value.enableDamping = true
    controls.value.dampingFactor = 0.05
    controls.value.minDistance = 3
    controls.value.maxDistance = 30
    controls.value.maxPolarAngle = Math.PI / 2 - 0.1
    controls.value.target.set(0, 1, 0)
    
    initPostProcessing(width, height)
    
    createRoom()
    createLights()
    createDecorations()
    
    isInitialized.value = true
    
    window.addEventListener('resize', onResize)
    container.addEventListener('mousemove', onMouseMove)
    container.addEventListener('click', onClick)
    
    animate()
  }

  function initPostProcessing(width, height) {
    composer.value = new EffectComposer(renderer.value)
    
    const renderPass = new RenderPass(scene.value, camera.value)
    composer.value.addPass(renderPass)
    
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.5,
      0.4,
      0.85
    )
    composer.value.addPass(bloomPass)
  }

  function createRoom() {
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
    scene.value.add(floor)
    
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x16213e,
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.DoubleSide
    })
    
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 10),
      wallMaterial
    )
    backWall.position.set(0, 5, -10)
    backWall.receiveShadow = true
    backWall.name = 'backWall'
    scene.value.add(backWall)
    
    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 10),
      wallMaterial
    )
    leftWall.position.set(-10, 5, 0)
    leftWall.rotation.y = Math.PI / 2
    leftWall.receiveShadow = true
    leftWall.name = 'leftWall'
    scene.value.add(leftWall)
    
    const rightWall = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 10),
      wallMaterial
    )
    rightWall.position.set(10, 5, 0)
    rightWall.rotation.y = -Math.PI / 2
    rightWall.receiveShadow = true
    rightWall.name = 'rightWall'
    scene.value.add(rightWall)
  }

  function createLights() {
    const ambientLight = new THREE.AmbientLight(0x404060, 0.4)
    scene.value.add(ambientLight)
    
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5)
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
    mainLight.shadow.bias = -0.0001
    scene.value.add(mainLight)
    
    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.5)
    fillLight.position.set(-5, 5, -5)
    scene.value.add(fillLight)
    
    const spotLight1 = new THREE.SpotLight(0xff6b6b, 2, 15, Math.PI / 6, 0.5)
    spotLight1.position.set(-5, 8, 0)
    spotLight1.target.position.set(-5, 0, 0)
    spotLight1.castShadow = true
    scene.value.add(spotLight1)
    scene.value.add(spotLight1.target)
    
    const spotLight2 = new THREE.SpotLight(0x4ecdc4, 2, 15, Math.PI / 6, 0.5)
    spotLight2.position.set(5, 8, 0)
    spotLight2.target.position.set(5, 0, 0)
    spotLight2.castShadow = true
    scene.value.add(spotLight2)
    scene.value.add(spotLight2.target)
    
    const pointLight = new THREE.PointLight(0xffd93d, 1, 10)
    pointLight.position.set(0, 6, 3)
    scene.value.add(pointLight)
  }

  function createDecorations() {
    const pedestalGeometry = new THREE.CylinderGeometry(0.8, 1, 0.5, 32)
    const pedestalMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d3d5c,
      roughness: 0.3,
      metalness: 0.7
    })
    
    const positions = [
      { x: -5, z: -5 },
      { x: 0, z: -5 },
      { x: 5, z: -5 }
    ]
    
    positions.forEach((pos, index) => {
      const pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial)
      pedestal.position.set(pos.x, 0.25, pos.z)
      pedestal.castShadow = true
      pedestal.receiveShadow = true
      pedestal.name = `pedestal-${index}`
      scene.value.add(pedestal)
      
      createShowcaseItem(pos.x, 1, pos.z, index)
    })
    
    const frameGeometry = new THREE.BoxGeometry(3, 2, 0.1)
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a6a,
      roughness: 0.5,
      metalness: 0.5
    })
    
    for (let i = 0; i < 3; i++) {
      const frame = new THREE.Mesh(frameGeometry, frameMaterial)
      frame.position.set(-6 + i * 6, 4, -9.9)
      frame.castShadow = true
      frame.name = `frame-${i}`
      scene.value.add(frame)
    }
  }

  function createShowcaseItem(x, y, z, index) {
    const geometries = [
      new THREE.IcosahedronGeometry(0.6, 0),
      new THREE.TorusKnotGeometry(0.4, 0.15, 64, 8),
      new THREE.OctahedronGeometry(0.6, 0)
    ]
    
    const colors = [0xff6b6b, 0x4ecdc4, 0xffd93d]
    
    const geometry = geometries[index % geometries.length]
    const material = new THREE.MeshStandardMaterial({
      color: colors[index % colors.length],
      roughness: 0.2,
      metalness: 0.8,
      emissive: colors[index % colors.length],
      emissiveIntensity: 0.1
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(x, y + 0.6, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.name = `showcase-item-${index}`
    mesh.userData = {
      type: 'showcase-item',
      index,
      title: `展品 ${index + 1}`,
      description: `这是一个精美的3D展品，编号 #${index + 1}`,
      rotationSpeed: 0.5 + Math.random() * 0.5
    }
    
    scene.value.add(mesh)
    interactiveObjects.push(mesh)
    loadedModels.value.push(mesh)
  }

  async function loadModel(url, options = {}) {
    const loader = new GLTFLoader()
    
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
    loader.setDRACOLoader(dracoLoader)
    
    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (gltf) => {
          const model = gltf.scene
          
          const { position = [0, 0, 0], scale = 1, rotation = [0, 0, 0] } = options
          model.position.set(...position)
          model.scale.setScalar(scale)
          model.rotation.set(...rotation)
          
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true
              child.receiveShadow = true
            }
          })
          
          model.userData = {
            type: 'loaded-model',
            url,
            ...options
          }
          
          scene.value.add(model)
          interactiveObjects.push(model)
          loadedModels.value.push(model)
          
          resolve(model)
        },
        (progress) => {
          console.log('Loading progress:', (progress.loaded / progress.total * 100).toFixed(2) + '%')
        },
        (error) => {
          console.error('Model loading error:', error)
          reject(error)
        }
      )
    })
  }

  function onMouseMove(event) {
    if (!containerRef.value) return
    
    const rect = containerRef.value.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    raycaster.setFromCamera(mouse, camera.value)
    const intersects = raycaster.intersectObjects(interactiveObjects, true)
    
    if (intersects.length > 0) {
      const object = findInteractiveParent(intersects[0].object)
      if (object && object !== hoveredObject.value) {
        unhighlightObject(hoveredObject.value)
        hoveredObject.value = object
        highlightObject(object)
        containerRef.value.style.cursor = 'pointer'
      }
    } else {
      if (hoveredObject.value) {
        unhighlightObject(hoveredObject.value)
        hoveredObject.value = null
        containerRef.value.style.cursor = 'default'
      }
    }
  }

  function onClick(event) {
    if (!containerRef.value) return
    
    const rect = containerRef.value.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    raycaster.setFromCamera(mouse, camera.value)
    const intersects = raycaster.intersectObjects(interactiveObjects, true)
    
    if (intersects.length > 0) {
      const object = findInteractiveParent(intersects[0].object)
      if (object) {
        selectedObject.value = object
      }
    } else {
      selectedObject.value = null
    }
  }

  function findInteractiveParent(object) {
    let current = object
    while (current) {
      if (interactiveObjects.includes(current)) {
        return current
      }
      current = current.parent
    }
    return null
  }

  function highlightObject(object) {
    if (!object) return
    
    object.traverse((child) => {
      if (child.isMesh) {
        if (!originalMaterials.has(child)) {
          originalMaterials.set(child, child.material.clone())
        }
        if (child.material.emissive) {
          child.material.emissiveIntensity = 0.5
        }
      }
    })
  }

  function unhighlightObject(object) {
    if (!object) return
    
    object.traverse((child) => {
      if (child.isMesh && originalMaterials.has(child)) {
        const original = originalMaterials.get(child)
        if (child.material.emissive) {
          child.material.emissiveIntensity = original.emissiveIntensity || 0.1
        }
      }
    })
  }

  function onResize() {
    if (!containerRef.value || !camera.value || !renderer.value) return
    
    const width = containerRef.value.clientWidth
    const height = containerRef.value.clientHeight
    
    camera.value.aspect = width / height
    camera.value.updateProjectionMatrix()
    
    renderer.value.setSize(width, height)
    composer.value.setSize(width, height)
  }

  function animate() {
    animationId = requestAnimationFrame(animate)
    
    const delta = clock.getDelta()
    const elapsed = clock.getElapsedTime()
    
    controls.value.update()
    
    loadedModels.value.forEach((model) => {
      if (model.userData.rotationSpeed) {
        model.rotation.y += delta * model.userData.rotationSpeed
      }
    })
    
    const pointLight = scene.value.children.find(
      child => child.isPointLight
    )
    if (pointLight) {
      pointLight.position.x = Math.sin(elapsed * 0.5) * 3
      pointLight.position.z = Math.cos(elapsed * 0.5) * 3 + 3
    }
    
    composer.value.render()
  }

  function dispose() {
    window.removeEventListener('resize', onResize)
    
    if (containerRef.value) {
      containerRef.value.removeEventListener('mousemove', onMouseMove)
      containerRef.value.removeEventListener('click', onClick)
    }
    
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
    
    interactiveObjects.length = 0
    loadedModels.value = []
    originalMaterials.clear()
    
    if (scene.value) {
      scene.value.traverse((object) => {
        if (object.geometry) object.geometry.dispose()
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(m => m.dispose())
          } else {
            object.material.dispose()
          }
        }
      })
    }
    
    if (renderer.value) {
      renderer.value.dispose()
      if (containerRef.value && renderer.value.domElement) {
        containerRef.value.removeChild(renderer.value.domElement)
      }
    }
    
    if (controls.value) {
      controls.value.dispose()
    }
    
    isInitialized.value = false
  }

  onUnmounted(() => {
    dispose()
  })

  return {
    scene,
    camera,
    renderer,
    controls,
    composer,
    isInitialized,
    hoveredObject,
    selectedObject,
    loadedModels,
    init,
    dispose,
    loadModel
  }
}
