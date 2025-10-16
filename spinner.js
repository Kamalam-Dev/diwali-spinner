const wheel = document.getElementById("wheel");
const spinButton = document.getElementById("spinButton");
const canvas = document.getElementById("confettiCanvas");
const ctx = canvas.getContext("2d");
const diyaCanvas = document.getElementById("diya");
const dCtx = diyaCanvas.getContext("2d");
const allResults = document.getElementById("allResults");

const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbzcaOaLMYx0oS54UzCCur0fuLPkIyARW0m0DKa08agUtJxf5hh5TmC2i8BDdZQnuKs/exec";

const teams = ["Team-Lakshmi Vedi", "Team-Bijili", "Team-Kuruvi Vedi", "Team-Atom Bomb"];
const colors = ["#ff4d4d", "#ffd11a", "#ff9933", "#ff66ff", "#66ff66", "#ff1a1a", "#ffcc66", "#ff66cc"];
const numSegments = teams.length;

function resizeCanvas(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const size = document.getElementById("wheelContainer").clientWidth;
    diyaCanvas.width = size * 0.15;
    diyaCanvas.height = size * 0.1;
}
resizeCanvas();

function drawDiya(){
    dCtx.clearRect(0,0,diyaCanvas.width,diyaCanvas.height);
    dCtx.fillStyle="#ff9900";
    dCtx.beginPath();
    dCtx.moveTo(5,diyaCanvas.height*0.75);
    dCtx.quadraticCurveTo(diyaCanvas.width/2,diyaCanvas.height,diyaCanvas.width-5,diyaCanvas.height*0.75);
    dCtx.closePath(); dCtx.fill();
    const flameHeight=diyaCanvas.height*0.35 + Math.random()*5;
    const flameWidth=diyaCanvas.width*0.1;
    const flameX=diyaCanvas.width/2;
    const flameY=diyaCanvas.height*0.25;
    dCtx.fillStyle="yellow";
    dCtx.beginPath();
    dCtx.ellipse(flameX,flameY,flameWidth,flameHeight,0,0,2*Math.PI);
    dCtx.fill();
}
setInterval(drawDiya,150);

// --- CREATE WHEEL SEGMENTS WITH DYNAMIC FONT SIZING ---
for (let i = 0; i < numSegments; i++) {
    const seg = document.createElement("div");
    seg.classList.add("segment");
    seg.style.background = colors[i % colors.length];
    const angle = (360 / numSegments) * i;
    seg.style.transform = `rotate(${angle}deg) skewY(${90 - 360 / numSegments}deg)`;

    const label = document.createElement("span");
    label.innerText = teams[i];
    seg.appendChild(label);
    wheel.appendChild(seg);

    // --- DYNAMIC FONT SIZING ---
    const wheelRadius = wheel.offsetWidth / 2;
    const sliceAngle = 360 / numSegments;
    const arcLength = 2 * Math.PI * wheelRadius * (sliceAngle / 360) * 0.9; // 90% of arc
    let fontSize = Math.min(28, arcLength / label.innerText.length); // max 28px
    fontSize = Math.max(fontSize, 12); // min 12px
    label.style.fontSize = fontSize + "px";

    label.style.transform = `rotate(${sliceAngle / 2}deg) translateY(-50%)`;
}

let spinning = false;
let currentRotation = 0;
const confettiParticles = [];

function launchConfetti(){
    const confColors=["#ffcc33","#ff3300","#ff66ff","#ff9900","#ffcc66"];
    for(let i=0;i<120;i++){
        confettiParticles.push({
            x: Math.random()*canvas.width,
            y: Math.random()*canvas.height - canvas.height,
            r: Math.random()*5+2,
            d: Math.random()*10+5,
            color: confColors[Math.floor(Math.random()*confColors.length)],
            tilt: Math.random()*10-10,
            tiltAngleIncrement: Math.random()*0.05+0.02,
            type: Math.random()<0.3?'spark':'circle'
        });
    }
    requestAnimationFrame(drawConfetti);
}

function drawConfetti(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let i=0;i<confettiParticles.length;i++){
        const p = confettiParticles[i];
        ctx.beginPath();
        ctx.fillStyle = p.color; ctx.strokeStyle = p.color;
        if(p.type === 'circle'){ ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); }
        else{ ctx.lineWidth=p.r/2; ctx.moveTo(p.x+p.tilt,p.y); ctx.lineTo(p.x+p.tilt+p.r*2,p.y+p.r*2); ctx.stroke(); }
        p.y += (Math.cos(p.d)+2+p.r/2)/2; p.tilt += p.tiltAngleIncrement;
        if(p.y > canvas.height){ confettiParticles.splice(i,1); i--; }
    }
    if(confettiParticles.length>0) requestAnimationFrame(drawConfetti);
}

function logToSheet(name, team) {
  fetch(GOOGLE_SHEET_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, team })
  })
  .then(() => console.log(`Logged spin for ${name} → ${team}`))
  .catch(err => console.error("Sheet logging error:", err));
}

spinButton.addEventListener("click",()=>{
    const name = document.getElementById("name").value.trim();
    if(!name){ alert("Enter your name!"); return; }
    if(spinning) return;
    spinning = true; document.getElementById("result").innerText = "Spinning... 🎆";
    const extraRotation = Math.floor(Math.random()*360);
    currentRotation += 360*6 + extraRotation;
    wheel.style.transition = "transform 3s cubic-bezier(0.25,1,0.5,1)";
    wheel.style.transform = `rotate(${currentRotation}deg)`;
    wheel.addEventListener("transitionend", function handler(){
        wheel.style.transition = "none"; currentRotation = currentRotation % 360; wheel.style.transform = `rotate(${currentRotation}deg)`;
        wheel.removeEventListener("transitionend",handler);
        const degreesPerSegment = 360/numSegments;
        const selectedIndex = Math.floor(((360-currentRotation+degreesPerSegment/2)%360)/degreesPerSegment);
        const teamName = teams[selectedIndex];
        document.getElementById("result").innerHTML = `🎉 ${name}, you’ve been assigned to <b>${teamName}</b>!`;
        document.querySelectorAll(".segment span").forEach((s,i)=>s.classList.remove("pop"));
        document.querySelectorAll(".segment span")[selectedIndex].classList.add("pop");
        const li = document.createElement("li"); li.innerHTML = `${name} → <b>${teamName}</b>`; allResults.appendChild(li);
        logToSheet(name,teamName);
        document.getElementById("name").value = ""; document.getElementById("name").focus();
        spinning=false; launchConfetti();
    });
});

window.addEventListener('resize',()=>{resizeCanvas();});
