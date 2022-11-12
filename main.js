
let viewer;
document.addEventListener('DOMContentLoaded', createLayout);


function addToolButton(container, viewer, tool) {
    let btn = document.createElement('div');
    btn.classList.add('tool-btn');
    container.appendChild(btn);
    btn.onclick = ()=>{ 
        document.querySelectorAll('.tool-btn').forEach(other=>other.classList.remove('current'));
        btn.classList.add('current');
        viewer.tool = tool;
    }
    return btn;
}

function createLayout() {
    let mainContainer = document.getElementById('main-container');

    // control panel
    let controlPanel = document.createElement('div');
    controlPanel.classList.add('control-panel');
    mainContainer.appendChild(controlPanel);

    // canvas
    let canvas = document.createElement('canvas');
    canvas.classList.add('viewer');
    mainContainer.appendChild(canvas);

    viewer = new DiskViewer(canvas);

    let buttons = [];
    let btn;
    
    btn = addToolButton(controlPanel, viewer, new MovePointTool());
    buttons.push(btn);
    btn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
    <path stroke="black" fill="none" d="M25.5 30.25 l4 -4 l-10 -10 l5 -5 l-14 0 l0 14 l5 -5 l10 10z"/>
    <path fill="none" stroke="none" d="M0 0h36v36h-36z"/>    
    </svg>
    `;
    

    btn = addToolButton(controlPanel, viewer, new AddLineAndPointTool());
    buttons.push(btn);
    btn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
    <path d="M 2 22 A 18 18 0 0 1 33 22" stroke="black" fill="transparent"/>
    <circle fill="black" cx="10" cy="15" r="2.5"/>
    <circle fill="black" cx="28" cy="17" r="2.5"/>
    <path fill="none" stroke="none" d="M0 0h36v36h-36z"/>    
    </svg>
    `;

    btn = addToolButton(controlPanel, viewer, new CreateParallelsTool());
    buttons.push(btn);
    
    
    buttons[1].click();


    let span = document.createElement('span');
    span.classList.add('spc');
    controlPanel.appendChild(span);

    btn = document.createElement('button');
    btn.innerHTML = "clear";
    btn.classList.add('btn');
    controlPanel.appendChild(btn);
    btn.onclick = ()=> { viewer.diagram.clear();buttons[1].click();}


    


    let style = document.createElement('style');
    style.innerHTML = `
        #main-container {
            margin:0;
            padding:0;
            display:flex;
            flex-direction:column;            
        }
        .control-panel {
            /* border:solid 4px blue; */
            flex:0;
            display:flex;
            flex-direction:row;     
        }
        .viewer {
            /*border:solid 4px red;*/
            flex:1;
            aspect-ratio:1;
            max-height:80vh;
        }
        .spc { flex:1; }
        .tool-btn {
            background-color:white;
            width:40px;
            height:40px;
            border-radius:5px;
            border:solid 1px #bbb;
            margin:5px;
            cursor: pointer;
            text-align: center;
            line-height:40px;
            padding:1px;
        }
        .tool-btn:hover {
            border:solid 0.5px blue;
        }
        .tool-btn:active {
            filter: brightness(50%);
        }
        .tool-btn.current {
            border:solid 2px blue;

        }
        .btn {
            height:2.0em;            
        }
        
    `;
    document.head.appendChild(style);
}

