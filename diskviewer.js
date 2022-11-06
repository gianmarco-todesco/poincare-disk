
class DiskViewer {

    constructor(canvas) {
        this.canvas = canvas;
        let gl = this.gl = canvas.getContext("webgl", {antialias: true});
        const viewer = this;
        
        // initialize opengl
        let bgColor = [0.7,0.75,0.8,1];
        gl.clearColor(...bgColor);
        gl.enable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // create common entities (e.g disk background and border)
        this.createEntities();
        
        // this.draggableDots = [];
        this.currentDot = null;

        this.handlePointerEvents(canvas);  
        this.handleKeyboardEvents();  

        this.running = true;
        this.points = [{x:0,y:0},{x:0.1,y:0.1}];

        let hline = new HLine(1,0,0);
        this.lines = [hline];
        

        // animate function
        const animate = function(time) {
            if(!viewer.running) return;
            // let t0 = performance.now();
            twgl.resizeCanvasToDisplaySize(gl.canvas);
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
            let rr = 1.1;    
            twgl.m4.ortho(-aspect*rr, aspect*rr, rr, -rr, -1, 1, viewMatrix);

            viewer.entities.disk.material.setColor([1,1,1,1]);
            viewer.entities.disk.draw();
            
            viewer.render();
            
            //viewer.entities.dot.material.setColor([1,0,0,1]);
            //viewer.entities.dot.draw();

            
    
            viewer.entities.circle.material.setColor([0,0,0,1]);
            viewer.entities.circle.draw();
            requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);      
    }

    stop() {
        this.running = false;
    }

    /*
    getDotNearby(p) {
        if(!this.currentScene || !this.currentScene.draggableDots) return null;
        let found = null;
        let minDist = 0;
        this.currentScene.draggableDots.forEach(dot => {
            let dist = getDistance(p, dot.pos);
            if(!found || dist < minDist) {
                found = dot;
                minDist = dist;
            }
        })
        if(found && minDist < 0.07) return found;
        else return null;
    }
    */
    render() {
        //this.drawDot(0.0);
        //this.drawDot(0.3);

        this.lines.forEach(e=>{
            let hline = this.entities.hline;
            hline.setHLine(e);

            if(e.isCurrent) {
                this.entities.hline.material.setColor([1.0,0.5,1,1]);
            } else {
                this.entities.hline.material.setColor([0,0.5,1,1]);
            }
            hline.draw();

            if(e.w != 0.0) {
                this.drawDot(e.cx,e.cy);
                let p;
                p = e.getPoint(0);this.drawDot(p[0],p[1]);
                p = e.getPoint(1);this.drawDot(p[0],p[1]);


            }
        })
        this.points.forEach(p=>{
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
        let p = twgl.m4.transformPoint(twgl.m4.inverse(viewMatrix), [x,y,0]);
        return [p[0],-p[1]]
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
        if(this.tool && this.tool.onPointerDown) this.tool.onPointerDown(this, {x:p[0], y:p[1]}, e);
    }
    _onPointerUp(e) {
        this.buttonDown = false;
        if(this.tool && this.tool.onPointerUp) this.tool.onPointerUp(this, e);
    }

    _onPointerMove(e) {
        let p = this.pointerPosToWordPos(e);
        if(this.buttonDown) {
            // drag            
            let dx = p[0] - this.oldp[0];
            let dy = p[1] - this.oldp[1];
            this.oldp[0] = p[0];
            this.oldp[1] = p[1];    
            if(this.tool && this.tool.onPointerDrag) 
                this.tool.onPointerDrag(this, {x:p[0], y:p[1]}, e);    
        }
    }
    
    _onKeyDown(e) {
        if(e.code == "ArrowLeft") {
            e.preventDefault();
            e.stopPropagation();
                if(this.currentSceneIndex>0) {
                this.currentSceneIndex--;
                this.setCurrentScene(this.scenes[this.currentSceneIndex]);
            }
        } else if(e.code == "ArrowRight") {
            e.preventDefault();
            e.stopPropagation();
                if(this.currentSceneIndex+1<this.scenes.length) {
                this.currentSceneIndex++;
                this.setCurrentScene(this.scenes[this.currentSceneIndex]);
            }
        }
        else if(this.currentScene && this.currentScene.onKeyDown) {
            let ret = this.currentScene.onKeyDown(e);
            if(ret) {
                e.preventDefault();
                e.stopPropagation();        
            }
        }
    }


    handlePointerEvents(canvas) {   
        const me = this;
        this.buttonDown = false;
        canvas.onpointerdown = e => me._onPointerDown(e);
        canvas.onpointerup   = e => me._onPointerUp(e);
        canvas.onpointermove = e => me._onPointerMove(e);
    }

    handleKeyboardEvents() {
        const me = this;
        document.addEventListener('keydown', e => me._onKeyDown(e));
    }
       
}


class AddHLineTool {
    onPointerDown(viewer, p) {
        console.log(p);
        viewer.points.push(p);
        this.p0 = p;
        this.hline = undefined;
    }
    onPointerDrag(viewer, p) {
        if(p.x != this.p0.x || p.y != this.p0.y) {
            if(!this.hline) {
                this.hline =  new HLine(1,0,0);
                this.hline.setByPoints([this.p0.x,this.p0.y ], [p.x,p.y]);
                viewer.lines.push(this.hline);                
            } else {
                this.hline.setByPoints([this.p0.x,this.p0.y ], [p.x,p.y]);
            }
        }
    }
    onPointerUp(viewer) {
        this.hline = undefined;
    }
}


class MoveHLineTool {
    onPointerDown(viewer, p) {
        /*
        viewer.points.push(p);
        */
        this.p0 = p;
        this.line = undefined;
    }
    onPointerDrag(viewer, p) {
        let m = viewer.lines.length;
        let found = null;
        let minDist = Infinity;
        viewer.lines.forEach(line => {
            line.isCurrent = false;
            let d = line.getDist(p.x,p.y);
            if(d<minDist) { minDist = d; found = line; }
        });
        if(found) {
            found.isCurrent = true;
            found.distance = minDist;
            console.log(minDist);
        }
        /*
        if(p.x != this.p0.x || p.y != this.p0.y) {
            if(!this.line) {
                this.line = {x0:this.p0.x, y0:this.p0.y, x1:p.x, y1:p.y};
                viewer.lines.push(this.line);                
            } else {
                this.line.x1 = p.x;
                this.line.y1 = p.y;
            }
        }
        */
    }
    onPointerUp(viewer) {
        this.line = undefined;
    }
}