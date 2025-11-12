// Importamos los módulos necesarios
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- VARIABLES GLOBALES ---
let camera, scene, renderer;
let model; // 
let controls; // Variable para los controles de la cámara

// --- INICIALIZACIÓN ---
init();

function init() {
    // 1. Escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    // 2. Cámara
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    // --- CAMBIO ---
    // La movemos más lejos para asegurar que vemos el modelo
    camera.position.set(0, 2, 10); // 2m arriba, 10m atrás

    // 3. Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 2, 3);
    scene.add(directionalLight);

    // --- NUEVO: Añadimos una cuadrícula (GridHelper) como referencia ---
    const gridHelper = new THREE.GridHelper(20, 20); // 20x20 metros
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
    
    // --- NUEVO: Inicializamos los OrbitControls ---
    // Pasamos la cámara y el canvas del renderer
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Efecto de "desaceleración" suave
    controls.target.set(0, 1, 0); // Hacemos que la cámara mire hacia 1m de altura
    controls.update();

    // 6. Cargar el modelo FBX
    const loader = new FBXLoader();
    loader.load(
        'Mod_1/Mod_1.fbx', // La ruta a tu modelo
        
        (fbx) => {
            model = fbx;


            // Posicionamos el modelo en el centro de la cuadrícula
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

    // Renderizar la escena
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
