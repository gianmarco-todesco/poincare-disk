"use strict";

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

    getClosestPoint(p, maxWorldDistance) {
        let d = maxWorldDistance;
        let lst = this.points
            .map(q=>({q, d:getDistance(p,q)}))
            .filter(q=>q.d<d)
            .sort((a,b)=>a.d-b.d)
            .map(q=>q.q);
        return lst.length > 0 ? lst[0] : null;
    } 

    getClosestLine(p, maxWorldDistance) {
        let d = maxWorldDistance;
        let lst = this.lines
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
        point.lines.forEach(line => {
            if(line.points.length == 2) {
                line.setByPoints(line.points[0], line.points[1]);
            }
        })
    }

    moveLine(line, pos) {
        pos = this.adjustPoint(pos);
        let params = line.points.map(p=>line.getParameterAt(p));
        line.moveTo(pos);
        line.points.forEach((p,i) => {
            let q = line.getPoint(params[i]);
            p.x = q.x;
            p.y = q.y;
            p.lines.filter(other=>other!=line).forEach(other => {
                if(other.points.length == 2) {
                    other.setByPoints(other.points[0], other.points[1]);
                }
            })
        });

    }

    clear() {
        this.points = [];
        this.lines = [];
    }
}