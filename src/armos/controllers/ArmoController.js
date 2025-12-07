import * as THREE from "three";
import { armoConfig } from "../armosConfig";
import {
  getOccupiableCells,
  isValidPlacement,
  addCellsToOccupied,
  isValidStackPlacement,
} from "../utils/utils";

export class ArmoController {
  constructor({ scene, camera, floor, placedObjects, gui }) {
    this.scene = scene;
    this.camera = camera;
    this.floor = floor;
    this.placedObjects = placedObjects;
    this.gui = gui;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.lastHit = null;
    this.ghostOffsetX = 0;
    this.ghostOffsetZ = 0;
    this.ghostOffsetY = 0;

    this._eventBinder();
  }

  _eventBinder() {
    window.addEventListener("mousemove", (e) => this.ghostPreview(e));
    window.addEventListener("keydown", (e) => this.fineShifter(e));
    window.addEventListener("click", () => this.addArmo());
  }

  fineShifter(e) {
    if (!this.lastHit) return;

    if (e.key === "ArrowLeft" || e.key === "a") this.ghostOffsetX--;
    if (e.key === "ArrowRight" || e.key === "d") this.ghostOffsetX++;
    if (e.key === "ArrowUp" || e.key === "w") this.ghostOffsetZ--;
    if (e.key === "ArrowDown" || e.key === "s") this.ghostOffsetZ++;
    if (e.key === "q") this.ghostOffsetY--;
    if (e.key === "e") this.ghostOffsetY++;
    if (e.key === "Enter") this.addArmo();

    if (e.key === "R") {
      this.flip();
      return;
    }

    this.updateGhost();
  }

  ghostPreview = (e) => {
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObjects([
      this.floor.plane,
      ...this.placedObjects.values(),
    ]);

    if (hits.length === 0) {
      this.floor.highlight.visible = false;
      this.lastHit = null;
      this.ghostOffsetX = 0;
      this.ghostOffsetZ = 0;
      return;
    }

    this.lastHit = hits[0];
    this.ghostOffsetX = 0;
    this.ghostOffsetZ = 0;
    this.ghostOffsetY = 0;
    this.updateGhost();
  };

  updateGhost() {
    if (!this.lastHit) return;
    const hit = this.lastHit;

    if (hit.object.name !== "ground" && hit.face.normal.y <= 0.9) {
      this.floor.highlight.visible = false;
      return;
    }

    const currWidth = armoConfig.width;
    const currDepth = armoConfig.depth;
    const offsetX = (currWidth - 1) / 2;
    const offsetZ = (currDepth - 1) / 2;

    const x = Math.floor(hit.point.x) + 0.5;
    const z = Math.floor(hit.point.z) + 0.5;

    const yLevel =
      hit.object.name === "ground" ? 0 : hit.object.userData.newYLevel + 1;

    const newYLevel = yLevel + this.ghostOffsetY;

    // If newYLevel becomes negative, reset ghostOffsetY to -baseYLevel.
    // This forces newYLevel to 0 on the next updateGhost() call (baseYLevel + (-baseYLevel) = 0).
    if (newYLevel < 0) {
      const yMinLevel = -yLevel;
      this.ghostOffsetY = yMinLevel;
      this.updateGhost();
      return;
    }

    const hightlightWorldY = newYLevel === 0 ? 0.02 : 0.02 + newYLevel * 0.9;

    this.floor.highlight.visible = true;
    this.floor.highlight.position.set(
      x + offsetX + this.ghostOffsetX,
      hightlightWorldY,
      z + offsetZ + this.ghostOffsetZ,
    );
    this.floor.highlight.scale.set(currWidth, currDepth, 1);

    const cells = getOccupiableCells(
      x + this.ghostOffsetX,
      newYLevel,
      z + this.ghostOffsetZ,
      currWidth,
      currDepth,
    );

    const valid =
      newYLevel === 0 ? isValidPlacement(cells) : isValidStackPlacement(cells);

    this.floor.highlight.material.color.setHex(valid ? 0x00ff00 : 0xff0000);
  }

  addArmo() {
    if (!this.lastHit) return;
    const hit = this.lastHit;
    if (hit.object.name !== "ground" && hit.face.normal.y <= 0.9) return;

    const currWidth = armoConfig.width;
    const currDepth = armoConfig.depth;
    const offsetX = (currWidth - 1) / 2;
    const offsetZ = (currDepth - 1) / 2;

    const x = Math.floor(hit.point.x) + 0.5;
    const z = Math.floor(hit.point.z) + 0.5;

    const yLevel =
      hit.object.name === "ground" ? 0 : hit.object.userData.newYLevel + 1;
    const newYLevel = yLevel + this.ghostOffsetY;

    if (newYLevel < 0) return;

    const cells = getOccupiableCells(
      x + this.ghostOffsetX,
      newYLevel,
      z + this.ghostOffsetZ,
      currWidth,
      currDepth,
    );

    const valid =
      newYLevel === 0 ? isValidPlacement(cells) : isValidStackPlacement(cells);

    if (!valid) return;

    const armoWorldY = 0.455 + newYLevel * 0.9;

    const armoId = crypto.randomUUID();
    const armo = new THREE.Mesh(
      new THREE.BoxGeometry(currWidth, 0.9, currDepth),
      new THREE.MeshStandardMaterial({ color: armoConfig.color }),
    );

    armo.position.set(
      x + offsetX + this.ghostOffsetX,
      armoWorldY,
      z + offsetZ + this.ghostOffsetZ,
    );
    armo.userData.armoId = armoId;
    armo.userData.newYLevel = newYLevel;

    this.scene.add(armo);
    this.placedObjects.set(armoId, armo);
    addCellsToOccupied(cells, {
      armoId,
      color: armoConfig.color,
      width: currWidth,
      depth: currDepth,
    });

    this._recast(armo);
  }

  _recast(placed) {
    const offsetX = (armoConfig.width - 1) / 2;
    const offsetZ = (armoConfig.depth - 1) / 2;

    const cornerX = placed.position.x - offsetX;
    const cornerZ = placed.position.z - offsetZ;

    this.floor.highlight.position.set(
      placed.position.x,
      placed.position.y + 0.457,
      placed.position.z,
    );
    this.floor.highlight.visible = true;

    this.lastHit = {
      object: placed,
      point: new THREE.Vector3(cornerX, placed.position.y, cornerZ),
      face: { normal: { y: 1 } },
    };

    this.ghostOffsetX = 0;
    this.ghostOffsetZ = 0;
    this.ghostOffsetY = 0;
  }

  flip() {
    const swap = armoConfig.width;
    armoConfig.width = armoConfig.depth;
    armoConfig.depth = swap;

    if (this.gui) {
      this.gui.controllers.forEach((controller) => controller.updateDisplay());
    }

    this.updateGhost();
  }
}
