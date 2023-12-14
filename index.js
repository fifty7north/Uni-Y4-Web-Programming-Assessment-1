"use strict";
const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const Box2D = require("box2dweb-commonjs").Box2D;

let b2Vec2 = Box2D.Common.Math.b2Vec2;
let b2AABB = Box2D.Collision.b2AABB;
let b2BodyDef = Box2D.Dynamics.b2BodyDef;
let b2Body = Box2D.Dynamics.b2Body;
let b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
let b2Fixture = Box2D.Dynamics.b2Fixture;
let b2World = Box2D.Dynamics.b2World;
let b2MassData = Box2D.Collision.Shapes.b2MassData;
let b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
let b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
let b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
let b2MouseJointDef = Box2D.Dynamics.Joints.b2MouseJointDef;
let b2EdgeShape = Box2D.Collision.Shapes.b2EdgeShape;

const destroylist = []; // Empty List at start

let connections = [];
let world;
const SCALE = 30;
const WIDTH = 1200;
const HEIGHT = 800;
const OFFSET = 90;
let fps = 65;
let interval;

function createAnObject(
  objid,
  x,
  y,
  dims,
  angle,
  density,
  friction,
  restitution,
  iscircle,
  isstatic
) {
  let bodyDef = new b2BodyDef();
  bodyDef.type = isstatic ? b2Body.b2_staticBody : b2Body.b2_dynamicBody;
  bodyDef.position.x = x / SCALE;
  bodyDef.position.y = y / SCALE;
  bodyDef.angle = angle;
  bodyDef.fixedRotation = true;
  let fixDef = new b2FixtureDef();
  fixDef.density = density;
  fixDef.friction = friction;
  fixDef.restitution = restitution;
  let width, height;
  if (iscircle) {
    fixDef.shape = new b2CircleShape(dims.radius / SCALE);
    width = dims.radius * 2;
    height = dims.radius * 2;
  } else {
    fixDef.shape = new b2PolygonShape();
    fixDef.shape.SetAsBox(dims.width / SCALE, dims.height / SCALE);
    width = dims.width;
    height = dims.height;
  }
  let thisobj = world.CreateBody(bodyDef).CreateFixture(fixDef);
  thisobj.GetBody().SetUserData({
    id: objid,
    width: width,
    height: height,
    iscircle: iscircle,
  });
  return thisobj;
}

function drawDOMObjects() {
  let ret = [];
  for (let b = world.GetBodyList(); b; b = b.GetNext()) {
    for (let f = b.GetFixtureList(); f; f = f.GetNext()) {
      let id = f.GetBody().GetUserData().id;
      let x = Math.round(f.GetBody().GetPosition().x * SCALE);
      let y = Math.round(f.GetBody().GetPosition().y * SCALE);
      let r = Math.round(f.GetBody().GetAngle() * 100) / 100;
      let iscircle = f.GetBody().GetUserData().iscircle;
      let objwidth = Math.round(f.GetBody().GetUserData().width);
      let objheight = Math.round(f.GetBody().GetUserData().height);
      ret.push({
        id: id,
        x: x,
        y: y,
        r: r,
        iscircle: iscircle,
        objwidth: objwidth,
        objheight: objheight,
      });
    }
  }
  return ret;
}

/**
 *
 */

function update() {
  world.Step(1 / fps, 10, 10);

  io.sockets.emit("objdata", drawDOMObjects());
  world.ClearForces();
}

function init() {
  world = new b2World(new b2Vec2(0, 9.81), true);

  //Create canvas borders
  createAnObject(
    "ground",
    0,
    HEIGHT,
    { width: WIDTH, height: 5 },
    0,
    1,
    1,
    1,
    false,
    true
  );
  createAnObject(
    "border",
    0,
    0,
    { width: 5, height: HEIGHT * 10 },
    0,
    1,
    1,
    1,
    false,
    true
  );
  createAnObject(
    "border",
    WIDTH,
    0,
    { width: 5, height: HEIGHT * 10 },
    0,
    1,
    1,
    1,
    false,
    true
  );

  spawnDiver();
  spawnHoop();

  interval = setInterval(() => {
    update();
  }, 1000 / fps);
  update();

  var destroyListener = new Box2D.Dynamics.b2ContactListener();
  destroyListener.BeginContact = function (contact) {
    var fixa = contact.GetFixtureA().GetBody().GetUserData().id;
    var fixb = contact.GetFixtureB().GetBody().GetUserData().id;
    console.log("fixA: " + fixa + " fixB: " + fixb);
    if (
      (fixa == "diver" && fixb == "ground") ||
      (fixa == "ground" && fixb == "diver")
    ) {
      console.log("ground");
    }
  };
  world.SetContactListener(destroyListener);
}

/**
 * Object spawn functions
 */

function spawnDiver() {
  createAnObject(
    "diver",
    Math.random() * WIDTH - 25,
    0,
    { radius: 15 },
    0,
    1,
    1,
    1,
    true,
    false
  );
}

function spawnHoop() {
  var hoopAngle = Math.floor(Math.random() * 2) * 90 * (Math.PI / 180);
  var hoopSpawnChance = Math.floor(Math.random() * 100) + 1;
  if (hoopSpawnChance > 85) {
    //15% chance for gold hoop, small length big points
    createAnObject(
      "goldHoop",
      Math.random() * (WIDTH - 50),
      Math.random() * (HEIGHT / 2 - 50) - OFFSET,
      { width: 50, height: 10 },
      hoopAngle,
      1,
      1,
      1,
      false,
      true
    );
  } else if (hoopSpawnChance > 50) {
    //35% chance for silver hoop, mid length mid points
    createAnObject(
      "silverHoop",
      Math.random() * (WIDTH - 75),
      Math.random() * (HEIGHT / 2 - 75) - OFFSET,
      { width: 75, height: 10 },
      hoopAngle,
      1,
      1,
      1,
      false,
      true
    );
  } else {
    //50% chance for bronze hoop, big length small points
    createAnObject(
      "bronzeHoop",
      Math.random() * (WIDTH - 100),
      Math.random() * (HEIGHT / 2 - 100) - OFFSET,
      { width: 100, height: 10 },
      hoopAngle,
      1,
      1,
      1,
      false,
      true
    );
  }
}

/**
 *
 */

app.use(express.static("public"));
app.use("/js", express.static(__dirname + "public/js"));
app.use("/css", express.static(__dirname + "public/css"));
app.use("/assets", express.static(__dirname + "public/assets"));

http.listen(8000, function () {
  console.log("server up on * 8000");
  io.on("connection", function (socket) {
    //Live player count
    connections.push(socket);
    socket.emit("playerCount", connections.length);

    socket.on("disconnect", () => {
      connections.pop();
      socket.emit("playerCount", connections.length);
    });
    setInterval(() => {
      socket.emit("playerCount", connections.length);
    }, 1000);

    // * Mouse controls
    var drawTrampoline = false; //used to draw trampoline when set to true
    var trampolineX1, trampolineY1, trampolineX2, trampolineY2; //used to calculate trampoline length between mouse click and mouse release
    socket.on("mousedown", (mousePosX1, mousePosY1) => {
      trampolineX1 = mousePosX1;
      trampolineY1 = mousePosY1;
      if (trampolineY1 > 400) {
        //if mouse click happens in bottom half of canvas, allow trampoline to be drawn
        drawTrampoline = true;
      } else {
        //if mouse click happens in top half of canvas, message to console
        console.log("can't start drawing trampoline here");
      }
    });
    socket.on("mouseup", (mousePosX1, mousePosY1) => {
      //Get mouse coordinates on mouse left button release
      trampolineX2 = mousePosX1;
      trampolineY2 = mousePosY1;
      if (trampolineX1 == trampolineX2 && trampolineY1 == trampolineY2) {
        //Stops crash when creating 0 length trampoline by stopping trampoline being drawn and sending message to console
        drawTrampoline = false;
        console.log("trampoline too short");
      } else if (trampolineY2 > 400 && drawTrampoline) {
        //If mouse released in bottom half of canvas, draws trampoline
        var trampolineLength = Math.sqrt(
          (trampolineX2 - trampolineX1) ** 2 +
            (trampolineY2 - trampolineY1) ** 2
        );
        var trampolineAngle = Math.atan(
          (trampolineY2 - trampolineY1) / (trampolineX2 - trampolineX1)
        );
        //Sets restitution value to be determined by y coords, the further the trampoline is up the canvas the less restitution it has
        var trampolineRestitution = (trampolineY1 + trampolineY2) / 1600 + 0.25;

        if (trampolineLength > 500) {
          trampolineLength = 500;
          if (trampolineX1 < trampolineX2) {
            createAnObject(
              "trampoline",
              (trampolineX1 + trampolineX2) / 2 - 250,
              (trampolineY1 + trampolineY2) / 2,
              { width: trampolineLength / 2, height: 10 },
              trampolineAngle,
              1,
              1,
              trampolineRestitution,
              false,
              true
            );
          } else if (trampolineX1 > trampolineX2) {
            createAnObject(
              "trampoline",
              (trampolineX1 + trampolineX2) / 2 + 250,
              (trampolineY1 + trampolineY2) / 2,
              { width: trampolineLength / 2, height: 10 },
              trampolineAngle,
              1,
              1,
              trampolineRestitution,
              false,
              true
            );
          }
        } else {
          createAnObject(
            "trampoline",
            (trampolineX1 + trampolineX2) / 2,
            (trampolineY1 + trampolineY2) / 2 - OFFSET,
            { width: trampolineLength / 2, height: 10 },
            trampolineAngle,
            1,
            1,
            trampolineRestitution,
            false,
            true
          );
        }
      } else {
        //If mouse released in top half on canvas or unknown error occurs, messages console
        drawTrampoline = false;
        console.log("can't draw trampoline here");
      }
    });
  });
});

init();
