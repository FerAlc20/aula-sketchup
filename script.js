// Importamos los módulos necesarios
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- VARIABLES GLOBALES ---
let camera, scene, renderer;
let model; // Variable para guardar tu modelo
let controls; // Variable para los controles de la cámara

// --- INICIALIZACIÓN ---
init();

function init() {
    // 1. Escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    // 2. Cámara
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    // --- POSICIÓN AJUSTADA ---
    // (X=3 a la derecha, Y=2.5 de altura, Z=8 de distancia)
    // Esto es "enfrente" del profesor, fuera de la ventana.
    camera.position.set(3, 2.5, 8);

    // 3. Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 2, 3);
    scene.add(directionalLight);

    // Añadimos una cuadrícula (GridHelper) como referencia
    const gridHelper = new THREE.GridHelper(20, 20);
    scene.add(gridHelper);

    // 4. Renderizador (Renderer)
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Habilitación de VR
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);
    
    // 5. Botón de VR
    document.body.appendChild(VRButton.createButton(renderer));
    
    // Inicializamos los OrbitControls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    
    // --- OBJETIVO AJUSTADO ---
    // Hacemos que la cámara apunte al profesor (altura de ojos 1.6m en el origen)
    controls.target.set(0, 1.6, 0); 
    controls.update();

    // 6. Cargar el modelo FBX
    const loader = new FBXLoader();
    loader.load(
        'Mod_1/Mod_1.fbx', // La ruta a tu modelo
        
        (fbx) => {
            model = fbx;

            // --- AJUSTES DEL MODELO (DESCOMENTA SI ES NECESARIO) ---
            
            // Si el modelo aparece "acostado"
            // model.rotation.x = -Math.PI / 2; 

            // Si es muy grande o muy pequeño
            // model.scale.set(0.01, 0.01, 0.01); 

            model.position.set(0, 0, 0);
            
            scene.add(model);
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
    controls.update();
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

