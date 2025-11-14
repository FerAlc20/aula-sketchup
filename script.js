// Importamos los módulos necesarios
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- VARIABLES GLOBALES ---
let camera, scene, renderer;
let model; // Variable para guardar tu modelo
let controls; // Variable para los controles de la cámara
let vrGroup; // Grupo para posicionar el modelo en VR

// --- INICIALIZACIÓN ---
init();

function init() {
    // 1. Escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    // 2. Cámara
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(10, 15, 10);

    // 3. Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);
    
    // Luz direccional (Sol) para la vista exterior
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Luz interna para que se vea bien en VR
    const pointLight = new THREE.PointLight(0xffffff, 1.0, 15);
    pointLight.position.set(0, 2, 0); // La pondremos en el centro del salón
    scene.add(pointLight);

    // Añadimos una cuadrícula (GridHelper) como referencia
    const gridHelper = new THREE.GridHelper(20, 20);
    scene.add(gridHelper);

    // 4. Renderizador (Renderer)
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Arreglo de texturas y colores
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    
    // Habilitación de VR
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);
    
    // 5. Botón de VR
    document.body.appendChild(VRButton.createButton(renderer));
    
    // Inicializamos los OrbitControls (para modo escritorio)
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0, 0); // Apuntamos al centro (0,0,0)
    controls.update();

    // 6. Cargar el modelo FBX
    const loader = new FBXLoader();
    loader.setResourcePath('Mod_1/');

    loader.load(
        'Mod_1/Mod_1.fbx',
        
        // -- onLoad (Cuando se carga bien) --
        (fbx) => {
            model = fbx;

          
            const bbox = new THREE.Box3().setFromObject(model);
            const center = bbox.getCenter(new THREE.Vector3());

            model.position.x -= center.x;
            model.position.z -= center.z;
            
            model.position.y -= bbox.min.y;

            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    
                    materials.forEach(mat => {
                        if (mat && mat.map) {
                            mat.map.encoding = THREE.sRGBEncoding;

                            if (mat.map.image && mat.map.image.src.toLowerCase().endsWith('.png')) {
                                mat.transparent = true; // Hacer transparente
                                mat.alphaTest = 0.1; // Evita bordes feos
                            } else {
                                mat.transparent = false;
                            }
                        }
                    });
                }
            });
            
            vrGroup = new THREE.Group();
            vrGroup.add(model); // Añadimos el modelo ya centrado al grupo

       
          
            vrGroup.position.set(-5, 0, -4); 
            
            scene.add(vrGroup);
            console.log("Modelo cargado exitosamente.");
        },
        
   
      
        (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% cargado');
        },
        
        // -- onError (Si falla) --
        (error) => {
            console.error('Error al cargar el modelo FBX:', error);
        }
    );
    
    // 7. Loop de Animación
    renderer.setAnimationLoop(animate);

    // 8. Manejar redimensionamiento de ventana
    window.addEventListener('resize', onWindowResize);
}

// --- FUNCIONES AUXILIARES ---

function animate() {
    if (renderer.xr.isPresenting === false) {
        controls.update();
    }
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
