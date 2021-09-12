const { randStringArray, getRandomValueFromArray, randIntArray } = require('./utils');
const { SimufastPlayer } = require('./core/simufast-player');
const { ConsitentHashRing } = require('./hash/consitent-hash-ring');
const { ModuloHash } = require('./hash/modulo-hash');
const { MultiNodeCacheSimulation } = require('./cache/multi-node-cache-simulation');
const { createVisualArray } = require('./array/visual-array');
const { bubleSort, selectionSort } = require('./sort');

const cacheDemoCommands = (simulation) => {
    const keys = randStringArray(100);
    const commands = [];
    commands.push(() => simulation.addNode('N1'));
    commands.push(() => simulation.addNode('N2'));
    commands.push(() => simulation.addNode('N3'));
    commands.push(() => simulation.addNode('N4'));
    for (let i = 1; i < 100; i++) {
        const key = getRandomValueFromArray(keys);
        commands.push(() => simulation.getOrFetch(key, () => `${key}'s value from data source`));
    }
    commands.push(() => simulation.removeNode('N3'));
    commands.push(() => simulation.addNode('N5'));
    for (let i = 1; i < 100; i++) {
        const key = getRandomValueFromArray(keys);
        commands.push(() => simulation.getOrFetch(key, () => `${key}'s value from data source`));
    }
    commands.push(() => simulation.removeNode('N1'));
    commands.push(() => simulation.addNode('N6'));
    for (let i = 1; i < 100; i++) {
        const key = getRandomValueFromArray(keys);
        commands.push(() => simulation.getOrFetch(key, () => `${key}'s value from data source`));
    }
    return commands;
}

export async function consitentHashDemo() {
    const player = new SimufastPlayer();
    const chRing = new ConsitentHashRing(player.getStage(), {
        speedFn: () => player.getSpeed(),
        log: (text) => player.log(text)
    });
    const simulation = new MultiNodeCacheSimulation(chRing);
    const commands = cacheDemoCommands(simulation);
    await player.experiment({
        name: 'Consistent Hash',
        drawable: simulation,
        commands: commands
    });
}

export async function moduloHashDemo() {
    const player = new SimufastPlayer();
    const moduloHash = new ModuloHash(player.getStage(), {
        speedFn: () => player.getSpeed(),
        log: (text) => player.log(text)
    });
    const simulation = new MultiNodeCacheSimulation(moduloHash);
    const commands = cacheDemoCommands(simulation);
    await player.experiment({
        name: 'Modulo Hash',
        drawable: simulation,
        commands: commands
    });
}

export async function bubleSortDemo() {
    const player = new SimufastPlayer();
    const items = new createVisualArray(player.getStage(), randIntArray(9, 10, 99), {
        speedFn: () => player.getSpeed(),
        log: (text) => player.log(text)
    });
    await player.experiment({
        name: 'Buble Sort',
        drawable: items,
        commands: [(options) => bubleSort(items, options)]
    });
}

export async function selectionSortDemo() {
    const player = new SimufastPlayer({
        canvasHeight: 120
    });
    const items = new createVisualArray(player.getStage(), randIntArray(9, 10, 99), {
        speedFn: () => player.getSpeed(),
        log: (text) => player.log(text)
    });
    await player.experiment({
        name: 'Selection Sort',
        drawable: items,
        commands: [(options) => selectionSort(items, options)]
    });
}