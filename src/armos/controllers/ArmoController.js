import * as THREE from "three";
import { armoConfig } from "../armosConfig";
import {
  getOccupiableCells,
  isValidPlacement,
  addCellsToOccupied,
  isValidStackPlacement,
} from "../utils/utils";

export class ArmoController {
  constructor({ scene, camera, floor, placedObjects }) {
    this.scene = scene;
    this.camera = camera;
    this.floor = floor;
    this.placedObjects = placedObjects;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.lastHit = null;
    this.ghostOffsetX = 0;
    this.ghostOffsetZ = 0;

    this._eventBinder();
  }

  _eventBinder() {
    window.addEventListener("mousemove", (e) => this.ghostPreview(e));
    window.addEventListener("keydown", (e) => this.fineShifter(e));
    window.addEventListener("click", () => this.addArmo());
  }

  fineShifter(e) {
    if (!this.lastHit || this.lastHit.object.name === "ground") return;

    if (e.key === "ArrowLeft") this.ghostOffsetX--;
    if (e.key === "ArrowRight") this.ghostOffsetX++;
    if (e.key === "ArrowUp") this.ghostOffsetZ--;
    if (e.key === "ArrowDown") this.ghostOffsetZ++;
    if (e.key === "Enter") this.addArmo();

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
    this.updateGhost();
  };

  updateGhost() {
    if (!this.lastHit) return;

    const hit = this.lastHit;
    const offsetX = (armoConfig.width - 1) / 2;
    const offsetZ = (armoConfig.depth - 1) / 2;

    if (hit.object.name === "ground") {
      this.floor.highlight.visible = true;

      const x = Math.floor(hit.point.x) + 0.5;
      const z = Math.floor(hit.point.z) + 0.5;

      this.floor.highlight.position.set(x + offsetX, 0.02, z + offsetZ);
      this.floor.highlight.scale.set(armoConfig.width, armoConfig.depth, 1);

      const cells = getOccupiableCells(
        x,
        0,
        z,
        armoConfig.width,
        armoConfig.depth,
      );

      const valid = isValidPlacement(cells);
      this.floor.highlight.material.color.setHex(
        valid ? armoConfig.color : 0xff0000,
      );
    } else if (hit.face.normal.y > 0.9 && hit.object.userData.armoId) {
      this.floor.highlight.visible = true;

      const x = Math.floor(hit.point.x) + 0.5;
      const z = Math.floor(hit.point.z) + 0.5;

      const hitArmoYLevel = hit.object.userData.newYLevel;
      const newYLevel = hitArmoYLevel + 1;

      const worldY = hit.object.position.y + 0.457;

      this.floor.highlight.position.set(
        x + offsetX + this.ghostOffsetX,
        worldY,
        z + offsetZ + this.ghostOffsetZ,
      );
      this.floor.highlight.scale.set(armoConfig.width, armoConfig.depth, 1);

      const cells = getOccupiableCells(
        x + this.ghostOffsetX,
        newYLevel,
        z + this.ghostOffsetZ,
        armoConfig.width,
        armoConfig.depth,
      );
      const valid = isValidStackPlacement(cells);
      this.floor.highlight.material.color.setHex(valid ? 0x00ff00 : 0xff0000);
    } else {
      this.floor.highlight.visible = false;
    }
  }

  addArmo() {
    if (!this.lastHit) return;

    const hit = this.lastHit;
    const offsetX = (armoConfig.width - 1) / 2;
    const offsetZ = (armoConfig.depth - 1) / 2;

    if (hit.object.name === "ground") {
      const point = hit.point;
      const x = Math.floor(point.x) + 0.5;
      const z = Math.floor(point.z) + 0.5;

      const cells = getOccupiableCells(
        x,
        0,
        z,
        armoConfig.width,
        armoConfig.depth,
      );

      if (isValidPlacement(cells)) {
        const armoId = crypto.randomUUID();

        const armo = new THREE.Mesh(
          new THREE.BoxGeometry(armoConfig.width, 0.9, armoConfig.depth),
          new THREE.MeshStandardMaterial({ color: armoConfig.color }),
        );
        armo.position.set(x + offsetX, 0.455, z + offsetZ);
        armo.userData.armoId = armoId;
        armo.userData.newYLevel = 0;

        this.scene.add(armo);
        this.placedObjects.set(armo.userData.armoId, armo);
        addCellsToOccupied(cells, {
          armoId: armoId,
          color: armoConfig.color,
          width: armoConfig.width,
          depth: armoConfig.depth,
        });
      }
    } else if (hit.face.normal.y > 0.9 && hit.object.userData.armoId) {
      const point = hit.point;
      const x = Math.floor(point.x) + 0.5;
      const z = Math.floor(point.z) + 0.5;

      const hitArmoYLevel = hit.object.userData?.newYLevel;
      const newYLevel = hitArmoYLevel + 1;

      const cells = getOccupiableCells(
        x + this.ghostOffsetX,
        newYLevel,
        z + this.ghostOffsetZ,
        armoConfig.width,
        armoConfig.depth,
      );
      if (isValidStackPlacement(cells)) {
        const armoId = crypto.randomUUID();
        const worldY = hit.object.position.y + 0.9;

        const armo = new THREE.Mesh(
          new THREE.BoxGeometry(armoConfig.width, 0.9, armoConfig.depth),
          new THREE.MeshStandardMaterial({ color: armoConfig.color }),
        );
        armo.position.set(
          x + offsetX + this.ghostOffsetX,
          worldY,
          z + offsetZ + this.ghostOffsetZ,
        );
        armo.userData.armoId = armoId;
        armo.userData.newYLevel = newYLevel;

        this.scene.add(armo);
        this.placedObjects.set(armoId, armo);
        addCellsToOccupied(cells, {
          armoId,
          color: armoConfig.color,
          width: armoConfig.width,
          depth: armoConfig.depth,
        });
      }
    }
  }
}
