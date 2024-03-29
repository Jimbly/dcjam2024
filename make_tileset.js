/* eslint max-len:off */
const assert = require('assert');
const fs = require('fs');

function output(filename, content) {
  content = content.trim();
  assert(content);
  content += '\n';
  // assert(!fs.existsSync(filename));
  console.log(filename);
  fs.writeFileSync(filename, content);
}

const DOOR = 1;
const SECRETDOOR = 2;
const SOLID = 3;
// const CEILING = 4;
const FLOOR = 5;
const DETAIL = 6;
const MEDKIT = 7;
const NOTE = 8;
const TERMINAL = 9;
const STAIRS = 10;
const WALLDETAIL = 11;
let sheet = 'ship3';
let files = {
  capsule: [DETAIL, 'floor1'],
  door: [DOOR],
  floor1: [FLOOR, 'ceiling1'],
  floor2: [FLOOR, 'ceiling2'],
  floor3: [FLOOR,'ceiling3'],
  pipe_horiz: [WALLDETAIL, 'solid3'],
  pipe_vert: [WALLDETAIL, 'solid4'],
  secret: [SECRETDOOR],
  solid4: [SOLID],
  solid1: [SOLID],
  solid2: [SOLID],
  solid3: [SOLID],
  stairs_down: [STAIRS],
  stairs_up: [STAIRS],
  window: [SOLID],
};

let vstyle = `
---
fog_color: '#191c0e'
background_color: '#191c0e'
background_img: space1
fog_params:
- 0.003
- 0.0005
- 800.0
cell_swaps:
  open: ${sheet}_open
wall_swaps:
  open: demo_open
  door: ${sheet}_door
  door_oneway: ${sheet}_door
  door_locked: demo_door_locked
  door_locked_unlocked: demo_door_locked_unlocked
  secret_door: ${sheet}_secret_door
  secret_door_unvisited: ${sheet}_secret_door
  solid: ${sheet}_solid
  stairs_in: ${files.stairs_in ? sheet : 'ship2'}_stairs_in
  stairs_out: ${files.stairs_in ? sheet : 'ship2'}_stairs_out
`.trim();

let did = {};

for (let filename in files) {
  let [type, extra1, extra2] = files[filename];
  let cat;
  let content;
  if (type === DOOR) {
    if (!did[type]) {
      vstyle = vstyle.replace(`  door: ${sheet}_door`, `  door: ${sheet}_${filename}`);
      vstyle = vstyle.replace(`  door_oneway: ${sheet}_door`, `  door_oneway: ${sheet}_${filename}`);
    }
    cat = 'wall';
    content = `
---
open_move: true
open_vis: false
advertise_other_side: true
map_view_wall_frames_from: door
visuals:
  type: simple_wall
  opts:
    spritesheet: ${sheet}
    tile: ${filename}
`;
  } else if (type === WALLDETAIL) {
    assert(extra1);
    cat = 'wall';
    content = `
---
open_move: false
open_vis: false
advertise_other_side: false
map_view_wall_frames_from: solid
visuals:
- type: simple_wall
  opts:
    spritesheet: ${sheet}
    tile: ${extra1}
- pass: default
  detail_layer: 1
  type: simple_wall
  opts:
    spritesheet: ${sheet}
    tile: ${filename}
`;
  } else if (type === SECRETDOOR) {
    if (!did[type]) {
      vstyle = vstyle.replace(`secret_door: ${sheet}_secret_door`, `secret_door: ${sheet}_${filename}`);
      vstyle = vstyle.replace(`secret_door_unvisited: ${sheet}_secret_door`, `secret_door_unvisited: ${sheet}_${filename}`);
    }
    cat = 'wall';
    content = `
---
open_move: true
open_vis: false
is_secret: true
visuals:
- type: simple_wall
  opts:
    spritesheet: ${sheet}
    tile: ${filename}
replace:
  - func: UNVISITED
    name: secret_door_unvisited
`;
  } else if (type === SOLID) {
    if (!did[type]) {
      vstyle = vstyle.replace(`solid: ${sheet}_solid`, `solid: ${sheet}_${filename}`);
    }
    cat = 'wall';
    content = `
---
open_move: false
open_vis: false
map_view_wall_frames_from: solid
visuals:
- type: simple_wall
  opts:
    spritesheet: ${sheet}
    tile: ${filename}
`;
  } else if (type === STAIRS) {
    cat = 'wall';
    content = `
---
open_move: true
open_vis: false
map_view_wall_frames_from: 'door'
visuals:
  type: simple_wall
  opts:
    spritesheet: ${sheet}
    tile: ${filename}
`;
  } else if (type === FLOOR) {
    if (!did[type]) {
      vstyle = vstyle.replace(`open: ${sheet}_open`, `open: ${sheet}_${filename}`);
    }
    cat = 'cell';
    content = `
---
open_vis: true
default_wall: solid

visuals:
- pass: bg
  type: simple_floor
  opts:
    spritesheet: ${sheet}
    tile: ${filename}
`.trim();
    if (extra1) {
      content = `${content}
- pass: bg
  type: simple_ceiling
  opts:
    spritesheet: ${sheet}
    tile: ${extra1}
`;
    }
  } else if (type === DETAIL || type === MEDKIT || type === NOTE || type === TERMINAL) {
    assert(extra1);
    cat = 'cell';
    content = `
---
open_move: true
open_vis: true
default_wall: solid
${type === MEDKIT ? 'default_events:\n- dialog medkit' :
  type === NOTE ? 'default_events:\n- dialog note MSG' :
  type === TERMINAL ? 'default_events:\n- dialog terminal MSG' : ''}
visuals:
`.trim();
    if (extra2) {
      content = `${content}
- pass: bg
  type: simple_ceiling
  opts:
    spritesheet: ${sheet}
    tile: ${extra2}
`.trim();
    }
    content = `${content}
- pass: bg
  type: simple_floor
  opts:
    spritesheet: ${sheet}
    tile: ${extra1}
- type: simple_billboard
  opts:
    spritesheet: ${sheet}
    tile: ${filename}
    offs: [0, 0, 0]
    face_camera: false # Otherwise faces frustum
`;
  }
  if (!did[type]) {
    did[type] = filename;
  }

  output(`src/client/${cat}s/${sheet}_${filename}.${cat}def`, content);
}

if (!did[NOTE]) {
  output(`src/client/cells/${sheet}_note.celldef`, `
---
open_move: true
open_vis: true
default_wall: solid
default_events:
- dialog note MSG
visuals:
# - pass: bg
#   type: simple_ceiling
#   opts:
#     spritesheet: ${sheet}
#     tile: ceiling
- pass: bg
  type: simple_floor
  opts:
    spritesheet: ${sheet}
    tile: ${did[FLOOR]}
- pass: default
  detail_layer: 1
  type: simple_floor
  opts:
    spritesheet: ship2
    tile: note
`.trim());
}
if (!did[TERMINAL]) {
  output(`src/client/cells/${sheet}_terminal.celldef`, `
---
open_move: true
open_vis: true
default_wall: solid
default_events:
- dialog terminal MSG
visuals:
# - pass: bg
#   type: simple_ceiling
#   opts:
#     spritesheet: ${sheet}
#     tile: ceiling
- pass: bg
  type: simple_floor
  opts:
    spritesheet: ${sheet}
    tile: ${did[FLOOR]}
- type: simple_billboard
  opts:
    spritesheet: ship2
    tile:
    - terminal1
    - terminal2
    - terminal3
    - terminal4
    - terminal5
    times: 500
    do_blend: 500
    offs: [0, 0, -0.158]
    face_camera: false # Otherwise faces frustum
`.trim());
}
if (!did[MEDKIT]) {
  output(`src/client/cells/${sheet}_medkit.celldef`, `
---
open_move: true
open_vis: true
# map_view_detail_frame: 27
default_wall: solid
default_events:
- dialog medkit
visuals:
# - pass: bg
#   type: simple_ceiling
#   opts:
#     spritesheet: ${sheet}
#     tile: ceiling
- pass: bg
  type: simple_floor
  opts:
    spritesheet: ${sheet}
    tile: ${did[FLOOR]}
- type: simple_billboard
  opts:
    spritesheet: ship2
    tile: medkit
    offs: [0, 0, 0]
    face_camera: false # Otherwise faces frustum
`);
}
output(`src/client/walls/${sheet}_solitude_door.walldef`, `
---
open_move: true
open_vis: false
advertise_other_side: true
map_view_wall_frames_from: door
visuals:
- type: simple_wall
  opts:
    spritesheet: ${sheet}
    tile: ${did[SOLID]}
- type: simple_wall
  opts:
    spritesheet: solitude
    tile: gateway
`);

output(`src/client/vstyles/${sheet}.vstyle`, vstyle);
