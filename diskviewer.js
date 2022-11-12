"use strict";

class DiskViewer {

    constructor(canvas) {
        this.canvas = canvas;
        let gl = this.gl = canvas.getContext("webgl", {antialias: true});
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
        
        this.animate();
    }

    animate(dtime) {
        const gl = this.gl;
        if(!this.running) return;
        // let t0 = performance.now();
        twgl.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        let rr = 1.1;    
        twgl.m4.ortho(-aspect*rr, aspect*rr, rr, -rr, -1, 1, viewMatrix);

        this.entities.disk.material.setColor([0.95,0.95,1,1]);
        this.entities.disk.draw();
        
        this.paint();
    
        this.entities.circle.material.setColor([0,0,0,1]);
        this.entities.circle.draw();
        requestAnimationFrame((dt)=>this.animate(dt))
    }


    getPixelSize() {
        return 2.0/(this.gl.canvas.height*viewMatrix[0]);
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

    

    
    paint() {
        
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
        this.diagram.points.forEach(p=>{
            this.drawDot(p.x,p.y);
        })        
        
    }

    createEntities() {
        let gl = this.gl;
        let entities = this.entities = {};
        entities.circle = new Circle(gl, 1.005, 0.005, 500);
        entities.disk = new Disk(gl, 1.0, 500);
        let dotRadius = 0.01;        
        entities.dot = new Disk(gl, dotRadius, 30);
        entities.dotBorder = new Circle(gl, dotRadius, 0.002, 30);
        entities.hline = new HLineThinMesh(gl, 100);
    }

    pointerPosToWordPos(e) {
        const canvasBorder = 0;// 4;
        let r = this.canvas.getBoundingClientRect();
        let x = 2*(e.clientX - r.x - canvasBorder)/this.canvas.width-1;
        let y = 2*(e.clientY - r.y - canvasBorder)/this.canvas.height-1;
        let p = twgl.m4.transformPoint(twgl.m4.inverse(viewMatrix), [x,y,0,1]);
        return new Point(p[0],-p[1]);
    }

    drawDot(x,y) {
        let dot = this.entities.dot;
        let dotBorder = this.entities.dotBorder;
        let material = dot.material;
    
        let mat = twgl.m4.translation([x,y,0.0]);
        twgl.v3.copy([1,0,0,1], material.uniforms.color);
        let oldMat = material.uniforms.modelMatrix;
        material.uniforms.modelMatrix = mat;   
        dot.draw();
        twgl.v3.copy([0,0,0,1], material.uniforms.color);
        dotBorder.draw();
        material.uniforms.modelMatrix = oldMat;
    }


    _onPointerDown(e) {
        let p = this.pointerPosToWordPos(e);
        this.oldp = p;
        this.canvas.setPointerCapture(e.pointerId);
        this.buttonDown = true;
        if(this.tool && this.tool.onPointerDown) this.tool.onPointerDown(this, p, e);
    }
    _onPointerUp(e) {
        this.buttonDown = false;
        if(this.tool && this.tool.onPointerUp) this.tool.onPointerUp(this, e);
    }

    _onPointerMove(e) {
        let p = this.pointerPosToWordPos(e);
        if(this.buttonDown) {
            // drag            
            let dx = p.x - this.oldp.x;
            let dy = p.y - this.oldp.y;
            this.oldp.x = p.x;
            this.oldp.y = p.y;    
            if(this.tool && this.tool.onPointerDrag) 
                this.tool.onPointerDrag(this, p, e);    
        }
    }
    

    handlePointerEvents(canvas) {   
        const me = this;
        this.buttonDown = false;
        canvas.onpointerdown = e => me._onPointerDown(e);
        canvas.onpointerup   = e => me._onPointerUp(e);
        canvas.onpointermove = e => me._onPointerMove(e);
    }

    
       
}

