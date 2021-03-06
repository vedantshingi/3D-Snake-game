// 3D Snake Game
// Lesson Seven: Simplifying drawArena

const CELLS_PER_DIMENSION = 11;
const CELLS_RIGHT_OF_CENTER = (CELLS_PER_DIMENSION - 1) / 2;
const STARTING_NUM_SEGMENTS = 3;
const MS_PER_MOVE = 1000;
const SPEEDUP_FACTOR = 3;
const NUM_BOMB = 2;
const FILL_VICINITY = 3;
let curr_speedup;
let food;
let bombs;
let foodImage;
let bombImage;
let direction;
let segments;
let keyMappings;
let arenaWidth;
let cellWidth;
let zeroVector;
let nextMoveTime;
let rightmostCellCenter;

function preload() {
  foodImage = loadImage('apple.png');
  bombImage = loadImage('bomb.png');
}

function setup() {
  curr_speedup = 1;
  const len = min(windowWidth - 10, windowHeight - 50);
  createCanvas(len, len, WEBGL);
  zeroVector = createVector(0, 0, 0);
  arenaWidth = round(width * 0.6);
  cellWidth = round(arenaWidth / CELLS_PER_DIMENSION);
  rightmostCellCenter = cellWidth * CELLS_RIGHT_OF_CENTER;
  mapKeys();
  setUpState();
}

function draw() {
  if (millis() > nextMoveTime) {
    moveSnake();
    nextMoveTime += keyIsDown(SHIFT) ? MS_PER_MOVE / SPEEDUP_FACTOR : MS_PER_MOVE / curr_speedup;
  }
  moveCameraTo(map(sin(frameCount / 50), -1, 1, 0, -arenaWidth * 0.8), -arenaWidth * 0.8);
  background(255);
  smooth();
  drawArena();
  drawSnake();
  drawFood();
  drawBombs();
}

function mapKeys() {
  const v = createVector;
  const up      = v( 0, -1,  0);
  const down    = v( 0,  1,  0);
  const left    = v(-1,  0,  0);
  const right   = v( 1,  0,  0);
  const away    = v( 0,  0, -1);
  const towards = v( 0,  0,  1);
  keyMappings = {
    'w':          away,
    's':          towards,
    'ArrowLeft':  left,
    'ArrowRight': right,
    'ArrowUp':    up,
    'ArrowDown':  down,
  };
}

function setUpState() {
  direction = createVector(0, 0, 0);
  food = newFoodPosition();
  bombs = newBombsPosition();
  segments = Array.from({length: STARTING_NUM_SEGMENTS}, (v, i) =>
    createVector(-i * cellWidth, 0, 0));
}

function moveCameraTo(x, y) {
  camera(x, y, (height / 2.0) / tan(PI * 30.0 / 180.0), 0, 0, 0, 0, 1, 0);
}

function keyPressed() {
  const requestedDir = keyMappings[key];
  if (requestedDir) {
    const oppositeOfCurrentDir = p5.Vector.mult(direction, -1);
    if (!requestedDir.equals(oppositeOfCurrentDir)) {
      direction = requestedDir;
      if (!nextMoveTime)
        nextMoveTime = millis();
    }
  }
}

function newFoodPosition() {
  const m = CELLS_RIGHT_OF_CENTER;
  const c = () => round(random(-m, m)) * cellWidth;
  return createVector(c(), c(), c());
}

function newBombsPosition() {
  const m = CELLS_RIGHT_OF_CENTER;
  const c = (i) => round(random(max(i-FILL_VICINITY, -m),min(i+FILL_VICINITY,m))) * cellWidth;
  return Array.from({length: NUM_BOMB}, (v, i) =>
    createVector(c(food.x/cellWidth), c(food.y/cellWidth), c(food.z/cellWidth)));
}

function moveSnake() {
  if (!direction.equals(zeroVector)) {
    const newHeadPos = p5.Vector.add(segments[0], p5.Vector.mult(direction, cellWidth));
    if (newPositionWouldLeaveArena(newHeadPos)) {
      setUpState();
    } else if (newPositionWouldHitBomb(newHeadPos)) {
      setUpState();
    } else {
      if (newHeadPos.equals(food)) {
        food = newFoodPosition();
        bombs = newBombsPosition();
        curr_speedup += 0.5
      } else
        segments.pop(); // Discard last
      segments.unshift(newHeadPos); // Put new head on front
    }
  }
}

function newPositionWouldLeaveArena(pos) {
  return !pos.array().every(coord => abs(coord) < arenaWidth / 2);
}

function newPositionWouldHitBomb(pos) {
  for (var i = 0; i < NUM_BOMB; i++) {
    if (pos.equals(bombs[i]))
      return true;
  }
  return false;
}

function drawArena() {
  stroke('gray');
  const l = rightmostCellCenter + cellWidth / 2;
  const s = -l;
  const q = TAU / 4;

  [
    [[0, 0, s], 0, 0],
    [[l, 0, 0], 0, q],
    [[0, l, 0], q, 0],
  ].forEach(xf => {
    const [pos, xRot, yRot] = xf;
    at(...pos, () => {
      rotateX(xRot);
      rotateY(yRot);
      for (let v = s; v <= l; v += cellWidth) {
        line(s, v, 0, l, v, 0);
        line(v, s, 0, v, l, 0);
      }
    });
  });
}

function drawSnake() {
  const segmentWidth = cellWidth * 0.9;
  segments.forEach(segment => {
    stroke('gray');
    fill(0, 255, 0, 70);
    at(...segment.array(), () => box(segmentWidth));

    stroke(0, 255, 0);
    fill(0, 255, 0, 60);
    drawReferenceStructures(segments[0], segmentWidth);
  });
}

function drawFood() {
  noStroke();
  texture(foodImage);
  const itemWidth = cellWidth * 0.8;
  at(...food.array(), () => box(itemWidth));

  stroke(255, 0, 0);
  fill(255, 0, 0, 60);
  drawReferenceStructures(food, itemWidth);
}

function drawBombs() {
  noStroke();
  for (var i = 0; i < NUM_BOMB; i++) {
    texture(bombImage);
    const itemWidth = cellWidth * 0.8;
    at(...bombs[i].array(), () => box(itemWidth));
    fill(255, 0, 0, 60);
  }
}

function drawReferenceStructures(pos, objWidth) {
  const l = arenaWidth / 2; // Largest coordinate value
  const s = -l; // Smallest
  const {x, y, z} = pos;
  line(x, y, z,  l, y, z);
  line(x, y, z,  x, l, z);
  line(x, y, z,  x, y, s);

  noStroke();
  const w = objWidth;
  const f = 0.1; // Length on flat dimension
  at(l, y, z, () => box(f, w, w));
  at(x, l, z, () => box(w, f, w));
  at(x, y, s, () => box(w, w, f));
}

function at(x, y, z, fn) {
  push();
  translate(x, y, z);
  fn();
  pop();
}
