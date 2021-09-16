const { Container, Text, Shape } = require('@createjs/easeljs');
const { Tween, Ease } = require('@createjs/tweenjs');
const { HashNode } = require('./hash-node');
const { tweenPromise, getHashCode, MD5 } = require('../utils');


export class ConsistentHashRing {
    constructor(player, options) {
        this.stage = player.getStage();
        this.options = options || {};
        this.log = player.log.bind(player);
        this.speedFn = player.getSpeed.bind(player);
        this.config = {
            maxSlots: 1000,
            nodeReplicationFactor: 16,
        };
        this._initVisual();
    }

    _initVisual() {
        const margin = this.stage.canvas.width / 10;
        this.stage.canvas.height = this.stage.canvas.width;
        const ringRadius = (this.stage.canvas.width / 2) - margin;
        const ringX = margin + ringRadius;
        const ringY = margin + ringRadius;
        this.visualConfig = {
            ringX: ringX,
            ringY: ringY,
            ringRadius: ringRadius
        }
        this.nodeReplicas = [];
        this.container = new Container();
        const ring = new Shape();
        ring.graphics.setStrokeStyle(4).beginStroke("#66a841").drawCircle(ringX, ringY, ringRadius);
        this.container.addChild(ring);
        this.stage.addChild(this.container);
    }

    async addNode(nodeName) {
        this.log(`Adding node: ${nodeName}`)
        const drawPromises = [];
        for (let replicaNum = 1; replicaNum <= this.config.nodeReplicationFactor; replicaNum++) {
            const replicaName = `${nodeName}-${replicaNum}`
            const position = this._getPosition(replicaName);
            const point = this._getCircumferencePointAtPosition(position);
            const nodeReplica = new HashNode(nodeName, position, {
                x: point.x,
                y: point.y,
                radius: this.visualConfig.ringRadius / 10,
                speedFn: this.speedFn
            });
            this.nodeReplicas.push(nodeReplica);
            drawPromises.push(nodeReplica.draw(this.container));
        }
        this.nodeReplicas.sort((n1, n2) => n1.position - n2.position);
        await Promise.all(drawPromises);
    }

    async removeNode(nodeName) {
        this.log(`Removing node: ${nodeName}`);
        const nodeReplicasOfNode = this.nodeReplicas.filter(nodeReplica => nodeReplica.node === nodeName);
        const undrawPromises = [];
        for (const nodeReplica of nodeReplicasOfNode) {
            this._bringNodeReplicaToFront(nodeReplica);
            undrawPromises.push(nodeReplica.undraw(this.container));
            this.nodeReplicas.splice(this.nodeReplicas.indexOf(nodeReplica), 1);
        }
        await Promise.all(undrawPromises);
    }

    _getPosition(key) {
        const position = getHashCode(MD5(key)) % this.config.maxSlots;
        return position;
    }

    _getNodeReplicaNextTo(position) {
        // TODO: Use binary search for log-n search
        for (const nodeReplica of this.nodeReplicas) {
            if (nodeReplica.position >= position) {
                return nodeReplica;
            }
        }
        return this.nodeReplicas[0];
    }

    async getNodeForKey(key) {
        this.log(`Route key: ${key}`);
        const position = this._getPosition(key);
        const nodeReplica = this._getNodeReplicaNextTo(position);

        await this._visualiseNodeForKey(key, position, nodeReplica);

        return nodeReplica.node;
    }

    _bringNodeReplicaToFront(nodeReplica) {
        this.container.setChildIndex(nodeReplica.container, this.container.numChildren - 1);
    }

    async _visualiseNodeForKey(key, position, nodeReplica) {
        const { ringRadius } = this.visualConfig;
        this._bringNodeReplicaToFront(nodeReplica);

        const textPoint = this._getCircumferencePointAtPosition(position);
        const text = new Text(key, `${ringRadius / 10}px Arial`);
        this.container.addChild(text);
        await Promise.all([
            tweenPromise(Tween.get(text)
                // .to({ x: textPoint.x, y: textPoint.y }, 1000 * 0, Ease.linear)
                .to({ x: nodeReplica.visualConfig.x, y: nodeReplica.visualConfig.y }, 1000 / this.speedFn(), Ease.linear)),
            nodeReplica.highlight()
        ])
        this.container.removeChild(text);
    }

    _getCircumferencePointAtPosition(position) {
        const { ringX, ringY, ringRadius } = this.visualConfig;
        const angleRadian = (position / this.config.maxSlots) * (2 * Math.PI);
        const x = ringX + ringRadius * Math.cos(angleRadian);
        const y = ringY + ringRadius * Math.sin(angleRadian);
        return { x, y };
    }

    reset() {
        this.stage.removeChild(this.container);
        this._initVisual();
    }
}