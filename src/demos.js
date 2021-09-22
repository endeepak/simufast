const { randStringArray, getRandomValueFromArray, randIntArray } = require('./utils');
const { SimufastPlayer } = require('./core/simufast-player');
const { ConsistentHash } = require('./routing/consistent-hash');
const { ModuloHash } = require('./routing/modulo-hash');
const { MultiNodeCacheSimulation } = require('./cache/multi-node-cache-simulation');
const { createVisualArray } = require('./array/visual-array');
const { bubbleSort, selectionSort } = require('./sort');

const cacheDemoCommands = (simulation) => {
    const keys = randStringArray(100);
    const commands = [];
    commands.push(() => simulation.addNode('S1'));
    commands.push(() => simulation.addNode('S2'));
    commands.push(() => simulation.addNode('S3'));
    for (let i = 1; i <= 100; i++) {
        const key = getRandomValueFromArray(keys);
        commands.push(() => simulation.getOrFetch(key, () => `${key}'s value from data source`));
    }
    commands.push(() => simulation.removeNode('S2'));
    commands.push(() => simulation.addNode('S4'));
    for (let i = 1; i <= 100; i++) {
        const key = getRandomValueFromArray(keys);
        commands.push(() => simulation.getOrFetch(key, () => `${key}'s value from data source`));
    }
    commands.push(() => simulation.removeNode('S1'));
    commands.push(() => simulation.addNode('S5'));
    for (let i = 1; i <= 100; i++) {
        const key = getRandomValueFromArray(keys);
        commands.push(() => simulation.getOrFetch(key, () => `${key}'s value from data source`));
    }
    return commands;
}

export async function consistentHashDemo() {
    const player = new SimufastPlayer();
    const consistentHash = new ConsistentHash(player);
    const simulation = new MultiNodeCacheSimulation(consistentHash);
    const commands = cacheDemoCommands(simulation);
    await player.experiment({
        name: 'Consistent Hash',
        drawable: simulation,
        commands: commands
    });
}

export async function moduloHashDemo() {
    const player = new SimufastPlayer();
    const moduloHash = new ModuloHash(player);
    const simulation = new MultiNodeCacheSimulation(moduloHash);
    const commands = cacheDemoCommands(simulation);
    await player.experiment({
        name: 'Modulo Hash',
        drawable: simulation,
        commands: commands
    });
}

export async function bubbleSortDemo() {
    const player = new SimufastPlayer();
    const items = new createVisualArray(player, randIntArray(9, 10, 99));
    await player.experiment({
        name: 'Bubble Sort',
        drawable: items,
        commands: [(options) => bubbleSort(items, options)]
    });
}

export async function selectionSortDemo() {
    const player = new SimufastPlayer();
    const items = new createVisualArray(player, randIntArray(9, 10, 99));
    await player.experiment({
        name: 'Selection Sort',
        drawable: items,
        commands: [(options) => selectionSort(items, options)]
    });
}