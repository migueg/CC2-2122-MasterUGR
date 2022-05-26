'use strict'


const  faceapi = require ('face-api.js');
const { Canvas, Image } = require("canvas");
const canvas = require("canvas");
const fs = require('fs'),
http = require('http'),
https = require('https');

faceapi.env.monkeyPatch({ Canvas, Image });


// const MODEL_URL = '/models'

// await faceapi.loadSsdMobilenetv1Model(MODEL_URL)
// await faceapi.loadFaceLandmarkModel(MODEL_URL)
// await faceapi.loadFaceRecognitionModel(MODEL_URL)

module.exports = async (event, context) => {
  
  const downloadImage = async function(path, filename){
   
    var client = http;
    if (path.toString().indexOf("https") === 0){
      client = https;
     }

     return new Promise((resolve, reject) => {
         client.get(path, (resp) => {
 
             // chunk received from the server
             resp.on('data', (chunk) => {
                 fs.appendFileSync(filename, chunk);
             });
 
             // last chunk received, we are done
             resp.on('end', () => {
                 resolve('File downloaded and stored at: '+filename);
             });
 
         }).on("error", (err) => {
             reject(new Error(err.message))
         });
     })
  }
  const LoadModels = async function LoadModels() {
    // Load the models
    // __dirname gives the root directory of the server
    await faceapi.nets.faceRecognitionNet.loadFromDisk('./function/models');
    await faceapi.nets.faceLandmark68Net.loadFromDisk('./function/models');
    await faceapi.nets.ssdMobilenetv1.loadFromDisk('./function/models');
  }
 

  const start =  async function (filename, context){

    const descriptions = [];

    const img = await canvas.loadImage(filename);


    const detections = await faceapi.detectAllFaces(img)
    
    const width = 1200;
    const height = 627;
    const cv = new Canvas(width,height),
    ctx = cv.getContext('2d');
    const pattern = ctx.createPattern(img, 'no-repeat');
    ctx.fillStyle = pattern;
    ctx.fill();

    ctx.fillRect(0, 0, width, height);

    faceapi.draw.drawDetections(cv, detections);

    ///const buffer = cv.toBuffer("image/png");
    const dataURL = cv.toBuffer("image/png");

    return dataURL;

  }

  var result = { 
    'body': '',
    'content-type': event.headers["content-type"]
  }

  if(event.body.img){
    
    var pathToImage = event.body.img

    var filename = pathToImage.toString().indexOf(".png") !== -1 ?
      Date.now() + ".png" : pathToImage.toString().indexOf(".jpg") ?
      Date.now() + ".jpg" : "";
    
    filename = "/tmp/"+filename;

    if(filename === ""){
      result.body = 'Wrong image format. Only supported png and jpg';
      return context.status(500).fail(result);
    }

    
    await downloadImage(pathToImage, filename)
      .then(res => console.log(res))
      .catch(err => console.log(err));

   

    await LoadModels();
    const base64Img = await start(filename, context);
    
    
    return context
    .headers({
      'Content-Type': 'image/png',
      'Content-Length': base64Img.length
    })
    .status(200)
    .succeed(base64Img)
   
  }else{
    var result = {
      'body': 'Not path to image found',
      'content-type': event.headers["content-type"]
    }
    return context
    .status(400)
    .fail(result)
  }


}
