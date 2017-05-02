class Simulator {
    createChart(elem, title) {
        let chart = new Chart(elem, {
            type: 'line',
            data: {
                datasets: [{
                    data: []
                }]
            },
            options: {
                title: {
                    display: true,
                    text: title
                },
                legend: {
                    display: false
                },
                responsive: false,
                scales: {
                    xAxes: [{
                        type: 'linear',
                        position: 'bottom',
                        ticks: {
                            suggestedMax: 10
                        },
                        gridLines: {
                            display: false
                        }
                    }],
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        },
                        gridLines: {
                            display: false
                        }
                    }]
                },
                elements: {
                    point: {
                        radius: 1
                    },
                    line: {
                        fill: false
                    }
                }
            }
        });
        return chart;
    }

    createCharts(specs) {
        let charts = [];
        let telemetryContainer = document.querySelector('.telemetry');
        for (let spec of specs) {
            let chartElem = document.createElement('canvas');
            chartElem.classList.add('telemetry-chart');
            chartElem.setAttribute('height', '200');
            chartElem.setAttribute('width', '300');
            telemetryContainer.appendChild(chartElem);
            charts.push({
                chart: this.createChart(chartElem, spec.title),
                value: spec.value
            });
        }
        return charts;
    }

    updateCharts(charts, c, time) {
        for (let chart of charts) {
            chart.chart.data.datasets[0].data.push({ x: time, y: chart.value(c) });
            chart.chart.update();
        }
    }

    setUpEditor() {
        let editor = document.querySelector('.editor-container textarea');
        fetch('landingprogram.js')
            .then((response) => response.text())
            .then((text) => editor.innerText = text);
    }

    setUpButtons() {
        let runButton = document.getElementById('run-button');
        runButton.onclick = () => this.resetLander();
    }

    setUpLander() {
        this.lander = new Lander(
            document.querySelector('.lander'),
            document.querySelector('.world'),
            new LandingProgram());

        this.lastFrameTime = this.startTime = (new Date()).getTime();
        this.landerInterval = window.setInterval(() => {
            let currentTime = (new Date()).getTime();
            let timeStep = currentTime - this.lastFrameTime;
            this.lastFrameTime = currentTime;
            if (!this.lander.stopSimulating) {
                this.lander.step(timeStep);
                this.updateCharts(this.charts, this.lander.c, (currentTime - this.startTime) / 1000);
            } else {
                window.clearInterval(this.landerInterval);
            }
        }, 33);
    }
    
    resetLander() {
        window.clearInterval(this.landerInterval);
        this.setUpLander();
    }
    
    constructor() {
        this.setUpEditor();
        this.setUpButtons();
        this.setUpLander();

        this.charts = this.createCharts([
            { title: 'Rotation (rad)', value: (c) => c.th },
            { title: 'Rotational Velocity (rad/s)', value: (c) => c.vth },
            { title: 'Rotational Acceleration (rad/s^2)', value: (c) => c.ath },
            { title: 'Rotational Acceleration to stop (rad/s^2)', value: (c) => c.rotAToStop },
            { title: 'Requested Throttle Position', value: (c) => c.requestedRcsThrottle },
            { title: 'Throttle Position', value: (c) => c.rcsThrottle },
            { title: 'Height (m)', value: (c) => c.y },
            { title: 'Velocity (m/s)', value: (c) => c.vy },
            { title: 'Acceleration (m/s^2)', value: (c) => c.exploded ? undefined: c.ay }
        ]);

    }
}

window.onload = () => {
    let simulator = new Simulator();
};