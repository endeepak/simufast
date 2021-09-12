const { Container, Text, Shape } = require('@createjs/easeljs');
const { Tween, Ease } = require('@createjs/tweenjs');
const { tweenPromise, MD5, stringToColor } = require('../utils');


export class HashNode {
    constructor(node, position, visualConfig) {
        this.node = node;
        this.position = position;
        this.visualConfig = visualConfig;
        this.speedFn = visualConfig.speedFn;
        this._createVisual();
    }

    _createVisual() {
        const { x, y, radius } = this.visualConfig;
        const nodeName = this.node;

        this.container = new Container();
        const circle = new Shape();
        circle.graphics.beginFill(stringToColor(MD5(nodeName))).drawCircle(0, 0, radius);
        this.container.addChild(circle);

        const text = new Text(nodeName, `${radius}px Arial`);
        text.textAlign = 'center';
        text.textBaseline = 'middle';
        this.container.addChild(text);
    }

    async highlight() {
        await tweenPromise(Tween.get(this.container)
            .to({ scaleX: 1.5, scaleY: 1.5 }, 1000 / this.speedFn(), Ease.linear)
            .to({ scaleX: 1.0, scaleY: 1.0 }, 1000 / this.speedFn(), Ease.linear));
    }

    async moveTo(point) {
        await tweenPromise(Tween.get(this.container)
            .to({ x: point.x, y: point.y }, 1000 / this.speedFn(), Ease.linear));
    }

    async draw(parent) {
        parent.addChild(this.container);
        const { x, y } = this.visualConfig;
        await tweenPromise(Tween.get(this.container).to({ x: x, y: y }, 1000 / this.speedFn(), Ease.circIn));
    }

    async undraw(parent) {
        await tweenPromise(Tween.get(this.container).to({ scaleX: 0, scaleY: 0 }, 1000 / this.speedFn(), Ease.linear));
        parent.removeChild(this.container);
    }
}