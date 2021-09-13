const { Stage } = require('@createjs/easeljs');
const { Ticker } = require('@createjs/tweenjs');

export class SimufastPlayer {
    constructor(options) {
        this._play = false;
        this._speed = 1;
        const defaultOptions = {
            canvasHeight: 500
        }
        this.options = {
            ...defaultOptions,
            ...options
        };
        this._renderDOM();
    }

    getSpeed() {
        return this._speed;
    }

    log(text) {
        this._lastLogText.innerHTML = text;
    }

    updateProgress(progress) {
        this._progressText.innerHTML = `Progress: ${progress.completed}/${progress.total}`;
    }

    _allowReplay() {
        this.log(this._experiment.name);
        this.pause();
        this._experiment.completed = true;
        this._playPauseButton.classList.replace('fa-play', 'fa-repeat');
    }

    _renderDOM() {
        const dom = `
            <div class="simufast-player">
                <div class="last-log"></div>
                <canvas id="canvas"></canvas>
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
                <div class="additional-info">
                    <a class="stats-link collapsed" href="#">Stats</a>
                    <span class="attribution" >
                        <i class="fa fa-bolt"></i> by <a class="attribution-link" target="_new" href="https://github.com/endeepak/simufast">Simufast</a>
                    </span>
                    <div class="stats closed">No stats yet</div>
                </div>
            </div>
        `;

        document.write(dom);
        const player = document.querySelector('.simufast-player:last-child');

        this._progressText = player.getElementsByClassName('progress-text')[0];
        this._lastLogText = player.getElementsByClassName('last-log')[0];
        this._canvas = player.getElementsByTagName("canvas")[0];
        this._stage = new Stage(this._canvas);
        this._playPauseButton = player.getElementsByClassName('play-pause-button')[0];
        this._spinner = player.getElementsByClassName('spinner')[0];
        this._speedSelect = player.getElementsByClassName('speed-select')[0];
        this._statsLink = player.getElementsByClassName('stats-link')[0];
        this._stats = player.getElementsByClassName('stats')[0];

        const playerParentRect = player.parentElement.getBoundingClientRect();
        this.width = Math.min(playerParentRect.width, 500);
        player.style.width = `${this.width}px`;
        this._canvas.width = this.width;

        Ticker.framerate = 60;
        Ticker.addEventListener("tick", this._stage);

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

                this._statsLink.classList.add('expanded');
                this._statsLink.classList.remove('collapsed');
            } else {
                this._stats.classList.remove('open');
                this._stats.classList.add('closed');

                this._statsLink.classList.add('collapsed');
                this._statsLink.classList.remove('expanded');
            }
        })
    }

    updateStats(statsHTML) {
        this._stats.innerHTML = statsHTML;
    }

    getStage() {
        return this._stage;
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
        const totalCommands = commands.length;
        this.updateProgress({ total: totalCommands, completed: 0 });
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
