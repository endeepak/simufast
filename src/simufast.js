/**
Backlog:
    - CDN build for simufast. Build npm module
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

module.exports = {
    SimufastPlayer,
    demos
}

window.simufast = module.exports;



