const occupiedCells = new Map();
const GRID_SIZE = 32;

export function getOccupiableCells(
  cornerX,
  cornerY,
  cornerZ,
  studsWidth,
  studsDepth,
) {
  const cells = [];
  for (let x = 0; x < studsWidth; x++) {
    for (let z = 0; z < studsDepth; z++) {
      cells.push({
        x: cornerX + x,
        y: cornerY,
        z: cornerZ + z,
      });
    }
  }
  return cells;
}

export function isValidPlacement(cells, gridSize = GRID_SIZE) {
  const halfGrid = gridSize / 2;

  return cells.every((cell) => {
    const inBounds =
      cell.x >= -halfGrid &&
      cell.x < halfGrid &&
      cell.z >= -halfGrid &&
      cell.z < halfGrid;

    const notOccupied = !occupiedCells.has(`${cell.x},${cell.y},${cell.z}`);

    return inBounds && notOccupied;
  });
}

export function isValidStackPlacement(cells, gridSize = GRID_SIZE) {
  const halfGrid = gridSize / 2;

  const allInBounds = cells.every((cell) => {
    return (
      cell.x >= -halfGrid &&
      cell.x < halfGrid &&
      cell.z >= -halfGrid &&
      cell.z < halfGrid
    );
  });

  if (!allInBounds) return false;

  const noOverlap = cells.every((cell) => {
    return !occupiedCells.has(`${cell.x},${cell.y},${cell.z}`);
  });

  if (!noOverlap) return false;

  const hasSupport = cells.some((cell) => {
    const belowKey = `${cell.x},${cell.y - 1},${cell.z}`;
    return occupiedCells.has(belowKey);
  });

  return hasSupport;
}

export function addCellsToOccupied(cells, armoData) {
  cells.forEach((cell) => {
    occupiedCells.set(`${cell.x},${cell.y},${cell.z}`, armoData);
  });
}
