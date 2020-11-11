var video = document.querySelector("#videoElement");
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

let poses = [];
var wrist = {};

var jq = jQuery.noConflict();

var imageElement = document.getElementById('canvas');
imageElement.style.transform = 'translate('+ ((window.innerWidth/2)-(imageElement.width/2)) +'px,'+ ((window.innerHeight/2)-(imageElement.height/2)) +'px) scale('+ window.innerWidth/imageElement.width +','+ window.innerHeight/imageElement.height +')';
imageElement.style.transformOrigin ='center';

var videoElement = document.getElementById('videoElement');
videoElement.style.transform = 'translate('+ ((window.innerWidth/2)-(videoElement.width/2)) +'px,'+ ((window.innerHeight/2)-(videoElement.height/2)) +'px) scale(-'+ window.innerWidth/videoElement.width +','+ window.innerHeight/videoElement.height +')';
videoElement.style.transformOrigin ='center';

var cw = canvas.width;
var ch = canvas.height;

function areaOfInteraction(x1,y1,x2,y2,x3,y3,x4,y4, colour,name) {
    this.top = y1;
    this.bottom = y2;
    this.left = x1;
    this.right = x4;
    this.height = y2 - y1;
    this.width = x4 - x1;
    this.colour = colour;
    this.name = name;

    this.update = function(x1,y1,x2,y2,x3,y3,x4,y4,colour){
        this.colour = colour;
        ctx.beginPath();
        ctx.lineTo(x1,y1);
        ctx.lineTo(x2,y2);
        ctx.lineTo(x3,y3);
        ctx.lineTo(x4,y4);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = colour;
        ctx.fill();
    }
}
var topArea = new areaOfInteraction(0,0,50,50,cw-50,50, cw,0, "red","top");
var bottomArea = new areaOfInteraction(50,ch-50,0, ch, cw,ch,cw-50,ch-50,"blue","bottom");
var leftArea = new areaOfInteraction(0,0,0,ch,50,ch-50,50,50,"orange","left");
var rightArea = new areaOfInteraction(cw-50,50, cw-50, ch-50, cw, ch, cw,0,"green","right");

function pointer(x,y,radius){
    this.x  = x;
    this.y = y;
    this.radius = radius;
    this.update = function(x,y,radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.stroke();
    }
}
var cursor = new pointer(0,0,0);

var AOI = [topArea,bottomArea,leftArea,rightArea];

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
        video.srcObject=stream;
        video.play();
    });
}

function setUpCanvas() {
    topArea.update(0,0,50,50,cw-50,50, cw,0, "red");
    bottomArea.update(50,ch-50,0, ch, cw,ch,cw-50,ch-50,"blue");
    leftArea.update(0,0,0,ch,50,ch-50,50,50,"orange");
    rightArea.update(cw-50,50, cw-50, ch-50, cw, ch, cw,0,"green");
}

var selectorRadius = 20;
var bOverlap = false;
var selected = "";
var start, end, elapsed;

function collisionRecognition() {
    if((cursor.x > topArea.left)&&(cursor.x < topArea.right)&&(cursor.y < topArea.bottom)&&(cursor.y > topArea.top)){
        bOverlap = true;
        selected = topArea.name;
    }else if((cursor.x > bottomArea.left)&&(cursor.x < bottomArea.right)&&(cursor.y < bottomArea.bottom)&&(cursor.y > bottomArea.top)){
        bOverlap = true;
        selected = bottomArea.name;
    }else if((cursor.x > leftArea.left)&&(cursor.x < leftArea.right)&&(cursor.y < leftArea.bottom)&&(cursor.y > leftArea.top)){
        bOverlap = true;
        selected = leftArea.name;
    }else if((cursor.x > rightArea.left)&&(cursor.x < rightArea.right)&&(cursor.y < rightArea.bottom)&&(cursor.y > rightArea.top)){
        bOverlap = true;
        selected = rightArea.name;
    }else{
        bOverlap = false;
        selected = "";
    }
}

function selectionCountdown() {
    if(!bOverlap){
        start = 0;
        end = 0;
        elapsed = 0;
    }
    if((bOverlap)&&(!start)&&(!end)){
        start = new Date();
    }
    if((start)&&(!end)){
        end = new Date();
    }
    if((start)&&(end)&&(bOverlap)){
        elapsed = (end - start)/1000;
        end = 0;
    }
    if((elapsed < 3.1)&&(bOverlap)){
        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, selectorRadius, 0, 2 * Math.PI);
        ctx.stroke();

        if(selectorRadius > 10){
            selectorRadius -= (elapsed/3.1);
        }
    }else if(!bOverlap){
        selectorRadius = 20;
    }
    if((elapsed > 3.1)&&(bOverlap)){
        manageContent(selected);
    }
}

function drawCameraIntoCanvas() {
    ctx.clearRect(0, 0, cw, ch);
    setUpCanvas();
    drawKeypoints();
    collisionRecognition();
    selectionCountdown();
    window.requestAnimationFrame(drawCameraIntoCanvas);
}
window.requestAnimationFrame(drawCameraIntoCanvas);



const poseNet = ml5.poseNet(video,{flipHorizontal: true}, modelReady);
poseNet.on('pose', gotPoses);


function gotPoses(results) {
    if(results.length > 0){
        /*if(results[0].pose.rightWrist.confidence > results[0].pose.leftWrist.confidence*1.1){
            wrist = results[0].pose.rightWrist;
        }else if(results[0].pose.rightWrist.confidence < results[0].pose.leftWrist.confidence*1.1){
            wrist = results[0].pose.leftWrist;
        }*/
        wrist = results[0].pose.leftWrist;
    }
}

function modelReady() {
    console.log("model ready")
    poseNet.multiPose(video)
}

function drawKeypoints()  {
    var score = wrist.confidence;

    var x = wrist.x;
    var y = wrist.y;

    if(score > 0.1){
        cursor.update(x,y,10);
    }

}

function manageContent(instruction){
    var content = jq('#content');
    switch(instruction) {
        case topArea.name:
            content.attr('class','');
            content.addClass(topArea.name);
            break;
        case bottomArea.name:
            content.attr('class','');
            content.addClass(bottomArea.name);
            break;
        case leftArea.name:
            content.attr('class','');
            content.addClass(leftArea.name);
            break;
        case rightArea.name:
            content.attr('class','');
            content.addClass(rightArea.name);
            break;
    }

}