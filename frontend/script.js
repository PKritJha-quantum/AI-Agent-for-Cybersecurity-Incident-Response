const API = "http://localhost:5000";

const promptInput = document.getElementById("promptInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const clearBtn = document.getElementById("clearBtn");

const responseFeed = document.getElementById("responseFeed");

const statusBadge = document.getElementById("statusBadge");
const statusLabel = document.getElementById("statusLabel");

const sessionId = document.getElementById("sessionId");

const statQueries = document.getElementById("statQueries");
const statAvgTime = document.getElementById("statAvgTime");
const statUptime = document.getElementById("statUptime");

const loadingBar = document.getElementById("loadingBar");

const charCount = document.getElementById("charCount");

const threatFill = document.getElementById("threatFill");
const threatLabel = document.getElementById("threatLabel");

let queries = 0;
let totalTime = 0;
const startTime = Date.now();

sessionId.textContent = Math.random().toString(36).substring(2,8).toUpperCase();

function addCard(title,text){

    const div=document.createElement("div");

    div.className="response-card";

    div.innerHTML=`
        <h3>${title}</h3>
        <p>${text}</p>
    `;

    responseFeed.appendChild(div);

    responseFeed.scrollTop=responseFeed.scrollHeight;

}

async function checkBackend(){

    try{

        const res=await fetch(API+"/api/status");

        if(!res.ok) throw new Error();

        statusLabel.textContent="Backend Online";

        statusBadge.classList.add("is-online");

    }

    catch{

        statusLabel.textContent="Offline";

        statusBadge.classList.remove("is-online");

    }

}

checkBackend();

setInterval(checkBackend,30000);

function updateUptime(){

    let sec=Math.floor((Date.now()-startTime)/1000);

    let h=String(Math.floor(sec/3600)).padStart(2,"0");

    let m=String(Math.floor(sec%3600/60)).padStart(2,"0");

    let s=String(sec%60).padStart(2,"0");

    statUptime.textContent=`${h}:${m}:${s}`;

}

setInterval(updateUptime,1000);

promptInput.addEventListener("input",()=>{

    charCount.textContent=`${promptInput.value.length} / 4000`;

});

analyzeBtn.addEventListener("click",analyzeIncident);

promptInput.addEventListener("keydown",(e)=>{

    if(e.key==="Enter" && !e.shiftKey){

        e.preventDefault();

        analyzeIncident();

    }

});

async function analyzeIncident(){

    const text=promptInput.value.trim();

    if(text==="") return;

    loadingBar.style.display="block";

    const start=performance.now();

    try{

        const res=await fetch(API+"/api/incident",{

            method:"POST",

            headers:{

                "Content-Type":"application/json"

            },

            body:JSON.stringify({

                description:text

            })

        });

        const data=await res.json();

        const time=Math.round(performance.now()-start);

        queries++;

        totalTime+=time;

        statQueries.textContent=queries;

        statAvgTime.textContent=Math.round(totalTime/queries)+" ms";

        addCard("You",text);

        addCard("Server",JSON.stringify(data,null,2));

        threatFill.style.width="40%";

        threatLabel.textContent="LOW";

    }

    catch(err){

        addCard("Error","Cannot connect to backend.");

    }

    loadingBar.style.display="none";

    promptInput.value="";

    charCount.textContent="0 / 4000";

}

clearBtn.addEventListener("click",()=>{

    responseFeed.innerHTML="";

    queries=0;

    totalTime=0;

    statQueries.textContent="0";

    statAvgTime.textContent="—";

});

document.querySelectorAll(".quick-btn").forEach(btn=>{

    btn.onclick=()=>{

        promptInput.value=btn.dataset.prompt;

        charCount.textContent=`${promptInput.value.length} / 4000`;

        promptInput.focus();

    };

});
