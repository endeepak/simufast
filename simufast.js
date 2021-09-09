/**
Backlog:
    - Speed control and play-pause handling for sorting
    - Simulate remove Node
    - Show cache hits
    - Change play button to restart after completion
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

        createjs.Ticker.framerate = 60;
        createjs.Ticker.addEventListener("tick", this._stage);

        this._playPauseButton.addEventListener('click', () => {
            if (this._play) {
                this._playPauseButton.classList.replace('fa-pause', 'fa-play');
            } else {
                this._playPauseButton.classList.replace('fa-play', 'fa-pause');
            }
            this._play = !this._play;
        });

        this._speedSelect.addEventListener('change', () => {
            this._speed = Number(this._speedSelect.value);
        });
    }

    _showSpinner() {
        this._spinner.style.display = '';
    }

    _hideSpinner() {
        this._spinner.style.display = 'none';
    }

    async experiment({ name, drawable, commands }) {
        this.log(name);
        drawable.draw(this._stage);
        const totalCommands = commands.length;
        while (commands.length > 0) {
            if (this._play) {
                const command = commands.shift();
                // this._showSpinner();
                await command();
                this.updateProgress({ total: totalCommands, completed: totalCommands - commands.length });
                // this._hideSpinner();
            } else {
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }
    }
}

async function consitentHashDemo1() {
    const randomWords = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Non odio euismod lacinia at quis risus sed vulputate. Ligula ullamcorper malesuada proin libero nunc consequat interdum. Sed id semper risus in hendrerit gravida rutrum quisque non. Enim eu turpis egestas pretium aenean pharetra magna ac. Scelerisque purus semper eget duis at. Vulputate odio ut enim blandit volutpat maecenas. Fames ac turpis egestas sed tempus urna et. Vitae tempus quam pellentesque nec nam. Lacus laoreet non curabitur gravida arcu. Risus viverra adipiscing at in tellus integer feugiat. Enim blandit volutpat maecenas volutpat blandit. Sit amet mattis vulputate enim nulla aliquet porttitor lacus luctus. Mattis aliquam faucibus purus in. Enim blandit volutpat maecenas volutpat blandit aliquam etiam erat".replaceAll('.', '').replaceAll(',', '').split(' ');
    const player = new SimufastPlayer();
    const chRing = new ConsitentHashRing({
        speedFn: () => player.getSpeed(),
        log: (text) => player.log(text)
    });
    const commands = [];
    for (let i = 1; i <= 4; i++) {
        commands.push(() => chRing.addNode(`N${i}`));
    }
    for (let word of randomWords) {
        commands.push(() => chRing.store(word, word));
    }
    await player.experiment({
        name: 'Consistent Hash',
        drawable: chRing,
        commands: commands
    });
    console.log(chRing.getNodeStats());
}

async function bubleSortDemo() {
    const player = new SimufastPlayer();
    const items = new createVisualArray(randIntArray(9, 10, 99));
    await player.experiment({
        name: 'Buble Sort',
        drawable: items,
        commands: [() => bubleSort(items)]
    });
}

async function selectionSortDemo() {
    const player = new SimufastPlayer();
    const items = new createVisualArray(randIntArray(9, 10, 99));
    await player.experiment({
        name: 'Selection Sort',
        drawable: items,
        commands: [() => selectionSort(items)]
    });
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
var MD5 = function (d) { var r = M(V(Y(X(d), 8 * d.length))); return r.toLowerCase() }; function M(d) { for (var _, m = "0123456789ABCDEF", f = "", r = 0; r < d.length; r++)_ = d.charCodeAt(r), f += m.charAt(_ >>> 4 & 15) + m.charAt(15 & _); return f } function X(d) { for (var _ = Array(d.length >> 2), m = 0; m < _.length; m++)_[m] = 0; for (m = 0; m < 8 * d.length; m += 8)_[m >> 5] |= (255 & d.charCodeAt(m / 8)) << m % 32; return _ } function V(d) { for (var _ = "", m = 0; m < 32 * d.length; m += 8)_ += String.fromCharCode(d[m >> 5] >>> m % 32 & 255); return _ } function Y(d, _) { d[_ >> 5] |= 128 << _ % 32, d[14 + (_ + 64 >>> 9 << 4)] = _; for (var m = 1732584193, f = -271733879, r = -1732584194, i = 271733878, n = 0; n < d.length; n += 16) { var h = m, t = f, g = r, e = i; f = md5_ii(f = md5_ii(f = md5_ii(f = md5_ii(f = md5_hh(f = md5_hh(f = md5_hh(f = md5_hh(f = md5_gg(f = md5_gg(f = md5_gg(f = md5_gg(f = md5_ff(f = md5_ff(f = md5_ff(f = md5_ff(f, r = md5_ff(r, i = md5_ff(i, m = md5_ff(m, f, r, i, d[n + 0], 7, -680876936), f, r, d[n + 1], 12, -389564586), m, f, d[n + 2], 17, 606105819), i, m, d[n + 3], 22, -1044525330), r = md5_ff(r, i = md5_ff(i, m = md5_ff(m, f, r, i, d[n + 4], 7, -176418897), f, r, d[n + 5], 12, 1200080426), m, f, d[n + 6], 17, -1473231341), i, m, d[n + 7], 22, -45705983), r = md5_ff(r, i = md5_ff(i, m = md5_ff(m, f, r, i, d[n + 8], 7, 1770035416), f, r, d[n + 9], 12, -1958414417), m, f, d[n + 10], 17, -42063), i, m, d[n + 11], 22, -1990404162), r = md5_ff(r, i = md5_ff(i, m = md5_ff(m, f, r, i, d[n + 12], 7, 1804603682), f, r, d[n + 13], 12, -40341101), m, f, d[n + 14], 17, -1502002290), i, m, d[n + 15], 22, 1236535329), r = md5_gg(r, i = md5_gg(i, m = md5_gg(m, f, r, i, d[n + 1], 5, -165796510), f, r, d[n + 6], 9, -1069501632), m, f, d[n + 11], 14, 643717713), i, m, d[n + 0], 20, -373897302), r = md5_gg(r, i = md5_gg(i, m = md5_gg(m, f, r, i, d[n + 5], 5, -701558691), f, r, d[n + 10], 9, 38016083), m, f, d[n + 15], 14, -660478335), i, m, d[n + 4], 20, -405537848), r = md5_gg(r, i = md5_gg(i, m = md5_gg(m, f, r, i, d[n + 9], 5, 568446438), f, r, d[n + 14], 9, -1019803690), m, f, d[n + 3], 14, -187363961), i, m, d[n + 8], 20, 1163531501), r = md5_gg(r, i = md5_gg(i, m = md5_gg(m, f, r, i, d[n + 13], 5, -1444681467), f, r, d[n + 2], 9, -51403784), m, f, d[n + 7], 14, 1735328473), i, m, d[n + 12], 20, -1926607734), r = md5_hh(r, i = md5_hh(i, m = md5_hh(m, f, r, i, d[n + 5], 4, -378558), f, r, d[n + 8], 11, -2022574463), m, f, d[n + 11], 16, 1839030562), i, m, d[n + 14], 23, -35309556), r = md5_hh(r, i = md5_hh(i, m = md5_hh(m, f, r, i, d[n + 1], 4, -1530992060), f, r, d[n + 4], 11, 1272893353), m, f, d[n + 7], 16, -155497632), i, m, d[n + 10], 23, -1094730640), r = md5_hh(r, i = md5_hh(i, m = md5_hh(m, f, r, i, d[n + 13], 4, 681279174), f, r, d[n + 0], 11, -358537222), m, f, d[n + 3], 16, -722521979), i, m, d[n + 6], 23, 76029189), r = md5_hh(r, i = md5_hh(i, m = md5_hh(m, f, r, i, d[n + 9], 4, -640364487), f, r, d[n + 12], 11, -421815835), m, f, d[n + 15], 16, 530742520), i, m, d[n + 2], 23, -995338651), r = md5_ii(r, i = md5_ii(i, m = md5_ii(m, f, r, i, d[n + 0], 6, -198630844), f, r, d[n + 7], 10, 1126891415), m, f, d[n + 14], 15, -1416354905), i, m, d[n + 5], 21, -57434055), r = md5_ii(r, i = md5_ii(i, m = md5_ii(m, f, r, i, d[n + 12], 6, 1700485571), f, r, d[n + 3], 10, -1894986606), m, f, d[n + 10], 15, -1051523), i, m, d[n + 1], 21, -2054922799), r = md5_ii(r, i = md5_ii(i, m = md5_ii(m, f, r, i, d[n + 8], 6, 1873313359), f, r, d[n + 15], 10, -30611744), m, f, d[n + 6], 15, -1560198380), i, m, d[n + 13], 21, 1309151649), r = md5_ii(r, i = md5_ii(i, m = md5_ii(m, f, r, i, d[n + 4], 6, -145523070), f, r, d[n + 11], 10, -1120210379), m, f, d[n + 2], 15, 718787259), i, m, d[n + 9], 21, -343485551), m = safe_add(m, h), f = safe_add(f, t), r = safe_add(r, g), i = safe_add(i, e) } return Array(m, f, r, i) } function md5_cmn(d, _, m, f, r, i) { return safe_add(bit_rol(safe_add(safe_add(_, d), safe_add(f, i)), r), m) } function md5_ff(d, _, m, f, r, i, n) { return md5_cmn(_ & m | ~_ & f, d, _, r, i, n) } function md5_gg(d, _, m, f, r, i, n) { return md5_cmn(_ & f | m & ~f, d, _, r, i, n) } function md5_hh(d, _, m, f, r, i, n) { return md5_cmn(_ ^ m ^ f, d, _, r, i, n) } function md5_ii(d, _, m, f, r, i, n) { return md5_cmn(m ^ (_ | ~f), d, _, r, i, n) } function safe_add(d, _) { var m = (65535 & d) + (65535 & _); return (d >> 16) + (_ >> 16) + (m >> 16) << 16 | 65535 & m } function bit_rol(d, _) { return d << _ | d >>> 32 - _ };

// https://stackoverflow.com/a/33647870/69362
const getHashCode = (string) => {
    if (string == null) return 0;
    var hash = 0, i = 0, len = string.length;
    while (i < len) {
        hash = ((hash << 5) - hash + string.charCodeAt(i++)) << 0;
    }
    return (hash + 2147483647) + 1; // return positive value
}

class ConsitentHashRing {
    constructor(options) {
        this.config = {
            maxSlots: 1000,
            nodeReplcationFactor: 16,
        };
        this.nodes = [];
        this.nodeReplicas = [];
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
        this.container = new createjs.Container();
        const ring = new createjs.Shape();
        ring.graphics.setStrokeStyle(4).beginStroke("#66a841").drawCircle(ringX, ringY, ringRadius);
        this.container.addChild(ring);
    }

    async addNode(nodeName) {
        this.log(`Adding node: ${nodeName}`)
        const node = new ConsitentHashNode(nodeName);
        this.nodes.push(node);
        const drawPromises = [];
        for (let replicaNum = 1; replicaNum <= this.config.nodeReplcationFactor; replicaNum++) {
            const replicaName = `${nodeName}-${replicaNum}`
            const position = this._getPosition(replicaName);
            const point = this._getCircumferencePointAtPosition(position);
            const nodeReplica = new ConsitentHashNodeReplica(node, position, {
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

    async store(key, value) {
        this.log(`Storing key: ${key}`);
        const position = this._getPosition(key);
        const nodeReplica = this._getNodeReplicaNextTo(position);
        nodeReplica.node.store(key, value);

        await this._visualiseStoringKey(key, position, nodeReplica);
    }

    async _visualiseStoringKey(key, position, nodeReplica) {
        const { ringX, ringY, ringRadius } = this.visualConfig;
        this.container.setChildIndex(nodeReplica.container, this.container.numChildren - 1);

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

    getNodeStats() {
        return this.nodes.map((node) => {
            return {
                nodeName: node.name,
                keysCount: node.getKeys().length
            }
        });
    }

    _getCircumferencePointAtPosition(position) {
        const { ringX, ringY, ringRadius } = this.visualConfig;
        const angleRadian = (position / this.config.maxSlots) * (2 * Math.PI);
        const x = ringX + ringRadius * Math.cos(angleRadian);
        const y = ringY + ringRadius * Math.sin(angleRadian);
        return { x, y };
    }

    async draw(parent) {
        for (const nodeReplica of this.nodeReplicas) {
            await nodeReplica.draw(this.container);
        }
        parent.addChild(this.container);
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
        const nodeName = this.node.name;

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
        const { x, y, radius } = this.visualConfig;
        await tweenPromise(createjs.Tween.get(this.container).to({ x: x, y: y }, 1000 / this.speedFn(), createjs.Ease.linear));
    }
}

class ConsitentHashNode {
    constructor(name) {
        this.name = name;
        this.storage = {};
    }

    _createVisual() {
        this.container = new createjs.Container();
    }

    store(key, value) {
        this.storage[key] = value;
    }

    getKeys() {
        return Object.keys(this.storage);
    }

    toString() {
        return this.name;
    }
}

const bubleSort = async (items) => {
    for (let i = 0; i < items.length; i++) {
        items.trackIndex("end", () => items.length - i - 1);
        for (let j = 0; j < items.length - i - 1; j++) {
            items.trackIndex("j", () => j);
            items.trackIndex("j+1", () => j + 1);
            if (await items.compareAtIndex(j, j + 1) > 0) {
                await items.swap(j, j + 1);
            }
        }
    }
}

const selectionSort = async (items) => {
    for (let i = 0; i < items.length - 1; i++) {
        items.trackIndex("i", () => i);
        let minValueIndex = i;
        items.trackIndex("min", () => minValueIndex);
        for (let j = i + 1; j < items.length; j++) {
            items.trackIndex("j", () => j);
            if (await items.compareAtIndex(minValueIndex, j) > 0) {
                minValueIndex = j;
            }
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

const createVisualArray = function (array) {
    const visualArray = new VisualArray(array);
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
    constructor(values) {
        this.values = values || [];
        this.container = new createjs.Container();
        this.y = 0;
        this.elementDisplaySize = 50;
        this.indexTrackerDisplaySize = 30;
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
            this.elements[i].highlight(),
            this.elements[j].highlight()
        ]);
        return this.values[i] - this.values[j];
    }

    async swap(i, j) {
        swap(this.values, i, j);
        const iContainer = this.elements[i].container;
        const jContainer = this.elements[j].container;
        const iPosX = iContainer.x;
        const jPosX = jContainer.x;
        const iPromise = tweenPromise(createjs.Tween.get(iContainer).to({ x: jPosX }, 1000, createjs.Ease.linear));
        const jPromise = tweenPromise(createjs.Tween.get(jContainer).to({ x: iPosX }, 1000, createjs.Ease.linear));
        swap(this.elements, i, j);
        await Promise.all([iPromise, jPromise]);
    }

    draw(parent) {
        for (const element of this.elements) {
            element.draw(this.container);
        }
        parent.addChild(this.container);
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

    async highlight() {
        return new Promise((resolve) => {
            var element = this;
            element._select();
            setTimeout(function () {
                element._deselect();
                resolve();
            }, 1000);
        });
    }

    _select() {
        this.rectangleFillCommand.style = "lightblue";
    }

    _deselect() {
        this.rectangleFillCommand.style = "white";
    }
}
