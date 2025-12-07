"use strict";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Flooring from "./flooring/flooring";
import GUI from "lil-gui";
import { armoConfig } from "./armos/armosConfig";
import { ArmoController } from "./armos/controllers/ArmoController";
import { GRID_SIZE } from "./armos/utils/utils";

const gui = new GUI();
gui.add(armoConfig, "width", 1, GRID_SIZE, 1);
gui.add(armoConfig, "depth", 1, GRID_SIZE, 1);
gui.addColor(armoConfig, "color");

const canvas = document.querySelector("canvas.webgl");
const scene = new THREE.Scene();

const floor = Flooring();
scene.add(floor.group);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(0, 9, 9);
camera.lookAt(0, 0, 0);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

const controls = new OrbitControls(camera, canvas);
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI * 0.4;
controls.mouseButtons.RIGHT = null;

const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0xd3d3d3);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

const placedObjects = new Map();
new ArmoController({ scene, camera, floor, placedObjects, gui });

function tick() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();
