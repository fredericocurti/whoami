let isMobile = window.matchMedia("only screen and (max-width: 760px)").matches;

const N_SPIKES = 1
const N_CLOUDS = isMobile ? 1 : 2
const H = 240
const HERO_JUMP_SPEED = 3.5
let input, button

let score = 0
let charImg
let charJumpImg
let charFadeImg
let cloudImgs
let hero
let spikes = []
let clouds = []
let textContent = isMobile ? 'Touch to jump' : 'Press SPACE to jump' 
let gameRunning = true
let LEADERBOARD = []



// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyDPqjdeGUwoPQn-ttTTOzCs_vbDTW3LVGE",
    authDomain: "whoami-fredericocurti.firebaseapp.com",
    databaseURL: "https://whoami-fredericocurti.firebaseio.com",
    projectId: "whoami-fredericocurti",
    storageBucket: "whoami-fredericocurti.appspot.com",
    messagingSenderId: "861172314741",
    appId: "1:861172314741:web:5bf9afeeb08d3cb2167e3c",
    measurementId: "G-Y8MC73CZ1C"
}

firebase.initializeApp(firebaseConfig)
firebase.analytics()

const dbRef = firebase.database().ref('leaderboard')

dbRef.orderByChild('score').limitToLast(5).on('child_added', snap => {
    LEADERBOARD = [...LEADERBOARD, snap.val()].sort((a, b) => a.score > b.score ? -1 : 1).slice(0, 5)
})

function onClickSubmit() {
    const name = input.value();
    if (name.length < 2) {
        alert("Name must have at least 2 characters")
        return
    }
    dbRef.push({ name: name.slice(0, 18), score })
    input.position(-200, -200)
    button.position(-200, -200)
}

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

    input = createInput()
    input.elt.style.zIndex = 2
    input.elt.style.width = 100
    input.position(-200, 150)
    button = createButton('SUBMIT')
    button.elt.style.zIndex = 2
    button.position(-200, 150)
    button.mousePressed(onClickSubmit)
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

    charImg.resize(64, 64)
    charJumpImg.resize(64, 64)
    charFadeImg.resize(64, 64)
    charFadeImg.gifProperties.loopLimit = 1
    charFadeImg.gifProperties.playing = false
    charFadeImg.gifProperties.displayIndex = 1
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

    if (isMobile) {
        greetingsHeader.style.transform = "translateY(20px)"
    }
    
    if (isMobile === false) {
        input.position(20, 160)
        button.position(120, 160)    
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

    line(0, H, window.innerWidth, H)
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

    /** Show leaderboards */
    if (gameRunning === false) {
        textContent = `GAME OVER - SCORE ${score}\n`
        if (isMobile === false) {
            textStyle(BOLD)
            text('LEADERBOARD (TOP 5)', 20, 80)
            textStyle(NORMAL)

            LEADERBOARD.forEach((u, i) => {
                text(`${u.name.toUpperCase()} : ${u.score}`, 20, 80 + (i + 1) * 15)
            })

        }

    }

    hero.update()
}

function keyPressed() {
    if (keyCode === 32 && hero.y === 0 && gameRunning) {
        hero.ySpeed = HERO_JUMP_SPEED
        textContent = `SCORE ${score}`
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