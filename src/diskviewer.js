"use strict";
import * as twgl from './twgl-full.min.js';
import Diagram from "./diagram";
import { Circle, Disk, HLineThinMesh, HLineThinDashedMesh } from "./meshes";
import { SimpleMaterial, HyperbolicInvertedTexturedMaterial } from './materials.js';
import { Point } from './geometry';
import { ToolManager } from './tools';

const TEXTURE_SIZE = 512;

export default class DiskViewer {

    constructor(canvas) {
        this.canvas = canvas;
        let gl = this.gl = canvas.getContext("webgl", {antialias: true});

        console.log(gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE));
        this.viewMatrix = twgl.m4.identity();
        this.modelMatrix = twgl.m4.identity();
        this.hViewMatrix = twgl.m4.identity();
        
        const viewer = this;
        
        // initialize opengl
        let bgColor = [1,1,1,1];
        gl.clearColor(...bgColor);
        gl.enable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // create common entities (e.g disk background and border)
        this.createEntities();
        
        // this.draggableDots = [];
        this.currentDot = null;

        this.handlePointerEvents(canvas);  
        
        this.running = true;
        this.diagram = new Diagram();
        //this.points = [];
        //this.lines = [];
        this.toolManager = new ToolManager();

        this.animate();
    }

    animate(dtime) {
        const gl = this.gl;
        if(!this.running) return;
        // let t0 = performance.now();
        twgl.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // clear
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        let rr = 1.1;    
        twgl.m4.ortho(-aspect*rr, aspect*rr, rr, -rr, -1, 1, this.viewMatrix);

        // draw bg
        this.entities.disk.material.setColor([0.95,0.95,1,1]);
        this.entities.disk.draw();
        this.entities.paintedDisk.draw();
        
        if(this.diagram.mirrors.length>0) {
            let matrix = twgl.m4.identity();
            this.diagram.mirrors.forEach(mirror => matrix = twgl.m4.multiply(matrix, mirror.getMirrorMatrix()));

            let paintedDisk = this.entities.paintedDisk;
            paintedDisk.material.uniforms.hModelMatrix =  matrix;
            this.entities.paintedDisk.draw();
            paintedDisk.material.uniforms.hModelMatrix =  twgl.m4.identity();
        }

        // draw lines
        this.diagram.lines.forEach(e=>{
            let hline = this.entities.hline;
            hline.setHLine(e);

            if(e.isCurrent) {
                this.entities.hline.material.setColor([1.0,0.5,1,1]);
            } else {
                this.entities.hline.material.setColor([0,0.5,1,1]);
            }
            hline.draw();
        })

        // draw points
        this.diagram.points.forEach(p=>{
            if(p.isHandle) this.drawLineHandle(p.x,p.y);
            else this.drawDot(p.x,p.y);
        }) 
    
        // mirrors
        this.diagram.mirrors.forEach(e=>{
            let hline = this.entities.mirror;
            hline.setHLine(e);

            this.entities.hline.material.setColor([1.0,0.5,0.01,1]);
            hline.draw();
        })

        // draw border
        this.entities.circle.material.setColor([0,0,0,1]);
        this.entities.circle.draw();


        requestAnimationFrame((dt)=>this.animate(dt))
    }

    createEntities() {
        let gl = this.gl;
        const mat = this.simpleMaterial = new SimpleMaterial(this);
        let entities = this.entities = {};
        entities.circle = new Circle(gl, mat, 1.005, 0.005, 500);
        entities.disk = new Disk(gl, mat, 1.0, 500);
        let dotRadius = 0.01;        
        entities.dot = new Disk(gl, mat, dotRadius, 30);
        entities.dotBorder = new Circle(gl, mat, dotRadius, 0.002, 30);
        entities.hline = new HLineThinMesh(gl, mat, 100);

        entities.mirror = new HLineThinDashedMesh(gl, mat, 100);

        let textureCanvas = this.textureCanvas = new OffscreenCanvas(TEXTURE_SIZE, TEXTURE_SIZE);
        this.textureCtx = textureCanvas.getContext('2d');
        this.textureCtx.fillStyle='transparent';
        this.textureCtx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

        let txMat = new HyperbolicInvertedTexturedMaterial(this);
        txMat.uniforms.texture = twgl.createTexture(gl, {src: textureCanvas});        
        let paintedDisk = entities.paintedDisk = new Disk(gl, txMat, 0.9999, 100);
    }

    getPixelSize() {
        return 2.0/(this.gl.canvas.height*this.viewMatrix[0]);
    }

    getClosestPoint(p) {
        return this.diagram.getClosestPoint(p, this.getPixelSize()*10);
    }
    getClosestLine(p) {
        return this.diagram.getClosestLine(p, this.getPixelSize()*10);

    }

    stop() {
        this.running = false;
    }

    
    pointerPosToWordPos(e) {
        const canvasBorder = 0;// 4;
        let r = this.canvas.getBoundingClientRect();
        let x = 2*(e.clientX - r.x - canvasBorder)/this.canvas.width-1;
        let y = 2*(e.clientY - r.y - canvasBorder)/this.canvas.height-1;
        let p = twgl.m4.transformPoint(twgl.m4.inverse(this.viewMatrix), [x,y,0,1]);
        return new Point(p[0],-p[1]);
    }

    worldPosToTexturePos(p) { 
        return new Point(
            TEXTURE_SIZE * 0.5 * (1.0 + p.x), 
            TEXTURE_SIZE * 0.5 * (1.0 + p.y)); 
    }

    drawDot(x,y,color) {
        let dot = this.entities.dot;
        let dotBorder = this.entities.dotBorder;
        let material = dot.material;
    
        let mat = twgl.m4.translation([x,y,0.0]);
        twgl.v3.copy([0,1,1,1], material.uniforms.color);
        let oldMat = material.uniforms.modelMatrix;
        material.uniforms.modelMatrix = mat;   
        dot.draw();
        twgl.v3.copy([0,0,0,1], material.uniforms.color);
        dotBorder.draw();
        material.uniforms.modelMatrix = oldMat;
    }

    drawLineHandle(x,y,color) {
        let dot = this.entities.dot;
        let dotBorder = this.entities.dotBorder;
        let material = dot.material;
    
        let mat = twgl.m4.translation([x,y,0.0]);
        twgl.v3.copy([0,0,0,1], material.uniforms.color);
        let oldMat = material.uniforms.modelMatrix;
        material.uniforms.modelMatrix = mat;   
        dot.draw();
        //twgl.v3.copy([0,0,0,1], material.uniforms.color);
        //dotBorder.draw();
        material.uniforms.modelMatrix = oldMat;
    }


    _onPointerDown(e) {
        let p = this.pointerPosToWordPos(e);
        this.oldp = p;
        this.canvas.setPointerCapture(e.pointerId);
        this.buttonDown = true;
        this.toolManager.onPointerDown(this, p, e);
    }
    _onPointerUp(e) {
        this.buttonDown = false;
        this.toolManager.onPointerUp(this, e);
    }

    _onPointerMove(e) {
        let p = this.pointerPosToWordPos(e);
        if(this.buttonDown) {
            // drag            
            let dx = p.x - this.oldp.x;
            let dy = p.y - this.oldp.y;
            this.oldp.x = p.x;
            this.oldp.y = p.y;    
            this.toolManager.onPointerDrag(this, p, e);  
             
        }
        else 
        {
            this.toolManager.onPointerMove(this, p, e);  
        }
    }
    

    handlePointerEvents(canvas) {   
        const me = this;
        this.buttonDown = false;
        canvas.onpointerdown = e => me._onPointerDown(e);
        canvas.onpointerup   = e => me._onPointerUp(e);
        canvas.onpointermove = e => me._onPointerMove(e);
    }

    updatePaintedDisk() {
        const paintedDisk = this.entities.paintedDisk;
        paintedDisk.material.updateTexture(paintedDisk.material.uniforms.texture, this.textureCanvas);
    }


    clear() {
        this.diagram.clear();
        this.textureCtx.clearRect(0,0,TEXTURE_SIZE,TEXTURE_SIZE);
        this.updatePaintedDisk();            
    }
       
}

