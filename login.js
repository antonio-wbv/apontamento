// =============================================================
//  Login compartilhado pelas páginas do PCP e do Relatório.
//  Uso: protegerPagina(funcaoQueAbreAPagina)
// =============================================================
const db = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
const $ = id => document.getElementById(id);
const texto = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const brl = v => Number(v || 0).toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
const dataHora = ts => ts ? new Date(ts).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}) : "–";
const horas = min => { min = Math.round(min || 0); return Math.floor(min/60) + "h" + String(min%60).padStart(2,"0"); };

function protegerPagina(abrir){
  document.body.insertAdjacentHTML("afterbegin", `
    <div class="card oculto" id="loginCard" style="max-width:420px;margin:30px auto">
      <h2>Entrar</h2>
      <label>E-mail</label><input id="email" type="email">
      <label>Senha</label><input id="senha" type="password">
      <button class="btn-azul" id="btnLogin">Entrar</button>
      <div id="loginMsg"></div>
    </div>`);
  $("btnLogin").onclick = async () => {
    const { error } = await db.auth.signInWithPassword({ email: $("email").value, password: $("senha").value });
    if(error) $("loginMsg").innerHTML = `<div class="msg erro">${texto(error.message)}</div>`;
    else verificar();
  };
  async function verificar(){
    const { data:{ user } } = await db.auth.getUser();
    if(!user){ $("loginCard").classList.remove("oculto"); return; }
    $("loginCard").classList.add("oculto");
    $("painel").classList.remove("oculto");
    $("usuario").innerHTML = `${texto(user.email)} · <a href="#" id="sair" style="color:#fff">Sair</a>`;
    $("sair").onclick = async e => { e.preventDefault(); await db.auth.signOut(); location.reload(); };
    abrir();
  }
  verificar();
}
