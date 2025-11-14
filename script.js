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

    // 3. Luces (¡CAMBIOS IMPORTANTES!)
    // Luz ambiental más fuerte para que no se vea negro
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);
    
    // Luz hemisférica: Da una iluminación global suave, ideal para VR.
    // (Color del cielo, color del suelo, intensidad)
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
    hemisphereLight.position.set(0, 3, 0);
    scene.add(hemisphereLight);

    // Añadimos una cuadrícula (GridHelper) como referencia
    const gridHelper = new THREE.GridHelper(20, 20);
    scene.add(gridHelper);

    // 4. Renderizador (Renderer)
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Ajuste de color
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

            // --- AJUSTE DE TEXTURAS Y TRANSPARENCIA (¡CAMBIO IMPORTANTE!) ---
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Si el material tiene una textura (map)...
                    if (child.material && child.material.map) {
                        child.material.map.encoding = THREE.sRGBEncoding;
                        
                        // --- FORZAMOS LA TRANSPARENCIA ---
                        // Esto es para que el "profesor" (que es un PNG) se vea
                        child.material.transparent = true;
                        child.material.alphaTest = 0.1; // Evita bordes feos en la transparencia
                    }
                }
            });

            // --- AJUSTE POSICIÓN VR (¡CAMBIO IMPORTANTE!) ---
            vrGroup = new THREE.Group();
            vrGroup.add(model);

            // Regresamos la posición del grupo al origen (0,0,0)
            // Esto hará que aparezcas EN EL ORIGEN (centro del salón)
            // que es lo que querías.
            vrGroup.position.set(0, 0, 0); 
            
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
    // Solo actualiza los OrbitControls si NO estamos en modo VR
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
