const $=id=>document.getElementById(id);
const audio=$("radioAudio"), playBtn=$("playBtn"), statusText=$("playerStatus"), player=$("playBtn").closest(".player");
const STREAM="/api/stream";
let deferredInstall=null, newsCache=[], scheduleCache=[];
function setStatus(t){statusText.textContent=t}
function setPlaying(on){playBtn.textContent=on?"Ⅱ":"▶";playBtn.setAttribute("aria-label",on?"Pausar":"Reproducir");player.classList.toggle("playing",on)}
async function playRadio(){
  if(!audio.src) audio.src=STREAM;
  try{await audio.play();setPlaying(true);setStatus("Conectado · MONACO FM 98.7")}
  catch(e){setPlaying(false);setStatus("No se pudo conectar. Verificá tu conexión e intentá nuevamente.")}
}
playBtn.addEventListener("click",()=>{if(!audio.paused)audio.pause();else playRadio()});
audio.addEventListener("playing",()=>{setPlaying(true);setStatus("Transmitiendo en vivo")});
audio.addEventListener("pause",()=>setPlaying(false));
audio.addEventListener("waiting",()=>setStatus("Conectando con la transmisión…"));
audio.addEventListener("stalled",()=>setStatus("La señal está demorando. Esperando transmisión…"));
audio.addEventListener("error",()=>{setPlaying(false);setStatus("Señal no disponible. Tocá reproducir para reintentar.")});
$("menuToggle").addEventListener("click",()=>$("mainNav").classList.toggle("show"));
document.querySelectorAll("#mainNav a").forEach(a=>a.addEventListener("click",()=>$("mainNav").classList.remove("show")));
async function sharePage(){if(navigator.share){try{await navigator.share({title:"MONACO 98.7 FM",text:"Escuchá MONACO FM en vivo",url:location.href})}catch(e){}}else{try{await navigator.clipboard.writeText(location.href);alert("Enlace copiado")}catch(e){prompt("Copiá el enlace:",location.href)}}}
$("shareBtn").onclick=sharePage;$("shareBtn2").onclick=sharePage;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function api(path,opts={}){const r=await fetch(path,{credentials:"same-origin",...opts});let data={};try{data=await r.json()}catch{}if(!r.ok)throw new Error(data.error||"Error del servidor");return data}
function renderNews(items){newsCache=items;$("newsGrid").innerHTML=items.length?items.map(n=>`<article class="news-card">${n.image?`<img src="${esc(n.image)}" alt="">`:""}<div class="news-body"><span class="news-date">${esc(n.date||"MONACO FM")}</span><h3>${esc(n.title)}</h3><p>${esc(n.description)}</p></div></article>`).join(""):'<p class="empty">Todavía no hay noticias publicadas.</p>'}
function renderSchedule(items){scheduleCache=items.sort((a,b)=>(a.time||"").localeCompare(b.time||""));$("scheduleList").innerHTML=scheduleCache.length?scheduleCache.map(p=>`<div class="schedule-item"><time>${esc(p.time)}</time><strong>${esc(p.title)}</strong></div>`).join(""):'<p class="empty">Próximamente publicaremos nuestra programación.</p>'}
async function loadContent(){try{const d=await api("/api/content");renderNews(d.news||[]);renderSchedule(d.schedule||[])}catch(e){$("newsGrid").innerHTML='<p class="empty">No se pudieron cargar las noticias.</p>';$("scheduleList").innerHTML='<p class="empty">No se pudo cargar la programación.</p>'}}
const modal=$("adminModal");function openModal(){modal.classList.add("open");modal.setAttribute("aria-hidden","false");checkSession()}function closeModal(){modal.classList.remove("open");modal.setAttribute("aria-hidden","true")}
$("adminTrigger").onclick=openModal;$("closeAdmin").onclick=closeModal;modal.addEventListener("click",e=>{if(e.target===modal)closeModal()});
async function checkSession(){try{await api("/api/session");$("loginView").hidden=true;$("panelView").hidden=false;await loadAdmin()}catch{$("loginView").hidden=false;$("panelView").hidden=true}}
$("loginForm").addEventListener("submit",async e=>{e.preventDefault();$("loginError").textContent="";try{await api("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:$("adminPassword").value})});$("adminPassword").value="";$("loginView").hidden=true;$("panelView").hidden=false;await loadAdmin()}catch(err){$("loginError").textContent=err.message}});
$("logoutBtn").onclick=async()=>{try{await api("/api/logout",{method:"POST"})}catch{}$("panelView").hidden=true;$("loginView").hidden=false;};
document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===t));document.querySelectorAll(".tab-panel").forEach(x=>x.hidden=x.id!==t.dataset.tab)});
let selectedImage="";
$("newsImage").addEventListener("change",()=>{const f=$("newsImage").files[0];if(!f)return;if(f.size>5*1024*1024){alert("La imagen no debe superar 5 MB");$("newsImage").value="";return}const u=URL.createObjectURL(f);$("imagePreview").innerHTML=`<img src="${u}" alt="Vista previa">`});
function resetNews(){$("newsForm").reset();$("newsId").value="";$("imagePreview").innerHTML="";selectedImage=""}
$("resetNews").onclick=resetNews;
$("newsForm").addEventListener("submit",async e=>{e.preventDefault();try{let image=selectedImage;const f=$("newsImage").files[0];if(f){const fd=new FormData();fd.append("file",f);const up=await api("/api/upload",{method:"POST",body:fd});image=up.url}
const id=$("newsId").value;await api("/api/content",{method:id?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"news",id,title:$("newsTitle").value,description:$("newsDesc").value,image})});resetNews();await loadAdmin();alert("Noticia guardada correctamente")}catch(err){alert(err.message)}});
$("scheduleForm").addEventListener("submit",async e=>{e.preventDefault();try{await api("/api/content",{method:$("scheduleId").value?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"schedule",id:$("scheduleId").value,time:$("scheduleTime").value,title:$("scheduleTitle").value})});$("scheduleForm").reset();$("scheduleId").value="";await loadAdmin();alert("Programa guardado")}catch(err){alert(err.message)}});
$("resetSchedule").onclick=()=>{$("scheduleForm").reset();$("scheduleId").value=""};
async function removeItem(type,id){if(!confirm("¿Querés eliminar este elemento?"))return;try{await api("/api/content",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({type,id})});await loadAdmin()}catch(e){alert(e.message)}}
async function loadAdmin(){const d=await api("/api/content");newsCache=d.news||[];scheduleCache=d.schedule||[];$("adminNewsList").innerHTML=newsCache.map(n=>`<div class="admin-row"><span>${esc(n.title)}</span><div><button data-edit-news="${esc(n.id)}">EDITAR</button> <button data-del-news="${esc(n.id)}">ELIMINAR</button></div></div>`).join("")||'<p class="empty">Sin noticias.</p>';$("adminScheduleList").innerHTML=scheduleCache.map(p=>`<div class="admin-row"><span>${esc(p.time)} · ${esc(p.title)}</span><div><button data-edit-schedule="${esc(p.id)}">EDITAR</button> <button data-del-schedule="${esc(p.id)}">ELIMINAR</button></div></div>`).join("")||'<p class="empty">Sin programas.</p>';renderNews(newsCache);renderSchedule(scheduleCache)}
$("adminNewsList").addEventListener("click",e=>{const ed=e.target.dataset.editNews,del=e.target.dataset.delNews;if(ed){const n=newsCache.find(x=>x.id===ed);$("newsId").value=n.id;$("newsTitle").value=n.title;$("newsDesc").value=n.description;selectedImage=n.image||"";$("imagePreview").innerHTML=n.image?`<img src="${esc(n.image)}" alt="">`:"";$("newsForm").scrollIntoView({behavior:"smooth"})}if(del)removeItem("news",del)});
$("adminScheduleList").addEventListener("click",e=>{const ed=e.target.dataset.editSchedule,del=e.target.dataset.delSchedule;if(ed){const p=scheduleCache.find(x=>x.id===ed);$("scheduleId").value=p.id;$("scheduleTime").value=p.time;$("scheduleTitle").value=p.title;$("scheduleForm").scrollIntoView({behavior:"smooth"})}if(del)removeItem("schedule",del)});
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("installBanner").hidden=false});
$("installBtn").onclick=async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$("installBanner").hidden=true};
$("dismissInstall").onclick=()=>$("installBanner").hidden=true;
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}));
loadContent();