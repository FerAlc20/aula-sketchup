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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 2, 3);
    directionalLight.castShadow = true; // Opcional, para sombras
    scene.add(directionalLight);

    // Añadimos una cuadrícula (GridHelper) como referencia
    const gridHelper = new THREE.GridHelper(20, 20);
    scene.add(gridHelper);

    // 4. Renderizador (Renderer)
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // --- AJUSTE DE TEXTURAS (Color) ---
    // Asegura que los colores y texturas se vean correctamente (evita que se vean "lavados")
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true; // Habilita sombras
    
    // Habilitación de VR
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);
    
    // 5. Botón de VR
    document.body.appendChild(VRButton.createButton(renderer));
    
    // Inicializamos los OrbitControls (para modo escritorio)
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    // Apuntamos al profesor
    controls.target.set(0, 1.6, 0); 
    controls.update();

    // 6. Cargar el modelo FBX
    const loader = new FBXLoader();
    
    // Define la ruta base para las texturas
    loader.setResourcePath('Mod_1/');

    loader.load(
        'Mod_1/Mod_1.fbx', // Carga el modelo
        
        (fbx) => {
            model = fbx;

            // --- AJUSTE DE TEXTURAS (Materiales) ---
            // Recorremos el modelo buscando mallas (meshes)
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Si el material tiene una textura (map), ajustamos su codificación
                    if (child.material && child.material.map) {
                        child.material.map.encoding = THREE.sRGBEncoding;
                    }
                }
            });

            // --- AJUSTE POSICIÓN VR ---
            // Creamos un grupo para controlar la posición en VR
            vrGroup = new THREE.Group();
            vrGroup.add(model); // Añadimos el modelo al grupo

            // Asumimos que el origen (0,0,0) del modelo es el profesor.
            // Queremos que el usuario (que en VR es 0,0,0) aparezca
            // un poco detrás del profesor para ver el salón.
            // Ajusta estos valores X, Z para moverte dentro del salón.
            // (X=0, Y=0, Z=1.5) te pone 1.5 metros detrás del profesor.
            vrGroup.position.set(0, 0, 1.5); 
            
            // Añadimos el GRUPO (no el modelo) a la escena
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
