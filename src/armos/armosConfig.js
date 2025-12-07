const randIntRange = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const randomArmoWidth = randIntRange(1, 3);
const randomArmoDepth = randIntRange(2, 5);

export const armoConfig = {
  width: randomArmoWidth,
  depth: randomArmoDepth,
  color: 0xe6e6e6,
};
