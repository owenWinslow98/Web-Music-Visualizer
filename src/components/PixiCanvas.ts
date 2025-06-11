import { Application, Container, Graphics, Sprite, Texture, Ticker, Assets, Text } from 'pixi.js';
import { Emitter } from '@barvynkoa/particle-emitter'
import bubbles from '../../public/Bubbles99.png'

type PixiEl = Sprite | Graphics | Emitter | Ticker | Texture | Text
export type spriteMap = Map<string, PixiEl>




const WHITE_ROUND_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAAXNSR0IArs4c6QAAAENJREFUKFNj/P///2YGBPjFyMgYjMRnYERTcJKRkbEFl4JfDAwMZYyMjHfRFaxlYGA4z8DAsBxdEqSQEVk1NjYdFAAAomsWCasRpi0AAAAASUVORK5CYII='
export async function initPixi(canvas: HTMLCanvasElement, container: HTMLElement): Promise<{ app: Application, spriteMap: spriteMap }> {
  const app = new Application();
  // 将 canvas 传给 app

  const texture = await Assets.load(WHITE_ROUND_IMG);

  // const particleGraphics = new Graphics();

  // // 使用 v8 的新语法绘制发光效果
  // particleGraphics.clear();

  // // 外圈，半透明
  // particleGraphics
  //   .fill({ color: 0xFFFFFF, alpha: 0.3 })  // 使用对象语法
  //   .circle(0, 0, 8)
  //   .fill()

  //   .fill({ color: 0xFFFFFF, alpha: 0.8 })  // 使用对象语法
  //   .circle(0, 0, 4)
  //   .fill();

  // 将 Graphics 转换为纹理
  // const renderer = new CanvasRenderer();
  // const particleTexture = app.renderer.generateTexture(particleGraphics, {});
  await app.init({
    resizeTo: container,
    canvas: canvas,
    antialias: true,
  });

  const squre = new Container();
  app.stage.addChild(squre);

  const background = new Sprite(Texture.WHITE);
  squre.addChild(background);

  const emitterContainer = new Container();
  squre.addChild(emitterContainer);
  const emitter = createEmitter(emitterContainer, texture)
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
  spriteMap.set('bubblesTexture', texture);

  const AudioText = new Text({
    text: 'Hello World',
    style: {
      fontFamily: 'Arial',
      fontSize: 32,
      fill: 0xFFFFFF,  // 白色
      align: 'center'
    }
  });

  AudioText.x = 100;
  AudioText.y = 100;
  squre.addChild(AudioText);
  // 创建 emitter
  // 创建发射器
  spriteMap.set('audioText', AudioText);
  spriteMap.set('emitter', emitter);
  // 设置发射器位置
  emitter.updateOwnerPos(500, 500);
  emitter.emit = true;
  ticker.start();
  return { app, spriteMap };
}


export type spriteAttributes = {
  xPercent: number,
  yPercent: number,
  widthPercent: number,
  heightPercent: number,
}

export const backgroundSprite: spriteAttributes = {
  xPercent: 0,
  yPercent: 0,
  widthPercent: 1,
  heightPercent: 9 / 16,
}

export const majorSprite: spriteAttributes = {
  xPercent: 0.425,
  yPercent: 0.085, //despreate
  widthPercent: 0.15,
  heightPercent: 0.15,
}

export const audioVisualizerSprite: spriteAttributes = {
  xPercent: 0.5,
  yPercent: 0.16,
  widthPercent: 0.08,
  heightPercent: 0.5,
}

export const bubblesTexture: spriteAttributes = {
  xPercent: 0.5,
  yPercent: 0.16,
  widthPercent: 0.01,
  heightPercent: 0.01,
}

export const audioText: spriteAttributes = {
  xPercent: 0.5,
  yPercent: 0.32,
  widthPercent: 1,
  heightPercent: 0.5,
}
const createEmitter = (container: Container, texture: Texture) => {
  return new Emitter(
    container,
    {
      lifetime: {
        min: 7,
        max: 8
      },
      frequency: 0.016,
      emitterLifetime: 0,
      maxParticles: 800,
      addAtBack: false,
      pos: {
        x: 0,
        y: 0
      },
      behaviors: [
        {
          type: 'alpha',
          config: {
            alpha: {
              list: [
                { time: 0, value: 1 },
                { time: 1, value: 0.22 }
              ]
            }
          }
        },
        {
          type: 'moveSpeedStatic',
          config: {
            min: 150,
            max: 150
          }
        },
        {
          type: 'scale',
          config: {
            scale: {
              list: [
                { time: 0, value: 0.8 },
                { time: 1, value: 1.8 }
              ]
            },
            minMult: 0.9
          }
        },
        {
          type: 'rotation',
          config: {
            accel: 0,
            minSpeed: 0,
            maxSpeed: 0,
            minStart: 0,     // 向右 (0度)
            maxStart: 360,     // 向右 (0度)
          }
        },
        {
          type: 'textureSingle',
          config: {
            texture: texture,
          }
        },
        {
          type: 'spawnShape',
          config: {
            type: 'circle',
            data: {
              x: 0,
              y: 0,
              radius: 1
            }
          }
        }
      ]
    }
  );
}
