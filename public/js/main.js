"use strict";
let socket = io();

/**
 * EaselJS Globals
 */

let easelCan, easelCtx, loader, stage, stagewidth, stageheight;
let timestamps = [];
let framerate = 60;
let datastamps = [];
let objs = [];

let R2D = 180 / Math.PI;

function init() {
  easelCan = document.getElementById("easelcan");
  easelCtx = easelCan.getContext("2d");
  stage = new createjs.Stage(easelCan);
  stage.snapPixelsEnabled = true;
  stagewidth = stage.canvas.width;
  stageheight = stage.canvas.height;
  let manifest = [
    { src: "./assets/background.jpg", id: "background" },
    { src: "./assets/trampoline.png", id: "trampoline" },
    { src: "./assets/diver.png", id: "diver" },
    { src: "./assets/bronze_hoop.png", id: "bronzeHoop" },
    { src: "./assets/silver_hoop.png", id: "silverHoop" },
    { src: "./assets/gold_hoop.png", id: "goldHoop" },
  ];
  loader = new createjs.LoadQueue(false);
  loader.addEventListener("complete", handleComplete);
  loader.loadManifest(manifest, true);
}

function tick(e) {
  const now = performance.now();
  while (timestamps.length > 0 && timestamps[0] <= now - 1000) {
    timestamps.shift();
  }
  timestamps.push(now);
  if (timestamps.length < 45) {
    framerate = 30;
  } else if (timestamps.length < 75) {
    framerate = 60;
  } else if (timestamps.length < 105) {
    framerate = 90;
  } else if (timestamps.length < 130) {
    framerate = 120;
  } else if (timestamps.length < 160) {
    framerate = 144;
  } else {
    framerate = 240;
  }
  createjs.Ticker.framerate = framerate;
  stage.update(e);
}

function handleComplete() {
  let easelbackground = makeBitmap(
    loader.getResult("background"),
    stagewidth / 2,
    stageheight / 2
  );
  easelbackground.x = stagewidth / 2;
  easelbackground.y = stageheight / 2;
  stage.addChild(easelbackground);

  createjs.Ticker.framerate = framerate;
  createjs.Ticker.timingMode = createjs.Ticker.RAF;
  createjs.Ticker.addEventListener("tick", tick);

  let initialised = false;
  socket.on("objdata", function (data) {
    for (let i in data) {
      if (!initialised && data[i].id == "diver") {
        objs.push(
          makeBitmap(
            loader.getResult("diver"),
            data[i].objwidth,
            data[i].objheight
          )
        );
        stage.addChild(objs[objs.length - 1]);
      }
      if (data[i].id == "diver") {
        objs[i].x = data[i].x;
        objs[i].y = data[i].y;
        objs[i].rotation = data[i].r * R2D;
      }
      if (data[i].id == "trampoline") {
        objs.push(
          makeBitmap(
            loader.getResult("trampoline"),
            data[i].objwidth,
            data[i].objheight
          )
        );
        objs[i].x = data[i].x;
        objs[i].y = data[i].y;
        objs[i].rotation = data[i].r * R2D;
        stage.addChild(objs[objs.length - 1]);
      }
      if (data[i].id == "goldHoop") {
        objs.push(
          makeBitmap(
            loader.getResult("goldHoop"),
            data[i].objwidth,
            data[i].objheight
          )
        );
        objs[i].x = data[i].x;
        objs[i].y = data[i].y;
        objs[i].rotation = data[i].r * R2D;
        stage.addChild(objs[objs.length - 1]);
      }
      if (data[i].id == "silverHoop") {
        objs.push(
          makeBitmap(
            loader.getResult("silverHoop"),
            data[i].objwidth,
            data[i].objheight
          )
        );
        objs[i].x = data[i].x;
        objs[i].y = data[i].y;
        objs[i].rotation = data[i].r * R2D;
        stage.addChild(objs[objs.length - 1]);
      }
      if (data[i].id == "bronzeHoop") {
        objs.push(
          makeBitmap(
            loader.getResult("bronzeHoop"),
            data[i].objwidth,
            data[i].objheight
          )
        );
        objs[i].x = data[i].x;
        objs[i].y = data[i].y;
        objs[i].rotation = data[i].r * R2D;
        stage.addChild(objs[objs.length - 1]);
      }
    }
    const now = performance.now();
    while (datastamps.length > 0 && datastamps[0] <= now - 1000) {
      datastamps.shift();
    }
    datastamps.push(now);
    initialised = true;
  });
}

$("canvas").mousedown(function (e) {
  socket.emit("mousedown", e.clientX, e.clientY);
});
$("canvas").mouseup(function (e) {
  socket.emit("mouseup", e.clientX, e.clientY);
});

socket.on("playerCount", (playerCount) => {
  document.getElementById("playersConnected").innerHTML =
    "Players: " + playerCount;
});

/**
 * Easel Helper Functions
 */

function makeBitmap(ldrimg, b2x, b2y, yadjust = 0) {
  var theImage = new createjs.Bitmap(ldrimg);
  var scalex = (b2x * 2) / theImage.image.naturalWidth;
  var scaley = (b2y * 2) / theImage.image.naturalHeight;
  theImage.scaleX = scalex;
  theImage.scaleY = scaley;
  theImage.regX = theImage.image.width / 2;
  theImage.regY = theImage.image.height / 2 - yadjust;
  theImage.snapToPixel = true;
  return theImage;
}
