import * as THREE from "https://unpkg.com/three@0.159.0/build/three.module.js";

const canvas = document.querySelector("#game");
const scoreEl = document.querySelector("#score");

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x020617, 20, 80);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(18, 18, 18);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x020617, 1);

const ambient = new THREE.AmbientLight(0xffffff, 0.65);
scene.add(ambient);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
dirLight.position.set(12, 18, 6);
scene.add(dirLight);

const planeSize = 14;
const gridHelper = new THREE.GridHelper(planeSize * 2, planeSize * 2, 0x334155, 0x1e293b);
gridHelper.position.y = -0.5;
scene.add(gridHelper);

const boundaryMaterial = new THREE.LineBasicMaterial({ color: 0x475569 });
const boundaryGeometry = new THREE.BoxGeometry(planeSize * 2, planeSize * 2, planeSize * 2);
const boundaryEdges = new THREE.EdgesGeometry(boundaryGeometry);
const boundaryWire = new THREE.LineSegments(boundaryEdges, boundaryMaterial);
boundaryWire.position.y = planeSize - 0.5;
scene.add(boundaryWire);

const cellSize = 1;
const worldLimit = planeSize;

const snakeMaterial = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.2, roughness: 0.4 });
const headMaterial = new THREE.MeshStandardMaterial({ color: 0x22d3ee, metalness: 0.1, roughness: 0.3 });
const foodMaterial = new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0x7c2d12, emissiveIntensity: 0.6 });

const cubeGeometry = new THREE.BoxGeometry(cellSize, cellSize, cellSize);

const snake = [];
let direction = new THREE.Vector3(1, 0, 0);
let pendingDirection = direction.clone();
let food = null;
let score = 0;
let gameInterval = null;

const directionMap = new Map([
  ["ArrowUp", new THREE.Vector3(0, 0, -1)],
  ["ArrowDown", new THREE.Vector3(0, 0, 1)],
  ["ArrowLeft", new THREE.Vector3(-1, 0, 0)],
  ["ArrowRight", new THREE.Vector3(1, 0, 0)],
  ["KeyW", new THREE.Vector3(0, 0, -1)],
  ["KeyS", new THREE.Vector3(0, 0, 1)],
  ["KeyA", new THREE.Vector3(-1, 0, 0)],
  ["KeyD", new THREE.Vector3(1, 0, 0)],
  ["KeyQ", new THREE.Vector3(0, -1, 0)],
  ["KeyE", new THREE.Vector3(0, 1, 0)],
]);

const updateScore = () => {
  scoreEl.textContent = score.toString();
};

const addSegment = (position, isHead = false) => {
  const mesh = new THREE.Mesh(cubeGeometry, isHead ? headMaterial : snakeMaterial);
  mesh.position.copy(position);
  scene.add(mesh);
  snake.unshift(mesh);
};

const resetSnake = () => {
  snake.forEach((segment) => scene.remove(segment));
  snake.length = 0;

  addSegment(new THREE.Vector3(0, 0, 0), true);
  addSegment(new THREE.Vector3(-1, 0, 0));
  addSegment(new THREE.Vector3(-2, 0, 0));

  direction = new THREE.Vector3(1, 0, 0);
  pendingDirection = direction.clone();
};

const randomCell = () => {
  const range = worldLimit - 1;
  return new THREE.Vector3(
    THREE.MathUtils.randInt(-range, range),
    THREE.MathUtils.randInt(-range, range),
    THREE.MathUtils.randInt(-range, range)
  );
};

const isOccupied = (position) =>
  snake.some((segment) => segment.position.equals(position));

const spawnFood = () => {
  if (food) scene.remove(food);

  let position = randomCell();
  while (isOccupied(position)) {
    position = randomCell();
  }

  food = new THREE.Mesh(cubeGeometry, foodMaterial);
  food.position.copy(position);
  scene.add(food);
};

const withinBounds = (position) =>
  Math.abs(position.x) < worldLimit &&
  Math.abs(position.y) < worldLimit &&
  Math.abs(position.z) < worldLimit;

const isOppositeDirection = (nextDir) =>
  nextDir.clone().add(direction).lengthSq() === 0;

const moveSnake = () => {
  if (isOppositeDirection(pendingDirection)) {
    pendingDirection = direction.clone();
  }

  direction.copy(pendingDirection);
  const nextPosition = snake[0].position.clone().add(direction);

  if (!withinBounds(nextPosition) || isOccupied(nextPosition)) {
    clearInterval(gameInterval);
    gameInterval = null;
    return;
  }

  const tail = snake.pop();
  tail.position.copy(nextPosition);
  tail.material = headMaterial;
  snake[1].material = snakeMaterial;
  snake.unshift(tail);

  if (food && nextPosition.equals(food.position)) {
    score += 1;
    updateScore();
    const tailCopy = snake[snake.length - 1].position.clone();
    addSegment(tailCopy);
    spawnFood();
  }
};

const restartGame = () => {
  score = 0;
  updateScore();
  resetSnake();
  spawnFood();
  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(moveSnake, 200);
};

window.addEventListener("keydown", (event) => {
  if (event.code === "KeyR") {
    restartGame();
    return;
  }

  const nextDirection = directionMap.get(event.code);
  if (nextDirection) {
    pendingDirection = nextDirection.clone();
  }
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const animate = () => {
  requestAnimationFrame(animate);
  const time = Date.now() * 0.0003;
  camera.position.x = Math.cos(time) * 22;
  camera.position.z = Math.sin(time) * 22;
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
};

restartGame();
animate();
