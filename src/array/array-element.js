const { Container, Shape, Text } = require('@createjs/easeljs');

export class ArrayElement {
    constructor(value, x, y, size) {
        this.container = new Container();
        this.container.x = x || 0;
        this.container.y = y || 0;
        this.size = size || 50;
        this.rectangle = new Shape();
        this.rectangleFillCommand = this.rectangle.graphics.beginFill("white").command;
        this.rectangle.graphics.beginStroke("black").drawRect(0, 0, this.size, this.size);
        this.textSize = (this.size / (1.5 * (value || '').toString().length));
        this.text = new Text(value, `${this.textSize}px Arial`);
        this.text.x = (this.size - this.textSize) / 2;
        this.text.y = (this.size - this.textSize) / 2;
        this.container.addChild(this.rectangle, this.text);
    }

    draw(parent) {
        parent.addChild(this.container);
    }

    async highlight(speed) {
        return new Promise((resolve) => {
            var element = this;
            element._select();
            setTimeout(function () {
                element._deselect();
                resolve();
            }, 1000 / speed);
        });
    }

    _select() {
        this.rectangleFillCommand.style = "lightblue";
    }

    _deselect() {
        this.rectangleFillCommand.style = "white";
    }
}