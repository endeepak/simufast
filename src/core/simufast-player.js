const { Stage } = require('@createjs/easeljs');
const { Ticker } = require('@createjs/tweenjs');

export class SimufastPlayer {
    constructor(options) {
        this._options = options || {};
        this._play = this._options.autoPlay || false;
        this._speed = this._options.speed || 1;
        this._maxWidth = this._options.maxWidth || 500;
        this._speedOptions = {
            '0.25x': 0.25,
            '0.5x': 0.5,
            'Normal': 1,
            '2x': 2,
            '3x': 3,
            '5x': 5,
            'Max': 99999,
        }
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
        this.updateStats();
    }

    _allowReplay() {
        this.log(this._experiment.name);
        this.pause();
        this._experiment.completed = true;
        this._playPauseButton.classList.replace('fa-play', 'fa-repeat');
    }

    _renderDOM() {
        const speedOptionsDom = Object.keys(this._speedOptions).map((name) => {
            return `<option value="${this._speedOptions[name]}" ${this._speedOptions[name] === this._speed ? 'selected' : ''}>${name}</option>`;
        }).join('\n');
        const showStats = this._options.showStats === false ? false : true;
        const statsExpanded = showStats && this._options.statsExpanded == true ? true : false;

        const dom = `
            <div class="simufast-player">
                <div class="last-log"></div>
                <canvas id="canvas"></canvas>
                <div class="control-bar">
                    <span class="speed">
                        <label>Speed:</label>
                        <select class="speed-select">
                            ${speedOptionsDom}
                        </select>
                    </span>
                    <span class="actions">
                        <button class="play-pause-button fa ${this._play ? 'fa-pause' : 'fa-play'}"></button>
                    </span>
                    <span class="progress">
                        <span class="progress-text"></span>
                    </span>
                </div>
                <div class="additional-info">
                    <a class="stats-link ${showStats ? 'open' : 'closed'} ${statsExpanded ? 'expanded' : 'collapsed'}" href="#">Stats</a>
                    <span class="attribution" >
                        <i class="fa fa-bolt"></i> by <a class="attribution-link" target="_new" href="https://github.com/endeepak/simufast">Simufast</a>
                    </span>
                    <div class="stats ${statsExpanded ? 'open' : 'closed'}"></div>
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
        this.width = Math.min(playerParentRect.width, this._maxWidth);
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

    updateStats() {
        const drawable = this._experiment.drawable;
        if (drawable.getStatsHTML) {
            this._statsLink.style.display = '';
            this._stats.innerHTML = drawable.getStatsHTML();
        } else {
            this._statsLink.style.display = 'none';
        }
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
            await this._pauseIfRequired();
        }
        this._allowReplay();
    }
}
