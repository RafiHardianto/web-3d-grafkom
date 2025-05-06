const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);
const loadingText = document.getElementById("loading");

let dirLight, hemiLight, shadowGenerator, car, wheels = [], input = {};

const createScene = function () {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.9, 0.9, 0.9, 1);

    // Kamera
    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI, Math.PI / 2.2, 10, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 3;
    camera.upperRadiusLimit = 100;

    // Hemispheric Light
    hemiLight = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.5;

    // Directional Light (utama + shadow)
    dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -2, -1), scene);
    dirLight.position = new BABYLON.Vector3(5, 10, 5);
    dirLight.intensity = 1.0;
    dirLight.shadowMinZ = 0.1;
    dirLight.shadowMaxZ = 100;
    dirLight.specular = BABYLON.Color3.Black();

    // Shadow Generator
    shadowGenerator = new BABYLON.ShadowGenerator(2048, dirLight);
    shadowGenerator.usePoissonSampling = true;
    shadowGenerator.bias = 0.0005;

    // Ground (ubah menjadi abu-abu)
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 50, height: 50 }, scene);
    ground.receiveShadows = true;
    ground.position.y = -1.2;

    // Ground Material abu-abu
    const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);  // Warna abu-abu
    groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);  // Tidak ada refleksi spekular
    groundMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2); // Sedikit cahaya
    ground.material = groundMaterial;

    return scene;
};

const scene = createScene();

async function loadCarModel() {
    try {
        const result = await BABYLON.SceneLoader.ImportMeshAsync("", "models/", "scene.gltf", scene);

        result.meshes.forEach(mesh => {
            if (mesh instanceof BABYLON.Mesh) {
                mesh.scaling = new BABYLON.Vector3(1.4, 1.4, 1.4);
                mesh.position = new BABYLON.Vector3(0, -1.2, 0);
                mesh.receiveShadows = true;
                mesh.castShadow = true;
                shadowGenerator.addShadowCaster(mesh);

                if (mesh.name.toLowerCase().includes("wheel")) {
                    wheels.push(mesh);
                    console.log(`Roda ditemukan: ${mesh.name}`);
                }
            }
        });

        car = result.meshes.find(mesh =>
            mesh.name.toLowerCase().includes("car") ||
            mesh.name.toLowerCase().includes("body")
        ) || result.meshes[0];

        loadingText.style.display = "none";

    } catch (error) {
        console.error("Error loading model:", error);
        loadingText.innerText = "Model gagal dimuat.";
    }
}

// Input Keyboard
window.addEventListener("keydown", (e) => input[e.key.toLowerCase()] = true);
window.addEventListener("keyup", (e) => input[e.key.toLowerCase()] = false);

// Pergerakan mobil
scene.onBeforeRenderObservable.add(() => {
    if (car) {
        let speed = 0.05;
        let turnSpeed = 0.03;
        let wheelRadius = 0.5;
        let wheelCircumference = 2 * Math.PI * wheelRadius;
        let moveDistance = 0;

        if (input["w"]) moveDistance = speed;
        if (input["s"]) moveDistance = -speed;

        if (input["a"]) car.rotate(BABYLON.Axis.Y, -turnSpeed);
        if (input["d"]) car.rotate(BABYLON.Axis.Y, turnSpeed);

        car.translate(BABYLON.Axis.Z, moveDistance, BABYLON.Space.LOCAL);

        let rotations = moveDistance / wheelCircumference;

        wheels.forEach(wheel => {
            wheel.rotate(BABYLON.Axis.X, -rotations * 2 * Math.PI, BABYLON.Space.LOCAL);
        });
    }
});

loadCarModel();

// Tambahkan fungsi toggle lampu setelah semua fungsi utama
function toggleDirectionalLight() {
    if (dirLight) {
        dirLight.setEnabled(!dirLight.isEnabled());
    }
}

engine.runRenderLoop(() => scene.render());
window.addEventListener("resize", () => engine.resize());
