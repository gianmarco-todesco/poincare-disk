
const m4 = twgl.m4;


function invertPoint(p) {
    const [x,y] = p;
    let factor = 1.0/(x*x+y*y);
    return [x*factor, y*factor]
}

function getDistance(pa,pb) {
    return Math.sqrt(Math.pow(pb[0]-pa[0],2) + Math.pow(pb[1]-pa[1],2));
}

function getLength(p) {
    return Math.sqrt(p[0]*p[0] + p[1]*p[1]);
}


function hTranslation(dx, dy) {
    let d = Math.sqrt(dx*dx+dy*dy);
    let phi = -Math.atan2(-dy,-dx);
    let cs = Math.cos(phi);
    let sn = Math.sin(phi);
    let h = 2 * Math.atanh(d);
    let csh = Math.cosh(h);
    let snh = Math.sinh(h);
    return twgl.m4.multiply(
        [
            cs,-sn, 0.0, 0.0,
            sn, cs, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0
        ],
        twgl.m4.multiply(
            [csh,0,-snh,0, 0,1,0,0, -snh,0,csh,0,0,0,0,1],
            [
                cs, sn, 0.0, 0.0,
               -sn, cs, 0.0, 0.0,
                0.0, 0.0, 1.0, 0.0,
                0.0, 0.0, 0.0, 1.0
            ]));
}
hTranslation1 = hTranslation;

/*

  function hRotation(dx, dy, phi) {
    let cs = Math.cos(phi);
    let sn = Math.sin(phi);
  
    let rot = [
      cs, sn, 0.0, 0.0,
      -sn, cs, 0.0, 0.0,
       0.0, 0.0, 1.0, 0.0,
       0.0, 0.0, 0.0, 1.0];
  
    return  m4.multiply(hTranslation(-dx,-dy),m4.multiply(rot,hTranslation(dx,dy)));
  }
  */

// n.b. in the hyperboloid: x^2+y^2-z^2 = -1
  
// poincaré to hyperboloid 
function p2h(p) { 
    let t = 2.0/(1.0-(p[0]*p[0]+p[1]*p[1])); 
    return [t*p[0],t*p[1],t-1.0,1.0]; 
}
// hyperboloid to poincaré
function h2p(p) {
    let d = 1.0/(p[3] + p[2]);
    return [p[0]*d, p[1]*d];
}
// poincaré to klein
function p2k(p) {
    let s = 2.0/(1.0 + p[0]*p[0] + p[1]*p[1]);
    return [s*p[0], s*p[1]]
}
// klein to poincaré
function k2p(p) {
    let s = 1.0/(1.0 + Math.sqrt(1.0 - p[0]*p[0] - p[1]*p[1]));
    return [s*p[0], s*p[1]]
}

// poincaré => hyperboloid => transform => poincaré
function pTransform(mat, p) {
    let q = [0,0,0,1];
    twgl.m4.transformPoint(mat, p2h(p), q);
    return h2p(q);
}


// midpoint in poincaré model
function pMidPoint(a,b) {
    let ha = p2h(a);
    let hb = p2h(b);
    let x = ha[0]+hb[0], y = ha[1]+hb[1], z = ha[2]+hb[2];
    let factor = 1.0/Math.sqrt(z*z-x*x-y*y)    
    let h = [x*factor,y*factor,z*factor,1];
    return h2p(h);
}

function normalizeHMatrix(hmatrix) {
    let p = pTransform(hmatrix, [0,0]);
    let hmatrix1 = m4.multiply(hTranslation(-p[0], -p[1]), hmatrix);
    let q = pTransform(hmatrix1, [0.5,0]);
    let phi = Math.atan2(q[1],q[0]);
    return m4.multiply(hTranslation(p[0], p[1]), m4.rotationZ(phi));
}

// return a circle passing by three points : [cx,cy,r]
// see: https://www.geeksforgeeks.org/equation-of-circle-when-three-points-on-the-circle-are-given/
function getCircle(p1, p2, p3)
{
    let [x1,y1] = p1;
    let [x2,y2] = p2;
    let [x3,y3] = p3;
    
    let x12 = x1 - x2;
    let x13 = x1 - x3;
 
    let y12 = y1 - y2;
    let y13 = y1 - y3;
 
    let y31 = y3 - y1;
    let y21 = y2 - y1;
 
    let x31 = x3 - x1;
    let x21 = x2 - x1;
 
    //x1^2 - x3^2
    let sx13 = Math.pow(x1, 2) - Math.pow(x3, 2);
 
    // y1^2 - y3^2
    let sy13 = Math.pow(y1, 2) - Math.pow(y3, 2);
 
    let sx21 = Math.pow(x2, 2) - Math.pow(x1, 2);
    let sy21 = Math.pow(y2, 2) - Math.pow(y1, 2);
 
    let fden = 2 * (y31 * x12 - y21 * x13);
    let gden = 2 * (x31 * y12 - x21 * y13);
    
    const eps = 1.0e-8;
    if(Math.abs(fden)<eps || Math.abs(gden) < eps)
    {
        // punti allineati
        return null;
    }
    
    let f = ( sx13 * x12
            + sy13 * x12
            + sx21 * x13
            + sy21 * x13)
            / fden;
    let g = ( sx13 * y12
            + sy13 * y12
            + sx21 * y13
            + sy21 * y13)
            / gden;
 
    let c = -(Math.pow(x1, 2)) - Math.pow(y1, 2) - 2 * g * x1 - 2 * f * y1;
 
    // eqn of circle be
    // x^2 + y^2 + 2*g*x + 2*f*y + c = 0
    // where centre is (h = -g, k = -f) and radius r
    // as r^2 = h^2 + k^2 - c
    let cx = -g;
    let cy = -f;
    // r is the radius
    let r = Math.sqrt(cx * cx + cy * cy - c);
    return [cx,cy,r]
}


// return a arc point generator f: f(0,0.0) == x1,y1, f(1,0.0) == x2,y2
// second parameter move across the arc (used to draw thick)
// see: https://www.geeksforgeeks.org/equation-of-circle-when-three-points-on-the-circle-are-given/
function getCircleArc(p1, p2, p3)
{
    let [x1,y1] = p1;
    let [x2,y2] = p2;
    let [x3,y3] = p3;
    
    let x12 = x1 - x2;
    let x13 = x1 - x3;
 
    let y12 = y1 - y2;
    let y13 = y1 - y3;
 
    let y31 = y3 - y1;
    let y21 = y2 - y1;
 
    let x31 = x3 - x1;
    let x21 = x2 - x1;
 
    //x1^2 - x3^2
    let sx13 = Math.pow(x1, 2) - Math.pow(x3, 2);
 
    // y1^2 - y3^2
    let sy13 = Math.pow(y1, 2) - Math.pow(y3, 2);
 
    let sx21 = Math.pow(x2, 2) - Math.pow(x1, 2);
    let sy21 = Math.pow(y2, 2) - Math.pow(y1, 2);
 
    let fden = 2 * (y31 * x12 - y21 * x13);
    let gden = 2 * (x31 * y12 - x21 * y13);
    
    const eps = 1.0e-8;
    if(Math.abs(fden)<eps || Math.abs(gden) < eps)
    {
        // punti allineati
        return function(t) {
            return [(1-t)*x1+t*x2, (1-t)*y1+t*y2];
        }
    }
    
    let f = ( sx13 * x12
            + sy13 * x12
            + sx21 * x13
            + sy21 * x13)
            / fden;
    let g = ( sx13 * y12
            + sy13 * y12
            + sx21 * y13
            + sy21 * y13)
            / gden;
 
    let c = -(Math.pow(x1, 2)) - Math.pow(y1, 2) - 2 * g * x1 - 2 * f * y1;
 
    // eqn of circle be
    // x^2 + y^2 + 2*g*x + 2*f*y + c = 0
    // where centre is (h = -g, k = -f) and radius r
    // as r^2 = h^2 + k^2 - c
    let cx = -g;
    let cy = -f;
    // r is the radius
    let r = Math.sqrt(cx * cx + cy * cy - c);

    return function(t) {
        let x = (1-t)*x1 + t*x2;
        let y = (1-t)*y1 + t*y2;
        let dx = x - cx;
        let dy = y - cy;
        let d = Math.sqrt(dx*dx+dy*dy);
        let s = r/d;
        return [cx + dx*s, cy + dy*s];        
    }
}

function getHThickness(x,y) {
    return Math.max(0.1, Math.pow(1.0 - x*x - y*y, 2.0))
}

class HLine {
    constructor(cx,cy,w) {
        this.setParameters(cx,cy,w);
    }

    setParameters(cx,cy,w) {
        this.cx = cx;
        this.cy = cy;
        this.w = w;
        if(this.w == 0.0) {
            this.phi = Math.atan2(cy,cx) + Math.PI/2;
            this.csPhi = Math.cos(this.phi);
            this.snPhi = Math.sin(this.phi);
        } else {
            cx /= w;
            cy /= w;  
            this.cx = cx;
            this.cy = cy;          
            let c2 = cx*cx + cy*cy;
            this.r = Math.sqrt(c2 - 1.0);
            let c = Math.sqrt(c2);
            this.e0 = [-cx/c, -cy/c];
            this.e1 = [-this.e0[1], this.e0[0]];
            this.theta = Math.acos(this.r/c);            
        }
    }

    setByPoints(p0, p1) {
        const [x0,y0] = p0;
        const [x1,y1] = p1;
        const eps = 1.0e-7;
        // check punti coincidenti
        if(Math.pow(x1-x0,2)+Math.pow(y1-y0,2)<eps) return;
        // calcolo le distanze quadrate dal centro
        let d0 = x0*x0 + y0*y0;
        let d1 = x1*x1 + y1*y1;
        
        // check punti allineati con il centro
        let q = x0*y1-y0*x1;
        if(Math.abs(q) < eps) {
            // punti allineati con il centro
            let p = d1>d0 ? p1 : p0;
            let x = -p[1], y = p[0];
            let r = Math.sqrt(x*x+y*y);
            this.setParameters(x/r,y/r,0.0);
        } else {
            // punti non allineati
            let p = invertPoint(d1>d0 ? p1 : p0);
            let circle = getCircle(p0,p1,p);
            this.setParameters(circle[0],circle[1],1.0);
        }
        
        
    }

    getPoint(t, w = 0.0) {
        let x,y,wx,wy;
        let tt = -1.0 + 2.0 * Math.max(0.0, Math.min(1.0, t));
        if(this.w == 0.0) {
            x = tt * this.csPhi;
            y = tt * this.snPhi;
            wx = -this.snPhi;
            wy = this.csPhi;
        } else {
            let angle = this.theta * (-1 + 2.0*t);
            let cs = Math.cos(angle), sn = Math.sin(angle);
            wx = this.e0[0] * cs + this.e1[0] * sn;
            wy = this.e0[1] * cs + this.e1[1] * sn;
            
            x = this.cx + wx * this.r;
            y = this.cy + wy * this.r;            
        }
        let ww = w != 0.0 ? w * getHThickness(x,y) : 0;
        return [x + wx*ww, y + wy*ww];
    }


    getDist(x, y) {
        if(this.w == 0.0) {
            // diametro
            let u = this.csPhi * x + this.snPhi * y;
            let v = -this.snPhi * x + this.csPhi * y;
            if(u>1) return getDistance([x,y], [this.csPhi, this.snPhi]);
            else if(u<-1) return getDistance([x,y], [-this.csPhi, -this.snPhi]);
            else return Math.abs(v);
        } else {
            let xx = x - this.cx, yy = y - this.cy;
            if(xx*this.e1[0] + yy*this.e1[1] < 0) 
            {
                let p = this.getPoint(0);
                if(xx * (p[1]-this.cy) - yy * (p[0]-this.cx) > 0) 
                    return getDistance([x,y], p);
            }
            else 
            {
                let p = this.getPoint(1);
                if(xx * (p[1]-this.cy) - yy * (p[0]-this.cx) < 0) 
                    return getDistance([x,y], p);
                
            }
            let r = getDistance([x,y], [this.cx,this.cy]);
            return Math.abs(r - this.r);
        }
    }

    getMirrorMatrix() {
        let phi = Math.atan2(-this.cy, this.cx);
        if(this.w == 0.0) {
            // lines is a diameter
            return [
                m4.rotationZ(-phi),
                m4.scaling([-1,1,1]),
                m4.rotationZ(phi)
            ].reduce((a,b) => m4.multiply(a,b));
        } else {
            // closest point to the origin
            let x = this.cx + this.r * this.e0[0];
            let y = this.cy + this.r * this.e0[1];
            return [
                hTranslation(x, y),
                m4.rotationZ(-phi),
                m4.scaling([-1,1,1]),
                m4.rotationZ(phi),
                hTranslation(-x, -y)                
            ].reduce((a,b) => m4.multiply(a,b));
            return m4.scaling([-1,1,1]);
        }
    }

}



class HSegment {
    constructor(p0, p1) {
        this.setEnds(p0,p1);
    }

    setEnds(p0, p1) {
        this.p0 = p0;
        this.p1 = p1;

        const [x0,y0] = p0;
        const [x1,y1] = p1;
        const eps = 1.0e-7;
        // check punti coincidenti
        if(Math.pow(x1-x0,2)+Math.pow(y1-y0,2)<eps) 
        {
            let p = [(x0+x1)/2, (y0+y1)/2];
            this._getPoint = (t, w) => p;
            return;
        }
        // calcolo le distanze quadrate dal centro
        let d0 = x0*x0 + y0*y0;
        let d1 = x1*x1 + y1*y1;
        
        // check punti allineati con il centro
        let q = x0*y1-y0*x1;
        if(Math.abs(q) < eps) {
            // punti allineati con il centro            
            let p = d1>d0 ? p1 : p0;
            let pp = Math.sqrt(p[0]*p[0] + p[1]*p[1]);
            const cs = p[0]/pp;
            const sn = p[0]/pp;
            const r0 = getLength(p0);
            const r1 = getLength(p1);
            this._getPoint = (t, w) => {
                let r = r0*(1-t) + r1*t;
                let x = cs*r, y = sn*r;
                let ww = w * getHThickness(x,y);
                return [x + -sn*ww, y + cs*ww];
            };
        } else {
            // punti non allineati
            let p = invertPoint(d1>d0 ? p1 : p0);
            let circle = getCircle(p0,p1,p);
            const [cx,cy,r] = circle; 
            const e0 = [(x0-cx)/r, (y0-cy)/r];
            let tmp = [-e0[1],e0[0]];
            const e1 = tmp[0] * (x1-cx) +  tmp[1] * (y1-cy) >= 0 ? tmp : [-tmp[0],-tmp[1]];
            let dx1 = x1 - cx, dy1 = y1 - cy;
            let dd = Math.sqrt(dx1*dx1 + dy1*dy1);            
            const theta = Math.acos((e0[0]*dx1 + e0[1]*dy1)/dd);
            this._getPoint = (t, w) => {
                let angle = theta * t;
                let cs = Math.cos(angle);
                let sn = Math.sin(angle);
                let ux = cs * e0[0] + sn * e1[0];
                let uy = cs * e0[1] + sn * e1[1];
                let x = cx + ux*r, y = cy + uy*r;
                let ww = w * getHThickness(x,y);
                return [x + ux*ww, y + uy*ww];
            };
        }
    }

    getPoint(t, w = 0.0) {
        return this._getPoint(t,w);
    }
}
