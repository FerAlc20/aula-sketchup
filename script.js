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
    // Posición para modo ESCRITORIO (vista de "Dios" desde arriba)
    camera.position.set(10, 15, 10);

    // 3. Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);
    
    // Usamos una luz direccional (Sol) para la vista exterior
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Añadimos una cuadrícula (GridHelper) como referencia
    const gridHelper = new THREE.GridHelper(20, 20);
    scene.add(gridHelper);

    // 4. Renderizador (Renderer)
    renderer = new THREE.WebGLRenderer({ antias: true });
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
        
        (fbx) => {
            model = fbx;

            // --- ¡SOLUCIÓN DE POSICIÓN #1: CENTRAR EL MODELO! ---
            const bbox = new THREE.Box3().setFromObject(model);
            const center = bbox.getCenter(new THREE.Vector3());

            model.position.x -= center.x;
            model.position.z -= center.z;
            model.position.y -= bbox.min.y;

            // --- LÓGICA DE TEXTURAS (SIMPLIFICADA) ---
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach(mat => {
                        if (mat && mat.map) {
                            mat.map.encoding = THREE.sRGBEncoding;
                        }
                    });
                }
            });
            
            // --- ¡SOLUCIÓN DE POSICIÓN #2: MOVERTE A LA 'X'! ---
            vrGroup = new THREE.Group();
            vrGroup.add(model); // Añadimos el modelo ya centrado al grupo

            // (X=-5 te mueve a la derecha, Z=-4 te mueve hacia la ventana)
            vrGroup.position.set(-5, 0, -4); 
            
            scene.add(vrGroup);
            console.log("Modelo cargado exitosamente.");
        },
        // --- LÍNEA CORREGIDA (SE ELIMINÓ LA 's') ---
        (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% cargado');
        },
        
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
