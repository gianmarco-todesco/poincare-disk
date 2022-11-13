"use strict";

import { HLine, Point } from './geometry';

class ToolManager {
    constructor() {
    }

    setCurrentTool(viewer, tool) {
        if(this.currentTool && this.currentTool.deactivate) this.currentTool.deactivate(viewer);
        this.currentTool = tool;
        if(this.currentTool && this.currentTool.activate) this.currentTool.activate(viewer);
    }

    onPointerDown(viewer, p, e) {
        if(this.currentTool && this.currentTool.onPointerDown) this.currentTool.onPointerDown(viewer,p,e);
    }
    onPointerDrag(viewer, p, e) {
        if(this.currentTool && this.currentTool.onPointerDrag) this.currentTool.onPointerDrag(viewer,p,e);
    }
    onPointerUp(viewer, e) {
        if(this.currentTool && this.currentTool.onPointerUp) this.currentTool.onPointerUp(viewer, e);
    }
    onPointerMove(viewer, p, e) {
        if(this.currentTool && this.currentTool.onPointerMove) this.currentTool.onPointerMove(viewer,p,e);
    }

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

class MoveTool {

    unselectLine(viewer) {
        if(this.currentLine) this.currentLine.isCurrent = false;
        this.currentLine = null;
        if(this.lineHandle) viewer.diagram.removePoint(this.lineHandle);
        this.lineHandle = null;
    }
    
    onPointerDown(viewer, p) {

        let point = viewer.getClosestPoint(p);
        if(point) {
            if(point == this.lineHandle && this.currentLine) {
                // clicked a line handle => we move the line
                this.currentPoint = point;
            } else {
                // clicked on a regular point
                this.offset = {x : point.x - p.x, y : point.y - p.y};
                this.currentPoint = point;
                this.unselectLine(viewer);
            }

        } else {
            let line = viewer.getClosestLine(p);
            this.currentPoint = null;
            if(line && line == this.currentLine) {
                // clicked on the current line; far from line handle => we rotate the line
                let parameter = line.getParameterAt(p);
                

            } else if(line) {
                // clicked on a new line; select & move the line
                this.currentLine = line;
                this.currentLine.isCurrent = true;
                p = line.getPoint(line.getParameterAt(p));
                if(!this.lineHandle) { 
                    this.lineHandle = viewer.diagram.createPoint(p); 
                    this.lineHandle.isHandle = true; 
                }
                else this.lineHandle.copyFrom(p);
                this.currentPoint = this.lineHandle;
            } else {
                // nothing clicked
                this.unselectLine(viewer);
            }
        }        
    }


    onPointerDrag(viewer, pos) {
        if(this.currentPoint && this.currentLine && this.currentPoint == this.lineHandle) {
            // moving current line (by the lineHandle)
            let line = this.currentLine;
            viewer.diagram.moveLine(line, pos);
            let p = line.getPoint(line.getParameterAt(pos));
            this.lineHandle.copyFrom(p);
        } else if(this.currentPoint) {
            // moving current point
            let actualPos = pos.add(this.offset);
            // move outside => delete
            if(actualPos.getLength()>=1.0 + 0.01) {
                viewer.diagram.removePoint(this.currentPoint);
                this.currentPoint = null;
                return;
            } else {
                viewer.diagram.movePoint(this.currentPoint, actualPos);
            }
        } else if(this.currentLine) {
            // rotate current line
            this.currentLine.setByPoints(this.lineHandle, pos);
            viewer.diagram.onLineMoved(this.currentLine);
        }
        /*
            if(this.currentLine && point == this.rotHandle || point == this.moveHandle) {
                actualPos = viewer.diagram.adjustPoint(actualPos);
                this.currentPoint.copyFrom(actualPos);
                this.currentLine.setByPoints(this.moveHandle, this.rotHandle);
                return;
            }
            else if(actualPos.getLength()>=1.0 - 1.0e-5) {
                viewer.diagram.removePoint(this.currentPoint);
                this.currentPoint = null;
                return;
            }
            viewer.diagram.movePoint(point, actualPos);
        } else if(this.currentLine) {
            if(pos.getLength()>=1.0 - 1.0e-5) {
                viewer.diagram.removeLine(this.currentLine);
                this.currentLine = null;
                return;
            }
            viewer.diagram.moveLine(this.currentLine, pos);
            / *
            let delta = pos.sub(this.oldPos);
            this.oldPos = new Point(pos.x, pos.y);
            console.log(delta);
            let p0 = this.currentLine.getPoint(this.param - 0.01).add(delta);
            let p1 = this.currentLine.getPoint(this.param + 0.01).add(delta);
            this.currentLine.setByPoints(p0,p1);
            * /
        }
        */
    }
    onPointerUp(viewer, p) {
        // if(this.currentLine) this.currentLine.isCurrent = false;
        // this.currentLine = null;
    }

    deactivate(viewer) {
        this.unselectLine(viewer);
        if(this.lineHandle) {
            viewer.removePoint(this.lineHandle);
            this.lineHandle = null;
        }
    }
    
}


class CreateParallelsTool {
    onPointerDown(viewer, p) {
        let line = this.line = viewer.diagram.getClosestLine(p, 2); 
        if(line) {
            this.p = viewer.diagram.createPoint(p);
            this.line1 = viewer.diagram.createLine();
            this.line2 = viewer.diagram.createLine();
            this.line1.setByPoints(this.line.getPoint(0), this.p);
            this.line2.setByPoints(this.line.getPoint(1), this.p);    
        }
    }
    onPointerDrag(viewer, pos) {
        if(!this.line) return;
        pos = viewer.diagram.adjustPoint(pos);
        this.p.x = pos.x;
        this.p.y = pos.y;
        this.line1.setByPoints(this.line.getPoint(0), this.p);
        this.line2.setByPoints(this.line.getPoint(1), this.p);
    }
    onPointerUp(viewer, p) {
        
    }
    
}


class FreeHandDrawTool {
    constructor() {
        this.thickness = 10;
    }
    limitPoint(p) {
        let r = p.getLength();
        const maxr = 0.8;
        if(r>maxr) return p.scale(maxr/r);
        else return p;
    }

    onPointerDown(viewer, p) {
        const ctx = viewer.textureCtx
        let tp = viewer.worldPosToTexturePos(this.limitPoint(p));
        ctx.beginPath();
        ctx.arc(tp.x,tp.y,this.thickness/2, 0, 2*Math.PI);
        ctx.fillStyle = 'black';
        ctx.fill();
        viewer.updatePaintedDisk();
        this.oldTp = tp;
        ctx.lineWidth = this.thickness;
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        
    }
    onPointerDrag(viewer, pos) {
        const ctx = viewer.textureCtx;
        let tp = viewer.worldPosToTexturePos(this.limitPoint(pos));
        ctx.beginPath();
        ctx.moveTo(this.oldTp.x, this.oldTp.y);
        ctx.lineTo(tp.x, tp.y);
        ctx.stroke();
        viewer.updatePaintedDisk();
        this.oldTp.copyFrom(tp);
    }
    onPointerUp(viewer, p) {}
    
}

class AddMirrorTool {
    constructor() {

    }
    onPointerDown(viewer, p) {
        this.p0 = viewer.diagram.createPoint(p);
        this.p1 = viewer.diagram.createPoint(p);
        this.mirror = null;
    }

    onPointerDrag(viewer, pos) {
        pos = viewer.diagram.adjustPoint(pos);
        this.p1.copyFrom(pos);
        console.log(this.p1);
        if(Point.getDistance(this.p0, this.p1)>1.0e-5) {
            if(!this.mirror) this.mirror = viewer.diagram.createMirror();
            this.mirror.setByPoints(this.p0, this.p1);
            console.log(this.p0, this.p1, Point.getDistance(this.p0, this.p1), this.mirror);
        } else {
            console.log("same point", this.p0, this.p1);
            if(this.mirror) viewer.diagram.removeMirror(this.mirror);
            this.mirror = null;
        }
    }
    onPointerUp(viewer, p) {
        viewer.diagram.removePoint(this.p0);
        viewer.diagram.removePoint(this.p1);
        this.p0 = this.p1 = this.mirror = null;
    }
}


export { ToolManager, AddLineAndPointTool, MoveTool, CreateParallelsTool, FreeHandDrawTool, AddMirrorTool }