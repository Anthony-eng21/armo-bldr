"use strict";
import * as THREE from "three";
import { armoConfig } from "../armos/armosConfig";
import { GRID_SIZE } from "../armos/utils/utils.js";

export default function Flooring(size = GRID_SIZE) {
  const group = new THREE.Group();

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      color: 0xfbbbbbb,
    }),
  );
  plane.rotateX(-Math.PI / 2);
  plane.name = "ground";
  group.add(plane);

  const grid = new THREE.GridHelper(size, size, 0x777b7a, 0x9ea5a5);
  grid.position.y = 0.01;
  group.add(grid);

  const highlight = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      color: armoConfig.color,
      transparent: true,
      opacity: 0.5,
    }),
  );
  highlight.rotateX(-Math.PI / 2);
  highlight.position.y = 0.02;
  highlight.visible = false;
  group.add(highlight);

  return { group, plane, highlight };
}
