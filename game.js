
let charJumpImg, charImg, charFadeImg, cloudImgs, hero
let score = 0
let lineShrink = 0
let gameRunning = true
let spikes = []
let clouds = []
let stars = []

const N_SPIKES = 1
const N_CLOUDS = isMobile ? 1 : 2
const N_STARS = 25
const H = 240
const HERO_JUMP_SPEED = 3.5


function preload() {
    charImg = loadImage('assets/running.gif')
    charJumpImg = loadImage('assets/jumping.gif')
    charFadeImg = loadImage('assets/fading.gif')
    cloudImgs = [loadImage('assets/cloud1.png')]
}

function setup() {
    const canvas = createCanvas(window.innerWidth, H)
    canvas.parent('canvas-container')
    background(255);

    let context = canvas.elt.getContext('2d')
    context.mozImageSmoothingEnabled = false
    context.webkitImageSmoothingEnabled = false
    context.msImageSmoothingEnabled = false
    context.imageSmoothingEnabled = false

    hero = new Hero();

    for (let i = 0; i < N_SPIKES; i++) {
        spikes.push(new Spike(i))
    }

    for (let i = 0; i < N_CLOUDS; i++) {
        clouds.push(new Cloud(i, cloudImgs[i % cloudImgs.length]))
    }

    for (var i = 0; i < N_STARS; i++) {
        stars[i] = new Star();
    }

    charImg.resize(64, 64)
    charJumpImg.resize(64, 64)
    charFadeImg.resize(64, 64)
    charFadeImg.gifProperties.loopLimit = 1
    charFadeImg.gifProperties.playing = false
    charFadeImg.gifProperties.displayIndex = 1
}

function Star() {
    this.x = random(width);
    this.y = random(height - 20);
    this.size = random(0.25, 3);
    this.t = random(TAU)
    this.vx = 0.025;

    this.draw = () => {
        this.t += 0.05
        this.x -= this.vx
        var scale = this.size + sin(this.t)
        noStroke()
        ellipse(this.x - this.vx, this.y, scale, scale)
        if (this.x < 0) {
            this.x = windowWidth
        }
    }
}

function Hero() {
    this.y = 0;
    this.x = 10;
    this.ySpeed = 0;
    this.OFFSET = 64
    this.fadeCounter = 1;
    const gravity = 0.13;

    this.update = () => {
        this.ySpeed = this.ySpeed - gravity

        this.y = this.y + this.ySpeed - gravity

        if (this.y < 0) {
            this.y = 0
        }

        if (this.y > 5 && gameRunning) {
            image(charJumpImg, this.x, H - this.OFFSET - this.y)
        } else if (gameRunning) {
            image(charImg, this.x, H - this.OFFSET - this.y)
        } else {
            image(charFadeImg, this.x, H - this.OFFSET - this.y)
        }

        charImg.gifProperties.playing = gameRunning
    }
}

function Cloud(index, img) {
    this.xSpeed = -0.25
    this.x = windowWidth - index * (windowWidth / 2)
    this.y = random() * -60
    const sprite = img

    this.update = () => {
        image(sprite, this.x, this.y)
        this.x += this.xSpeed
        if (this.x < -300) {
            this.x = windowWidth + 240
            this.y = random() * -80
        }
    }
}

function onGameOver() {
    charFadeImg.gifProperties.playing = true
    charFadeImg.gifProperties.displayIndex = 2
    const greetingsHeader = document.querySelector(".greetings-container")
    gameRunning = false
    lineShrink = 10
    trophyButton.style.opacity = 0.7

    if (isMobile) {
        greetingsHeader.style.transform = "translateY(20px)"
    }
}

function Spike(index) {
    this.x = window.innerWidth + index * 50
    this.xSpeed = 3
    this.h = 40
    this.height = 20
    this.hitbox = [0, 0]

    this.update = () => {
        this.hitbox = [this.x + 100, this.height]
        const x = this.x
        this.x -= this.xSpeed
        this.xSpeed += 0.001
        triangle(x + 90, H, x + 100, H - this.height, x + 110, H)
        fill(0)
        if (this.x < -100 && gameRunning) {
            this.x = window.innerWidth + index * 50
            score++
            textContent = `SCORE ${score}`
        }
    }
}

function draw() {
    clear()
    stroke(1)

    if (gameRunning === false) {
        lineShrink += 0.05 * lineShrink
    }

    let lineShrinkDist = width - 2 * lineShrink

    if (lineShrinkDist > 0) {
        line(0 + lineShrink, H, window.innerWidth - lineShrink, H)
    }

    noStroke()

    if (theme === 'dark') {
        for (let i = 0; i < stars.length; i++) {
            stars[i].draw()
        }
    }

    for (let i = 0; i < N_CLOUDS; i++) {
        clouds[i].update()
    }

    text(textContent, 20, 50)

    /** Detect collision */
    for (let i = 0; i < N_SPIKES; i++) {
        spikes[i].update()
        const [x, y] = spikes[i].hitbox
        if (hero.y <= y && hero.x + 32 > x - 3 && hero.x + 32 < x + 3) {
            if (gameRunning === true) {
                onGameOver()
            }
        }
    }

    /** Show leaderboard */
    if (gameRunning === false) {
        textContent = `SCORE ${score}\n`
    }

    hero.update()
}

function keyPressed() {
    if (keyCode === 32 && hero.y === 0 && gameRunning) {
        hero.ySpeed = HERO_JUMP_SPEED
        textContent = `SCORE ${score}`
    }

    if (gameRunning === false && keyCode === 13) {
        onSubmitScore()
    }
}


function mousePressed(event) {
    if (hero.y === 0 && gameRunning && isMobile) {
        hero.ySpeed = HERO_JUMP_SPEED
        textContent = `SCORE ${score}`
    }
}

function windowResized() {
    resizeCanvas(windowWidth, H, true);
    isMobile = window.matchMedia("only screen and (max-width: 760px)").matches;
}