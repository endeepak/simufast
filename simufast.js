/**
Backlog:
    - Show ring level stats, simulate remove node
    - Show detailed logs with auto scroll
    - Embeddable script like github gist
    - CDN build for simufast. Build npm module
    - Embeddable script builder : https://codemirror.net/
    - Create random word function, from limited set, use just n nodes, k words
    - Simulate module hashing, compare stats
    - Step by step execution
    - Rewind? -> Undo / Redo
*/

class SimufastPlayer {
    constructor() {
        this._play = false;
        this._speed = 1;
        this._renderDOM();
    }

    getSpeed() {
        return this._speed;
    }

    log(text) {
        this._lastLogText.innerHTML = text;
    }

    updateProgress(progress) {
        this._progressText.innerHTML = `Completed: ${progress.completed}/${progress.total}`;
    }

    _allowReplay() {
        this.pause();
        this._experiment.completed = true;
        this._playPauseButton.classList.replace('fa-play', 'fa-repeat');
    }

    _renderDOM() {
        const dom = `
            <div class="simufast-player">
                <div class="last-log"></div>
                <canvas id="canvas" width="500" height="500"></canvas>
                <div class="control-bar">
                    <span class="speed">
                        <label>Speed:</label>
                        <select class="speed-select">
                            <option value="0.25">0.25x</option>
                            <option value="0.5">0.5x</option>
                            <option value="1" selected>Normal</option>
                            <option value="2">2x</option>
                            <option value="3">3x</option>
                            <option value="5">5x</option>
                            <option value="999999">Max</option>
                        </select>
                    </span>
                    <span class="actions">
                        <button class="play-pause-button fa fa-play"></button>
                    </span>
                    <span class="progress">
                        <span class="progress-text"></span>
                        <i style="display: none;" class="spinner fa fa-spinner fa-spin"></i>
                    </span>
                </div>
                <div style="display: none;" class="stats-section">
                    <a class="stats-link" href="#">Stats</a>
                    <div class="stats"></div>
                </div>
            </div>
        `;

        const player = document.createElement('div');
        document.body.appendChild(player);
        player.innerHTML = dom;

        this._progressText = player.getElementsByClassName('progress-text')[0];
        this._lastLogText = player.getElementsByClassName('last-log')[0];
        this._canvas = player.getElementsByTagName("canvas")[0];
        this._stage = new createjs.Stage(this._canvas);
        this._playPauseButton = player.getElementsByClassName('play-pause-button')[0];
        this._spinner = player.getElementsByClassName('spinner')[0];
        this._speedSelect = player.getElementsByClassName('speed-select')[0];
        this._statsSection = player.getElementsByClassName('stats-section')[0];
        this._statsLink = player.getElementsByClassName('stats-link')[0];
        this._stats = player.getElementsByClassName('stats')[0];

        createjs.Ticker.framerate = 60;
        createjs.Ticker.addEventListener("tick", this._stage);

        this._playPauseButton.addEventListener('click', () => {
            const previouslyPlaying = this._play;
            if (previouslyPlaying) {
                this.pause();
            } else {
                this.play();
            }
        });

        this._speedSelect.addEventListener('change', () => {
            this._speed = Number(this._speedSelect.value);
        });

        this._statsLink.addEventListener('click', (event) => {
            event.preventDefault();
            if (this._stats.classList.contains('closed')) {
                this._stats.classList.remove('closed');
                this._stats.classList.add('open');
            } else {
                this._stats.classList.remove('open');
                this._stats.classList.add('closed');
            }
        })
    }

    updateStats(statsHTML) {
        if (statsHTML) {
            this._statsSection.style.display = '';
        }
        this._stats.innerHTML = statsHTML;
    }

    _showSpinner() {
        this._spinner.style.display = '';
    }

    _hideSpinner() {
        this._spinner.style.display = 'none';
    }

    async _pauseIfRequired() {
        while (!this._play) {
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }

    play() {
        const previousExperimentCompleted = this._experiment.completed;
        if (previousExperimentCompleted) {
            this.reset();
            this._playPauseButton.classList.replace('fa-repeat', 'fa-pause');
        }
        this._play = true;
        this._playPauseButton.classList.replace('fa-play', 'fa-pause');
    }

    pause() {
        this._play = false;
        this._playPauseButton.classList.replace('fa-pause', 'fa-play');
    }

    reset() {
        const { drawable } = this._experiment;
        drawable.reset();
        this._experiment.completed = false;
        this.experiment(this._experiment);
    }

    async experiment(experiment) {
        const { name, drawable, commands } = experiment;
        this._experiment = experiment;
        this.log(name);
        drawable.draw(this._stage);
        const totalCommands = commands.length;
        const commandsQueue = [...commands];
        await this._pauseIfRequired();
        while (commandsQueue.length > 0) {
            const command = commandsQueue.shift();
            await command({
                onStepCompleted: this._pauseIfRequired.bind(this)
            });
            this.updateProgress({ total: totalCommands, completed: totalCommands - commandsQueue.length });
            this.updateStats(drawable.getStatsHTML ? drawable.getStatsHTML() : '');
            await this._pauseIfRequired();
        }
        this._allowReplay();
    }
}

async function consitentHashDemo() {
    const player = new SimufastPlayer();
    const chRing = new ConsitentHashRing({
        speedFn: () => player.getSpeed(),
        log: (text) => player.log(text)
    });
    const simulation = new MultiNodeCacheSimulation(chRing);
    const keys = [...Array(100)].map(() => makeid(5)); // 100 unique keys
    const commands = [];
    for (let i = 1; i <= 4; i++) {
        commands.push(() => simulation.addNode(`N${i}`));
    }
    // commands.push(() => simulation.removeNode(`N${randomInteger(1, 4)}`));
    for (let i = 1; i < 500; i++) {
        const key = getRandomValueFromArray(keys);
        commands.push(() => simulation.getOrFetch(key, () => `${key}'s value from data source`));
    }
    await player.experiment({
        name: 'Consistent Hash',
        drawable: simulation,
        commands: commands
    });
}

async function moduloHashDemo() {
    const player = new SimufastPlayer();
    const chRing = new ModuloHash({
        speedFn: () => player.getSpeed(),
        log: (text) => player.log(text)
    });
    const simulation = new MultiNodeCacheSimulation(chRing);
    const keys = [...Array(100)].map(() => makeid(5)); // 100 unique keys
    const commands = [];
    for (let i = 1; i <= 4; i++) {
        commands.push(() => simulation.addNode(`N${i}`));
    }
    // commands.push(() => simulation.removeNode(`N${randomInteger(1, 4)}`));
    for (let i = 1; i < 500; i++) {
        const key = getRandomValueFromArray(keys);
        commands.push(() => simulation.getOrFetch(key, () => `${key}'s value from data source`));
    }
    await player.experiment({
        name: 'Modulo Hash',
        drawable: simulation,
        commands: commands
    });
}

async function bubleSortDemo() {
    const player = new SimufastPlayer();
    const items = new createVisualArray(randIntArray(9, 10, 99), {
        speedFn: () => player.getSpeed(),
        log: (text) => player.log(text)
    });
    await player.experiment({
        name: 'Buble Sort',
        drawable: items,
        commands: [(options) => bubleSort(items, options)]
    });
}

async function selectionSortDemo() {
    const player = new SimufastPlayer();
    const items = new createVisualArray(randIntArray(9, 10, 99), {
        speedFn: () => player.getSpeed(),
        log: (text) => player.log(text)
    });
    await player.experiment({
        name: 'Selection Sort',
        drawable: items,
        commands: [(options) => selectionSort(items, options)]
    });
}

const getRandomValueFromArray = (values) => {
    return values[randomInteger(0, values.length - 1)];
}

// https://gist.github.com/0x263b/2bdd90886c2036a1ad5bcf06d6e6fb37
String.prototype.toColor = function () {
    var colors = ["#e51c23", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#5677fc", "#03a9f4", "#00bcd4", "#009688", "#259b24", "#8bc34a", "#afb42b", "#ff9800", "#ff5722", "#795548", "#607d8b"]

    var hash = 0;
    if (this.length === 0) return hash;
    for (var i = 0; i < this.length; i++) {
        hash = this.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
    }
    hash = ((hash % colors.length) + colors.length) % colors.length;
    return colors[hash];
}

// https://stackoverflow.com/a/33486055/69362
var MD5 = function (d) {
    var r = M(V(Y(X(d), 8 * d.length))); return r.toLowerCase()
};
function M(d) { for (var _, m = "0123456789ABCDEF", f = "", r = 0; r < d.length; r++)_ = d.charCodeAt(r), f += m.charAt(_ >>> 4 & 15) + m.charAt(15 & _); return f }
function X(d) { for (var _ = Array(d.length >> 2), m = 0; m < _.length; m++)_[m] = 0; for (m = 0; m < 8 * d.length; m += 8)_[m >> 5] |= (255 & d.charCodeAt(m / 8)) << m % 32; return _ }
function V(d) { for (var _ = "", m = 0; m < 32 * d.length; m += 8)_ += String.fromCharCode(d[m >> 5] >>> m % 32 & 255); return _ }
function Y(d, _) { d[_ >> 5] |= 128 << _ % 32, d[14 + (_ + 64 >>> 9 << 4)] = _; for (var m = 1732584193, f = -271733879, r = -1732584194, i = 271733878, n = 0; n < d.length; n += 16) { var h = m, t = f, g = r, e = i; f = md5_ii(f = md5_ii(f = md5_ii(f = md5_ii(f = md5_hh(f = md5_hh(f = md5_hh(f = md5_hh(f = md5_gg(f = md5_gg(f = md5_gg(f = md5_gg(f = md5_ff(f = md5_ff(f = md5_ff(f = md5_ff(f, r = md5_ff(r, i = md5_ff(i, m = md5_ff(m, f, r, i, d[n + 0], 7, -680876936), f, r, d[n + 1], 12, -389564586), m, f, d[n + 2], 17, 606105819), i, m, d[n + 3], 22, -1044525330), r = md5_ff(r, i = md5_ff(i, m = md5_ff(m, f, r, i, d[n + 4], 7, -176418897), f, r, d[n + 5], 12, 1200080426), m, f, d[n + 6], 17, -1473231341), i, m, d[n + 7], 22, -45705983), r = md5_ff(r, i = md5_ff(i, m = md5_ff(m, f, r, i, d[n + 8], 7, 1770035416), f, r, d[n + 9], 12, -1958414417), m, f, d[n + 10], 17, -42063), i, m, d[n + 11], 22, -1990404162), r = md5_ff(r, i = md5_ff(i, m = md5_ff(m, f, r, i, d[n + 12], 7, 1804603682), f, r, d[n + 13], 12, -40341101), m, f, d[n + 14], 17, -1502002290), i, m, d[n + 15], 22, 1236535329), r = md5_gg(r, i = md5_gg(i, m = md5_gg(m, f, r, i, d[n + 1], 5, -165796510), f, r, d[n + 6], 9, -1069501632), m, f, d[n + 11], 14, 643717713), i, m, d[n + 0], 20, -373897302), r = md5_gg(r, i = md5_gg(i, m = md5_gg(m, f, r, i, d[n + 5], 5, -701558691), f, r, d[n + 10], 9, 38016083), m, f, d[n + 15], 14, -660478335), i, m, d[n + 4], 20, -405537848), r = md5_gg(r, i = md5_gg(i, m = md5_gg(m, f, r, i, d[n + 9], 5, 568446438), f, r, d[n + 14], 9, -1019803690), m, f, d[n + 3], 14, -187363961), i, m, d[n + 8], 20, 1163531501), r = md5_gg(r, i = md5_gg(i, m = md5_gg(m, f, r, i, d[n + 13], 5, -1444681467), f, r, d[n + 2], 9, -51403784), m, f, d[n + 7], 14, 1735328473), i, m, d[n + 12], 20, -1926607734), r = md5_hh(r, i = md5_hh(i, m = md5_hh(m, f, r, i, d[n + 5], 4, -378558), f, r, d[n + 8], 11, -2022574463), m, f, d[n + 11], 16, 1839030562), i, m, d[n + 14], 23, -35309556), r = md5_hh(r, i = md5_hh(i, m = md5_hh(m, f, r, i, d[n + 1], 4, -1530992060), f, r, d[n + 4], 11, 1272893353), m, f, d[n + 7], 16, -155497632), i, m, d[n + 10], 23, -1094730640), r = md5_hh(r, i = md5_hh(i, m = md5_hh(m, f, r, i, d[n + 13], 4, 681279174), f, r, d[n + 0], 11, -358537222), m, f, d[n + 3], 16, -722521979), i, m, d[n + 6], 23, 76029189), r = md5_hh(r, i = md5_hh(i, m = md5_hh(m, f, r, i, d[n + 9], 4, -640364487), f, r, d[n + 12], 11, -421815835), m, f, d[n + 15], 16, 530742520), i, m, d[n + 2], 23, -995338651), r = md5_ii(r, i = md5_ii(i, m = md5_ii(m, f, r, i, d[n + 0], 6, -198630844), f, r, d[n + 7], 10, 1126891415), m, f, d[n + 14], 15, -1416354905), i, m, d[n + 5], 21, -57434055), r = md5_ii(r, i = md5_ii(i, m = md5_ii(m, f, r, i, d[n + 12], 6, 1700485571), f, r, d[n + 3], 10, -1894986606), m, f, d[n + 10], 15, -1051523), i, m, d[n + 1], 21, -2054922799), r = md5_ii(r, i = md5_ii(i, m = md5_ii(m, f, r, i, d[n + 8], 6, 1873313359), f, r, d[n + 15], 10, -30611744), m, f, d[n + 6], 15, -1560198380), i, m, d[n + 13], 21, 1309151649), r = md5_ii(r, i = md5_ii(i, m = md5_ii(m, f, r, i, d[n + 4], 6, -145523070), f, r, d[n + 11], 10, -1120210379), m, f, d[n + 2], 15, 718787259), i, m, d[n + 9], 21, -343485551), m = safe_add(m, h), f = safe_add(f, t), r = safe_add(r, g), i = safe_add(i, e) } return Array(m, f, r, i) } function md5_cmn(d, _, m, f, r, i) { return safe_add(bit_rol(safe_add(safe_add(_, d), safe_add(f, i)), r), m) } function md5_ff(d, _, m, f, r, i, n) { return md5_cmn(_ & m | ~_ & f, d, _, r, i, n) } function md5_gg(d, _, m, f, r, i, n) { return md5_cmn(_ & f | m & ~f, d, _, r, i, n) } function md5_hh(d, _, m, f, r, i, n) { return md5_cmn(_ ^ m ^ f, d, _, r, i, n) } function md5_ii(d, _, m, f, r, i, n) { return md5_cmn(m ^ (_ | ~f), d, _, r, i, n) } function safe_add(d, _) { var m = (65535 & d) + (65535 & _); return (d >> 16) + (_ >> 16) + (m >> 16) << 16 | 65535 & m } function bit_rol(d, _) {
    return d << _ | d >>> 32 - _
};

// https://stackoverflow.com/a/33647870/69362
const getHashCode = (string) => {
    if (string == null) return 0;
    var hash = 0, i = 0, len = string.length;
    while (i < len) {
        hash = ((hash << 5) - hash + string.charCodeAt(i++)) << 0;
    }
    return (hash + 2147483647) + 1; // return positive value
}

// https://stackoverflow.com/a/6229124/69362
function unCamelCase(str) {
    return str
        // insert a space between lower & upper
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        // space before last upper in a sequence followed by lower
        .replace(/\b([A-Z]+)([A-Z])([a-z])/, '$1 $2$3')
        // uppercase the first character
        .replace(/^./, function (str) { return str.toUpperCase(); })
}

// https://stackoverflow.com/a/1349426/69362
function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const objectsToTable = (stats) => {
    if (!stats || !stats.length) {
        return '';
    }
    const keys = Object.keys(stats[0]);
    const tableHeader = keys.map((key) => `<th>${unCamelCase(key)}</th>`).join('\n');
    const tableBody = stats.map((stat) => {
        const tds = keys.map((key) => `<td>${stat[key]}</td>`).join('\n');
        return `<tr>${tds}</tr>`;
    }).join('\n');
    return `
    <table>
        <thead>${tableHeader}</thead>
        <tbody>${tableBody}</tbody>
    </table>
    `
}

class MultiNodeCacheSimulation {
    constructor(nodeDecider) {
        this.nodes = {};
        this.nodeDecider = nodeDecider;
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
        const value = await node.getOrFetch(key, valueFetcher);
        return value;
    }

    async draw(stage) {
        await this.nodeDecider.draw(stage);
    }

    reset() {
        this.nodes = {};
        this.nodeDecider.reset();
    }

    getNodeStats() {
        return Object.keys(this.nodes).map((nodeName) => {
            const node = this.nodes[nodeName];
            return {
                node: node.name,
                keys: node.stats.keys,
                hits: node.stats.hits,
                misses: node.stats.misses,
                hitRatio: node.stats.hits && node.stats.misses ? Math.round(node.stats.hits * 100 / (node.stats.hits + node.stats.misses)) : 0
            }
        });
    }

    getStatsHTML() {
        return objectsToTable(this.getNodeStats());
    }
}

class CacheNode {
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
            return this.storage[key];
        } else {
            const value = await valueFetcher();
            this.storage[key] = value;
            this.stats.keys += 1;
            this.stats.misses += 1;
        }
    }

    getKeys() {
        return Object.keys(this.storage);
    }
}

class ModuloHash {
    constructor() {
        this.nodes = [];
    }

    addNode(nodeName) {
        this.nodes.push(nodeName);
    }

    removeNode(nodeName) {
        const nodeIndex = this.nodes.indexOf(nodeName);
        if (index === -1) return;
        this.nodes.splice(nodeIndex, 1);
    }

    getNodeForKey(key) {
        const nodeIndex = getHashCode(MD5(key)) % this.nodes.length;
        return this.nodes[nodeIndex];
    }

    async draw(parent) {

    }

    reset() {
        this.nodes = [];
    }
}

class ConsitentHashRing {
    constructor(options) {
        this.config = {
            maxSlots: 1000,
            nodeReplcationFactor: 16,
        };
        this.log = options.log || console.log;
        this.speedFn = options.speedFn || (() => 1);

        this.visualConfig = {
            ringX: 250,
            ringY: 250,
            ringRadius: 200
        }
        this._initVisual();
    }

    _initVisual() {
        const { ringX, ringY, ringRadius } = this.visualConfig;
        this.nodeReplicas = [];
        this.container = new createjs.Container();
        const ring = new createjs.Shape();
        ring.graphics.setStrokeStyle(4).beginStroke("#66a841").drawCircle(ringX, ringY, ringRadius);
        this.container.addChild(ring);
    }

    async addNode(nodeName) {
        this.log(`Adding node: ${nodeName}`)
        const drawPromises = [];
        for (let replicaNum = 1; replicaNum <= this.config.nodeReplcationFactor; replicaNum++) {
            const replicaName = `${nodeName}-${replicaNum}`
            const position = this._getPosition(replicaName);
            const point = this._getCircumferencePointAtPosition(position);
            const nodeReplica = new ConsitentHashNodeReplica(nodeName, position, {
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
        this.log(`Get key: ${key}`);
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
        const text = new createjs.Text(key, `${ringRadius / 10}px Arial`);
        this.container.addChild(text);
        await Promise.all([
            tweenPromise(createjs.Tween.get(text)
                // .to({ x: textPoint.x, y: textPoint.y }, 1000 * 0, createjs.Ease.linear)
                .to({ x: nodeReplica.visualConfig.x, y: nodeReplica.visualConfig.y }, 1000 / this.speedFn(), createjs.Ease.linear)),
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

    async draw(parent) {
        this._parent = parent;
        for (const nodeReplica of this.nodeReplicas) {
            await nodeReplica.draw(this.container);
        }
        parent.addChild(this.container);
    }

    reset() {
        if (!this._parent) return;
        this._parent.removeChild(this.container);
        this._initVisual();
    }
}

class ConsitentHashNodeReplica {
    constructor(node, position, visualConfig) {
        this.node = node;
        this.position = position;
        this.visualConfig = visualConfig;
        this.speedFn = visualConfig.speedFn;
        this._createVisual();
    }

    _createVisual() {
        const { x, y, radius } = this.visualConfig;
        const nodeName = this.node;

        this.container = new createjs.Container();
        const circle = new createjs.Shape();
        circle.graphics.beginFill(MD5(nodeName).toColor()).drawCircle(0, 0, radius);
        this.container.addChild(circle);

        const text = new createjs.Text(nodeName, `${radius}px Arial`);
        text.textAlign = 'center';
        text.textBaseline = 'middle';
        this.container.addChild(text);
    }

    async highlight() {
        await tweenPromise(createjs.Tween.get(this.container)
            .to({ scaleX: 1.5, scaleY: 1.5 }, 1000 / this.speedFn(), createjs.Ease.linear)
            .to({ scaleX: 1.0, scaleY: 1.0 }, 1000 / this.speedFn(), createjs.Ease.linear));
    }

    async draw(parent) {
        parent.addChild(this.container);
        const { x, y } = this.visualConfig;
        await tweenPromise(createjs.Tween.get(this.container).to({ x: x, y: y }, 1000 / this.speedFn(), createjs.Ease.circIn));
    }

    async undraw(parent) {
        await tweenPromise(createjs.Tween.get(this.container).to({ scaleX: 0, scaleY: 0 }, 1000 / this.speedFn(), createjs.Ease.linear));
        parent.removeChild(this.container);
    }
}

const bubleSort = async (items, options) => {
    for (let i = 0; i < items.length; i++) {
        items.trackIndex("end", () => items.length - i - 1);
        for (let j = 0; j < items.length - i - 1; j++) {
            items.trackIndex("j", () => j);
            items.trackIndex("j+1", () => j + 1);
            if (await items.compareAtIndex(j, j + 1) > 0) {
                await items.swap(j, j + 1);
            }
            await options.onStepCompleted();
        }
    }
}

const selectionSort = async (items, options) => {
    for (let i = 0; i < items.length - 1; i++) {
        items.trackIndex("i", () => i);
        let minValueIndex = i;
        items.trackIndex("min", () => minValueIndex);
        for (let j = i + 1; j < items.length; j++) {
            items.trackIndex("j", () => j);
            if (await items.compareAtIndex(minValueIndex, j) > 0) {
                minValueIndex = j;
            }
            await options.onStepCompleted();
        }
        await items.swap(i, minValueIndex);
    }
}

const randIntArray = (n, min, max) => {
    const nums = [];
    for (let i = 0; i < n; i++) {
        nums[i] = randomInteger(min, max);
    }
    return nums;
}

const randomInteger = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const createVisualArray = function (array, options) {
    const visualArray = new VisualArray(array, options);
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

const swap = (items, i, j) => {
    const temp = items[i];
    items[i] = items[j];
    items[j] = temp;
}

const tweenPromise = (tween) => {
    return new Promise((resolve) => tween.call(resolve));
}

/*
    array -> set, push, pop, shift, delete?
    rerender all or override methods? or render diff->how to track diff?
*/
class VisualArray {
    constructor(values, options) {
        this._originalValues = values || [];
        this.options = options || {};
        this.speedFn = this.options.speedFn || (() => 1);
        this.y = 0;
        this.elementDisplaySize = 50;
        this.indexTrackerDisplaySize = 30;

        this._initVisual();
    }

    _initVisual() {
        this.values = [...this._originalValues];
        this.container = new createjs.Container();
        this.elements = [];
        this.nextElementX = 0;
        for (let i = 0; i < this.values.length; i++) {
            const element = new ArrayElement(this.values[i], this.nextElementX, this.y, this.elementDisplaySize);
            this.elements.push(element);
            this.nextElementX += this.elementDisplaySize;
        }
        this.indexTrackers = {};
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
        const iPromise = tweenPromise(createjs.Tween.get(iContainer).to({ x: jPosX }, 1000 / this.speedFn(), createjs.Ease.linear));
        const jPromise = tweenPromise(createjs.Tween.get(jContainer).to({ x: iPosX }, 1000 / this.speedFn(), createjs.Ease.linear));
        swap(this.elements, i, j);
        await Promise.all([iPromise, jPromise]);
    }

    draw(parent) {
        this._parent = parent;
        for (const element of this.elements) {
            element.draw(this.container);
        }
        parent.addChild(this.container);
    }

    reset() {
        if (!this._parent) return;
        this._parent.removeChild(this.container);
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
            const text = new createjs.Text(name, `${this.indexTrackerDisplaySize / 1.5}px Arial`);
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

class ArrayElement {
    constructor(value, x, y, size) {
        this.container = new createjs.Container();
        this.container.x = x || 0;
        this.container.y = y || 0;
        this.size = size || 50;
        this.rectangle = new createjs.Shape();
        this.rectangleFillCommand = this.rectangle.graphics.beginFill("white").command;
        this.rectangle.graphics.beginStroke("black").drawRect(0, 0, this.size, this.size);
        this.textSize = (this.size / (1.5 * (value || '').toString().length));
        this.text = new createjs.Text(value, `${this.textSize}px Arial`);
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
