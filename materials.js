let currentMaterial = null;
const viewMatrix = twgl.m4.identity();
const modelMatrix = twgl.m4.identity();
const hViewMatrix = twgl.m4.identity();

let simpleMaterial;
let simpleHyperbolicMaterial;

// -----------------------------
// Material
// -----------------------------
class Material {
    constructor(gl, options) {
        this.gl = gl;
        let vs = options.vs;
        let fs = options.fs;
        this.uniforms = options.uniforms;
        this.programInfo = twgl.createProgramInfo(gl, [vs, fs]);          
    }

    setUniforms() {
        twgl.setUniforms(this.programInfo, this.uniforms);  
    }
    bind() {
        if(currentMaterial != this) {
            currentMaterial = this;
            this.gl.useProgram(this.programInfo.program);
        }        
        twgl.setUniforms(this.programInfo, this.uniforms);
    }

    updateTexture(texture, src) {
        let gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

};



// -----------------------------
// SimpleMaterial
// -----------------------------
class SimpleMaterial extends Material {
    constructor(gl) {
        super(gl, {
            vs : `
            precision mediump float;
            attribute vec2 position;
            uniform mat4 viewMatrix, modelMatrix;
            void main(void) { 
                gl_Position = viewMatrix * modelMatrix * vec4(position, 0.0, 1.0); 
            }
            `,
            fs:`
            precision mediump float;            
            uniform vec4 color;        
            void main() {
                gl_FragColor = color; 
            } 
            `,
            uniforms: {
                color: [0.0,0.0,0.0,1.0],
                viewMatrix: viewMatrix,
                modelMatrix: modelMatrix
            }
        });
    }
    setColor(rgba) {
        for(let i=0;i<4;i++) this.uniforms.color[i] = rgba[i];        
    }
    setModelMatrix(matrix) {
        this.modelMatrix = matrix;
    }
};


// -----------------------------
// SimpleTexturedMaterial
// -----------------------------
class SimpleTexturedMaterial extends Material {
    constructor(gl) {
        super(gl, {
            vs : `
            precision mediump float;
            attribute vec2 position;
            uniform mat4 viewMatrix, modelMatrix;
            varying vec2 v_pos;
            void main(void) { 
                v_pos = position;
                gl_Position = viewMatrix * modelMatrix * vec4(position, 0.0, 1.0); 
            }
            `,
            fs:`
            precision mediump float;            
            uniform vec4 color;       
            uniform sampler2D texture;
            varying vec2 v_pos;
            void main() {
                gl_FragColor = texture2D(texture, vec2(0.5, 0.5) + v_pos * 0.5); 
                
            } 
            `,
            uniforms: {
                color: [0.0,0.0,0.0,1.0],
                viewMatrix: viewMatrix,
                modelMatrix: modelMatrix,
                texture:null,
            }
        });
    }
    setColor(rgba) {
        for(let i=0;i<4;i++) this.uniforms.color[i] = rgba[i];        
    }
    setModelMatrix(matrix) {
        this.modelMatrix = matrix;
    }
};




class SimpleHyperbolicMaterial extends Material {
    constructor(gl) {
        super(gl, {
            vs : `
            precision mediump float;
            attribute vec2 position;
            uniform mat4 hViewMatrix;
            uniform mat4 hModelMatrix;
            uniform mat4 viewMatrix;
            
            // poincaré to hyperboloid
            vec4 p2h(vec2 p) { 
                float t = 2.0/(1.0-(p.x*p.x+p.y*p.y)); 
                return vec4(t*p.x,t*p.y,t-1.0,1.0); 
            }
            // hyperboloid to poincaré
            vec2 h2p(vec4 p) {
                float d = 1.0/(p.w + p.z);
                return vec2(p.x*d, p.y*d);
            }

            void main(void) { 
                vec4 p = p2h(position);
                vec2 q = h2p(hViewMatrix * hModelMatrix * p);
                gl_Position = viewMatrix * vec4(q, 0.0, 1.0); 
            }
            `,
            fs:`
            precision mediump float;            
            uniform vec4 color;
            
            void main() {
                gl_FragColor = color; 
            } 
            `,
            uniforms: {
                color: [0.0,0.0,0.0,1.0],
                viewMatrix: viewMatrix,
                hModelMatrix: twgl.m4.identity(),
                hViewMatrix: twgl.m4.identity(),
            }
        });
    }
    setColor(rgba) {
        for(let i=0;i<4;i++) this.uniforms.color[i] = rgba[i];        
    }
};



function getSimpleMaterial(gl) {
    if(!simpleMaterial) simpleMaterial = new SimpleMaterial(gl);
    return simpleMaterial;
}

function getSimpleHyperbolicMaterial(gl) {
    if(!simpleHyperbolicMaterial) simpleHyperbolicMaterial = new SimpleHyperbolicMaterial(gl);
    return simpleHyperbolicMaterial;
}




class HyperbolicTexturedMaterial extends Material {
    constructor(gl) {
        super(gl, {
            vs : `
            precision mediump float;
            attribute vec2 position;
            uniform mat4 hViewMatrix;
            uniform mat4 hModelMatrix;
            uniform mat4 viewMatrix;
            varying vec2 v_pos;
            
            // poincaré to hyperboloid
            vec4 p2h(vec2 p) { 
                float t = 2.0/(1.0-(p.x*p.x+p.y*p.y)); 
                return vec4(t*p.x,t*p.y,t-1.0,1.0); 
            }
            // hyperboloid to poincaré
            vec2 h2p(vec4 p) {
                float d = 1.0/(p.w + p.z);
                return vec2(p.x*d, p.y*d);
            }

            void main(void) { 
                v_pos = position;
                vec4 p = p2h(position);
                vec2 q = h2p(hViewMatrix * hModelMatrix * p);
                gl_Position = viewMatrix * vec4(q, 0.0, 1.0); 
            }
            `,
            fs:`
            precision mediump float;            
            uniform vec4 color;
            varying vec2 v_pos;
            uniform sampler2D texture;
            void main() {
                gl_FragColor = texture2D(texture, vec2(0.5, 0.5) + v_pos * 0.5); 
            } 
            `,
            uniforms: {
                color: [0.0,0.0,0.0,1.0],
                viewMatrix: viewMatrix,
                hModelMatrix: twgl.m4.identity(),
                hViewMatrix: twgl.m4.identity(),
                texture: null // twgl.createTexture(gl, {src:'images/full-circle.png'})

            }
        });
    }
    setColor(rgba) {
        for(let i=0;i<4;i++) this.uniforms.color[i] = rgba[i];        
    }
};


class HyperbolicTexturedMaterialBis extends Material {
    constructor(gl) {
        super(gl, {
            vs : `
            precision mediump float;
            attribute vec2 position;
            uniform mat4 hMatrix;
            uniform mat4 viewMatrix;
            varying vec2 v_pos;
            
            // poincaré to hyperboloid
            vec4 p2h(vec2 p) { 
                float t = 2.0/(1.0-(p.x*p.x+p.y*p.y)); 
                return vec4(t*p.x,t*p.y,t-1.0,1.0); 
            }
            // hyperboloid to poincaré
            vec2 h2p(vec4 p) {
                float d = 1.0/(p.w + p.z);
                return vec2(p.x*d, p.y*d);
            }

            void main(void) { 
                vec4 p = p2h(position);
                vec2 q = h2p(hMatrix * p);
                v_pos = q;
                gl_Position = viewMatrix * vec4(q, 0.0, 1.0); 
            }
            `,
            fs:`
            precision mediump float;            
            uniform vec4 color;
            varying vec2 v_pos;
            uniform mat4 hInvMatrix;
            uniform sampler2D texture;

            // poincaré to hyperboloid
            vec4 p2h(vec2 p) { 
                float t = 2.0/(1.0-(p.x*p.x+p.y*p.y)); 
                return vec4(t*p.x,t*p.y,t-1.0,1.0); 
            }
            // hyperboloid to poincaré
            vec2 h2p(vec4 p) {
                float d = 1.0/(p.w + p.z);
                return vec2(p.x*d, p.y*d);
            }

            void main() {
                vec2 q = vec2(0.5, 0.5) + h2p(hInvMatrix * p2h(v_pos)) * 0.5;

                vec4 outColor1 = texture2D(texture, q);
                // vec4 outColor2 = texture2D(texture, q + vec2(0.002, 0.002));
                gl_FragColor = outColor1;

            } 
            `,
            uniforms: {
                color: [0.0,0.0,0.0,1.0],
                viewMatrix: viewMatrix,
                //hModelMatrix: twgl.m4.identity(),
                //hViewMatrix: twgl.m4.identity(),
                hMatrix: twgl.m4.identity(),
                hInvMatrix: twgl.m4.identity(),
                texture: null // twgl.createTexture(gl, {src:'images/full-circle.png'})

            }
        });
    }
    setColor(rgba) {
        for(let i=0;i<4;i++) this.uniforms.color[i] = rgba[i];        
    }
};


class HyperbolicInvertedTexturedMaterial extends Material {
    constructor(gl) {
        super(gl, {
            vs : `
            precision mediump float;
            attribute vec2 position;
            uniform mat4 viewMatrix;
            varying vec2 v_pos;
            
            void main(void) { 
                v_pos = position;
                gl_Position = viewMatrix * vec4(position, 0.0, 1.0); 
            }
            `,
            fs:`
            precision mediump float;            
            uniform vec4 color;
            varying vec2 v_pos;
            uniform sampler2D texture;
            uniform mat4 hViewMatrix;
            uniform mat4 hModelMatrix;
            

            // poincaré to hyperboloid
            vec4 p2h(vec2 p) { 
                float t = 2.0/(1.0-(p.x*p.x+p.y*p.y)); 
                return vec4(t*p.x,t*p.y,t-1.0,1.0); 
            }
            // hyperboloid to poincaré
            vec2 h2p(vec4 p) {
                float d = 1.0/(p.w + p.z);
                return vec2(p.x*d, p.y*d);
            }

            void main() {
                vec4 p = p2h(v_pos);
                vec2 q = h2p(hViewMatrix * hModelMatrix * p);
                gl_FragColor = texture2D(texture, vec2(0.5, 0.5) + q * 0.5); 
            } 
            `,
            uniforms: {
                color: [0.0,0.0,0.0,1.0],
                viewMatrix: viewMatrix,
                hModelMatrix: twgl.m4.identity(),
                hViewMatrix: twgl.m4.identity(),
                texture: null // twgl.createTexture(gl, {src:'images/full-circle.png'})

            }
        });
    }
    setColor(rgba) {
        for(let i=0;i<4;i++) this.uniforms.color[i] = rgba[i];        
    }
};


class HyperbolicPalettedTexturedMaterial extends Material {
    constructor(gl) {
        super(gl, {
            vs : `
            precision mediump float;
            attribute vec2 position;
            uniform mat4 hMatrix;
            uniform mat4 viewMatrix;
            varying vec2 v_pos;
            
            // poincaré to hyperboloid
            vec4 p2h(vec2 p) { 
                float t = 2.0/(1.0-(p.x*p.x+p.y*p.y)); 
                return vec4(t*p.x,t*p.y,t-1.0,1.0); 
            }
            // hyperboloid to poincaré
            vec2 h2p(vec4 p) {
                float d = 1.0/(p.w + p.z);
                return vec2(p.x*d, p.y*d);
            }

            void main(void) { 
                vec4 p = p2h(position);
                vec2 q = h2p(hMatrix * p);
                v_pos = q;
                gl_Position = viewMatrix * vec4(q, 0.0, 1.0); 
            }
            `,
            fs:`
            precision mediump float;            
            uniform vec4 color, color1, color2;
            varying vec2 v_pos;
            uniform mat4 hInvMatrix;
            uniform sampler2D texture;
            uniform float textureScale;
            uniform vec2 textureOffset;
            

            // poincaré to hyperboloid
            vec4 p2h(vec2 p) { 
                float t = 2.0/(1.0-(p.x*p.x+p.y*p.y)); 
                return vec4(t*p.x,t*p.y,t-1.0,1.0); 
            }
            // hyperboloid to poincaré
            vec2 h2p(vec4 p) {
                float d = 1.0/(p.w + p.z);
                return vec2(p.x*d, p.y*d);
            }

            void main() {
                vec2 q = h2p(hInvMatrix * p2h(v_pos));
                vec4 c = texture2D(texture, textureOffset + q * textureScale ); 
                float gray = c.b;
                float alpha = c.a;
                if(c.r > gray * 1.1) gl_FragColor = vec4(color1.rgb*gray,alpha);
                else if(c.g > gray * 1.1) gl_FragColor = vec4(color2.rgb*gray,alpha);
                else gl_FragColor = vec4(color.rgb*gray, alpha);
            } 
            `,
            uniforms: {
                color: [1.0,1.0,1.0,1.0],
                color1: [1.0,0.0,0.0,1.0],
                color2: [0.0,1.0,0.0,1.0],
                
                viewMatrix: viewMatrix,
                //hModelMatrix: twgl.m4.identity(),
                //hViewMatrix: twgl.m4.identity(),
                hMatrix: twgl.m4.identity(),
                hInvMatrix: twgl.m4.identity(),
                texture: null,
                textureScale: 0.5,
                textureOffset:[0.5,0.5]

            }
        });
    }
    setColor(rgba) {
        for(let i=0;i<4;i++) this.uniforms.color[i] = rgba[i];        
    }
};