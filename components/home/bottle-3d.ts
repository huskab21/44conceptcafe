import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { bottleProfiles } from "@/lib/bottle-profiles";

export type BottleId = keyof typeof bottleProfiles;

const IMAGES: Record<BottleId, string> = {
  sapporo: "/images/beer/sapporo.webp",
  kirin: "/images/beer/kirin.webp",
};

/**
 * A real 3D beer bottle: the body is a lathe built from the photo's own silhouette, and the photo is
 * projected onto it from the front (mirrored-correctly on the back, slightly darker), so the front looks
 * exactly like the product shot while the bottle still turns, catches reflections and shades like glass.
 */
export function createBottleScene(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  camera.position.set(0, 0, 2.55);

  scene.add(new THREE.AmbientLight(0xffffff, 1.05));
  const key = new THREE.DirectionalLight(0xfff1dc, 1.1);
  key.position.set(-1.5, 1.2, 2);
  scene.add(key);
  const rimL = new THREE.DirectionalLight(0xffc27a, 2.2);
  rimL.position.set(-2.5, 0.5, -1.5);
  scene.add(rimL);
  const rimR = new THREE.DirectionalLight(0xffe2b8, 1.6);
  rimR.position.set(2.5, -0.3, -1.2);
  scene.add(rimR);

  // tilt (static lean) → turn (cursor + spin)
  const tilt = new THREE.Group();
  tilt.rotation.z = THREE.MathUtils.degToRad(-25);
  const turn = new THREE.Group();
  tilt.add(turn);
  scene.add(tilt);

  const loader = new THREE.TextureLoader();
  const cache = new Map<BottleId, { geo: THREE.LatheGeometry; mat: THREE.MeshPhysicalMaterial }>();
  let mesh: THREE.Mesh | null = null;

  function build(id: BottleId) {
    const hit = cache.get(id);
    if (hit) return hit;
    const { profile, aspect } = bottleProfiles[id];
    const pts = profile.map(([y, r]) => new THREE.Vector2(Math.max(r, 0.0005), y));
    const geo = new THREE.LatheGeometry(pts, 128);
    geo.translate(0, -0.5, 0);

    const tex = loader.load(IMAGES[id]);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    tex.generateMipmaps = true;

    const mat = new THREE.MeshPhysicalMaterial({
      map: tex,
      roughness: 0.32,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      envMapIntensity: 0.55,
      specularIntensity: 0.6,
    });
    // Project the photo from the front instead of using lathe UVs.
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uAspect = { value: aspect };
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vObj;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvObj = position;");
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vObj;\nuniform float uAspect;")
        .replace(
          "#include <map_fragment>",
          `
          float front = step(0.0, vObj.z);
          float sx = mix(-vObj.x, vObj.x, front);           // back reads the right way round
          vec2 puv = vec2(0.5 + 0.965 * sx / uAspect, vObj.y + 0.5);
          vec4 texel = texture2D(map, puv);
          vec3 c = texel.rgb;
          c *= mix(0.55, 1.0, front);                        // back side sits in shadow
          diffuseColor.rgb *= c;
          `,
        );
    };
    const entry = { geo, mat };
    cache.set(id, entry);
    return entry;
  }

  function setBottle(id: BottleId) {
    const { geo, mat } = build(id);
    if (!mesh) {
      mesh = new THREE.Mesh(geo, mat);
      turn.add(mesh);
    } else {
      mesh.geometry = geo;
      mesh.material = mat;
    }
  }

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  /** yaw/pitch in degrees */
  function render(yaw: number, pitch: number) {
    turn.rotation.y = THREE.MathUtils.degToRad(yaw);
    turn.rotation.x = THREE.MathUtils.degToRad(pitch);
    renderer.render(scene, camera);
  }

  function preload(ids: BottleId[]) {
    ids.forEach(build);
  }

  function dispose() {
    cache.forEach(({ geo, mat }) => {
      geo.dispose();
      mat.map?.dispose();
      mat.dispose();
    });
    env.dispose();
    pmrem.dispose();
    renderer.dispose();
  }

  return { setBottle, resize, render, preload, dispose };
}

export type BottleScene = ReturnType<typeof createBottleScene>;
