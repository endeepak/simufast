/**
Backlog:
    - CDN build for simufast. Build npm module
    - Option to show stats by default
    - Option to hide attribution
TBD:
    - Interactive commands for readers
    - Embeddable script like github gist
    - Embeddable script builder : https://codemirror.net/
    - Show detailed logs with auto scroll
    - Step by step execution
    - Rewind? -> Undo / Redo
*/
const { SimufastPlayer } = require('./core/simufast-player');
const demos = require('./demos');
const routing = require('./routing');
const cache = require('./cache');
const utils = require('./utils');
const array = require('./array');
const sequenceDiagram = require('./sequence-diagram');

const run = async (fn, options) => {
    const player = new simufast.SimufastPlayer(options);
    await fn(player);
};

module.exports = {
    SimufastPlayer,
    demos,
    routing,
    cache,
    utils,
    array,
    sequenceDiagram,
    run
}


