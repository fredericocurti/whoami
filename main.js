let isMobile = window.matchMedia("only screen and (max-width: 760px)").matches;

const N_SPIKES = 1
const N_CLOUDS = isMobile ? 1 : 2
const N_STARS = 25
const TOP_N = 10
const H = 240
const HERO_JUMP_SPEED = 3.5

let input, button
let score = 0

let charJumpImg, charImg, charFadeImg, cloudImgs
let hero
let spikes = []
let clouds = []
let stars = []
let leaderboard = []
let leaderboardDOM = null
let textContent = isMobile ? 'Touch to jump' : 'Press SPACE to jump'
let gameRunning = true
let theme = 'light'
let lineShrink = 0
let showLeaderboards = false
let trophyButton
let selectedProject = null
let repos = []
let modalOpen = false

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

dbRef.orderByChild('score').limitToLast(TOP_N).on('child_added', snap => {
    leaderboard = [...leaderboard, snap.val()].sort((a, b) => a.score > b.score ? -1 : 1).slice(0, TOP_N)
    leaderboardDOM.innerHTML = `<b>Leaderboard</b><table>` + leaderboard
        .map(u => `<tr><td>${u.name.toUpperCase()}</td><td>${u.score}</td></tr>`).toString()
        .replace(/,/g, "")
    leaderboardDOM.innerHTML += `</table><br>
    <form onsubmit="onSubmitScore()" action="#">
        <input type="text" id="leaderboard-name" placeholder="YOUR NAME">
        <input type="submit" style="display: none">
    </form>
    `
})

document.body.addEventListener('click', (ev) => {
    const path = Array.from(ev.composedPath())
    showLeaderboards = false
    path.forEach(el => {
        if (el.id === 'leaderboard' || el.id === "trophy-button") {
            showLeaderboards = true
        }
    })
    leaderboardDOM.style.transform = `translateX(${showLeaderboards ? '0px' : '-500px'})`

    if (modalOpen && path.every(item => item.id !== "overlay")) {
        selectedProject.classList.remove("selected")
        modalOpen = false
        selectedProject = null
        document.querySelector("#overlay").remove()
        return
    }

    if (ev.target.classList.contains("selected")) {
        modalOpen = true
    }
})

window.addEventListener('keydown', (e) => {
    if (e.keyCode == 32 && e.target == document.body) {
        e.preventDefault();
    }
})

document.addEventListener("DOMContentLoaded", (event) => {
    const scDOM = document.querySelector("#sc")
    leaderboardDOM = document.querySelector('#leaderboard')
    trophyButton = document.querySelector("#trophy-button")
    const dmButton = document.querySelector("#dm-button")

    let defaultTheme = 'light'
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        defaultTheme = 'dark'
    }

    theme = localStorage.getItem('theme') || defaultTheme
    scDOM.className = theme
    document.documentElement.setAttribute('data-theme', theme)

    trophyButton.addEventListener('click', (ev) => {
        showLeaderboards = true
        leaderboardDOM.style.transform = `translateX(${showLeaderboards ? '0px' : '-500px'})`
    })

    dmButton.addEventListener('click', (ev) => {
        theme = localStorage.getItem('theme') || defaultTheme
        localStorage.setItem('theme', theme === 'light' ? 'dark' : 'light')
        theme = localStorage.getItem('theme')
        document.documentElement.setAttribute('data-theme', theme)
        scDOM.className = theme
    })

    renderRepos()
})

function onSubmitScore() {
    input = document.querySelector("#leaderboard-name")
    const name = input.value
    if (name.length < 2) {
        alert("Name must have at least 2 characters")
        return
    }
    dbRef.push({ name: name.slice(0, 18), score })
    input.style.display = 'none'
    return false
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

const renderRepos = async () => {
    const projectsContainer = document.querySelector('.projects-container')
    try {
        repos = await fetch("https://api.github.com/users/fredericocurti/repos")
        if (repos.status !== 200) {
            throw new Error(`failed to get repos`)
        }
        repos = await repos.json()
        localStorage.setItem('repos', JSON.stringify(repos))
    } catch (err) {
        repos = JSON.parse(localStorage.getItem('repos'))
    }

    repos.forEach((r, i) => {
        setTimeout(() => {
            const el = document.createElement('span')
            el.classList.add('projects-item')
            el.innerHTML= r.name
            el.onclick = () => onClickRepo(r.id)
            el.id = `p-${r.id}`
            el.style.opacity = 0
            projectsContainer.appendChild(el)
            setTimeout(() => {
                el.style.opacity = 0.85
            }, 50)
        }, Math.sqrt(i) * 300)
    })

    // projectsContainer.innerHTML = repos.map(p => ).join().replace(/,/g, "")
}

const onClickRepo = async (id) => {
    if (selectedProject || modalOpen) {
        return
    }
    
    selectedProject = document.querySelector(`#p-${id}`)
    selectedProject.classList.add("selected")
    const overlay = document.createElement('div')
    const repo = repos.find(r => r.id === id)
    overlay.id = "overlay"
    overlay.classList.add("overlay")

    document.body.appendChild(overlay)
    let README = await fetch(`https://raw.githubusercontent.com/fredericocurti/${repo.name}/master/README.md`)
    
    README = await README.text()
    overlay.innerHTML = marked(README).replace(/src='(?:[^'\/]*\/)*([^']+)'/g, `src='https://github.com/fredericocurti/${repo.name}/raw/master/$1'`);
    overlay.style.opacity = 1
}
