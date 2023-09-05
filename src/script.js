import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';

import * as dat from 'lil-gui';

import * as core from '@theatre/core';
import studio from '@theatre/studio';
import firstSectionState from '../static/theatre-animations/first-section-camera.json';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

THREE.ColorManagement.enabled = false;

/**
 * Base
 */
// Debug
const gui = new dat.GUI();
gui.close();
gui.hide();

// Canvas
const canvas = document.querySelector('.galaxy-canvas');

// Scene
const scene = new THREE.Scene();

// Axes helper
const axesHelper = new THREE.AxesHelper(30);
// scene.add(axesHelper);

/**
 * Galaxy
 */
const parameters = {};
parameters.count = 100000;
parameters.size = 0.001;
parameters.radius = 5;
parameters.branches = 3;
parameters.spin = 0.2;
parameters.randomness = 0.2;
parameters.randomnessPower = 3;
parameters.insideColor = '#ff6030';
parameters.outsideColor = '#1b3984';

let geometry = null;
let material = null;
let points = null;

const generateGalaxy = function () {
  // Destroy old galaxy
  if (points !== null) {
    geometry.dispose();
    material.dispose();
    scene.remove(points);
  }

  const positions = new Float32Array(parameters.count * 3);
  const colors = new Float32Array(parameters.count * 3);

  const insideColor = new THREE.Color(parameters.insideColor);
  const outsideColor = new THREE.Color(parameters.outsideColor);

  for (let i = 0; i < parameters.count; i++) {
    const i3 = 3 * i;

    // Positions
    const radius = Math.random() * parameters.radius;
    const spinAngle = radius * parameters.spin;
    const branchAngle =
      ((i % parameters.branches) / parameters.branches) * (2 * Math.PI);
    const randomnessPower = parameters.randomnessPower;

    const randomX =
      Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1);
    const randomY =
      Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1);
    const randomZ =
      Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1);

    positions[i3 + 0] = Math.cos(branchAngle + spinAngle) * radius + randomX;
    positions[i3 + 1] = randomY;
    positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

    // Colos
    const mixedColor = insideColor.clone();
    mixedColor.lerp(outsideColor, radius / parameters.radius);

    colors[i3 + 0] = mixedColor.r;
    colors[i3 + 1] = mixedColor.g;
    colors[i3 + 2] = mixedColor.b;
  }

  // Geometry
  geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Material
  material = new THREE.PointsMaterial();
  material.size = parameters.size;
  material.sizeAttenuation = true;
  material.depthWrite = false;
  material.blending = THREE.AdditiveBlending;
  material.vertexColors = true;

  // Points
  points = new THREE.Points(geometry, material);

  // Scene
  scene.add(points);
};

generateGalaxy();

// Galaxy debug UI
gui
  .add(parameters, 'count')
  .min(1000)
  .max(50000)
  .step(100)
  .name('Stars count')
  .onFinishChange(generateGalaxy);
gui
  .add(parameters, 'size')
  .min(0.001)
  .max(0.1)
  .step(0.001)
  .name('Stars size')
  .onFinishChange(generateGalaxy);
gui
  .add(parameters, 'radius')
  .min(0.01)
  .max(20)
  .step(0.1)
  .name('Galaxy radius')
  .onFinishChange(generateGalaxy);
gui
  .add(parameters, 'branches')
  .min(3)
  .max(30)
  .step(1)
  .name('Galaxy branches')
  .onFinishChange(generateGalaxy);
gui
  .add(parameters, 'spin')
  .min(-1)
  .max(1)
  .step(0.0001)
  .name('Galaxy spin angle')
  .onFinishChange(generateGalaxy);
gui
  .add(parameters, 'randomness')
  .min(0)
  .max(2)
  .step(0.001)
  .name('Stars andomness')
  .onFinishChange(generateGalaxy);
gui
  .add(parameters, 'randomnessPower')
  .min(1)
  .max(10)
  .step(0.001)
  .name('Stars Randomness Power')
  .onFinishChange(generateGalaxy);
gui.addColor(parameters, 'insideColor').onFinishChange(generateGalaxy);
gui.addColor(parameters, 'outsideColor').onFinishChange(generateGalaxy);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const cameraRotationBox = new THREE.Group();

const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 10;
camera.position.y = 10;
camera.position.z = 10;

cameraRotationBox.add(camera);
scene.add(cameraRotationBox);

/**
 * Controls
 */
const orbitControls = new OrbitControls(camera, canvas);
// orbitControls.enableDamping = true;
orbitControls.enabled = false;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  camera.lookAt(points.position);

  // Update controls
  // orbitControls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

/**
 * *GSAP
 */
gsap.registerPlugin(ScrollTrigger);

// *First section animation
const firstSectionTimeline = gsap.timeline({});

firstSectionTimeline.fromTo(
  camera.position,
  { x: 0.1, y: 0.1, z: 0.1 },
  { x: 0.1, y: 5, z: 0.01, duration: 1, ease: 'linear' },
  0
);
firstSectionTimeline.fromTo(
  cameraRotationBox.rotation,
  { x: 0, y: 0, z: 0 },
  { x: 0, y: 2 * Math.PI, z: 0, duration: 1, ease: 'linear' },
  0
);

const firstSectionScrollTrigger = ScrollTrigger.create({
  trigger: '#first-section',
  start: 'clamp(top top)',
  end: 'bottom top',
  animation: firstSectionTimeline,
  markers: true,
  scrub: 1,

  onUpdate() {
    const percentageProgress = Math.round(
      firstSectionScrollTrigger.progress * 100
    );
  },
});
// firstSectionScrollTrigger.disable();

// *Second section animation
const secondSectionAnimation = gsap.timeline({});
secondSectionAnimation.fromTo(
  camera.position,
  { x: 0.1, y: 5, z: 0.01 },
  { x: 2, y: -9, z: 2, duration: 1, ease: 'linear' },
  0
);
secondSectionAnimation.fromTo(
  cameraRotationBox.rotation,
  { x: 0, y: 2 * Math.PI, z: 0 },
  { x: 0, y: 2 * 2 * Math.PI, z: 0, duration: 1, ease: 'linear' },
  0
);

const secondSectionScrollTrigger = ScrollTrigger.create({
  trigger: '#second-section',
  start: 'top top',
  end: 'bottom top',
  animation: secondSectionAnimation,
  // markers: true,
  scrub: 1,
  onUpdate() {
    const galaxyCurrentBrunch = Math.ceil(
      secondSectionScrollTrigger.progress * 10 + 2 === 2
        ? 3
        : secondSectionScrollTrigger.progress * 10 + 2
    );
    const galaxyRandomnessPower = Math.ceil(
      secondSectionScrollTrigger.progress * 10 + 3
    );

    parameters.branches = galaxyCurrentBrunch;
    parameters.randomnessPower = galaxyRandomnessPower;

    generateGalaxy();

    console.log(galaxyCurrentBrunch);
  },
});
// secondSectionScrollTrigger.disable();

/**
 * Theatre
 */
studio.initialize();
studio.ui.hide();

const firstSectionProject = core.getProject('First Section', {
  state: firstSectionState,
});
const firstSectioSheet = firstSectionProject.sheet('Sheet');

// Theatre Camera Object
const firstSectionGalaxy = firstSectioSheet.object('Galaxy', {
  position: core.types.compound({
    x: core.types.number(camera.position.x, { range: [-20, 20] }),
    y: core.types.number(camera.position.y, { range: [-20, 20] }),
    z: core.types.number(camera.position.z, { range: [-20, 20] }),
  }),

  rotation: core.types.compound({
    x: core.types.number(cameraRotationBox.rotation.x, {
      range: [-2 * Math.PI, 2 * Math.PI],
    }),
    y: core.types.number(cameraRotationBox.rotation.y, {
      range: [-2 * Math.PI, 2 * Math.PI],
    }),
    z: core.types.number(cameraRotationBox.rotation.z, {
      range: [-2 * Math.PI, 2 * Math.PI],
    }),
  }),
});

firstSectionGalaxy.onValuesChange((values) => {
  const { x: positionX, y: positionY, z: positionZ } = values.position;
  const { x: rotationX, y: rotationY, z: rotationZ } = values.rotation;

  camera.position.set(positionX, positionY, positionZ);

  cameraRotationBox.rotation.set(rotationX, rotationY, rotationZ);
});
