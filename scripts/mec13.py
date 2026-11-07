import re, sys, json
from playwright.sync_api import sync_playwright
H=sys.argv[1] if len(sys.argv)>1 else "http://localhost:3120"
ok=0; mal=0; errs=[]
def t(n,c,extra=""):
    global ok,mal
    if c: ok+=1
    else: mal+=1
    print(("OK   " if c else "MAL  ")+n+(("  "+str(extra)) if extra else ""))
def esperar_resultado(pg):
    pg.wait_for_selector("text=Afirmación contra medida",timeout=30000)
    pg.wait_for_function("!document.body.innerText.includes('Calculando 24 simulaciones')",timeout=30000)
    pg.wait_for_timeout(300)
def evs(pg): return pg.evaluate("JSON.parse(localStorage.getItem('croquisvivo.eventos.v1')||'[]')")
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    ctx=b.new_context(viewport={"width":1200,"height":900},accept_downloads=True); pg=ctx.new_page()
    pg.on("pageerror",lambda e:errs.append("pageerror "+str(e))); pg.on("console",lambda m: errs.append(m.text) if m.type=="error" else None)
    r=pg.goto(H+"/sesiones"); pg.wait_for_timeout(800)
    t("/sesiones carga",r.status==200 and "Libreta" in pg.title())
    cuerpo=pg.inner_text("body")
    t("dice que no se anoten nombres, correos ni teléfonos","correos ni teléfonos" in cuerpo)
    t("regla de la semana muestra 0 de 5","0 de 5" in cuerpo and "0 de 3" in cuerpo)
    t("10:1 dice por medir",re.search(r"Por medir",cuerpo) is not None)
    t("no hay botón de borrar sesiones", pg.get_by_role("button",name=re.compile("borrar",re.I)).count()==0)
    # pagina_vista
    t("se registra pagina_vista de /sesiones", any(e["tipo"]=="pagina_vista" and e["detalle"].get("ruta")=="/sesiones" for e in evs(pg)))
    # iniciar sesión
    pg.get_by_role("button",name="Iniciar sesión").click(); pg.wait_for_timeout(600)
    t("aparece el cronómetro", pg.locator(".temporizador").count()==1)
    t("se registra sesion_iniciada", any(e["tipo"]=="sesion_iniciada" for e in evs(pg)))
    sid=pg.evaluate("JSON.parse(localStorage.getItem('croquisvivo.sesionActiva.v1')).id")
    # herramienta
    pg.get_by_role("link",name="Abrir la herramienta").first.click(); pg.wait_for_url("**/herramienta"); pg.wait_for_timeout(1200)
    # botón atasco
    pg.get_by_role("button",name="Se me atoró aquí").click()
    pg.get_by_role("button",name="Guardar",exact=True).click()
    t("atasco vacío da error", pg.get_by_role("alert").count()>=1)
    pg.fill("#atasco-txt","escríbeme a nico@correo.com porque no entiendo")
    pg.get_by_role("button",name="Guardar",exact=True).click()
    t("atasco con correo se rechaza", "correo" in pg.inner_text(".atasco").lower())
    pg.fill("#atasco-txt","No entiendo qué es una corrida")
    pg.get_by_role("button",name="Guardar",exact=True).click(); pg.wait_for_timeout(300)
    t("atasco válido da gracias", "Gracias" in pg.inner_text(".atasco"))
    pg.get_by_role("button",name="Cerrar").click()
    a=[e for e in evs(pg) if e["tipo"]=="atasco"]
    t("el atasco queda con sesión, cita y ruta", len(a)==1 and a[0]["sesionId"]==sid and a[0]["detalle"].get("cita")=="No entiendo qué es una corrida" and a[0]["detalle"].get("ruta")=="/herramienta", a)
    # usar la herramienta
    pg.get_by_label("Nombre del caso").fill("Caso de sesión")
    pg.get_by_role("button",name="Crear caso").click(); esperar_resultado(pg)
    pg.fill("#tie","abc"); pg.get_by_role("button",name="Comparar con la simulación").click(); pg.wait_for_timeout(300)
    tipos=[e["tipo"] for e in evs(pg)]
    t("se registran caso_creado y comparado", "caso_creado" in tipos and "comparado" in tipos, tipos)
    t("un tiempo mal escrito registra error_validacion", "error_validacion" in tipos)
    t("los eventos de la sesión llevan el id", all(e["sesionId"]==sid for e in evs(pg) if e["tipo"] in("caso_creado","comparado","error_validacion","atasco")))
    t("ningún evento guarda nombres de caso", "Caso de sesión" not in json.dumps(evs(pg)))
    # volver y cerrar
    pg.goto(H+"/sesiones"); pg.wait_for_timeout(800)
    t("la sesión sigue en curso tras navegar", pg.locator(".temporizador").count()==1)
    pg.get_by_role("button",name="Terminar sesión").click(); pg.wait_for_timeout(500)
    t("el formulario de cierre precarga el atasco", "No entiendo qué es una corrida" in pg.input_value("#s-a"))
    t("el formulario precarga 1 error", pg.input_value("#s-e")=="1", pg.input_value("#s-e"))
    pg.get_by_role("button",name="Guardar sesión").click(); pg.wait_for_timeout(300)
    t("guardar vacío da errores y no guarda", pg.get_by_role("alert").count()>=1 and "Rol" in pg.inner_text("[role=alert]"))
    pg.select_option("#s-rol","administrador_hospital"); pg.select_option("#s-des","si"); pg.select_option("#s-mod","remota"); pg.select_option("#s-sola","si")
    pg.fill("#s-p","No entiende qué es una corrida"); pg.select_option("#s-g","4")
    pg.fill("#s-paga","teléfono 55 1234 5678"); pg.fill("#s-firma","Dirección administrativa"); pg.select_option("#s-vol","no")
    pg.get_by_role("button",name="Guardar sesión").click(); pg.wait_for_timeout(300)
    t("un teléfono en 'qué paga hoy' se rechaza", "teléfono" in pg.inner_text("[role=alert]").lower())
    pg.fill("#s-paga","sin dato"); pg.fill("#s-hoja","5:00")
    pg.get_by_role("button",name="Guardar sesión").click(); pg.wait_for_timeout(1200)
    cuerpo=pg.inner_text("body")
    t("la sesión queda guardada", "1 de 5" in cuerpo and "sesiones guardadas (1)" in cuerpo.lower())
    t("el cronómetro desaparece", pg.locator(".temporizador").count()==0 and pg.evaluate("localStorage.getItem('croquisvivo.sesionActiva.v1')")is None)
    t("el ranking muestra el problema", "No entiende qué es una corrida" in cuerpo)
    t("el 10:1 sigue por medir con 1 sesión", "Por medir" in cuerpo)
    t("la regla dice que falta", "falta" in cuerpo.lower())
    # exportar
    with pg.expect_download() as d: pg.get_by_role("button",name="Exportar CSV").click()
    csv=open(d.value.path(),encoding="utf-8").read()
    t("el CSV trae cabecera y la sesión", csv.startswith("id,fecha,rol") and "administrador_hospital" in csv and csv.count("\n")==1, csv[:120])
    with pg.expect_download() as d2: pg.get_by_role("button",name="Exportar JSON").click()
    t("el JSON es válido", len(json.load(open(d2.value.path(),encoding="utf-8")))==1)
    # persistencia
    pg.reload(); pg.wait_for_timeout(1000)
    t("la sesión persiste al recargar", "sesiones guardadas (1)" in pg.inner_text("body").lower())
    # sin ayuda: sesión nueva y descartar
    pg.get_by_role("button",name="Iniciar sesión").click(); pg.wait_for_timeout(300)
    pg.get_by_role("button",name="Terminar sesión").click(); pg.wait_for_timeout(300)
    pg.get_by_role("button",name="Descartar").click(); pg.wait_for_timeout(500)
    t("descartar no borra lo guardado", "sesiones guardadas (1)" in pg.inner_text("body").lower())
    # celular
    m=b.new_context(viewport={"width":390,"height":800}).new_page()
    for ruta in ["/sesiones","/herramienta"]:
        m.goto(H+ruta); m.wait_for_timeout(700)
        t("sin scroll horizontal en celular "+ruta, m.evaluate("document.documentElement.scrollWidth")<=392, m.evaluate("document.documentElement.scrollWidth"))
    m.goto(H+"/herramienta"); m.wait_for_timeout(500); m.get_by_role("button",name="Se me atoró aquí").click()
    t("el panel de atasco cabe en celular", m.evaluate("document.querySelector('.atasco').getBoundingClientRect().right")<=392)
    # sin localStorage
    c3=b.new_context(viewport={"width":1200,"height":900}); c3.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new Error('bloqueado')}})")
    q=c3.new_page(); e3=[]; q.on("pageerror",lambda e:e3.append(str(e)))
    q.goto(H+"/sesiones"); q.wait_for_timeout(800)
    t("sin localStorage la libreta carga y no se cae", "Libreta del observador" in q.inner_text("body") and not e3, e3)
    q.goto(H+"/herramienta"); q.wait_for_timeout(800); q.get_by_role("button",name="Se me atoró aquí").click(); q.fill("#atasco-txt","Prueba sin almacenamiento"); q.get_by_role("button",name="Guardar",exact=True).click(); q.wait_for_timeout(300)
    t("sin localStorage el botón de atasco no se cae", "Gracias" in q.inner_text(".atasco") and not e3, e3)
    # sin textos 10x / seguro
    todo=pg.inner_text("body")
    t("la libreta no dice 10× ni 'seguro' como resultado", not re.search(r"\b10\s?[x×]\b|diez veces",todo,re.I))
    t("sin errores de consola ni de página", not errs, errs[:3])
    b.close()
print(f"\n{ok} bien, {mal} mal")
