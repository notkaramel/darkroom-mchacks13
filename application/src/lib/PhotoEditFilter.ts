import { Filter, GlProgram } from 'pixi.js';

const vertex = `
in vec2 aPosition;
out vec2 vTextureCoord;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition() {
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
    return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord() {
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

void main() {
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
}
`;

const fragment = `
in vec2 vTextureCoord;
uniform sampler2D uTexture;
uniform float uBrightness;
uniform float uContrast;
uniform float uHighlights;
uniform float uShadows;
uniform float uTemperature;
uniform float uTint;
uniform float uSaturation;
uniform float uVibrance;

// HSL Per-Color Adjustments (8 colors × 3 properties)
uniform float uRedHue;
uniform float uRedSat;
uniform float uRedLum;
uniform float uOrangeHue;
uniform float uOrangeSat;
uniform float uOrangeLum;
uniform float uYellowHue;
uniform float uYellowSat;
uniform float uYellowLum;
uniform float uGreenHue;
uniform float uGreenSat;
uniform float uGreenLum;
uniform float uCyanHue;
uniform float uCyanSat;
uniform float uCyanLum;
uniform float uBlueHue;
uniform float uBlueSat;
uniform float uBlueLum;
uniform float uPurpleHue;
uniform float uPurpleSat;
uniform float uPurpleLum;
uniform float uMagentaHue;
uniform float uMagentaSat;
uniform float uMagentaLum;

// Lens Corrections
uniform float uDistortion;
uniform float uChromaticAberration;
uniform float uVignetting;

// Transform
uniform float uRotation;
uniform float uVertical;
uniform float uHorizontal;
uniform float uPerspective;

// RGB to HSL conversion
vec3 rgb2hsl(vec3 color) {
    float maxC = max(max(color.r, color.g), color.b);
    float minC = min(min(color.r, color.g), color.b);
    float delta = maxC - minC;
    
    float h = 0.0;
    float s = 0.0;
    float l = (maxC + minC) / 2.0;
    
    if (delta > 0.0) {
        s = l < 0.5 ? delta / (maxC + minC) : delta / (2.0 - maxC - minC);
        
        float deltaR = (((maxC - color.r) / 6.0) + (delta / 2.0)) / delta;
        float deltaG = (((maxC - color.g) / 6.0) + (delta / 2.0)) / delta;
        float deltaB = (((maxC - color.b) / 6.0) + (delta / 2.0)) / delta;
        
        if (color.r >= maxC - 0.001) {
            h = deltaB - deltaG;
        } else if (color.g >= maxC - 0.001) {
            h = (1.0 / 3.0) + deltaR - deltaB;
        } else {
            h = (2.0 / 3.0) + deltaG - deltaR;
        }
        
        if (h < 0.0) h += 1.0;
        if (h > 1.0) h -= 1.0;
    }
    
    return vec3(h, s, l);
}

// Helper for HSL to RGB
float hue2rgb(float p, float q, float t) {
    if (t < 0.0) t += 1.0;
    if (t > 1.0) t -= 1.0;
    if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
    if (t < 1.0/2.0) return q;
    if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
    return p;
}

// HSL to RGB conversion
vec3 hsl2rgb(vec3 hsl) {
    float h = hsl.x;
    float s = hsl.y;
    float l = hsl.z;
    
    if (s < 0.001) {
        return vec3(l, l, l);
    }
    
    float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
    float p = 2.0 * l - q;
    
    float r = hue2rgb(p, q, h + 1.0/3.0);
    float g = hue2rgb(p, q, h);
    float b = hue2rgb(p, q, h - 1.0/3.0);
    
    return vec3(r, g, b);
}

// Luminance calculation
float luminance(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
}

// Lightroom-style color weight calculation with cosine falloff
float getColorWeight(float hue, float centerHue, float feather) {
    // Calculate shortest distance on hue circle (handles wrap-around)
    float dist = abs(hue - centerHue);
    if (dist > 0.5) dist = 1.0 - dist;
    
    // Outside the feather range, no influence
    if (dist >= feather) return 0.0;
    
    // Cosine interpolation for smooth Lightroom-like falloff
    float t = dist / feather;
    return 0.5 + 0.5 * cos(t * 3.14159265359);
}

// Apply Lightroom-style color mixer with overlapping ranges and weight normalization
vec3 applyColorMixer(vec3 hsl, 
    float redH, float redS, float redL,
    float orangeH, float orangeS, float orangeL,
    float yellowH, float yellowS, float yellowL,
    float greenH, float greenS, float greenL,
    float cyanH, float cyanS, float cyanL,
    float blueH, float blueS, float blueL,
    float purpleH, float purpleS, float purpleL,
    float magentaH, float magentaS, float magentaL) {
    
    // Skip grayscale pixels (no color information)
    if (hsl.y < 0.01) return hsl;
    
    float h = hsl.x;
    
    // Feather controls the width of influence (60 degrees = 0.167)
    float feather = 0.167;
    
    // Calculate weights for all 8 color ranges
    float weights[8];
    weights[0] = getColorWeight(h, 0.0, feather);     // Red (0°)
    weights[1] = getColorWeight(h, 0.083, feather);   // Orange (30°)
    weights[2] = getColorWeight(h, 0.167, feather);   // Yellow (60°)
    weights[3] = getColorWeight(h, 0.333, feather);   // Green (120°)
    weights[4] = getColorWeight(h, 0.5, feather);     // Cyan (180°)
    weights[5] = getColorWeight(h, 0.667, feather);   // Blue (240°)
    weights[6] = getColorWeight(h, 0.75, feather);    // Purple (270°)
    weights[7] = getColorWeight(h, 0.917, feather);   // Magenta (330°)
    
    // Normalize weights so they sum to 1.0
    float totalWeight = weights[0] + weights[1] + weights[2] + weights[3] + 
                        weights[4] + weights[5] + weights[6] + weights[7];
    
    if (totalWeight > 0.0) {
        for (int i = 0; i < 8; i++) {
            weights[i] /= totalWeight;
        }
    }
    
    // Accumulate weighted adjustments from all color ranges
    float hueShift = redH * weights[0] + orangeH * weights[1] + yellowH * weights[2] + greenH * weights[3] +
                     cyanH * weights[4] + blueH * weights[5] + purpleH * weights[6] + magentaH * weights[7];
    
    float satShift = redS * weights[0] + orangeS * weights[1] + yellowS * weights[2] + greenS * weights[3] +
                     cyanS * weights[4] + blueS * weights[5] + purpleS * weights[6] + magentaS * weights[7];
    
    float lumShift = redL * weights[0] + orangeL * weights[1] + yellowL * weights[2] + greenL * weights[3] +
                     cyanL * weights[4] + blueL * weights[5] + purpleL * weights[6] + magentaL * weights[7];
    
    // Apply hue shift with wrap-around
    hsl.x += hueShift;
    if (hsl.x < 0.0) hsl.x += 1.0;
    if (hsl.x > 1.0) hsl.x -= 1.0;
    
    // Apply saturation: multiplicative for positive, additive for negative (Lightroom behavior)
    if (satShift >= 0.0) {
        hsl.y *= (1.0 + satShift);
    } else {
        hsl.y += satShift;
    }
    hsl.y = clamp(hsl.y, 0.0, 1.0);
    
    // Apply luminance: additive adjustment
    hsl.z += lumShift;
    hsl.z = clamp(hsl.z, 0.0, 1.0);
    
    return hsl;
}

// Apply barrel/pincushion distortion
vec2 applyDistortion(vec2 coord, float amount) {
    vec2 center = vec2(0.5, 0.5);
    vec2 offset = coord - center;
    float dist = length(offset);
    float distortion = 1.0 + amount * dist * dist;
    return center + offset * distortion;
}

// Apply chromatic aberration (RGB channel shifting)
vec3 applyChromaticAberration(vec2 coord, float amount) {
    vec2 center = vec2(0.5, 0.5);
    vec2 direction = normalize(coord - center);
    float dist = length(coord - center);
    
    // Shift each channel slightly
    vec2 redCoord = coord - direction * amount * dist * 0.01;
    vec2 greenCoord = coord;
    vec2 blueCoord = coord + direction * amount * dist * 0.01;
    
    float r = texture2D(uTexture, redCoord).r;
    float g = texture2D(uTexture, greenCoord).g;
    float b = texture2D(uTexture, blueCoord).b;
    
    return vec3(r, g, b);
}

// Apply vignetting effect
vec3 applyVignetting(vec3 color, vec2 coord, float amount) {
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(coord, center);
    float vignette = 1.0 - smoothstep(0.3, 0.8, dist) * abs(amount);
    
    if (amount < 0.0) {
        // Negative vignetting (brighten edges)
        vignette = 1.0 + smoothstep(0.3, 0.8, dist) * abs(amount);
    }
    
    return color * vignette;
}

// 2D rotation matrix
vec2 rotate2D(vec2 coord, float angle) {
    vec2 center = vec2(0.5, 0.5);
    coord -= center;
    float s = sin(angle);
    float c = cos(angle);
    mat2 rotationMatrix = mat2(c, -s, s, c);
    coord = rotationMatrix * coord;
    return coord + center;
}

void main() {
    vec2 coord = vTextureCoord;
    
    // Apply transform first (rotation, perspective)
    if (abs(uRotation) > 0.001) {
        float angleRad = radians(uRotation);
        coord = rotate2D(coord, angleRad);
    }
    
    // Apply perspective shifts
    if (abs(uVertical) > 0.001 || abs(uHorizontal) > 0.001) {
        coord.x += uHorizontal * 0.001 * (coord.y - 0.5);
        coord.y += uVertical * 0.001 * (coord.x - 0.5);
    }
    
    // Apply lens distortion
    if (abs(uDistortion) > 0.001) {
        coord = applyDistortion(coord, uDistortion * 0.5);
    }
    
    // Check bounds after transformations
    if (coord.x < 0.0 || coord.x > 1.0 || coord.y < 0.0 || coord.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }
    
    // Sample texture with chromatic aberration if enabled
    vec3 rgb;
    float alpha;
    if (abs(uChromaticAberration) > 0.001) {
        rgb = applyChromaticAberration(coord, uChromaticAberration);
        alpha = texture2D(uTexture, coord).a;
    } else {
        vec4 texColor = texture2D(uTexture, coord);
        rgb = texColor.rgb;
        alpha = texColor.a;
    }
    
    // Apply vignetting
    if (abs(uVignetting) > 0.001) {
        rgb = applyVignetting(rgb, vTextureCoord, uVignetting);
    }
    
    // 1. Brightness (additive offset)
    rgb += uBrightness;
    
    // 2. Contrast (around 0.5 midpoint, clamped to prevent full gray)
    rgb = (rgb - 0.5) * (1.0 + max(-0.8, uContrast)) + 0.5;
    
    // 3. Highlights (affect bright pixels)
    float lum = luminance(rgb);
    float highlightMask = smoothstep(0.5, 1.0, lum);
    rgb += uHighlights * highlightMask;
    
    // 4. Shadows (affect dark pixels)
    float shadowMask = smoothstep(0.5, 0.0, lum);
    rgb += uShadows * shadowMask;
    
    // 5. Temperature (warm/cool shift)
    rgb.r += uTemperature * 0.1;
    rgb.b -= uTemperature * 0.1;
    
    // 6. Tint (green/magenta shift)
    rgb.r += uTint * 0.1;
    rgb.g -= uTint * 0.1;
    
    // Clamp to prevent out of range values
    rgb = clamp(rgb, 0.0, 1.0);
    
    // 7. Saturation (global)
    vec3 hsl = rgb2hsl(rgb);
    hsl.y *= (1.0 + uSaturation);
    hsl.y = clamp(hsl.y, 0.0, 1.0);
    
    // 8. Color Mixer (Lightroom-style HSL per color range)
    hsl = applyColorMixer(hsl,
        uRedHue, uRedSat, uRedLum,
        uOrangeHue, uOrangeSat, uOrangeLum,
        uYellowHue, uYellowSat, uYellowLum,
        uGreenHue, uGreenSat, uGreenLum,
        uCyanHue, uCyanSat, uCyanLum,
        uBlueHue, uBlueSat, uBlueLum,
        uPurpleHue, uPurpleSat, uPurpleLum,
        uMagentaHue, uMagentaSat, uMagentaLum
    );
    
    rgb = hsl2rgb(hsl);
    
    // 9. Vibrance (smart saturation)
    if (abs(uVibrance) > 0.001) {
        hsl = rgb2hsl(rgb);
        float sat = hsl.y;
        float vibMask = 1.0 - sat;
        hsl.y += uVibrance * vibMask;
        hsl.y = clamp(hsl.y, 0.0, 1.0);
        rgb = hsl2rgb(hsl);
    }
    
    // Final clamp
    rgb = clamp(rgb, 0.0, 1.0);
    
    gl_FragColor = vec4(rgb, alpha);
}
`;

export class PhotoEditFilter extends Filter {
    constructor() {
        super({
            glProgram: GlProgram.from({
                vertex,
                fragment,
            }),
            resources: {
                photoEditUniforms: {
                    uBrightness: { value: 0.0, type: 'f32' },
                    uContrast: { value: 0.0, type: 'f32' },
                    uHighlights: { value: 0.0, type: 'f32' },
                    uShadows: { value: 0.0, type: 'f32' },
                    uTemperature: { value: 0.0, type: 'f32' },
                    uTint: { value: 0.0, type: 'f32' },
                    uSaturation: { value: 0.0, type: 'f32' },
                    uVibrance: { value: 0.0, type: 'f32' },
                    uRedHue: { value: 0.0, type: 'f32' },
                    uRedSat: { value: 0.0, type: 'f32' },
                    uRedLum: { value: 0.0, type: 'f32' },
                    uOrangeHue: { value: 0.0, type: 'f32' },
                    uOrangeSat: { value: 0.0, type: 'f32' },
                    uOrangeLum: { value: 0.0, type: 'f32' },
                    uYellowHue: { value: 0.0, type: 'f32' },
                    uYellowSat: { value: 0.0, type: 'f32' },
                    uYellowLum: { value: 0.0, type: 'f32' },
                    uGreenHue: { value: 0.0, type: 'f32' },
                    uGreenSat: { value: 0.0, type: 'f32' },
                    uGreenLum: { value: 0.0, type: 'f32' },
                    uCyanHue: { value: 0.0, type: 'f32' },
                    uCyanSat: { value: 0.0, type: 'f32' },
                    uCyanLum: { value: 0.0, type: 'f32' },
                    uBlueHue: { value: 0.0, type: 'f32' },
                    uBlueSat: { value: 0.0, type: 'f32' },
                    uBlueLum: { value: 0.0, type: 'f32' },
                    uPurpleHue: { value: 0.0, type: 'f32' },
                    uPurpleSat: { value: 0.0, type: 'f32' },
                    uPurpleLum: { value: 0.0, type: 'f32' },
                    uMagentaHue: { value: 0.0, type: 'f32' },
                    uMagentaSat: { value: 0.0, type: 'f32' },
                    uMagentaLum: { value: 0.0, type: 'f32' },
                    // Lens corrections
                    uDistortion: { value: 0.0, type: 'f32' },
                    uChromaticAberration: { value: 0.0, type: 'f32' },
                    uVignetting: { value: 0.0, type: 'f32' },
                    // Transform
                    uRotation: { value: 0.0, type: 'f32' },
                    uVertical: { value: 0.0, type: 'f32' },
                    uHorizontal: { value: 0.0, type: 'f32' },
                    uPerspective: { value: 0.0, type: 'f32' }
                }
            }
        });
    }

    // Basic adjustments
    get brightness(): number {
        return this.resources.photoEditUniforms.uniforms.uBrightness;
    }
    set brightness(value: number) {
        this.resources.photoEditUniforms.uniforms.uBrightness = value;
    }

    get contrast(): number {
        return this.resources.photoEditUniforms.uniforms.uContrast;
    }
    set contrast(value: number) {
        this.resources.photoEditUniforms.uniforms.uContrast = value;
    }

    get highlights(): number {
        return this.resources.photoEditUniforms.uniforms.uHighlights;
    }
    set highlights(value: number) {
        this.resources.photoEditUniforms.uniforms.uHighlights = value;
    }

    get shadows(): number {
        return this.resources.photoEditUniforms.uniforms.uShadows;
    }
    set shadows(value: number) {
        this.resources.photoEditUniforms.uniforms.uShadows = value;
    }

    get temperature(): number {
        return this.resources.photoEditUniforms.uniforms.uTemperature;
    }
    set temperature(value: number) {
        this.resources.photoEditUniforms.uniforms.uTemperature = value;
    }

    get tint(): number {
        return this.resources.photoEditUniforms.uniforms.uTint;
    }
    set tint(value: number) {
        this.resources.photoEditUniforms.uniforms.uTint = value;
    }

    get saturation(): number {
        return this.resources.photoEditUniforms.uniforms.uSaturation;
    }
    set saturation(value: number) {
        this.resources.photoEditUniforms.uniforms.uSaturation = value;
    }

    get vibrance(): number {
        return this.resources.photoEditUniforms.uniforms.uVibrance;
    }
    set vibrance(value: number) {
        this.resources.photoEditUniforms.uniforms.uVibrance = value;
    }

    // HSL Per-Color: Red
    setRedHSL(hue: number, sat: number, lum: number) {
        this.resources.photoEditUniforms.uniforms.uRedHue = hue;
        this.resources.photoEditUniforms.uniforms.uRedSat = sat;
        this.resources.photoEditUniforms.uniforms.uRedLum = lum;
    }

    // HSL Per-Color: Orange
    setOrangeHSL(hue: number, sat: number, lum: number) {
        this.resources.photoEditUniforms.uniforms.uOrangeHue = hue;
        this.resources.photoEditUniforms.uniforms.uOrangeSat = sat;
        this.resources.photoEditUniforms.uniforms.uOrangeLum = lum;
    }

    // HSL Per-Color: Yellow
    setYellowHSL(hue: number, sat: number, lum: number) {
        this.resources.photoEditUniforms.uniforms.uYellowHue = hue;
        this.resources.photoEditUniforms.uniforms.uYellowSat = sat;
        this.resources.photoEditUniforms.uniforms.uYellowLum = lum;
    }

    // HSL Per-Color: Green
    setGreenHSL(hue: number, sat: number, lum: number) {
        this.resources.photoEditUniforms.uniforms.uGreenHue = hue;
        this.resources.photoEditUniforms.uniforms.uGreenSat = sat;
        this.resources.photoEditUniforms.uniforms.uGreenLum = lum;
    }

    // HSL Per-Color: Cyan
    setCyanHSL(hue: number, sat: number, lum: number) {
        this.resources.photoEditUniforms.uniforms.uCyanHue = hue;
        this.resources.photoEditUniforms.uniforms.uCyanSat = sat;
        this.resources.photoEditUniforms.uniforms.uCyanLum = lum;
    }

    // HSL Per-Color: Blue
    setBlueHSL(hue: number, sat: number, lum: number) {
        this.resources.photoEditUniforms.uniforms.uBlueHue = hue;
        this.resources.photoEditUniforms.uniforms.uBlueSat = sat;
        this.resources.photoEditUniforms.uniforms.uBlueLum = lum;
    }

    // HSL Per-Color: Purple
    setPurpleHSL(hue: number, sat: number, lum: number) {
        this.resources.photoEditUniforms.uniforms.uPurpleHue = hue;
        this.resources.photoEditUniforms.uniforms.uPurpleSat = sat;
        this.resources.photoEditUniforms.uniforms.uPurpleLum = lum;
    }

    // HSL Per-Color: Magenta
    setMagentaHSL(hue: number, sat: number, lum: number) {
        this.resources.photoEditUniforms.uniforms.uMagentaHue = hue;
        this.resources.photoEditUniforms.uniforms.uMagentaSat = sat;
        this.resources.photoEditUniforms.uniforms.uMagentaLum = lum;
    }

    // Lens Corrections
    get distortion(): number {
        return this.resources.photoEditUniforms.uniforms.uDistortion;
    }
    set distortion(value: number) {
        this.resources.photoEditUniforms.uniforms.uDistortion = value;
    }

    get chromaticAberration(): number {
        return this.resources.photoEditUniforms.uniforms.uChromaticAberration;
    }
    set chromaticAberration(value: number) {
        this.resources.photoEditUniforms.uniforms.uChromaticAberration = value;
    }

    get vignetting(): number {
        return this.resources.photoEditUniforms.uniforms.uVignetting;
    }
    set vignetting(value: number) {
        this.resources.photoEditUniforms.uniforms.uVignetting = value;
    }

    // Transform
    get rotation(): number {
        return this.resources.photoEditUniforms.uniforms.uRotation;
    }
    set rotation(value: number) {
        this.resources.photoEditUniforms.uniforms.uRotation = value;
    }

    get vertical(): number {
        return this.resources.photoEditUniforms.uniforms.uVertical;
    }
    set vertical(value: number) {
        this.resources.photoEditUniforms.uniforms.uVertical = value;
    }

    get horizontal(): number {
        return this.resources.photoEditUniforms.uniforms.uHorizontal;
    }
    set horizontal(value: number) {
        this.resources.photoEditUniforms.uniforms.uHorizontal = value;
    }

    get perspective(): number {
        return this.resources.photoEditUniforms.uniforms.uPerspective;
    }
    set perspective(value: number) {
        this.resources.photoEditUniforms.uniforms.uPerspective = value;
    }
}