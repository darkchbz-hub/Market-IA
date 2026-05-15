import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext.jsx";
import { SOCKET_URL, apiFetch } from "../lib/api.js";

const quickSupportTopics = [
  "Metodos de pago",
  "Estado de pedido",
  "Tiempo de entrega",
  "Problemas con cuenta",
  "Reembolso o cancelacion",
  "Hablar con asesor"
];

function buildSupportBotReply(rawText) {
  const text = String(rawText || "").toLowerCase();

  if (/pago|tarjeta|paypal|mercado\s*pago|transferencia|visa|mastercard/.test(text)) {
    return "Aceptamos Mercado Pago, PayPal y tarjeta. Si tu compra sigue pendiente, entra a tu pedido y vuelve a elegir la forma de pago.";
  }

  if (/pedido|orden|id|seguimiento|estatus|estado/.test(text)) {
    return "Puedes revisar el estado en Perfil > Tus compras. Ahi veras ID de orden, fecha, estado y seguimiento.";
  }

  if (/envio|entrega|llega|tiempo|dias/.test(text)) {
    return "El tiempo de entrega depende del producto y destino. En cada pedido te mostramos fecha estimada y avance.";
  }

  if (/cuenta|login|acceso|correo|codigo|verificacion|nickname/.test(text)) {
    return "Para acceso, usa tu correo Gmail y el codigo de verificacion. Si falla, solicita un nuevo codigo desde registro.";
  }

  if (/cancelar|cancelacion|devolucion|reembolso/.test(text)) {
    return "Puedes cancelar solo si el pedido aun no fue enviado. Si ya esta en proceso, soporte te ayuda con la mejor opcion.";
  }

  if (/asesor|humano|agente|persona/.test(text)) {
    return "Perfecto, te conecto con un asesor humano. Desactive el bot para que tu siguiente mensaje lo reciba soporte.";
  }

  return "Te puedo ayudar con pagos, pedidos, envios, cuenta o cancelaciones. Escribeme tu duda con mas detalle y te respondo al momento.";
}

export function ChatPage() {
  const { token, user, isAdmin } = useAuth();
  const socketRef = useRef(null);
  const [threads, setThreads] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [botEnabled, setBotEnabled] = useState(true);
  const [status, setStatus] = useState("Conectando...");

  const loadThreads = async () => {
    if (!isAdmin) return;
    const payload = await apiFetch("/messages/threads", { token });
    setThreads(payload.items);
    if (!selectedUserId && payload.items[0]) {
      setSelectedUserId(payload.items[0].usuarioId);
    }
  };

  const loadMessages = async (userId) => {
    const query = isAdmin && userId ? `?userId=${userId}` : "";
    const payload = await apiFetch(`/messages${query}`, { token });
    setMessages(payload.items);
  };

  useEffect(() => {
    if (isAdmin) {
      loadThreads().catch(() => {});
    } else if (user?.id) {
      setSelectedUserId(user.id);
    }
  }, [isAdmin, user?.id, token]);

  useEffect(() => {
    if (!token || (!selectedUserId && isAdmin)) return;
    loadMessages(selectedUserId).catch(() => {});
  }, [token, selectedUserId, isAdmin]);

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => setStatus("Conectado"));
    socket.on("disconnect", () => setStatus("Desconectado"));
    socket.on("chat:error", (payload) => setStatus(payload.message || "No se pudo enviar el mensaje."));
    socket.on("chat:message", (message) => {
      if (!isAdmin || message.usuarioId === selectedUserId) {
        setMessages((current) => [...current, message]);
      }
      if (isAdmin) {
        loadThreads().catch(() => {});
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, isAdmin, selectedUserId]);

  const handleSend = (event) => {
    event.preventDefault();
    if (!draft.trim() || !socketRef.current) return;

    if (!isAdmin && botEnabled) {
      const userMessage = {
        id: `local-user-${Date.now()}`,
        fecha: new Date().toISOString(),
        rolRemitente: "customer",
        mensaje: draft.trim(),
        usuarioId: user?.id
      };
      const userText = draft.trim();
      setMessages((current) => [...current, userMessage]);
      setDraft("");
      setStatus("Asistente respondiendo...");

      window.setTimeout(() => {
        const botReply = buildSupportBotReply(userText);
        const botMessage = {
          id: `local-bot-${Date.now()}`,
          fecha: new Date().toISOString(),
          rolRemitente: "bot",
          mensaje: botReply,
          usuarioId: user?.id
        };

        setMessages((current) => [...current, botMessage]);
        if (/asesor|humano|agente|persona/.test(userText.toLowerCase())) {
          setBotEnabled(false);
          setStatus("Conectado con soporte humano");
        } else {
          setStatus("Conectado");
        }
      }, 550);

      return;
    }

    socketRef.current.emit("chat:send", {
      userId: isAdmin ? selectedUserId : undefined,
      mensaje: draft.trim()
    });

    setDraft("");
  };

  return (
    <div className="chat-layout">
      {isAdmin && (
        <aside className="chat-sidebar">
          <div className="section-heading section-heading--compact">
            <div>
              <p className="section-label">Conversaciones</p>
              <h2>Clientes</h2>
            </div>
          </div>
          <div className="list-stack">
            {threads.map((thread) => (
              <button
                key={thread.usuarioId}
                type="button"
                className={`thread-card ${selectedUserId === thread.usuarioId ? "is-active" : ""}`}
                onClick={() => setSelectedUserId(thread.usuarioId)}
              >
                <strong>{thread.nombre}</strong>
                <span>{thread.email}</span>
              </button>
            ))}
          </div>
        </aside>
      )}

      <section className="chat-main">
        <div className="section-heading section-heading--compact">
          <div>
            <p className="section-label">Soporte</p>
            <h2>{isAdmin ? "Atencion al cliente" : "Habla con nosotros"}</h2>
          </div>
          <span className="status-pill">{status}</span>
        </div>

        {!isAdmin && (
          <section className="support-bot-card">
            <div className="support-bot-card__head">
              <strong>Asistente de Soporte</strong>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setBotEnabled((current) => !current)}
              >
                {botEnabled ? "Bot activo" : "Bot inactivo"}
              </button>
            </div>
            <p className="muted-text">Respuestas rapidas para dudas frecuentes, sin salir del apartado de Soporte.</p>
            <div className="pill-row">
              {quickSupportTopics.map((topic) => (
                <button key={topic} type="button" className="pill pill--small" onClick={() => setDraft(topic)}>
                  {topic}
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="messages-box">
          {messages.map((message) => (
            <article
              key={`${message.id}-${message.fecha}`}
              className={`message ${
                message.rolRemitente === "admin" ? "message--admin" : message.rolRemitente === "bot" ? "message--bot" : "message--customer"
              }`}
            >
              <strong>{message.rolRemitente === "admin" ? "Soporte" : message.rolRemitente === "bot" ? "Asistente" : "Cliente"}</strong>
              <p>{message.mensaje}</p>
            </article>
          ))}
        </div>

        <form className="chat-form" onSubmit={handleSend}>
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Escribe tu mensaje" />
          <button type="submit" className="button button--primary" disabled={!selectedUserId && isAdmin}>
            Enviar
          </button>
        </form>
      </section>
    </div>
  );
}
