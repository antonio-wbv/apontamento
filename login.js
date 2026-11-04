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
    $("usuario").innerHTML = `${texto(user.email)} · <a href="#" id="sair">Sair</a>`;
    $("sair").onclick = async e => { e.preventDefault(); await db.auth.signOut(); location.reload(); };
    abrir();
  }
  verificar();
}

// =============================================================
//  Horas de máquina trabalhadas no MÊS ATUAL (todas as máquinas ou uma)
//  Soma o tempo de cada trecho de OP a partir do dia 1º, até agora.
//  Inclui sábados trabalhados (é custo real de máquina).
// =============================================================
async function horasUsinadasMes(maquina){
  const agora = new Date(), inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  let q = db.from("vw_apontamentos").select("inicio,fim,maquina_codigo")
            .or(`fim.is.null,fim.gte.${inicioMes.toISOString()}`).limit(10000);
  if(maquina) q = q.eq("maquina_codigo", maquina);
  const { data, error } = await q;
  if(error){ console.error(error); return { total:0, porMaquina:{} }; }
  const porMaquina = {}; let total = 0;
  for(const s of data){
    const ini = Math.max(new Date(s.inicio), inicioMes), fim = s.fim ? new Date(s.fim) : agora;
    const h = Math.max(0, fim - ini) / 3600000;               // só a parte dentro do mês
    porMaquina[s.maquina_codigo] = (porMaquina[s.maquina_codigo] || 0) + h; total += h;
  }
  return { total, porMaquina };
}
const nomeMes = () => new Date().toLocaleDateString("pt-BR", { month:"long", year:"numeric" });
