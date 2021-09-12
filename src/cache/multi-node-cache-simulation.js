const { CacheNode } = require('./cache-node');
const { objectsToTable } = require('../utils');

export class MultiNodeCacheSimulation {
    constructor(nodeDecider) {
        this.nodes = {};
        this.nodeDecider = nodeDecider;
        this.stats = {
            hits: 0,
            misses: 0
        }
    }

    async addNode(nodeName) {
        // this.log(`Adding node: ${nodeName}`)
        const node = new CacheNode(nodeName);
        this.nodes[nodeName] = node;
        await this.nodeDecider.addNode(nodeName);
    }

    async removeNode(nodeName) {
        delete this.nodes[nodeName];
        await this.nodeDecider.removeNode(nodeName);
    }

    async getOrFetch(key, valueFetcher) {
        // this.log(`Get key: ${key}`);
        const nodeName = await this.nodeDecider.getNodeForKey(key);
        const node = this.nodes[nodeName];
        const result = await node.getOrFetch(key, valueFetcher);
        if (result.cached) {
            this.stats.hits += 1;
        } else {
            this.stats.misses += 1;
        }
        return result.value;
    }

    async draw(stage) {
        await this.nodeDecider.draw(stage);
    }

    reset() {
        this.nodes = {};
        this.nodeDecider.reset();
    }

    _getHitRatio(hits, misses) {
        return hits && misses ? Math.round(hits * 100 / (hits + misses)) : 0
    }

    getNodeStats() {
        return Object.keys(this.nodes).map((nodeName) => {
            const node = this.nodes[nodeName];
            return {
                node: node.name,
                keys: node.stats.keys,
                hits: node.stats.hits,
                misses: node.stats.misses,
                hitRatio: this._getHitRatio(node.stats.hits, node.stats.misses)
            }
        });
    }

    getTotalStats() {
        const totalKeys = Object.keys(this.nodes).reduce((total, nodeName) => total + this.nodes[nodeName].stats.keys, 0);
        return {
            node: 'Overall',
            keys: totalKeys,
            hits: this.stats.hits,
            misses: this.stats.misses,
            hitRatio: this._getHitRatio(this.stats.hits, this.stats.misses)
        }
    }

    getStatsHTML() {
        return objectsToTable([
            ...this.getNodeStats(),
            this.getTotalStats()
        ]);
    }
}
