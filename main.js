let isMobile = window.matchMedia("only screen and (max-width: 760px)").matches;
let input, button, backdrop
let leaderboard = []
let leaderboardDOM = null
let textContent = isMobile ? 'Touch to jump' : 'Press SPACE to jump'

const TOP_N = 10

let theme = 'light'

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
        backdrop.style.display = "none"
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
    backdrop = document.querySelector('.backdrop')
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
    renderHighlights()
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
    backdrop.style.display = "block"
    overlay.id = "overlay"
    overlay.classList.add("overlay")

    document.body.appendChild(overlay)
    let readme = await fetch(`https://raw.githubusercontent.com/fredericocurti/${repo.name}/master/README.md`)
    readme = await readme.text()
    overlay.innerHTML = marked.default(readme).replace(/src='(?:[^'\/]*\/)*([^']+)'/g, `src='https://github.com/fredericocurti/${repo.name}/raw/master/$1'`);
    overlay.style.opacity = 1
}

const renderHighlights = () => {
  const data = [{
    repo: `https://github.com/Face2Face-Py/face2face`,
    label: 'Adventure Machine VR',
    gif: `https://github.com/fredericocurti/cse165-adventuremachinevr/raw/master/demo.gif`,
    description: `VR game to make beats on a bedroom music studio`
  },{
    repo: `https://github.com/Face2Face-Py/face2face`,
    label: 'face2face',
    gif: `https://i.ibb.co/cYpvD1L/download.gif`,
    description: `Navigate Facebook with hands and facial expressions`
  },
  {
    repo: `https://github.com/fredericocurti/streamaster`,
    label: 'Streamaster',
    gif: `https://github.com/fredericocurti/streamaster/blob/master/thumb.gif?raw=true`,
    description: `Play songs from Spotify, SoundCloud and YouTube`
  }, {
    repo: `https://github.com/Face2Face-Py/face2face`,
    label: 'Asymmetric Climb',
    gif: `https://i.ibb.co/FDDTCd3/thumb.gif`,
    description: `Climb on VR while PC player tries to stop you`
  },{
    repo: `https://github.com/fredericocurti/magneto`,
    label: 'Magneto',
    gif: `https://raw.githubusercontent.com/fredericocurti/magneto/master/thumb.gif`,
    description: `Stream torrents straight from magnet links into VLC`
  },{
    repo: `https://github.com/Face2Face-Py/face2face`,
    label: 'Night Shift Slider',
    gif: `https://github.com/fredericocurti/night-shift-slider/raw/master/demo.gif`,
    description: `Quickly adjust night shift intensity on macOS`
  }]

  const cont = document.querySelector(".highlight-container")
  cont.innerHTML = data.map(d => `
    <div class="highlight-item">
      <div class="highlight-card" onmouseenter="pushRepos()" onmouseleave="pullRepos()">
        <img class="highlight-img" src="${d.gif}"/>
        <div class="highlight-label">${d.label}</div>
      </div>
      <div class="highlight-description">${d.description}</div>
    </div>`).join('')
}

const cont = document.querySelectorAll(".pushable")

const pushRepos = () => {
  cont.forEach(d => d.style.transform = "translateY(-25px)")
}

const pullRepos = () => {
  cont.forEach(d => d.style.transform = "translateY(-100px)")
}