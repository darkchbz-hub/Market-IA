import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const defaultChecklist = [
  { id: "ux", label: "Revisar experiencia visual", done: false },
  { id: "ventas", label: "Preparar nueva estrategia de ventas", done: false },
  { id: "catalogo", label: "Subir nuevos productos curados", done: false },
  { id: "soporte", label: "Validar flujo de soporte", done: false }
];

function loadJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function ControlCenterPage() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState("");
  const [checklist, setChecklist] = useState(defaultChecklist);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [timerOn, setTimerOn] = useState(false);

  useEffect(() => {
    setNotes(window.localStorage.getItem("gc_control_notes") || "");

    const storedChecklist = loadJson("gc_control_checklist", defaultChecklist);
    if (Array.isArray(storedChecklist) && storedChecklist.length) {
      setChecklist(storedChecklist);
    }

    const storedSeconds = Number(window.localStorage.getItem("gc_focus_seconds") || 25 * 60);
    if (Number.isFinite(storedSeconds) && storedSeconds > 0) {
      setSecondsLeft(storedSeconds);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("gc_control_notes", notes);
  }, [notes]);

  useEffect(() => {
    window.localStorage.setItem("gc_control_checklist", JSON.stringify(checklist));
  }, [checklist]);

  useEffect(() => {
    window.localStorage.setItem("gc_focus_seconds", String(secondsLeft));
  }, [secondsLeft]);

  useEffect(() => {
    if (!timerOn) {
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setTimerOn(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [timerOn]);

  const completed = useMemo(() => checklist.filter((item) => item.done).length, [checklist]);

  const timerLabel = useMemo(() => {
    const mins = Math.floor(secondsLeft / 60)
      .toString()
      .padStart(2, "0");
    const secs = (secondsLeft % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  }, [secondsLeft]);

  return (
    <div className="page-stack">
      <section className="section-card section-card--spotlight">
        <div className="section-heading">
          <div>
            <p className="section-label">Nueva funcion</p>
            <h1>Centro de Control de la Tienda</h1>
          </div>
        </div>
        <p className="muted-text">
          Este espacio centraliza productividad, navegacion y plan operativo para el relanzamiento de la web.
        </p>
      </section>

      <section className="metrics-row">
        <article className="metric-card">
          <span>Tareas completadas</span>
          <strong>{completed}/{checklist.length}</strong>
        </article>
        <article className="metric-card">
          <span>Temporizador enfoque</span>
          <strong>{timerLabel}</strong>
        </article>
        <article className="metric-card">
          <span>Estado general</span>
          <strong>{completed === checklist.length ? "Listo" : "En progreso"}</strong>
        </article>
      </section>

      <div className="community-grid">
        <section className="section-card">
          <div className="section-heading section-heading--compact">
            <div>
              <p className="section-label">Notas estrategicas</p>
              <h2>Bitacora rapida</h2>
            </div>
          </div>
          <textarea
            rows="11"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Escribe acuerdos, tareas del equipo o decisiones importantes del rediseño..."
          />
        </section>

        <section className="section-card">
          <div className="section-heading section-heading--compact">
            <div>
              <p className="section-label">Checklist inteligente</p>
              <h2>Control operativo</h2>
            </div>
          </div>
          <div className="list-stack">
            {checklist.map((item) => (
              <label key={item.id} className="checkbox-chip">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={(event) => {
                    setChecklist((current) =>
                      current.map((entry) =>
                        entry.id === item.id ? { ...entry, done: event.target.checked } : entry
                      )
                    );
                  }}
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </section>
      </div>

      <div className="community-grid">
        <section className="section-card">
          <div className="section-heading section-heading--compact">
            <div>
              <p className="section-label">Focus mode</p>
              <h2>Temporizador Pomodoro</h2>
            </div>
          </div>
          <p className="muted-text">Usalo para bloques de trabajo profundo durante mejoras de la web.</p>
          <div className="hero-actions">
            <button type="button" className="button button--primary" onClick={() => setTimerOn(true)}>
              Iniciar
            </button>
            <button type="button" className="button button--ghost" onClick={() => setTimerOn(false)}>
              Pausar
            </button>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => {
                setTimerOn(false);
                setSecondsLeft(25 * 60);
              }}
            >
              Reiniciar
            </button>
          </div>
        </section>

        <section className="section-card">
          <div className="section-heading section-heading--compact">
            <div>
              <p className="section-label">Navegacion rapida</p>
              <h2>Acciones clave</h2>
            </div>
          </div>
          <div className="list-stack">
            <button type="button" className="market-rail__link" onClick={() => navigate("/catalogo") }>
              <strong>Catalogo</strong>
              <small>Revisar estado de inventario</small>
            </button>
            <button type="button" className="market-rail__link" onClick={() => navigate("/admin") }>
              <strong>Administrador</strong>
              <small>Gestionar ventas y contenido</small>
            </button>
            <button type="button" className="market-rail__link" onClick={() => navigate("/chat") }>
              <strong>Soporte</strong>
              <small>Probar canal de atencion</small>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
