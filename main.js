
let viewer;
document.addEventListener('DOMContentLoaded', createLayout);


function addToolButton(container, text, viewer, tool) {
    let btn = document.createElement('div');
    btn.innerHTML = text;
    btn.classList.add('tool-btn');
    container.appendChild(btn);
    btn.onclick = ()=>{ 
        console.log("ciao") 
        document.querySelectorAll('.tool-btn').forEach(other=>other.classList.remove('current'));
        btn.classList.add('current');
        viewer.tool = tool;
    }
    return btn;
}

function createLayout() {
    let mainContainer = document.getElementById('main-container');
    let canvas = document.createElement('canvas');
    canvas.classList.add('viewer');
    mainContainer.appendChild(canvas);
    let controlPanel = document.createElement('div');
    controlPanel.classList.add('control-panel');
    mainContainer.appendChild(controlPanel);

    viewer = new DiskViewer(canvas);

    let buttons = [];
    let btn;
    btn = addToolButton(controlPanel, "add line", viewer, new AddHLineTool());
    buttons.push(btn);
    btn = addToolButton(controlPanel, "bu", viewer, new MoveHLineTool());
    buttons.push(btn);
    btn = addToolButton(controlPanel, "move", viewer, new MovePointTool());
    buttons.push(btn);
    
    buttons[0].click();


    let style = document.createElement('style');
    style.innerHTML = `
        #main-container {
            margin:0;
            padding:0;
            display:flex;
            flex-direction:row;
            height:100%;
        }
        .viewer {
            /*border:solid 4px red;*/
            aspect-ratio:1;
            flex:1;
        }
        .control-panel {
            border:solid 4px blue;
            flex:1;
        }
        .tool-btn {
            background-color:cyan;
            width:70px;
            height:30px;
            border-radius:10px;
            border:solid 1px gray;
            margin:10px;
            cursor: pointer;
            text-align: center;
            line-height:30px;
        }
        .tool-btn:hover {
            filter: brightness(85%);
        }
        .tool-btn:active {
            filter: brightness(50%);
        }
        .tool-btn.current {
            background-color:orange;

        }
        
    `;
    document.head.appendChild(style);
}

