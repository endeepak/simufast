export class CacheNode {
    constructor(name) {
        this.name = name;
        this.storage = {};
        this.stats = {
            keys: 0,
            hits: 0,
            misses: 0
        };
    }

    async getOrFetch(key, valueFetcher) {
        if (this.storage.hasOwnProperty(key)) {
            this.stats.hits += 1;
            return {
                value: this.storage[key],
                cached: true
            };
        } else {
            const value = await valueFetcher();
            this.storage[key] = value;
            this.stats.keys += 1;
            this.stats.misses += 1;
            return {
                value: value,
                cached: false
            };
        }
    }
}
