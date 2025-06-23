import ShaderPad from 'shaderpad';
import handleTouch from './handleTouch';

const fragmentShaderSrc = `
precision highp float;

// Built-in variables.
varying vec2 vUv;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uCursor;

// Custom uniforms.
uniform float uMaxAngle;
uniform float uSpeed;
uniform float uPhaseStep;
uniform float uStepSize;
uniform float uSquareSize;
uniform float uBorder;
uniform int uPalette;

// Corner colors.
vec3 colorGreen = vec3(0.0, 1.0, 0.0);
vec3 colorBlue = vec3(0.0, 0.0, 1.0);
vec3 colorOrange = vec3(1.0, 0.5, 0.0);
vec3 colorRed = vec3(1.0, 0.0, 0.0);
vec3 colorPurple1 = vec3(0.5, 0.0, 1.0);
vec3 colorPurple2 = vec3(0.3, 0.4, 1.0);
vec3 colorPurple3 = vec3(0.3, 0.1, 0.5);
vec3 colorPurple4 = vec3(0.1, 0.0, 0.3);

void main() {
    vec2 uv = (gl_FragCoord.xy / uResolution.xy) * 2.0 - 1.0;
    uv.x *= uResolution.x / uResolution.y;
    vec2 center = uResolution * 0.5;
    vec2 pos = gl_FragCoord.xy - center;
    float dist = length(pos);

    // Compute which ring we're in.
    float iRing = floor(dist / uStepSize);
    float phase = -iRing * uPhaseStep;
    float angle = sin(uTime * uSpeed + phase) * uMaxAngle;

    // Rotate position by angle.
    float s = sin(angle);
    float c = cos(angle);
    vec2 rotated = vec2(
        c * pos.x - s * pos.y,
        s * pos.x + c * pos.y
    );

    // Move back to pixel coordinates after rotation
    vec2 gridUv = (rotated + center);

    // --- Gradient color after rotation ---
    // Compute uv01 from rotated coordinates
    vec2 uv01_rotated = gridUv / uResolution.xy;

	// colorGreen if uPalette is 1, colorPurple1 if uPalette is 2.
	vec3 colorTopLeft = (uPalette == 1) ? colorGreen : colorPurple1;
	vec3 colorBottomLeft = (uPalette == 1) ? colorBlue : colorPurple2;
	vec3 colorTopRight = (uPalette == 1) ? colorOrange : colorPurple3;
	vec3 colorBottomRight = (uPalette == 1) ? colorRed : colorPurple4;
    vec3 colorLeft = mix(colorBottomLeft, colorTopLeft, uv01_rotated.y);
    vec3 colorRight = mix(colorBottomRight, colorTopRight, uv01_rotated.y);
    vec3 gradientColor = mix(colorLeft, colorRight, uv01_rotated.x);
    vec3 bwColor = vec3(1.0);
    vec3 baseColor = (uPalette > 0) ? gradientColor : bwColor;

    // Grid: use pixel units so each cell is square.
    float gridPixelSize = uSquareSize;
    vec2 offset = mod(uResolution, gridPixelSize) * 0.5;
    vec2 grid = fract((gridUv - offset) / gridPixelSize);

    // Draw squares: inside each cell, color if inside uBorder of cell
    float mask = step(uBorder, grid.x) * step(uBorder, grid.y) *
                 step(grid.x, 1.0 - uBorder) * step(grid.y, 1.0 - uBorder);

    // Blend the grid mask with the gradient color or grayscale
    vec3 color = mix(vec3(0.0), baseColor, mask);
    gl_FragColor = vec4(color, 1.0);
}
`;

const shader = new ShaderPad(fragmentShaderSrc);

const variants = [
	// Original.
	{
		uMaxAngle: (6 * Math.PI) / 180, // 6 degrees.
		uSpeed: 2,
		uPhaseStep: Math.PI / 8,
		uStepSize: 142,
		uSquareSize: 100,
		uBorder: 0.25,
		uPalette: 0,
	},
	// Rainbow.
	{
		uMaxAngle: Math.PI, // 180 degrees.
		uSpeed: 2,
		uPhaseStep: Math.PI / 16,
		uStepSize: 160,
		uSquareSize: 1,
		uBorder: 0,
		uPalette: 1,
	},
	// Wavy squares at the edges.
	{
		uMaxAngle: Math.PI / 180, // 1 degree.
		uSpeed: 4,
		uPhaseStep: 0.3,
		uStepSize: 1,
		uSquareSize: 120,
		uBorder: 0.3,
		uPalette: 0,
	},
	// Interlaced stripes (2 sections).
	{
		uMaxAngle: 2 * Math.PI, // 360 degrees.
		uSpeed: 0.025,
		uPhaseStep: Math.PI,
		uStepSize: 10,
		uSquareSize: 160,
		uBorder: 0.2,
		uPalette: 0,
	},
	// Interlaced stripes (3 sections).
	{
		uMaxAngle: 2 * Math.PI, // 360 degrees.
		uSpeed: 0.025,
		uPhaseStep: (Math.PI * 3) / 2,
		uStepSize: 18,
		uSquareSize: 160,
		uBorder: 0.3,
		uPalette: 0,
	},
	// Graph paper.
	{
		uMaxAngle: 2 * Math.PI, // 360 degrees.
		uSpeed: 0.025,
		uPhaseStep: Math.PI,
		uStepSize: 100,
		uSquareSize: 20,
		uBorder: 0.05,
		uPalette: 0,
	},
	// Twisting rug.
	{
		uMaxAngle: 200 * Math.PI, // 100 turns.
		uSpeed: 0.001,
		uPhaseStep: Math.PI / 180,
		uStepSize: 4,
		uSquareSize: 20,
		uBorder: 0.3,
		uPalette: 1,
	},
	// Twisting rug 2.
	{
		uMaxAngle: 200 * Math.PI, // 100 turns.
		uSpeed: 0.001,
		uPhaseStep: Math.PI / 800,
		uStepSize: 2,
		uSquareSize: 10,
		uBorder: 0.15,
		uPalette: 2,
	},
	// Dot ripple.
	{
		uMaxAngle: Math.PI / 90, // 2 degrees.
		uSpeed: 4,
		uPhaseStep: Math.PI / 42,
		uStepSize: 10,
		uSquareSize: 42,
		uBorder: 0.42,
		uPalette: 0,
	},
];

Object.entries(variants[0]).forEach(([key, value]) => {
	shader.initializeUniform(key, key === 'uPalette' ? 'int' : 'float', value);
});

shader.play();

let isPlaying = true;
let variantIdx = 0;
document.addEventListener('keydown', e => {
	switch (e.key) {
		case ' ':
			isPlaying = !isPlaying;
			isPlaying ? shader.play() : shader.pause();
			break;
		case 'ArrowRight':
			variantIdx += 2;
		// Fall through.
		case 'ArrowLeft':
			variantIdx = (variantIdx - 1 + variants.length) % variants.length;
			shader.updateUniforms(variants[variantIdx]);
			break;
		case 's':
			shader.save('sway');
			break;
	}
});

handleTouch(document.body, (direction, diff) => {
	if (direction === 'x') {
		variantIdx = (variantIdx - Math.sign(diff) + variants.length) % variants.length;
		shader.updateUniforms(variants[variantIdx]);
		return { skip: true };
	}
});
