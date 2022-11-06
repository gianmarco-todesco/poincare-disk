
let viewer;
document.addEventListener('DOMContentLoaded', createLayout);


function addToolButton(container, text, tool) {
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

    addToolButton(controlPanel, "uno", new AddHLineTool());
    addToolButton(controlPanel, "due", new MoveHLineTool());
    

    viewer = new DiskViewer(canvas);

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
            width:50px;
            height:30px;
            border-radius:10px;
            border:solid 1px gray;
            margin:10px;
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

