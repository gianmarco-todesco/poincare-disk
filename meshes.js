
// -----------------------------
// Mesh
// -----------------------------
class Mesh {
    constructor(gl, verb, material) {
        this.gl = gl;
        this.verb = verb;
        this.material = material;
    }

    createBufferInfo(attributes) {
        this.bufferInfo = twgl.createBufferInfoFromArrays(this.gl, attributes);
    }

    draw() {
        this.material.bind();
        twgl.setBuffersAndAttributes(this.gl, this.material.programInfo, this.bufferInfo);
        twgl.drawBufferInfo(this.gl, this.bufferInfo, this.verb);   
    }
};



class Circle extends Mesh {
    constructor(gl, r, thickness, m) {
        super(gl, gl.TRIANGLE_STRIP, getSimpleMaterial(gl));
        const attributes = { position: { data: [], numComponents: 2 } };    
        let r0 = r-thickness;
        let r1 = r+thickness;
        for(let i=0;i<m;i++) {
            let phi = 2*Math.PI*i/(m-1);
            let cs = Math.cos(phi), sn = Math.sin(phi);
            attributes.position.data.push(cs*r1,sn*r1,cs*r0,sn*r0);
        }
        this.createBufferInfo(attributes);
    }      
};


class Disk extends Mesh {
    constructor(gl,r, m) {
        super(gl, gl.TRIANGLE_FAN, getSimpleMaterial(gl));
        const attributes = { position: { data: [], numComponents: 2 } };    
        attributes.position.data.push(0.0, 0.0);
        for(let i=0;i<m;i++) {
            let phi = 2*Math.PI*i/(m-1);
            let cs = Math.cos(phi), sn = Math.sin(phi);
            attributes.position.data.push(cs*r,sn*r);
        }
        this.createBufferInfo(attributes);
    }  
};


class HLineMesh extends Mesh {
    constructor(gl, m) {
        super(gl, gl.TRIANGLE_STRIP, getSimpleMaterial(gl));
        this.m = m;
        this.hline = new HLine(0,1,0);
        const attributes = this.attributes = { position: { data: new Array(m*2), numComponents: 2 } };    
        this._computePts(this.hline);
        this.createBufferInfo(attributes);
    }  

    _computePts(hline) {
        const m = this.m;
        const buffer = this.attributes.position.data;
        for(let i=0;i<m;i++) {
            let w = i==0 || i==m-1 ? 0.0 : (-1 + 2*(i%2))*0.005;
            let t = i/(m-1);
            w *= 1.0 + 5*(Math.abs(t-0.5)*2)**3;
            let p = hline.getPoint(i/(m-1),w);
            buffer[i*2] = p[0];
            buffer[i*2+1] = p[1];            
        }
    }
    setByPoints(p0, p1) {
        this.hline.setByPoints(p0,p1);
        this._computePts(this.hline);
        twgl.setAttribInfoBufferFromArray(this.gl, this.bufferInfo.attribs.position, this.attributes.position);
    }
}


class HLineThinMesh extends Mesh {
    constructor(gl, m) {
        super(gl, gl.LINE_STRIP, getSimpleMaterial(gl));
        this.m = m;
        this.hline = new HLine(0,1,0);
        const attributes = this.attributes = { position: { data: new Array(2*m), numComponents: 2 } };    
        this._computePts(this.hline);
        this.createBufferInfo(attributes);
    }  

    _computePts(hline) {
        const m = this.m;
        const buffer = this.attributes.position.data;
        for(let i=0;i<m;i++) {
            let p = hline.getPoint(i/(m-1),0.0);
            buffer[i*2] = p[0];
            buffer[i*2+1] = p[1];            
        }
    }
    setByPoints(p0, p1) {
        this.hline.setByPoints(p0,p1);
        this._computePts(this.hline);
        twgl.setAttribInfoBufferFromArray(this.gl, this.bufferInfo.attribs.position, this.attributes.position);
    }
    setHLine(hline) {
        this.hline.setParameters(hline.cx,hline.cy,hline.w);
        this._computePts(this.hline);
        twgl.setAttribInfoBufferFromArray(this.gl, this.bufferInfo.attribs.position, this.attributes.position);
    }
}



class HSegmentMesh extends Mesh {
    constructor(gl, m, p0, p1) {
        super(gl, gl.TRIANGLE_STRIP, getSimpleHyperbolicMaterial(gl));
        this.m = m;
        this.hSegment = new HSegment(p0,p1);
        const attributes = this.attributes = { position: { data: new Array(m*2), numComponents: 2 } };    
        this._computePts();
        this.createBufferInfo(attributes);
    }  

    _computePts() {
        const thickness = 0.005;
        const m = this.m;
        const buffer = this.attributes.position.data;
        for(let i=0;i<m;i++) {
            let w = i==0 || i==m-1 ? 0.0 : (-1 + 2*(i%2))*thickness;
            let p = this.hSegment.getPoint(i/(m-1),w);
            buffer[i*2] = p[0];
            buffer[i*2+1] = p[1];            
        }
    }
    setEnds(p0, p1) {
        this.hSegment.setEnds(p0,p1);
        this._computePts();
        twgl.setAttribInfoBufferFromArray(this.gl, this.bufferInfo.attribs.position, this.attributes.position);
    }
}

class HRegularPolygonOutlineMesh extends Mesh {
    constructor(gl, vCount, radius, m) {
        super(gl, gl.LINE_STRIP, getSimpleHyperbolicMaterial(gl));
        this.vCount = vCount;
        this.radius = radius;
        this.m = m;
        const attributes = this.attributes = { position: { data: new Array(m*2*vCount+2), numComponents: 2 } };    
        this._computePts();
        this.createBufferInfo(attributes);
    }  

    _computePts() {
        const m = this.m;
        const buffer = this.attributes.position.data;
        let pts = [];
        for(let side=0; side<this.vCount; side++) {
            let phi = 2*Math.PI*side/this.vCount;
            pts.push([this.radius*Math.cos(phi),this.radius*Math.sin(phi)]);
        }
        for(let side=0; side<this.vCount; side++) {
            let hSegment = new HSegment(pts[side], pts[(side+1)%this.vCount]);
            for(let i=0; i<m; i++) {
                let p = hSegment.getPoint(i/m);
                let k = side*m+i;
                buffer[2*k] = p[0];
                buffer[2*k+1] = p[1];                
            }
        }
        let vCount = this.vCount;
        buffer[m*2*vCount] = buffer[0];
        buffer[m*2*vCount+1] = buffer[1];        
    }
}

class HRegularPolygonThickOutlineMesh extends Mesh {
    constructor(gl, vCount, radius, thickness, m) {
        super(gl, gl.TRIANGLE_STRIP, getSimpleHyperbolicMaterial(gl));
        this.vCount = vCount;
        this.radius = radius;
        this.m = m;
        this.thickness = thickness;
        const attributes = this.attributes = { position: { data: new Array(m*4*vCount), numComponents: 2 } };    
        this._computePts();
        this.createBufferInfo(attributes);
    }  

    _computePts() {
        const m = this.m;
        const buffer = this.attributes.position.data;
        let pts = [];
        for(let side=0; side<this.vCount; side++) {
            let phi = 2*Math.PI*side/this.vCount;
            pts.push([this.radius*Math.cos(phi),this.radius*Math.sin(phi)]);
        }
        for(let side=0; side<this.vCount; side++) {
            let hSegment = new HSegment(pts[side], pts[(side+1)%this.vCount]);
            for(let i=0; i<m; i++) {
                let p = hSegment.getPoint(i/m, -this.thickness);
                let k = side*m+i;
                buffer[4*k] = p[0];
                buffer[4*k+1] = p[1];    
                p = hSegment.getPoint(i/m, this.thickness);
                buffer[4*k+2] = p[0];
                buffer[4*k+3] = p[1];             
            }
        }
    }
}


class HRegularPolygonMesh extends Mesh {
    constructor(gl, vCount, radius, m) {
        super(gl, gl.TRIANGLE_FAN, getSimpleHyperbolicMaterial(gl));
        this.vCount = vCount;
        this.radius = radius;
        this.m = m;
        const attributes = this.attributes = { position: { data: [] /* new Array(2+(m+1)*2*vCount) */, numComponents: 2 } };    
        //attributes.position.data[0] = 0.0;
        //attributes.position.data[1] = 0.0;
        attributes.position.data.push(0,0);

        this._computePts();
        this.createBufferInfo(attributes);
    }  

    _computePts() {
        const m = this.m;
        const buffer = this.attributes.position.data;
        let pts = [];
        for(let side=0; side<this.vCount; side++) {
            let phi = 2*Math.PI*side/this.vCount;
            pts.push([this.radius*Math.cos(phi),this.radius*Math.sin(phi)]);
        }
        for(let side=0; side<this.vCount; side++) {
            let hSegment = new HSegment(pts[side], pts[(side+1)%this.vCount]);
            for(let i=0; i<m; i++) {
                let p = hSegment.getPoint(i/m);
                let k = side*m+i;
                //buffer[2*k] = p[0];
                //buffer[2*k+1] = p[1];   
                buffer.push(p[0], p[1])             
            }
        }
        buffer.push(buffer[2], buffer[3])
        //let t = buffer.length;
        //buffer[t-2] = buffer[2];
        //buffer[t-1] = buffer[3];
        
    }
}

class HRegularPolygon {
    constructor(gl, vCount, radius) {
        this.gl = gl;
        this.vCount = vCount;
        this.radius = radius;
        let phi = Math.PI*2/vCount;
        this.edge = new HSegmentMesh(gl, 100, [radius,0.0], [Math.cos(phi)*radius, Math.sin(phi)*radius]);
        this.matrix = m4.identity();
    }

    draw() {
        let oldMatrix = this.edge.material.uniforms.hModelMatrix;
        this.edge.material.setColor([0.5,0.3,0.5,1]);
        for(let i=0; i<this.vCount; i++) {
            let phi = Math.PI*2*i/this.vCount;
            this.edge.material.uniforms.hModelMatrix = m4.multiply(this.matrix, m4.rotationZ(phi));
            this.edge.draw();
        }
        this.edge.material.uniforms.hModelMatrix = oldMatrix;
    }

    drawVertices(dot) {
        let p0 = this.edge.hSegment.p0;
        for(let i=0; i<this.vCount; i++) {
            let phi = Math.PI*2*i/this.vCount;
            let matrix = m4.multiply(this.matrix, m4.rotationZ(phi));
            let p = pTransform(matrix, p0);

            let mat = twgl.m4.translation([p[0], p[1],0.0]);
            let oldMat = dot.material.uniforms.modelMatrix;
            dot.material.uniforms.modelMatrix = mat;
            dot.draw();
            dot.material.uniforms.modelMatrix = oldMat;
        }
    }

    setFirstVertex(p) {
        let p2 = m4.transformPoint(m4.rotationZ(2*Math.PI/this.vCount), [p[0],p[1],0]);
        this.edge.setEnds(p,p2);
    }

    // pi rotation around the i-th edge midpoint
    getEdgeMatrix(i) {
        let p = pMidPoint(this.edge.hSegment.p0, this.edge.hSegment.p1);
        p = m4.transformPoint(m4.rotationZ(2*Math.PI*i/this.vCount), [p[0],p[1],0,1]);
        let mat = hTranslation(p[0], p[1]);
        return m4.multiply(
            mat, m4.multiply(m4.rotationZ(Math.PI), m4.inverse(mat))
        );
    }
}






class HGearMesh extends Mesh {
    constructor(gl, vCount, radius, m = 10) {
        super(gl, gl.LINES, getSimpleHyperbolicMaterial(gl));
        this.vCount = vCount;
        this.radius = radius;
        this.m = m;
        const attributes = this.attributes = { position: { data: [], numComponents: 2 } };    
        this._computePts();
        this.createBufferInfo(attributes);
    }  

    _computePts() {
        let m = this.m;
        const buffer = this.attributes.position.data;
        
        let r = this.radius * 0.78;
        let r0 = r - this.radius * 0.05;
        let r1 = r + this.radius * 0.05;

        /*
        let r2 = this.radius * 0.7;
        let r3 = this.radius * 0.69;
        let r4 = this.radius * 0.06;
        let r5 = this.radius * 0.05;
        */

        m = 30;
        for(let i=0; i<m; i++) {
            let phis = [0,1,2,3,4].map(j=>2*Math.PI*(i+j/4-0.63)/m);
            let cssn = phis.map(phi=>[Math.cos(phi), Math.sin(phi)]);
            let pts = [r0,r1,r1,r0,r0].map((r,j)=>
                [r*cssn[j][0], r*cssn[j][1]]);
            // buffer.push(...pts[0], ...pts[1])
            for(let j=0; j<4; j++) 
                buffer.push(...pts[j], ...pts[j+1]);    
            [0.03,0.07,0.68,0.70].forEach(rr=> {
                let r = this.radius * rr;
                for(let j=0; j<4; j++) {
                    buffer.push(cssn[j][0]*r,cssn[j][1]*r,cssn[j+1][0]*r,cssn[j+1][1]*r);
                }
            });
                    
        }

        /*
        let pts = [];
        for(let side=0; side<this.vCount; side++) {
            let phi = 2*Math.PI*side/this.vCount;
            pts.push([this.radius*Math.cos(phi),this.radius*Math.sin(phi)]);
        }

        for(let side=0; side<this.vCount; side++) {
            this._addSegment(pts[side], pts[(side+1)%this.vCount]);
            // this._addSegment([0,0], pts[(side+1)%this.vCount]);
            /*
            let hSegment = new HSegment(pts[side], pts[(side+1)%this.vCount]);
            for(let i=0; i<m; i++) {
                let p = hSegment.getPoint(i/m);
                let k = side*m+i;
                buffer.push(p[0], p[1]);
            }
            * /
        }
        */

    }

    _addSegment(p0, p1) {
        const buffer = this.attributes.position.data;
        let m = 10;
        let hSegment = new HSegment(p0,p1);
        for(let i=0; i<m; i++) {
            let p = hSegment.getPoint(i/m);
            
            buffer.push(p[0], p[1]);
        }
    }
}




class HPseudoSphereMesh extends Mesh {
    constructor(gl) {
        super(gl, gl.LINE_STRIP, getSimpleHyperbolicMaterial(gl));
        const attributes = this.attributes = { position: { data: [], numComponents: 2 } };    
        this._computePts();
        this.createBufferInfo(attributes);
    }  

    _computePts() {
        const buffer = this.attributes.position.data;


        let r = 0.5;
        // let theta = this.foo(r);
        // console.log("theta=", theta)
        let theta = 1.0;
        let cx = 0, cy = 1-r;

        let m = 100;

        let x1 = cx + Math.sin(theta) * r;
        let y1 = cy - Math.cos(theta) * r;
        
        let hsegm = new HSegment([0,0.9999], [x1,y1]);

        for(let i=0; i<m; i++) {
            let p = hsegm.getPoint(i/m);
            buffer.push(...p);
        }
        for(let i=0; i<m; i++) {       
            let phi = theta * (1.0 - i/m);            
            let x = cx + r * Math.sin(phi);
            let y = cy - r * Math.cos(phi);
            buffer.push(x,y);            
        }
        let k = buffer.length;
        while(k>=2) {
            buffer.push(-buffer[k-2], buffer[k-1]);
            k-=2;
        }
    }

    foo(t) {
        let cx = 0, cy = t * 0.5, r = t * 0.5;
        let x0 = 0, y0 = cy - r;
        let dist0 = 0.0;
        let theta0 = 0;
        let targetDist = 1; //Math.PI;
        let count = 0;
        while(count++<5000) {
            let theta1 = theta0 + 0.1;
            let x1 = cx + r*Math.sin(theta1);
            let y1 = cy - r*Math.cos(theta1);
            let x = (x0+x1)/2, y = (y0+y1)/2;
            let uff = Math.pow(1-x*x-y*y,2);
            if(uff <= 0.0) break;
            let dx = x1-x0, dy = y1-y0;
            let d = Math.sqrt((dx*dx+dy*dy)/uff);
            console.log(x,y,uff,d);
            let dist1 = dist0 + d;
            if(dist1 > targetDist) {
                return theta0 + (theta1-theta0)*(targetDist-dist0)/d;
            }
            dist0 = dist1;
            theta0 = theta1;
            x0 = x1;
            y0 = y1;
        }
        console.log(theta0, dist0);
    }

    _addSegment(p0, p1) {
        const buffer = this.attributes.position.data;
        let m = 10;
        let hSegment = new HSegment(p0,p1);
        for(let i=0; i<m; i++) {
            let p = hSegment.getPoint(i/m);
            
            buffer.push(p[0], p[1]);
        }
    }
}
