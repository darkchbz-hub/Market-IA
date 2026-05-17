import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { apiFetch } from "../lib/api.js";

const quickSupportTopics = ["Metodos de pago", "Estado de pedido", "Tiempo de entrega", "Problemas con cuenta", "Reembolso o cancelacion", "Hablar con asesor"];

const supportBots = [
  {
    id: "taz",
    name: "Taz",
    subtitle: "Rapido y directo",
    toneClass: "is-blue"
  },
  {
    id: "grayce",
    name: "Grayce",
    subtitle: "Calida y detallada",
    toneClass: "is-silver"
  },
  {
    id: "black-beard",
    name: "Black Beard",
    subtitle: "Serio y preciso",
    toneClass: "is-dark"
  }
];

function getSelectedBot(botId) {
  return supportBots.find((bot) => bot.id === botId) || supportBots[0];
}

export function ChatPage() {
  const { token, user, isAdmin } = useAuth();
  const refreshTimerRef = useRef(null);
  const [threads, setThreads] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [selectedBotId, setSelectedBotId] = useState("taz");
  const [botEnabled, setBotEnabled] = useState(true);
  const [status, setStatus] = useState("Soporte activo");
  const [sending, setSending] = useState(false);

  const selectedBot = getSelectedBot(selectedBotId);

  const loadThreads = async () => {
    if (!isAdmin) {
      return;
    }

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
      loadThreads().catch((error) => setStatus(error.message));
    } else if (user?.id) {
      setSelectedUserId(user.id);
    }
  }, [isAdmin, user?.id, token]);

  useEffect(() => {
    if (!token || (!selectedUserId && isAdmin)) {
      return;
    }
    loadMessages(selectedUserId).catch((error) => setStatus(error.message));
  }, [token, selectedUserId, isAdmin]);

  useEffect(() => {
    if (!token) {
      return () => {};
    }

    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    const refresh = async () => {
      try {
        if (isAdmin) {
          await loadThreads();
        }
        await loadMessages(selectedUserId);
        setStatus("Soporte activo");
      } catch (error) {
        setStatus(error.message || "No se pudo sincronizar soporte.");
      }
    };

    refresh().catch(() => {});
    refreshTimerRef.current = setInterval(() => {
      refresh().catch(() => {});
    }, 4000);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [token, isAdmin, selectedUserId]);

  const handleSend = async (event) => {
    event.preventDefault();
    if (!draft.trim()) {
      return;
    }

    setSending(true);

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
      setStatus(`${selectedBot.name} esta respondiendo...`);

      try {
        const persistedUserMessage = await apiFetch("/messages", {
          method: "POST",
          token,
          body: {
            mensaje: userText
          }
        });
        setMessages((current) => [...current.filter((message) => message.id !== userMessage.id), persistedUserMessage.message]);

        const assistantPayload = await apiFetch("/messages/assistant", {
          method: "POST",
          token,
          body: {
            botId: selectedBot.id,
            mensaje: userText
          }
        });
        setMessages((current) => [...current, assistantPayload.message]);
        if (/asesor|humano|agente|persona/i.test(userText)) {
          setBotEnabled(false);
          setStatus("Conectado con soporte humano");
        } else {
          setStatus(`${selectedBot.name} activo`);
        }
      } catch (error) {
        setStatus(error.message || "No se pudo guardar el mensaje.");
      } finally {
        setSending(false);
      }
      return;
    }

    try {
      const payload = await apiFetch("/messages", {
        method: "POST",
        token,
        body: {
          userId: isAdmin ? selectedUserId : undefined,
          mensaje: draft.trim()
        }
      });
      setMessages((current) => [...current, payload.message]);
      setDraft("");
      if (isAdmin) {
        await loadThreads();
      }
      setStatus("Soporte activo");
    } catch (error) {
      setStatus(error.message || "No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`chat-layout chat-layout--support ${!isAdmin ? "chat-layout--single" : ""}`}>
      {isAdmin && (
        <aside className="chat-sidebar">
          <div className="section-heading section-heading--compact">
            <div>
              <p className="section-label">Conversaciones</p>
              <h2>Clientes</h2>
            </div>
          </div>
          <div className="list-stack">
            {threads.length ? (
              threads.map((thread) => (
                <button
                  key={thread.usuarioId}
                  type="button"
                  className={`thread-card ${selectedUserId === thread.usuarioId ? "is-active" : ""}`}
                  onClick={() => setSelectedUserId(thread.usuarioId)}
                >
                  <strong>{thread.nombre}</strong>
                  <span>{thread.email}</span>
                </button>
              ))
            ) : (
              <p className="muted-text">Todavia no hay conversaciones de clientes.</p>
            )}
          </div>
        </aside>
      )}

      <section className="chat-main">
        <div className="section-heading section-heading--compact">
          <div>
            <p className="section-label">Soporte</p>
            <h2>{isAdmin ? "Atencion al cliente" : "Chat de soporte inteligente"}</h2>
          </div>
          <span className="status-pill">{status}</span>
        </div>

        <section className="support-bot-card">
          <div className="support-bot-card__head">
            <strong>{isAdmin ? "Respuestas rapidas" : "Elige tu asistente IA"}</strong>
            {!isAdmin && (
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setBotEnabled((current) => !current)}
              >
                {botEnabled ? "Bot activo" : "Bot inactivo"}
              </button>
            )}
          </div>

          {!isAdmin && (
            <div className="support-bot-grid">
              {supportBots.map((bot) => (
                <button
                  key={bot.id}
                  type="button"
                  className={`support-bot-option ${bot.toneClass} ${selectedBotId === bot.id ? "is-selected" : ""}`}
                  onClick={() => setSelectedBotId(bot.id)}
                >
                  <span className="cat-avatar">
                    <span className="cat-avatar__ear cat-avatar__ear--left" />
                    <span className="cat-avatar__ear cat-avatar__ear--right" />
                    <span className="cat-avatar__face">{bot.name.slice(0, 1)}</span>
                  </span>
                  <span className="support-bot-option__meta">
                    <strong>{bot.name}</strong>
                    <small>{bot.subtitle}</small>
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="pill-row">
            {quickSupportTopics.map((topic) => (
              <button key={topic} type="button" className="pill pill--small" onClick={() => setDraft(topic)}>
                {topic}
              </button>
            ))}
          </div>
        </section>

        <div className="messages-box messages-box--compact">
          {messages.map((message) => (
            <article
              key={`${message.id}-${message.fecha}`}
              className={`message ${
                message.rolRemitente === "admin" ? "message--admin" : message.rolRemitente === "bot" ? "message--bot" : "message--customer"
              }`}
            >
              <strong>{message.rolRemitente === "admin" ? "Soporte" : message.rolRemitente === "bot" ? selectedBot.name : "Cliente"}</strong>
              <p>{message.mensaje}</p>
            </article>
          ))}
        </div>

        <form className="chat-form chat-form--support" onSubmit={handleSend}>
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Escribe tu mensaje" />
          <button type="submit" className="button button--primary" disabled={!selectedUserId && isAdmin}>
            {sending ? "Enviando..." : "Enviar"}
          </button>
        </form>
      </section>
    </div>
  );
}
