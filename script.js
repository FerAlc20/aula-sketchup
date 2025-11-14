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
    // Posición para modo ESCRITORIO (ver el modelo desde arriba y lejos)
    camera.position.set(0, 10, 15); // Desde arriba, mirando el centro de la escena
    camera.lookAt(0, 0, 0); // Que mire al origen

    // 3. Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); // Luz ambiental
    scene.add(ambientLight);
    
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0); // Luz de cielo/suelo
    hemisphereLight.position.set(0, 10, 0); // Más arriba
    scene.add(hemisphereLight);

    // Luz puntual para iluminar el interior, la pondremos dentro del salón
    const pointLight = new THREE.PointLight(0xffffff, 1.5, 15); // Intensidad ajustada
    scene.add(pointLight); // La posicionaremos más tarde junto al modelo

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
    controls.target.set(0, 0, 0); // Mirando al origen de la escena
    controls.update();

    // 6. Cargar el modelo FBX
    const loader = new FBXLoader();
    loader.setResourcePath('Mod_1/');

    loader.load(
        'Mod_1/Mod_1.fbx',
        
        (fbx) => {
            model = fbx;

            // --- ESCALADO Y ROTACIÓN INICIAL DEL MODELO ---
            // Si el modelo está muy grande/pequeño o acostado, descomenta y ajusta
            // model.scale.set(0.01, 0.01, 0.01);
            // model.rotation.x = -Math.PI / 2; // Si está acostado

            // --- CENTRAMOS EL MODELO EN EL ORIGEN DE LA ESCENA ---
            // Esto es CRUCIAL para que el vrGroup funcione bien.
            const bbox = new THREE.Box3().setFromObject(model);
            const center = bbox.getCenter(new THREE.Vector3());
            
            // Mueve el modelo para que su "base" esté en Y=0 y su centro horizontal en X=0, Z=0
            model.position.x += (model.position.x - center.x);
            model.position.y += (model.position.y - center.y) + (bbox.max.y - bbox.min.y) / 2; // Asegura que el suelo esté en Y=0
            model.position.z += (model.position.z - center.z);
            
            // --- AJUSTE DE TEXTURAS ---
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    if (child.material) {
                        // Si es un array de materiales, recorre cada uno
                        const materials = Array.isArray(child.material) ? child.material : [child.material];
                        materials.forEach(mat => {
                            if (mat.map) {
                                mat.map.encoding = THREE.sRGBEncoding;
                            }
                            // Si el material debe ser transparente (como el profesor), asegúrate de ello
                            // Esto puede depender del nombre de la textura o del material
                            // Por ahora, asumimos que FBXLoader lo maneja bien si el .png tiene transparencia
                            // Si el profesor se ve con fondo blanco, necesitarás una lógica más específica aquí.
                            // Por ejemplo: if (mat.name === "Material_Del_Profesor") { mat.transparent = true; mat.alphaTest = 0.5; }
                        });
                    }
                }
            });

            // --- POSICIONAMIENTO VR ---
            vrGroup = new THREE.Group();
            vrGroup.add(model);
            
            // AHORA el modelo está centrado. La "X" está a la izquierda y adelante del profesor.
            // Para que TÚ aparezcas en la 'X', movemos el vrGroup:
            // - Si el profesor está en el centro del modelo (ahora en 0,0,0 de la escena)
            // - La 'X' está a la izquierda (negativo en X) y adelante (negativo en Z) del profesor.
            // - Por lo tanto, movemos el vrGroup a las coordenadas de la 'X' para que el usuario (en 0,0,0) esté en la 'X'.
            //   Asumo que 'X' está a -2m en X y -3m en Z desde el profesor. Ajusta esto.
            vrGroup.position.set(-2, 0, -3); // ¡AJUSTAR ESTOS VALORES!
            
            scene.add(vrGroup);
            console.log("Modelo cargado exitosamente.");

            // POSICIONAR LA LUZ PUNTUAL DESPUÉS DE QUE EL MODELO ESTÁ CARGADO
            // La ponemos en la posición de la 'X' para que ilumine desde el usuario.
            pointLight.position.copy(vrGroup.position);
            pointLight.position.y = 1.5; // Altura de la luz
        },
        
        (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% cargado');
        },
        
        (error) => {
            console.error('Error al cargar el modelo FBX:', error);
        }
    );
    
    renderer.setAnimationLoop(animate);

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
