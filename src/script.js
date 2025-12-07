"use strict";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Flooring from "./flooring/flooring";
import GUI from "lil-gui";
import { armoConfig } from "./armos/armosConfig";
import {
  getOccupiableCells,
  isValidPlacement,
  addCellsToOccupied,
  isValidStackPlacement,
} from "./armos/utils/utils";

const gui = new GUI();
gui.add(armoConfig, "studsWidth", 1, 16, 1);
gui.add(armoConfig, "studsDepth", 1, 16, 1);
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
camera.position.set(6, 8, 6);
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
renderer.setClearColor(0x464f5e);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

const placedObjects = new Map();

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let ghostOffsetX = 0;
let ghostOffsetZ = 0;

const fineShifter = (e) => {
  if (!lastHit || lastHit.object.name === "ground") return;

  if (e.key === "ArrowLeft" || e.key === "a") ghostOffsetX--;
  if (e.key === "ArrowRight" || e.key === "d") ghostOffsetX++;
  if (e.key === "ArrowUp" || e.key === "w") ghostOffsetZ--;
  if (e.key === "ArrowDown" || e.key === "s") ghostOffsetZ++;
  if (e.key === "Enter") addArmo();

  updateGhost();
};
window.addEventListener("keydown", fineShifter);

let lastHit = null;

const ghostPreview = (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects([
    floor.plane,
    ...placedObjects.values(),
  ]);

  if (hits.length === 0) {
    floor.highlight.visible = false;
    lastHit = null;
    ghostOffsetX = 0;
    ghostOffsetZ = 0;
    return;
  }

  lastHit = hits[0];
  ghostOffsetX = 0;
  ghostOffsetZ = 0;
  updateGhost();
};

window.addEventListener("mousemove", ghostPreview);

function updateGhost() {
  if (!lastHit) return;

  const hit = lastHit;
  const offsetX = (armoConfig.studsWidth - 1) / 2;
  const offsetZ = (armoConfig.studsDepth - 1) / 2;

  if (hit.object.name === "ground") {
    floor.highlight.visible = true;

    const x = Math.floor(hit.point.x) + 0.5;
    const z = Math.floor(hit.point.z) + 0.5;

    floor.highlight.position.set(x + offsetX, 0.02, z + offsetZ);
    floor.highlight.scale.set(armoConfig.studsWidth, armoConfig.studsDepth, 1);

    const cells = getOccupiableCells(
      x,
      0,
      z,
      armoConfig.studsWidth,
      armoConfig.studsDepth,
    );
    const valid = isValidPlacement(cells);
    floor.highlight.material.color.setHex(valid ? 0x00ff00 : 0xff0000);
  } else if (hit.face.normal.y > 0.9 && hit.object.userData.armoId) {
    floor.highlight.visible = true;

    const x = Math.floor(hit.point.x) + 0.5;
    const z = Math.floor(hit.point.z) + 0.5;

    const hitArmoYLevel = hit.object.userData.newYLevel;
    const newYLevel = hitArmoYLevel + 1;

    const worldY = hit.object.position.y + 0.457;

    floor.highlight.position.set(
      x + offsetX + ghostOffsetX,
      worldY,
      z + offsetZ + ghostOffsetZ,
    );
    floor.highlight.scale.set(armoConfig.studsWidth, armoConfig.studsDepth, 1);

    // Validate stack placement
    const cells = getOccupiableCells(
      x + ghostOffsetX,
      newYLevel,
      z + ghostOffsetZ,
      armoConfig.studsWidth,
      armoConfig.studsDepth,
    );
    const valid = isValidStackPlacement(cells);
    floor.highlight.material.color.setHex(valid ? 0x00ff00 : 0xff0000);
  } else {
    floor.highlight.visible = false;
  }
}

const addArmo = (e) => {
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects([
    floor.plane,
    ...placedObjects.values(),
  ]);
  const offsetX = (armoConfig.studsWidth - 1) / 2;
  const offsetZ = (armoConfig.studsDepth - 1) / 2;

  if (hits[0].object.name === "ground") {
    const point = hits[0].point;
    const x = Math.floor(point.x) + 0.5;
    const z = Math.floor(point.z) + 0.5;

    const cells = getOccupiableCells(
      x,
      0,
      z,
      armoConfig.studsWidth,
      armoConfig.studsDepth,
    );

    if (isValidPlacement(cells)) {
      const armoId = crypto.randomUUID();

      const armo = new THREE.Mesh(
        new THREE.BoxGeometry(
          armoConfig.studsWidth,
          0.9,
          armoConfig.studsDepth,
        ),
        new THREE.MeshStandardMaterial({ color: armoConfig.color }),
      );
      armo.position.set(x + offsetX, 0.455, z + offsetZ);
      armo.userData.armoId = armoId;
      armo.userData.newYLevel = 0;

      scene.add(armo);
      placedObjects.set(armo.userData.armoId, armo);
      addCellsToOccupied(cells, {
        armoId: armoId,
        color: armoConfig.color,
        width: armoConfig.studsWidth,
        depth: armoConfig.studsDepth,
      });
    }
  } else if (hits[0].face.normal.y > 0.9 && hits[0].object.userData.armoId) {
    const point = hits[0].point;
    const x = Math.floor(point.x) + 0.5;
    const z = Math.floor(point.z) + 0.5;

    const hitArmoYLevel = hits[0].object.userData?.newYLevel;
    const newYLevel = hitArmoYLevel + 1;

    const cells = getOccupiableCells(
      x + ghostOffsetX,
      newYLevel,
      z + ghostOffsetZ,
      armoConfig.studsWidth,
      armoConfig.studsDepth,
    );
    if (isValidStackPlacement(cells)) {
      const armoId = crypto.randomUUID();
      const worldY = hits[0].object.position.y + 0.9;

      const armo = new THREE.Mesh(
        new THREE.BoxGeometry(
          armoConfig.studsWidth,
          0.9,
          armoConfig.studsDepth,
        ),
        new THREE.MeshStandardMaterial({ color: armoConfig.color }),
      );
      armo.position.set(
        x + offsetX + ghostOffsetX,
        worldY,
        z + offsetZ + ghostOffsetZ,
      );
      armo.userData.armoId = armoId;
      armo.userData.newYLevel = newYLevel;

      scene.add(armo);
      placedObjects.set(armoId, armo);
      addCellsToOccupied(cells, {
        armoId,
        color: armoConfig.color,
        width: armoConfig.studsWidth,
        depth: armoConfig.studsDepth,
      });
    }
  }
};

window.addEventListener("click", addArmo);

function tick() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();
