const { Shape, Container, Text } = require('@createjs/easeljs');
const { Tween, Ease } = require('@createjs/tweenjs');
const { tweenPromise, swap } = require('../utils');

export class SequenceDiagram {
    constructor(player, { participants, steps }) {
        this.stage = player._stage;
        this._participants = participants || [];
        this._steps = steps || [];
        this._initVisual();
    }

    _initVisual() {
        const margin = this.stage.canvas.width / 10;
        this.stage.canvas.height = this.stage.canvas.width;
        this.container = new Container();
        const participantTextSize = 20;
        const rectHeight = 2 * participantTextSize;
        const lineWidth = 1;
        const lineHeight = 300;

        let nextX = margin;
        for (const participant of this._participants) {
            const pContainer = new Container().set({
                x: nextX,
                y: margin
            });
            const rectWidth = (participantTextSize * participant.name.length) / 1.5;
            const centerX = rectWidth / 2;

            // topRectangle
            const topRectangle = new Shape();
            topRectangle.graphics.beginStroke("black").drawRect(0, 0, rectWidth, rectHeight);
            const topText = new Text(participant.name, `${participantTextSize}px Arial`).set({
                textAlign: "center",
                textBaseline: "middle",
                x: centerX,
                y: rectHeight / 2
            });
            //line
            const line = new Shape();
            line.graphics.beginFill("black").drawRect(centerX, rectHeight, lineWidth, lineHeight);
            // bottomRectangle
            const bottomRectangle = new Shape();
            const bottomRectangleY = rectHeight + lineHeight;
            bottomRectangle.graphics.beginStroke("black").drawRect(0, bottomRectangleY, rectWidth, rectHeight);
            const bottomText = new Text(participant.name, `${participantTextSize}px Arial`).set({
                textAlign: "center",
                textBaseline: "middle",
                x: centerX,
                y: bottomRectangleY + rectHeight / 2
            });

            pContainer.addChild(topRectangle, topText, line, bottomRectangle, bottomText);

            this.container.addChild(pContainer);
            nextX = nextX + rectWidth + margin;
        }


        // const ringRadius = (this.stage.canvas.width / 2) - margin;
        // const ringX = margin + ringRadius;
        // const ringY = margin + ringRadius;
        // this.visualConfig = {
        //     ringX: ringX,
        //     ringY: ringY,
        //     ringRadius: ringRadius
        // }
        // this.nodeReplicas = [];
        this.stage.addChild(this.container);
    }

    draw(options) {
        for(const step of this._steps) {
            // from, to, text
        }
    }
}