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
    // Posición para modo ESCRITORIO (fuera de la ventana)
    camera.position.set(3, 2.2, 5);

    // 3. Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5); // Luz ambiental más fuerte
    scene.add(ambientLight);
    
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0); // Luz suave
    hemisphereLight.position.set(0, 3, 0);
    scene.add(hemisphereLight);

    // Añadimos una cuadrícula (GridHelper) como referencia
    const gridHelper = new THREE.GridHelper(20, 20);
    scene.add(gridHelper);

    // 4. Renderizador (Renderer)
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
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
    controls.target.set(0, 1.6, 0); 
    controls.update();

    // 6. Cargar el modelo FBX
    const loader = new FBXLoader();
    loader.setResourcePath('Mod_1/');

    loader.load(
        'Mod_1/Mod_1.fbx',
        
        (fbx) => {
            model = fbx;

            // --- ¡NUEVA LÓGICA DE TEXTURAS! ---
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    if (child.material) {
                        // Función para procesar cada material
                        const processMaterial = (mat) => {
                            if (mat.map) {
                                // Siempre ajustamos la codificación de color
                                mat.map.encoding = THREE.sRGBEncoding;
                                
                                // REVISAMOS SI LA TEXTURA ES PNG (para el profesor)
                                if (mat.map.image && mat.map.image.src.toLowerCase().endsWith('.png')) {
                                    mat.transparent = true; // Hacer transparente
                                    mat.alphaTest = 0.1; 
                                } else {
                                    // Si es JPG (como el piso), NOS ASEGURAMOS de que NO sea transparente
                                    mat.transparent = false;
                                }
                            }
                        };
                        
                        // Aplicamos la función si es un material o un array de materiales
                        if (Array.isArray(child.material)) {
                            child.material.forEach(processMaterial);
                        } else {
                            processMaterial(child.material);
                        }
                    }
                }
            });

            // --- ¡NUEVA POSICIÓN VR! ---
            vrGroup = new THREE.Group();
            vrGroup.add(model);

            // Estos valores mueven el *salón* para que TÚ aparezcas en la 'X'
            // (2 en X te mueve a la izquierda, 3 en Z te mueve adelante)
            vrGroup.position.set(2, 0, 3); 
            
            scene.add(vrGroup);
            console.log("Modelo cargado exitosamente.");
        },
        
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
