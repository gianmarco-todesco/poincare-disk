"use strict";

class ToolManager {

}


class AddLineAndPointTool {
    onPointerDown(viewer, p) {
        let q = viewer.getClosestPoint(p);
        if(!q) q = viewer.diagram.createPoint(p);
        this.p0 = this.p1 = q;
        this.p1IsFree = false;
        this.hline = undefined;
    }
    onPointerDrag(viewer, p) {
        if(this.p1IsFree) viewer.diagram.removePoint(this.p1);
        let q = viewer.getClosestPoint(p);
        if(q) {
            this.p1 = q;
            this.p1IsFree = false;
        } else {
            this.p1 = viewer.diagram.createPoint(p);
            this.p1IsFree = true;
        }
        if(this.p1 == this.p0) {
            if(this.hline) { viewer.diagram.removeLine(this.hline); this.hline = undefined; }
        } else {
            if(!this.hline) this.hline = viewer.diagram.createLine(new HLine(1,0,0));
            this.hline.setByPoints(this.p0, this.p1);
        }
    }
    onPointerUp(viewer) {
        if(this.hline && this.p0 != this.p1) {
            this.hline.addPoint(this.p0);
            this.hline.addPoint(this.p1);
        }
        this.hline = undefined;
        this.p0 = this.p1 = undefined;
        console.log(viewer.diagram.points.length, viewer.diagram.lines.length);
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

class MovePointTool {
    onPointerDown(viewer, p) {
        let q = this.currentPoint = viewer.getClosestPoint(p);
        if(q) {
            this.offset = {x : q.x - p.x, y : q.y - p.y};
        } else {
            let line = this.currentLine = viewer.getClosestLine(p);
            if(line) {
                line.isCurrent = true;
                this.param = line.getParameterAt(p);
                this.oldPos = p;
                //let pos = line.getPoint(parameter);
                //viewer.diagram.createPoint(pos);
            }
        }
    }
    onPointerDrag(viewer, pos) {
        let point = this.currentPoint;
        if(point) {
            viewer.diagram.movePoint(point, pos.add(this.offset));
        } else if(this.currentLine) {
            viewer.diagram.moveLine(this.currentLine, pos);
            /*
            let delta = pos.sub(this.oldPos);
            this.oldPos = new Point(pos.x, pos.y);
            console.log(delta);
            let p0 = this.currentLine.getPoint(this.param - 0.01).add(delta);
            let p1 = this.currentLine.getPoint(this.param + 0.01).add(delta);
            this.currentLine.setByPoints(p0,p1);
            */
        }
    }
    onPointerUp(viewer, p) {}
    
}


class CreateParallelsTool {
    onPointerDown(viewer, p) {
        let line = this.line = viewer.getClosestLine(p);
        this.p = viewer.diagram.createPoint(p);
        this.line1 = viewer.diagram.createLine();
        this.line2 = viewer.diagram.createLine();
        this.line1.setByPoints(this.line.getPoint(0), this.p);
        this.line2.setByPoints(this.line.getPoint(1), this.p);
    }
    onPointerDrag(viewer, pos) {
        pos = viewer.diagram.adjustPoint(pos);
        this.p.x = pos.x;
        this.p.y = pos.y;
        this.line1.setByPoints(this.line.getPoint(0), this.p);
        this.line2.setByPoints(this.line.getPoint(1), this.p);
    }
    onPointerUp(viewer, p) {}
    
}