const occupiedCells = new Map();
const GRID_SIZE = 32;

export function getOccupiableCells(
  cornerX,
  cornerY,
  cornerZ,
  brickWidth,
  brickDepth,
) {
  const cells = [];
  for (let x = 0; x < brickWidth; x++) {
    for (let z = 0; z < brickDepth; z++) {
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

  //  if (!allInBounds) return false;

  const notOccupied = cells.every((cell) => {
    return !occupiedCells.has(`${cell.x},${cell.y},${cell.z}`);
  });

  if (!notOccupied) return false;

  const hasSupport = cells.some((cell) => {
    const belowKey = `${cell.x},${cell.y - 1},${cell.z}`;
    const aboveKey = `${cell.x},${cell.y + 1},${cell.z}`;
    return occupiedCells.has(belowKey) || occupiedCells.has(aboveKey);
  });

  return hasSupport;
}

export function addCellsToOccupied(cells, armoData) {
  cells.forEach((cell) => {
    occupiedCells.set(`${cell.x},${cell.y},${cell.z}`, armoData);
  });
}

export { GRID_SIZE };
