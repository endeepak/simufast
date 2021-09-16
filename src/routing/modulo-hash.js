const { Container, Text } = require('@createjs/easeljs');
const { Tween, Ease } = require('@createjs/tweenjs');
const { HashNode } = require('./hash-node');
const { tweenPromise, getHashCode, MD5 } = require('../utils');

export class ModuloHash {
    constructor(player, options) {
        this.stage = player.getStage();
        this.options = options || {};
        this.log = player.log.bind(player);
        this.speedFn = player.getSpeed.bind(player);
        this._initVisual();
    }

    _initVisual() {
        this.nodes = [];
        this.container = new Container();
        const maxNodes = this.options.maxNodes || 3;
        const nodeRadius = this.stage.canvas.width / (2 * 10);
        const margin = nodeRadius;
        this.stage.canvas.height = (maxNodes * nodeRadius * 2) + (margin * 2);
        this.visualConfig = {
            x: this.stage.canvas.width - (3 * margin),
            y: margin,
            nodeRadius: nodeRadius
        }
        this.stage.addChild(this.container);
    }

    async addNode(nodeName, options) {
        this.log(`Adding node: ${nodeName}`);
        const point = this._getPontForNodeIndex(this.nodes.length);
        const node = new HashNode(nodeName, undefined, {
            x: point.x,
            y: point.y,
            radius: this.visualConfig.nodeRadius,
            speedFn: this.speedFn
        });
        this.nodes.push(node);
        await node.draw(this.container, options);
    }

    _getPontForNodeIndex(nodeIndex) {
        return {
            x: this.visualConfig.x - this.visualConfig.nodeRadius,
            y: this.visualConfig.y + (2 * nodeIndex) * this.visualConfig.nodeRadius + this.visualConfig.nodeRadius,
        }
    }

    async removeNode(nodeName) {
        this.log(`Removing node: ${nodeName}`);
        const node = this.nodes.filter(node => node.node === nodeName)[0];
        const nodeIndex = this.nodes.indexOf(node);
        this.nodes.splice(nodeIndex, 1);
        const promises = [node.undraw(this.container)];
        for (let i = nodeIndex; i < this.nodes.length; i++) {
            promises.push(this.nodes[i].moveTo(this._getPontForNodeIndex(i)));
        }
        await Promise.all(promises);
    }

    async getNodeForKey(key) {
        this.log(`Route key: ${key}`);
        const nodeIndex = getHashCode(MD5(key)) % this.nodes.length;
        const node = this.nodes[nodeIndex];
        await this._visualiseNodeForKey(key, nodeIndex, node);
        return node.node;
    }

    async _visualiseNodeForKey(key, nodeIndex, node) {
        const { nodeRadius } = this.visualConfig;
        const textPoint = this._getPontForNodeIndex(nodeIndex);
        const text = new Text(key, `${nodeRadius}px Arial`);
        this.container.addChild(text);
        await Promise.all([
            tweenPromise(Tween.get(text)
                .to({ x: textPoint.x, y: textPoint.y }, 1000 / this.speedFn(), Ease.linear)),
            node.highlight()
        ])
        this.container.removeChild(text);
    }

    reset() {
        this.stage.removeChild(this.container);
        this._initVisual();
    }
}