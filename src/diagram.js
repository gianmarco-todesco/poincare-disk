"use strict";

import { Point, HLine } from "./geometry.js";

class DiagramPoint extends Point {
    constructor(x,y) {
        super(x,y);
        this.lines = [];
    }
    addLine(line) {
        if(!this.lines.includes(line)) {
            this.lines.push(line);
            line.addPoint(this);
        }
    }
    removeLine(line) {
        let j = this.lines.indexOf(line);
        if(j>=0) {
            this.lines.splice(j,1);
            line.removePoint(this);
        }
    }
    dtor() {
        while(this.lines.length>0) this.removeLine(this.lines[0]);
    }
}

class DiagramLine extends HLine {
    constructor() {
        super();
        this.points = [];
    }
    addPoint(point) {
        if(!this.points.includes(point)) {
            this.points.push(point);
            point.addLine(this);
        }
    }
    removePoint(point) {
        let j = this.points.indexOf(point);
        if(j>=0) {
            this.points.splice(j,1);
            point.removeLine(this);
        }
    }
    dtor() {
        while(this.points.length>0) this.removePoint(this.points[0]);
    }

}


class Diagram {
    constructor() {
        this.points = [];
        this.lines = [];
        this.mirrors = [];
    }

    adjustPoint(p) {
        let r = p.getLength();
        if(r>1.0) p.scaleInPlace(1.0/r);
        return p;
    }
    createPoint(p) { 
        p = new DiagramPoint(p.x,p.y);
        this.adjustPoint(p);
        this.points.push(p); 
        return p;
    }
    removePoint(point) { 
        let j = this.points.indexOf(point); 
        if(j<0) return;
        this.points.splice(j,1); 
        point.dtor();
    }
    
    createLine() { 
        let line = new DiagramLine();
        this.lines.push(line); 
        return line;
    }
    removeLine(line) { 
        let j = this.lines.indexOf(line); 
        if(j<0) return;              
        this.lines.splice(j,1); 
        line.dtor();
    }
    createMirror() {
        let line = new DiagramLine();
        this.mirrors.push(line); 
        return line;
    }
    removeMirror(line) { 
        let j = this.mirrors.indexOf(line); 
        if(j<0) return;              
        this.mirrors.splice(j,1); 
        line.dtor();
    }

    getClosestPoint(p, maxWorldDistance) {
        let d = maxWorldDistance;
        let lst = this.points
            .map(q=>({q, d:Point.getDistance(p,q)}))
            .filter(q=>q.d<d)
            .sort((a,b)=>a.d-b.d)
            .map(q=>q.q);
        return lst.length > 0 ? lst[0] : null;
    } 

    getClosestLine(p, maxWorldDistance) {
        let d = maxWorldDistance;        
        let lst = [...this.lines, ...this.mirrors]
            .map(q=>({q, d:q.getDist(p)}))
            .filter(q=>q.d<d)
            .sort((a,b)=>a.d-b.d)
            .map(q=>q.q);
        return lst.length > 0 ? lst[0] : null;
    }

    movePoint(point, pos) {
        pos = this.adjustPoint(pos);
        point.x = pos.x;
        point.y = pos.y;
        point.lines.forEach(line => this.updateLineFromPoints(line));
    }

    moveLine(line, pos) {
        pos = this.adjustPoint(pos);
        line.moveTo(pos);
        // move line points
        line.points.forEach(p => {
            let param = line.getParameterAt(p);
            let q = line.getPoint(param);
            p.copyFrom(q);
            p.lines.filter(other=>other!=line).forEach(other => this.updateLineFromPoints(other));
        });
    }

    onLineMoved(line) {
        line.points.forEach(p => {
            let param = line.getParameterAt(p);
            let q = line.getPoint(param);
            p.copyFrom(q);
            p.lines.filter(other=>other!=line).forEach(other => {
                if(other.points.length == 2) {
                    other.setByPoints(other.points[0], other.points[1]);
                }
            })
        });
    }

    updateLineFromPoints(line) {
        const epsilon = 0.00001;
        const m = line.points.length;
        if(m == 0) return;
        else if(m == 1) {
            let p = line.points[0];
            let q = line.projectPoint(p);
            if(Point.getDistance(p,q) < epsilon) return;
            line.moveTo(p);
        } else {
            let p0 = line.points[0], p1 = line.points[m-1];
            /*if(line.points.length>2) {
                let params = line.points.map((p,i)=>[i, line.getParameterAt(p)]).sort((a,b)=>a[1]-b[1]);
                p0 = line.points[params[0][0]];
                p1 = line.points[params[m-1][0]];
            }*/
            line.setByPoints(p0,p1);

        }
    }

    clear() {
        this.points = [];
        this.lines = [];
        this.mirrors = [];
    }
}

export default Diagram
