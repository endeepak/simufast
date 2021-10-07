const { Container, Text } = require('@createjs/easeljs');
const { Tween, Ease, Ticker } = require('@createjs/tweenjs');
const { tweenPromise, swap } = require('../utils');
const { ArrayElement } = require('./array-element');
export class VisualArray {
    constructor(player, values, options) {
        this.stage = player.getStage();
        this.options = options || {};
        this.log = player.log.bind(player);
        this.speedFn = player.getSpeed.bind(player);
        this._originalValues = values || [];
        this._initVisual();
    }

    _initVisual() {
        this.y = 0;
        const margin = this.stage.canvas.width / 20;
        this.elementDisplaySize = this.stage.canvas.width / 10;
        this.indexTrackerDisplaySize = this.stage.canvas.width / 20;
        this.values = [...this._originalValues];
        this.container = new Container().set({
            x: margin,
            y: margin
        });
        this.elements = [];
        this.nextElementX = 0;
        for (let i = 0; i < this.values.length; i++) {
            const element = new ArrayElement(this.values[i], this.nextElementX, this.y, this.elementDisplaySize);
            this.elements.push(element);
            this.nextElementX += this.elementDisplaySize;
        }
        this.indexTrackers = {};
        for (const element of this.elements) {
            element.draw(this.container);
        }
        this.stage.addChild(this.container);
    }

    _get_(name) {
        if (this.__proto__.hasOwnProperty(name)) {
            return this[name].bind(this);
        }
        return this.values[name];
    }

    _set_(name, value) {
        this.values[name] = value;
        this.elements[name].text.text = value ? value.toString() : '';
    }

    async compareAtIndex(i, j) {
        await Promise.all([
            this.elements[i].highlight(this.speedFn()),
            this.elements[j].highlight(this.speedFn())
        ]);
        return this.values[i] - this.values[j];
    }

    async swap(i, j) {
        swap(this.values, i, j);
        const iContainer = this.elements[i].container;
        const jContainer = this.elements[j].container;
        const iPosX = iContainer.x;
        const jPosX = jContainer.x;
        const iPromise = tweenPromise(Tween.get(iContainer).to({ x: jPosX }, 1000 / this.speedFn(), Ease.linear));
        const jPromise = tweenPromise(Tween.get(jContainer).to({ x: iPosX }, 1000 / this.speedFn(), Ease.linear));
        swap(this.elements, i, j);
        await Promise.all([iPromise, jPromise]);
    }

    reset() {
        this.stage.removeChild(this.container);
        this._initVisual();
    }

    trackIndex(name, valueFn) {
        const existingTracker = this.indexTrackers[name];
        if (existingTracker) {
            this.indexTrackers[name] = {
                valueFn: valueFn,
                text: existingTracker.text
            }
        } else {
            const value = valueFn();
            const text = new Text(name, `${this.indexTrackerDisplaySize / 1.5}px Arial`);
            this.container.addChild(text);
            this.indexTrackers[name] = {
                valueFn: valueFn,
                text: text
            }
        }
        this._drawIndexTrackers();
    }

    _drawIndexTrackers() {
        const indexCount = [];
        for (let key in this.indexTrackers) {
            const tracker = this.indexTrackers[key];
            const value = tracker.valueFn();
            indexCount[value] = indexCount[value] || 0;
            tracker.text.x = value * this.elementDisplaySize + (this.indexTrackerDisplaySize / 6);
            tracker.text.y = this.elementDisplaySize + indexCount[value] * this.indexTrackerDisplaySize;
            indexCount[value] += 1;
        }
    }

    handleEvent(event) {
        if (event.type == "tick") {
            this._drawIndexTrackers();
        }
    }
}

export const createVisualArray = function (player, array, options) {
    const visualArray = new VisualArray(player, array, options);
    Ticker.addEventListener("tick", visualArray);
    return new Proxy(visualArray, {
        get: function (target, property) {
            return target._get_(property);
        },
        set: function (target, property, value) {
            target._set_(property, value);
            return true;
        }
    });
}
