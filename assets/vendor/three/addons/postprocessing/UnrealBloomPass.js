import{AdditiveBlending as n,Color as u,HalfFloatType as h,MeshBasicMaterial as m,ShaderMaterial as d,UniformsUtils as f,Vector2 as v,Vector3 as c,WebGLRenderTarget as g}from"three";import{Pass as e,FullScreenQuad as p}from"./Pass.js";import{CopyShader as b}from"../shaders/CopyShader.js";import{LuminosityHighPassShader as T}from"../shaders/LuminosityHighPassShader.js";class l extends e{constructor(e,r=1,t,s){super(),this.strength=r,this.radius=t,this.threshold=s,this.resolution=void 0!==e?new v(e.x,e.y):new v(256,256),this.clearColor=new u(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let i=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);this.renderTargetBright=new g(i,a,{type:h,depthBuffer:!1}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let e=0;e<this.nMips;e++){var o=new g(i,a,{type:h,depthBuffer:!1}),o=(o.texture.name="UnrealBloomPass.h"+e,o.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(o),new g(i,a,{type:h,depthBuffer:!1}));o.texture.name="UnrealBloomPass.v"+e,o.texture.generateMipmaps=!1,this.renderTargetsVertical.push(o),i=Math.round(i/2),a=Math.round(a/2)}var t=T,l=(this.highPassUniforms=f.clone(t.uniforms),this.highPassUniforms.luminosityThreshold.value=s,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new d({uniforms:this.highPassUniforms,vertexShader:t.vertexShader,fragmentShader:t.fragmentShader}),this.separableBlurMaterials=[],[6,10,14,18,22]);i=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);for(let e=0;e<this.nMips;e++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(l[e])),this.separableBlurMaterials[e].uniforms.invSize.value=new v(1/i,1/a),i=Math.round(i/2),a=Math.round(a/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=r,this.compositeMaterial.uniforms.bloomRadius.value=.1;this.compositeMaterial.uniforms.bloomFactors.value=[1,.8,.6,.4,.2],this.bloomTintColors=[new c(1,1,1),new c(1,1,1),new c(1,1,1),new c(1,1,1),new c(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=f.clone(b.uniforms),this.blendMaterial=new d({uniforms:this.copyUniforms,vertexShader:b.vertexShader,fragmentShader:b.fragmentShader,premultipliedAlpha:!0,blending:n,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new u,this._oldClearAlpha=1,this._basic=new m,this._fsQuad=new p(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,r){let t=Math.round(e/2),s=Math.round(r/2);this.renderTargetBright.setSize(t,s);for(let e=0;e<this.nMips;e++)this.renderTargetsHorizontal[e].setSize(t,s),this.renderTargetsVertical[e].setSize(t,s),this.separableBlurMaterials[e].uniforms.invSize.value=new v(1/t,1/s),t=Math.round(t/2),s=Math.round(s/2)}render(r,e,t,s,i){r.getClearColor(this._oldClearColor),this._oldClearAlpha=r.getClearAlpha();var a=r.autoClear;r.autoClear=!1,r.setClearColor(this.clearColor,0),i&&r.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=t.texture,r.setRenderTarget(null),r.clear(),this._fsQuad.render(r)),this.highPassUniforms.tDiffuse.value=t.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,r.setRenderTarget(this.renderTargetBright),r.clear(),this._fsQuad.render(r);let o=this.renderTargetBright;for(let e=0;e<this.nMips;e++)this._fsQuad.material=this.separableBlurMaterials[e],this.separableBlurMaterials[e].uniforms.colorTexture.value=o.texture,this.separableBlurMaterials[e].uniforms.direction.value=l.BlurDirectionX,r.setRenderTarget(this.renderTargetsHorizontal[e]),r.clear(),this._fsQuad.render(r),this.separableBlurMaterials[e].uniforms.colorTexture.value=this.renderTargetsHorizontal[e].texture,this.separableBlurMaterials[e].uniforms.direction.value=l.BlurDirectionY,r.setRenderTarget(this.renderTargetsVertical[e]),r.clear(),this._fsQuad.render(r),o=this.renderTargetsVertical[e];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,r.setRenderTarget(this.renderTargetsHorizontal[0]),r.clear(),this._fsQuad.render(r),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,i&&r.state.buffers.stencil.setTest(!0),this.renderToScreen?r.setRenderTarget(null):r.setRenderTarget(t),this._fsQuad.render(r),r.setClearColor(this._oldClearColor,this._oldClearAlpha),r.autoClear=a}_getSeparableBlurMaterial(r){var t=[],s=r/3;for(let e=0;e<r;e++)t.push(.39894*Math.exp(-.5*e*e/(s*s))/s);var i=[],a=[];for(let e=1;e<r;e+=2){var o=t[e],l=e+1<r?t[e+1]:0,n=o+l;i.push((e*o+(e+1)*l)/n),a.push(n)}return new d({defines:{KERNEL_PAIRS:i.length},uniforms:{colorTexture:{value:null},invSize:{value:new v(.5,.5)},direction:{value:new v(.5,.5)},centerWeight:{value:t[0]},gaussianOffsets:{value:i},gaussianWeights:{value:a}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				#include <common>

				varying vec2 vUv;

				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float centerWeight;
				uniform float gaussianOffsets[KERNEL_PAIRS];
				uniform float gaussianWeights[KERNEL_PAIRS];

				void main() {

					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * centerWeight;

					for ( int i = 0; i < KERNEL_PAIRS; i ++ ) {

						vec2 uvOffset = direction * invSize * gaussianOffsets[ i ];
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += ( sample1 + sample2 ) * gaussianWeights[ i ];

					}

					gl_FragColor = vec4( diffuseSum, 1.0 );

				}`})}_getCompositeMaterial(e){return new d({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				varying vec2 vUv;

				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor( const in float factor ) {

					float mirrorFactor = 1.2 - factor;
					return mix( factor, mirrorFactor, bloomRadius );

				}

				void main() {

					// 3.0 for backwards compatibility with previous alpha-based intensity
					vec3 bloom = 3.0 * bloomStrength * (
						lerpBloomFactor( bloomFactors[ 0 ] ) * bloomTintColors[ 0 ] * texture2D( blurTexture1, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 1 ] ) * bloomTintColors[ 1 ] * texture2D( blurTexture2, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 2 ] ) * bloomTintColors[ 2 ] * texture2D( blurTexture3, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 3 ] ) * bloomTintColors[ 3 ] * texture2D( blurTexture4, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 4 ] ) * bloomTintColors[ 4 ] * texture2D( blurTexture5, vUv ).rgb
					);

					float bloomAlpha = max( bloom.r, max( bloom.g, bloom.b ) );
					gl_FragColor = vec4( bloom, bloomAlpha );

				}`})}}l.BlurDirectionX=new v(1,0),l.BlurDirectionY=new v(0,1);export{l as UnrealBloomPass};