const $=s=>document.querySelector(s);
const feed=$("#feed"), picker=$("#videoPicker"), modalRoot=$("#modalRoot");
let videos=JSON.parse(localStorage.getItem("owitokVideos")||"[]");
let activeTab="home", settings=JSON.parse(localStorage.getItem("owitokSettings")||'{"dark":true,"notifications":true,"privacy":false,"dataSaver":false,"autoplay":true,"sound":true}');
const comments=JSON.parse(localStorage.getItem("owitokComments")||"{}");

function save(){localStorage.setItem("owitokVideos",JSON.stringify(videos));localStorage.setItem("owitokSettings",JSON.stringify(settings));localStorage.setItem("owitokComments",JSON.stringify(comments))}
function escape(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function seed(){if(!videos.length){videos=[];save()}}

function render(){
  feed.innerHTML="";
  const list=activeTab==="following"?videos.filter(v=>v.following):videos;
  $("#emptyState").classList.toggle("hidden",list.length>0);
  list.forEach(v=>{
    const card=document.createElement("article"); card.className="video-card"; card.dataset.id=v.id;
    card.innerHTML=`<video class="video" playsinline preload="metadata" ${settings.autoplay?"":"controls"}></video>
      <div class="shade"></div><button class="sound">${v.muted?"🔇":"🔊"}</button>
      <div class="video-info"><div class="username">@${escape(v.username||"owitok_user")}</div><div class="caption">${escape(v.caption||"My OwiTok video")}</div></div>
      <div class="actions">
        <button class="action like ${v.liked?"liked":""}"><span class="icon">♥</span><span>${v.likes||0}</span></button>
        <button class="action comments"><span class="icon">💬</span><span>${(comments[v.id]||[]).length}</span></button>
        <button class="action follow"><span class="icon">${v.following?"✓":"＋"}</span><span>${v.following?"Following":"Follow"}</span></button>
        <button class="action share"><span class="icon">↗</span><span>Share</span></button>
      </div><div class="heart-pop">♥</div>`;
    feed.appendChild(card);
    const video=card.querySelector("video");
    video.src=v.src; video.muted=v.muted!==false;
    video.addEventListener("click",()=>{if(video.paused) video.play().catch(()=>{}); else video.pause()});
    card.querySelector(".sound").onclick=e=>{e.stopPropagation();v.muted=!v.muted;video.muted=v.muted;e.currentTarget.textContent=v.muted?"🔇":"🔊";save();if(!v.muted)video.play().catch(()=>{})};
    card.querySelector(".like").onclick=e=>{e.stopPropagation();toggleLike(v,card)};
    card.querySelector(".comments").onclick=e=>{e.stopPropagation();openComments(v,card)};
    card.querySelector(".follow").onclick=e=>{e.stopPropagation();v.following=!v.following;save();render()};
    card.querySelector(".share").onclick=e=>{e.stopPropagation();shareVideo(v)};
    let lastTap=0;
    video.addEventListener("touchend",e=>{const now=Date.now();if(now-lastTap<320){e.preventDefault();toggleLike(v,card,true)}lastTap=now},{passive:false});
  });
  setupObserver();
}
function toggleLike(v,card,animate=false){v.liked=!v.liked;v.likes=Math.max(0,(v.likes||0)+(v.liked?1:-1));save();const b=card.querySelector(".like");b.classList.toggle("liked",v.liked);b.querySelector("span:last-child").textContent=v.likes;if(animate&&v.liked){const h=card.querySelector(".heart-pop");h.classList.remove("show");void h.offsetWidth;h.classList.add("show")}}
function setupObserver(){const obs=new IntersectionObserver(es=>es.forEach(e=>{const video=e.target;if(e.isIntersecting){video.play().catch(()=>{});}else video.pause()}),{threshold:.7});document.querySelectorAll(".video").forEach(v=>obs.observe(v))}
async function shareVideo(v){try{await navigator.share({title:"OwiTok",text:"Check out this OwiTok video"});}catch{}}
function openComments(v,card){
  const list=comments[v.id]||[]; modalRoot.innerHTML=`<div class="modal-backdrop"><div class="sheet"><button class="close">×</button><h2>Comments</h2><div class="comment-list">${list.length?list.map(c=>`<div class="comment"><b>@${escape(c.user)}</b><br>${escape(c.text)}</div>`).join(""):"<p>No comments yet.</p>"}</div><div class="comment-input"><input id="commentText" placeholder="Add a comment"><button id="sendComment" class="primary">Post</button></div></div></div>`;
  modalRoot.querySelector(".close").onclick=closeModal;modalRoot.querySelector(".modal-backdrop").onclick=e=>{if(e.target.classList.contains("modal-backdrop"))closeModal()};
  modalRoot.querySelector("#sendComment").onclick=()=>{const input=$("#commentText"),t=input.value.trim();if(!t)return;(comments[v.id]??=[]).push({user:"owitok_user",text:t});save();closeModal();render()};
}
function openSettings(){
 modalRoot.innerHTML=`<div class="modal-backdrop"><div class="sheet"><button class="close">×</button><h2>Settings and privacy</h2>
 ${settingRow("Account","Manage your OwiTok profile",false)}
 ${settingRow("Notifications","Likes, comments and follows",settings.notifications,"notifications")}
 ${settingRow("Privacy","Private-style local setting",settings.privacy,"privacy")}
 ${settingRow("Playback","Autoplay videos",settings.autoplay,"autoplay")}
 ${settingRow("Sound","Remember sound preference",settings.sound,"sound")}
 ${settingRow("Data Saver","Reduce video data use",settings.dataSaver,"dataSaver")}
 <div class="row"><span>Liked videos</span><button id="likedBtn">View</button></div>
 <div class="row"><span>Blocked accounts</span><button id="blockedBtn">Manage</button></div>
 <div class="row"><span>About OwiTok</span><span>v1.0</span></div>
 </div></div>`;
 modalRoot.querySelector(".close").onclick=closeModal;
 modalRoot.querySelectorAll("[data-setting]").forEach(b=>b.onclick=()=>{const k=b.dataset.setting;settings[k]=!settings[k];save();openSettings()});
}
function settingRow(title,sub,on,key){return `<div class="row"><div><b>${title}</b><div style="font-size:12px;color:#aaa">${sub}</div></div>${key?`<button class="switch ${on?"on":""}" data-setting="${key}" aria-label="${title}"></button>`:""}</div>`}
function closeModal(){modalRoot.innerHTML=""}
function openSearch(){modalRoot.innerHTML=`<div class="modal-backdrop"><div class="sheet"><button class="close">×</button><h2>Search</h2><input id="search" class="search-input" placeholder="Search OwiTok"><div id="results"></div></div></div>`;modalRoot.querySelector(".close").onclick=closeModal;$("#search").oninput=e=>{const q=e.target.value.toLowerCase();$("#results").innerHTML=videos.filter(v=>(v.username+" "+v.caption).toLowerCase().includes(q)).map(v=>`<div class="row"><span>@${escape(v.username)} — ${escape(v.caption)}</span></div>`).join("")}}
$("#uploadBtn").onclick=()=>picker.click();$("#emptyUpload").onclick=()=>picker.click();
picker.onchange=e=>{[...e.target.files].forEach(file=>{const url=URL.createObjectURL(file);videos.push({id:Date.now()+Math.random(),src:url,username:"owitok_user",caption:file.name,likes:0,liked:false,following:false,muted:true});});save();render();picker.value=""};
$("#settingsBtn").onclick=openSettings;$("#searchBtn").onclick=openSearch;
document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>{activeTab=b.dataset.tab;if(activeTab==="profile"){openProfile()}else if(activeTab==="inbox"){openInbox()}else{document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));b.classList.add("active");render()}});
function openProfile(){modalRoot.innerHTML=`<div class="modal-backdrop"><div class="sheet"><button class="close">×</button><h2>@owitok_user</h2><p>${videos.length} videos · ${videos.reduce((a,v)=>a+(v.likes||0),0)} likes</p><div class="row"><span>Settings</span><button id="pSettings">Open</button></div></div></div>`;modalRoot.querySelector(".close").onclick=closeModal;$("#pSettings").onclick=openSettings}
function openInbox(){modalRoot.innerHTML=`<div class="modal-backdrop"><div class="sheet"><button class="close">×</button><h2>Inbox</h2><p>No new notifications.</p></div></div>`;modalRoot.querySelector(".close").onclick=closeModal}
seed();render();
