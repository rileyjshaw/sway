import ShaderPad from 'shaderpad';
import handleTouch from './handleTouch';

const fragmentShaderSrc = `#version 300 es
precision highp float;

// Built-in variables.
uniform float u_time;
uniform vec2 u_resolution;

// Custom uniforms.
uniform float u_maxAngle;
uniform float u_speed;
uniform float u_phaseStep;
uniform float u_stepSize;
uniform float u_squareSize;
uniform float u_border;
uniform int u_palette;

out vec4 outColor;

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
    vec2 uv = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
    uv.x *= u_resolution.x / u_resolution.y;
    vec2 center = u_resolution * 0.5;
    vec2 pos = gl_FragCoord.xy - center;
    float dist = length(pos);

    // Compute which ring we're in.
    float iRing = floor(dist / u_stepSize);
    float phase = -iRing * u_phaseStep;
    float angle = sin(u_time * u_speed + phase) * u_maxAngle;

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
    vec2 uv01_rotated = gridUv / u_resolution.xy;

    // colorGreen if u_palette is 1, colorPurple1 if u_palette is 2.
    vec3 colorTopLeft = (u_palette == 1) ? colorGreen : colorPurple1;
    vec3 colorBottomLeft = (u_palette == 1) ? colorBlue : colorPurple2;
    vec3 colorTopRight = (u_palette == 1) ? colorOrange : colorPurple3;
    vec3 colorBottomRight = (u_palette == 1) ? colorRed : colorPurple4;
    vec3 colorLeft = mix(colorBottomLeft, colorTopLeft, uv01_rotated.y);
    vec3 colorRight = mix(colorBottomRight, colorTopRight, uv01_rotated.y);
    vec3 gradientColor = mix(colorLeft, colorRight, uv01_rotated.x);
    vec3 bwColor = vec3(1.0);
    vec3 baseColor = (u_palette > 0) ? gradientColor : bwColor;

    // Grid: use pixel units so each cell is square.
    float gridPixelSize = u_squareSize;
    vec2 offset = mod(u_resolution, gridPixelSize) * 0.5;
    vec2 grid = fract((gridUv - offset) / gridPixelSize);

    // Draw squares: inside each cell, color if inside u_border of cell
    float mask = step(u_border, grid.x) * step(u_border, grid.y) *
                 step(grid.x, 1.0 - u_border) * step(grid.y, 1.0 - u_border);

    // Blend the grid mask with the gradient color or grayscale
    vec3 color = mix(vec3(0.0), baseColor, mask);
    outColor = vec4(color, 1.0);
}
`;

const shader = new ShaderPad(fragmentShaderSrc);

const variants = [
	// Original.
	{
		u_maxAngle: (6 * Math.PI) / 180, // 6 degrees.
		u_speed: 2,
		u_phaseStep: Math.PI / 8,
		u_stepSize: 142,
		u_squareSize: 100,
		u_border: 0.25,
		u_palette: 0,
	},
	// Rainbow.
	{
		u_maxAngle: Math.PI, // 180 degrees.
		u_speed: 2,
		u_phaseStep: Math.PI / 16,
		u_stepSize: 160,
		u_squareSize: 1,
		u_border: 0,
		u_palette: 1,
	},
	// Wavy squares at the edges.
	{
		u_maxAngle: Math.PI / 180, // 1 degree.
		u_speed: 4,
		u_phaseStep: 0.3,
		u_stepSize: 1,
		u_squareSize: 120,
		u_border: 0.3,
		u_palette: 0,
	},
	// Interlaced stripes (2 sections).
	{
		u_maxAngle: 2 * Math.PI, // 360 degrees.
		u_speed: 0.025,
		u_phaseStep: Math.PI,
		u_stepSize: 10,
		u_squareSize: 160,
		u_border: 0.2,
		u_palette: 0,
	},
	// Interlaced stripes (3 sections).
	{
		u_maxAngle: 2 * Math.PI, // 360 degrees.
		u_speed: 0.025,
		u_phaseStep: (Math.PI * 3) / 2,
		u_stepSize: 18,
		u_squareSize: 160,
		u_border: 0.3,
		u_palette: 0,
	},
	// Graph paper.
	{
		u_maxAngle: 2 * Math.PI, // 360 degrees.
		u_speed: 0.025,
		u_phaseStep: Math.PI,
		u_stepSize: 100,
		u_squareSize: 20,
		u_border: 0.05,
		u_palette: 0,
	},
	// Twisting rug.
	{
		u_maxAngle: 200 * Math.PI, // 100 turns.
		u_speed: 0.001,
		u_phaseStep: Math.PI / 180,
		u_stepSize: 4,
		u_squareSize: 20,
		u_border: 0.3,
		u_palette: 1,
	},
	// Twisting rug 2.
	{
		u_maxAngle: 200 * Math.PI, // 100 turns.
		u_speed: 0.001,
		u_phaseStep: Math.PI / 800,
		u_stepSize: 2,
		u_squareSize: 10,
		u_border: 0.15,
		u_palette: 2,
	},
	// Dot ripple.
	{
		u_maxAngle: Math.PI / 90, // 2 degrees.
		u_speed: 4,
		u_phaseStep: Math.PI / 42,
		u_stepSize: 10,
		u_squareSize: 42,
		u_border: 0.42,
		u_palette: 0,
	},
];

Object.entries(variants[0]).forEach(([key, value]) => {
	shader.initializeUniform(key, key === 'u_palette' ? 'int' : 'float', value);
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

handleTouch(
	document.body,
	(direction, diff) => {
		if (direction === 'x') {
			variantIdx = (variantIdx + Math.sign(diff) + variants.length) % variants.length;
			shader.updateUniforms(variants[variantIdx]);
		}
	},
	{ once: true }
);
