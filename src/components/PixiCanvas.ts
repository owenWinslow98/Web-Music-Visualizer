import { Application, Container, Graphics, Sprite, Texture, Ticker, Assets, Text } from 'pixi.js';
type PixiEl = Sprite | Graphics | Ticker | Texture | Text | DustParticle[]
export type spriteMap = Map<string, PixiEl>

function generateCircleBase64() {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  if (ctx === null) return '';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.arc(8, 8, 8, 0, Math.PI * 2);
  ctx.fill();
  return canvas.toDataURL('image/png');
}
const PNG = generateCircleBase64()

export async function initPixi(canvas: HTMLCanvasElement): Promise<{ app: Application, spriteMap: spriteMap }> {
  const app = new Application();
  // 将 canvas 传给 app
  const texture = await Assets.load(PNG);
  await app.init({
    canvas: canvas,
    antialias: true,
    width: 1920,
    height: 1080,
    preserveDrawingBuffer: true,
  });
  const squre = new Container();
  app.stage.addChild(squre);

  const background = new Sprite(Texture.WHITE);
  squre.addChild(background);

  const dustList = new Array(30).fill(0).map(() => new DustParticle(texture))
  squre.addChild(...dustList);

  const major = new Sprite(Texture.WHITE);
  squre.addChild(major);

  const majorMask = new Graphics();
  squre.addChild(majorMask);

  const audioVisualizer = new Graphics();
  app.stage.addChild(audioVisualizer);

  const ticker = new Ticker();
  const spriteMap = new Map<string, PixiEl>();
  spriteMap.set('background', background);
  spriteMap.set('major', major);
  spriteMap.set('audioVisualizer', audioVisualizer);
  spriteMap.set('ticker', ticker);
  spriteMap.set('majorMask', majorMask);
  spriteMap.set('dustList', dustList);
  const AudioText = new Text({
    text: 'xx',
    style: {
      fontFamily: 'Arial',
      fontSize: 32,
      fill: 0xFFFFFF,
      align: 'center'
    }
  });
  squre.addChild(AudioText);
  spriteMap.set('audioText', AudioText);
  ticker.start();
  return { app, spriteMap };
}
export class DustParticle extends Sprite {
  static createdAreaX = 1920;
  static createdAreaY = 1080;
  static perspective = 400;

  rx: number = 0;
  ry: number = 0;
  rz: number = 0;

  static speed = 8;
  dx: number = 0;
  dy: number = 0;
  dleng: number = 0;


  constructor(texture: Texture) {
    const { particleOptions, additionOptions } = DustParticle.initOptions(texture)
    super(particleOptions);
    const { rx, ry, rz } = additionOptions;
    this.rx = rx;
    this.ry = ry;
    this.rz = rz;
    this.update();
  }
  static initCoord() {
    return {
      rx: Math.random() * DustParticle.createdAreaX,
      ry: Math.random() * DustParticle.createdAreaY,
      rz: Math.random() * ((-400) - (-1400)) + -1400,
    }
  }
  static transform(x: number, y: number, z: number) {
    const { createdAreaX, createdAreaY, perspective } = DustParticle;
    const dz = perspective - z;
    const scale = perspective / dz;
    const x2d = (x - createdAreaX / 2) * scale + createdAreaX / 2;
    const y2d = (y - createdAreaY / 2) * scale + createdAreaY / 2;
    return {
      x2d,
      y2d,
      scale,
    }
  }
  static initOptions(texture: Texture) {
    const additionOptions = this.initCoord();
    const { rx, ry, rz } = additionOptions;
    const { x2d, y2d, scale } = DustParticle.transform(rx, ry, rz);
    const particleOptions = {
      texture,
      x: x2d,
      y: y2d,
      scaleX: scale,
      scaleY: scale,
      rotation: 0,
      alpha: 1,
    }
    return { additionOptions, particleOptions }
  }
  update() {
    if (this.rz > 360) {
      this.reset();
    } this.rz += DustParticle.speed;
    const { x2d, y2d, scale } = DustParticle.transform(this.rx, this.ry, this.rz);
    this.x = x2d;
    this.y = y2d;
    this.scale = scale;
  }
  reset() {
    const { rx, ry, rz } = DustParticle.initCoord();
    this.rx = rx;
    this.ry = ry;
    this.rz = rz;
  }
}


export type spriteAttributes = {
  x: number,
  y: number,
  width: number,
  height: number,
}

export const backgroundSprite: spriteAttributes = {
  x: 0,
  y: 0,
  width: 1920,
  height: 1080,
}
export const majorSprite: spriteAttributes = {
  x: 1920 / 2 - 288 / 2,
  y: 1080 / 2 - 288,
  width: 288,
  height: 288,
}

export const majorMaskSprite: spriteAttributes = {
  x: 1920 / 2 - 288 / 2,
  y: 1080 / 2 - 288,
  width: 288,
  height: 288,
}

export const audioVisualizerSprite: spriteAttributes = {
  x: 1920 / 2,
  y: 1080 / 2 - 144,
  width: 144,
  height: 144,
}

export const audioTextSprite: spriteAttributes = {
  x: 1920 / 2,
  y: 1080 * 0.68,
  width: 1920,
  height: 1080 * 0.5,
}
