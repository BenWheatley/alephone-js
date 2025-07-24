// ------------------------------------------------------------
// Transporter / Beaming Effect
//
// iChannel0 : Foreground subject/sprite (RGBA if available; otherwise keyed by luma)
// iChannel1 : Background image/video
//
// This single-pass fragment shader composites the subject over the background
// and animates a dematerialize→rematerialize beam cycle with sparkles, scan rings,
// noise flicker, volumetric column glow, and configurable direction.
//
// ─────────────────────────────────────────────────────────────────────────────
// QUICK START
// 1. Load your subject texture in iChannel0. If it lacks alpha, adjust KEY_* below.
// 2. Load your background texture in iChannel1.
// 3. Paste this code into Shadertoy main() (mainImage) tab.
// 4. Adjust USER PARAMETERS section.
//
// You get a looping 2n‑second cycle: 0‑n s dematerialize (beam out), n‑2n s rematerialize (beam in).
// Click/drag in the Shadertoy viewport to scrub time interactively (vertical mouse position).
//
// ─────────────────────────────────────────────────────────────────────────────
// USER PARAMETERS
// (In Shadertoy you can expose these as uniforms via #define or tweak constants.)
//
#define BEAM_COLOR          vec3(0.9, 1.0, 0.7)   // Cyan-ish energy color
#define BEAM_COLOR_ALT      vec3(1.0, 1.0, 0.0)  // Secondary color used in spark mix
#define BEAM_CENTER_X       0.5                   // Column center in screen UV (0..1)
#define BEAM_RADIUS         0.5                  // Radius of bright column core
#define BEAM_SOFTNESS       0.5                  // Edge softness for column falloff
#define BEAM_DIR_UP         0                     // 1 = beam up (demat rises), 0 = beam down
#define CYCLE_SECONDS       2.0                   // Total loop length
#define COLUMN_INTENSITY    0.6                   // Base column glow multiplier
#define SPARK_DENSITY       10.0                  // Higher = more sparkles
#define SPARK_INTENSITY     100.0                   // Brightness of sparkles
#define FLICKER_STRENGTH    1.35                  // Temporal noise flicker in subject
#define DISTORT_STRENGTH    1.0                 // UV heat‑shimmer distortion
#define RING_FREQ           4.0                   // Scan ring count per cycle
#define RING_SPEED_SCALE    0.7                   // Ring speed multiplier
#define RING_THICKNESS      0.1                 // Ring thickness
#define RING_INTENSITY      1.2                   // Ring brightening
#define GRAIN_AMOUNT        0.0                   // Screen grain overlay
#define GAMMA               2.2                   // Output gamma (approx)
// Keying thresholds (if no alpha). Use luma; anything below LOW=transparent, above HIGH=opaque.
#define KEY_THRESH_LOW      0.05
#define KEY_THRESH_HIGH     0.20
// Optional chroma key color (set ENABLE_CHROMA_KEY 1 and tweak CHROMA_KEY/CHROMA_THRESH)
#define ENABLE_CHROMA_KEY   0
#define CHROMA_KEY          vec3(0.0,1.0,0.0)
#define CHROMA_THRESH       0.25

#define M_PI 3.14159265359

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES

float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
}

float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
    float n = hash21(p);
    return vec2(n, hash21(p + n));
}

// Value noise ---------------------------------------------------------------
float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    // Four corners
    float a = hash21(i);
    float b = hash21(i + vec2(1,0));
    float c = hash21(i + vec2(0,1));
    float d = hash21(i + vec2(1,1));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}

float fbm(vec2 p) {
    float a = 0.5;
    float r = 0.0;
    for(int i=0;i<5;i++) {
        r += a * vnoise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return r;
}

// Polar ring distance ------------------------------------------------------
float ring(vec2 uv, vec2 center, float rad, float thick) {
    float d = abs(length(uv - center) - rad);
    return smoothstep(thick, 0.0, d);
}

// Luma ---------------------------------------------------------------------
float luma(vec3 c) { return dot(c, vec3(0.299,0.587,0.114)); }

// Chroma key distance ------------------------------------------------------
float chromaDiff(vec3 c) {
    return length(c - CHROMA_KEY);
}

// Subject alpha extraction --------------------------------------------------
float extractAlpha(vec4 samp) {
    // If texture supplies alpha, trust it.
    if(samp.a > 0.0) return samp.a;
    // Optional chroma key.
#if ENABLE_CHROMA_KEY
    float cd = chromaDiff(samp.rgb);
    float aC = smoothstep(CHROMA_THRESH, CHROMA_THRESH*0.5, cd);
#else
    float aC = 1.0;
#endif
    float lum = luma(samp.rgb);
    float aL = smoothstep(KEY_THRESH_LOW, KEY_THRESH_HIGH, lum);
    return aL * aC;
}

// Aspect‑correct sampling for iChannel0 ------------------------------------
// Many sprite atlases are square; screen may not be. Fit shortest dimension.
vec2 aspectFit(vec2 uv, vec2 srcRes, vec2 dstRes) {
    float srcAspect = srcRes.x / srcRes.y;
    float dstAspect = dstRes.x / dstRes.y;
    vec2 st = uv;
    if(srcAspect > dstAspect) {
        // source wider → letterbox top/bottom
        float scale = dstAspect / srcAspect; // visible height fraction
        st.y = (uv.y - 0.5) / scale + 0.5;
    } else {
        // source taller → pillarbox left/right
        float scale = srcAspect / dstAspect; // visible width fraction
        st.x = (uv.x - 0.5) / scale + 0.5;
    }
    return st;
}

// Sample subject w/ aspect fit + alpha -------------------------------------
vec4 sampleSubject(vec2 uv) {
    vec2 srcRes = vec2(textureSize(iChannel0,0));
    vec2 dstRes = iResolution.xy;
    vec2 suv = aspectFit(uv, srcRes, dstRes);
    if(any(lessThan(suv, vec2(0.0))) || any(greaterThan(suv, vec2(1.0)))) return vec4(0.0);
    vec4 texel = texture(iChannel0, suv);
    texel.a = extractAlpha(texel);
    return texel;
}

// Sample background (just stretch to screen) --------------------------------
vec3 sampleBackground(vec2 uv) {
    return texture(iChannel1, uv).rgb;
}

// Column intensity falloff --------------------------------------------------
float beamColumn(vec2 uv) {
    float d = abs(uv.x - BEAM_CENTER_X);
    float core = smoothstep(BEAM_RADIUS, BEAM_RADIUS*0.5, d);
    float soft = smoothstep(BEAM_RADIUS+BEAM_SOFTNESS, BEAM_RADIUS, d);
    return max(core, soft*0.5);
}

// Temporal easing -----------------------------------------------------------
float easeInOut(float x) {
    return x*x*(3.0 - 2.0*x);
}

// Convert time to phase [0,1] and demat/remat flag -------------------------
void getPhase(out float phase, out bool demat) {
    float t = mod(iTime, CYCLE_SECONDS);
    float _half = 0.5 * CYCLE_SECONDS;
    demat = (t < _half);
    phase = demat ? (t / _half) : ((t - _half) / _half);
    // Mouse vertical scrub override when LMB held.
    if(iMouse.z > 0.0) {
        phase = clamp(iMouse.y / iResolution.y, 0.0, 1.0);
        demat = (iMouse.x < iResolution.x * 0.5); // left half = demat, right = remat
    }
    phase = easeInOut(phase);
}

// Height cutoff for dissolve front -----------------------------------------
// Returns cutoff Y in [0,1] where subject above/below disappears depending on mode.
float dissolveCut(float phase, bool demat) {
    // Add a small fbm wobble to make the front uneven.
    float wob = fbm(vec2(phase*5.0, iTime*0.5)) * 0.05;
    float cut = phase + wob;
    cut = clamp(cut, 0.0, 1.0);
    return demat ? cut : (1.0 - cut);
}

// Subject dissolve mask -----------------------------------------------------
// uv.y <-> cutoff depending on beam direction (up/down).
float subjectMask(vec2 uv, float cut, bool demat) {
    float y = uv.y;
#if BEAM_DIR_UP
    float mask = (y >= cut) ? 1.0 : 0.0; // keep above rising cut when demat (beam up)
    if(!demat) mask = (y <= cut) ? 1.0 : 0.0; // remat grows downward
#else
    float mask = (y <= cut) ? 1.0 : 0.0; // beam down variant
    if(!demat) mask = (y >= cut) ? 1.0 : 0.0;
#endif
    // feather front
    float feather = 0.05;
    float edge = smoothstep(cut - feather, cut + feather, y);
#if BEAM_DIR_UP
    mask = demat ? edge : (1.0 - edge);
#else
    mask = demat ? (1.0 - edge) : edge;
#endif
    return mask;
}

// Sparkles cluster near the dissolve front ---------------------------------
float sparkMask(vec2 uv, float spark_density) {
    float rnd = hash21(floor(uv * iResolution.xy * 0.5));
    float gate = step(1.0 / spark_density, rnd);
    // temporal twinkle
    float tw = step(0.8, fract(rnd + iTime * 20.0 * rnd));
    return gate * tw;
}

// Scan rings traveling up/down the column ----------------------------------
float scanRings(vec2 uv, float phase, bool demat) {
    float t = iTime * RING_SPEED_SCALE;
    float dir = demat ? 1.0 : -1.0;
    float y = uv.y * dir + t;
    float r = fract(y * RING_FREQ + phase);
    float dist = abs(r - 0.5);
    return sin(uv.x*M_PI) * smoothstep(RING_THICKNESS, 0.0, dist) * RING_INTENSITY;
}

// Heat‑shimmer style distortion --------------------------------------------
/*vec2 shimmer(vec2 uv, float phase) {
    float n = fbm(uv * 20.0 + iTime * 5.0 + phase*10.0);
    float n2 = vnoise(uv * 80.0 + iTime * 30.0);
    vec2 offs = (vec2(n, n2) - 0.5) * DISTORT_STRENGTH;
    return uv + offs;
}*/
// Heat‑shimmer style distortion with fade-out at phase=1 -------------------
vec2 shimmer(vec2 uv, float phase) {
    float n = fbm(uv * 20.0 + iTime * 5.0 + phase * 10.0);
    float n2 = vnoise(uv * 80.0 + iTime * 30.0);
    vec2 offs = (vec2(n, n2) - 0.5) * DISTORT_STRENGTH;

    // Fade shimmer out as phase approaches 1.0
    offs *= (1.0 - phase);

    return uv + offs;
}


// Grain --------------------------------------------------------------------
float grain(vec2 uv) {
    return hash21(uv * iResolution.xy + floor(iTime*60.0));
}

// Main ---------------------------------------------------------------------
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Time → phase
    float phase; bool demat;
    getPhase(phase, demat);
    
    float inverse_phase = 1.0 - phase;

    // Dissolve front cutoff in UV.y
    float cut = dissolveCut(phase, demat);

    // Distorted UV for subject sampling (heat shimmer within column region only)
    float col = beamColumn(uv); // 0..1
    vec2 uvD = mix(uv, shimmer(uv, phase), col);
    uvD.x = (uvD.x-0.5) / phase + 0.5;

    // Sample base layers
    vec3 bg = sampleBackground(uv);
    vec4 subj = sampleSubject(uvD);

    // Subject mask by dissolve
    float sm = subjectMask(uv, cut, demat);

    // Additional flicker noise (temporal) to make transporter speckle
    float flicker_strength_now = (1.0-phase) * FLICKER_STRENGTH;
    float flick = mix(1.0 - flicker_strength_now, 1.0 + flicker_strength_now,
                      fbm(uv * 10.0 + iTime * 10.0));

    // Apply dissolve mask to subject alpha
    subj.a *= sm * flick;

    // Sparkles at front
    float sp = sparkMask(uv, SPARK_DENSITY * inverse_phase);

    // Column glow + scan rings
    float colGlow = col * COLUMN_INTENSITY;
    colGlow += scanRings(uv, phase, demat);

    // Spark color mix
    vec3 sparkCol = mix(BEAM_COLOR, BEAM_COLOR_ALT, hash21(uv*999.0));

    // Combine subject + sparkles
    vec3 subjCol = subj.rgb * subj.a;
    float noise_r = hash21(uv*(999.0 + iTime));
    float noise_g = hash21(uv*(1999.0 + iTime));
    float noise_b = hash21(uv*(2999.0 + iTime));
    if (subj.a > 0.0 && noise_r + noise_g + noise_b > phase*3.0) {
        subjCol = vec3(noise_r, noise_g, noise_b);
    }

    // Additive beam column energy (modulated by dissolve progress: more energy when demat/remat front active)
    float frontEnergy = smoothstep(0.0, 0.2, abs(uv.y - cut));
    frontEnergy = 1.0 - frontEnergy; // invert: peak at front
    vec3 beamEnergy = BEAM_COLOR * colGlow * frontEnergy;

    // Composite over background (src over)
    vec3 color = mix(bg, subjCol.rgb, subj.a);

    // Add additive energy
    color += beamEnergy + subjCol * sp * 0.5;

    // Mild bloom proxy: energy times itself
    color += beamEnergy * beamEnergy * 0.25;

    // Screen grain
    color += (grain(uv) - 0.5) * GRAIN_AMOUNT;

    // Tone & gamma
    color = max(color, 0.0);
    color = pow(color, vec3(1.0 / GAMMA));

    fragColor = vec4(color, 1.0);
}

// END ----------------------------------------------------------------------
// Notes:
// • To force one‑shot dematerialization, freeze iTime and scrub with mouse.
// • For teleport receive pad effect, duplicate shader with BEAM_DIR_UP=0 and phase reversed.
// • Combine two instances (send + receive) via multipass if you want simultaneous endpoints.
// • For Stargate‑style watery kawoosh + vertical energy, feed a displacement map into iChannel2
//   and add refractive sampling inside beamColumn().
// • For transporter pad circles on floor, draw additional geometry in Buffer A & sample here.
//
// Performance: Avoid heavy fbm octaves if targeting mobile; reduce loops.
// ------------------------------------------------------------
