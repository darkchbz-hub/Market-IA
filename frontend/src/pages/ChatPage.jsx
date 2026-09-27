import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { apiFetch } from "../lib/api.js";
import { formatMexicoDate, parseStoreDate } from "../lib/date.js";

const quickSupportTopics = [
  { label: "Recomiendame productos", botId: "grayce", message: "Recomiendame productos que me puedan interesar" },
  { label: "Estado de pedido", botId: "barban", message: "Quiero revisar el estado de mi pedido" },
  { label: "Mi carrito", botId: "taz", message: "Dame un informe de mi carrito actual" },
  { label: "Mis pagos", botId: "taz", message: "Dame un informe de mis pagos y compras" },
  { label: "Tiempo de entrega", botId: "barban", message: "Necesito saber el tiempo de entrega de mi pedido" },
  { label: "Hablar con asesor", botId: "barban", message: "Quiero hablar con un asesor humano" }
];

const supportBots = [
  {
    id: "grayce",
    name: "Grayce",
    subtitle: "Recomienda productos y ofertas",
    avatar: "/assets/support-grayce.png",
    toneClass: "is-silver"
  },
  {
    id: "barban",
    name: "BarbaN",
    subtitle: "Pedidos, entregas y soporte",
    avatar: "/assets/support-barban.png",
    toneClass: "is-gold"
  },
  {
    id: "taz",
    name: "Taz",
    subtitle: "Carrito, compras y pagos",
    avatar: "/assets/support-taz.png",
    toneClass: "is-blue"
  }
];

function getSelectedBot(botId) {
  return supportBots.find((bot) => bot.id === botId) || supportBots[0];
}

function getBotDisplayName(message, fallbackBot) {
  const match = String(message?.mensaje || "").match(/^(Grayce|BarbaN|Taz):/i);
  if (!match) {
    return fallbackBot.name;
  }
  return match[1] === "Barban" ? "BarbaN" : match[1];
}

function getBotForMessage(message, fallbackBot) {
  const displayName = getBotDisplayName(message, fallbackBot).toLowerCase();
  return supportBots.find((bot) => bot.name.toLowerCase() === displayName) || fallbackBot;
}

function getMessageDay(value) {
  return formatMexicoDate(value, { year: "numeric", month: "long", day: "numeric" });
}

function getMessageTime(value) {
  const date = parseStoreDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", hour: "numeric", minute: "2-digit" }).format(date);
}

function chooseBotForText(text, fallbackBotId = "grayce") {
  const value = String(text || "").toLowerCase();

  if (/recom|producto|interesar|categoria|presupuesto|oferta|catalogo/.test(value)) {
    return "grayce";
  }

  if (/pedido|orden|envio|entrega|llega|tracking|cancel|devolu|reembolso|asesor|humano|soporte|agente/.test(value)) {
    return "barban";
  }

  if (/carrito|pago|pagos|compra|compras|tarjeta|paypal|mercado|informe|cuenta/.test(value)) {
    return "taz";
  }

  return fallbackBotId;
}

export function ChatPage() {
  const { token, user, isAdmin } = useAuth();
  const refreshTimerRef = useRef(null);
  const messagesBoxRef = useRef(null);
  const [threads, setThreads] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [selectedBotId, setSelectedBotId] = useState("grayce");
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

  useEffect(() => {
    const box = messagesBoxRef.current;
    if (!box) return;
    box.scrollTo({ top: box.scrollHeight, behavior: messages.length > 1 ? "smooth" : "auto" });
  }, [messages.length, sending]);

  const sendCustomerBotMessage = async (messageText, forcedBotId = "") => {
    const userText = String(messageText || "").trim();

    if (!userText || sending) {
      return;
    }

    setSending(true);
    const bot = getSelectedBot(forcedBotId || chooseBotForText(userText, selectedBot.id));
    setSelectedBotId(bot.id);

    const userMessage = {
      id: `local-user-${Date.now()}`,
      fecha: new Date().toISOString(),
      rolRemitente: "customer",
      mensaje: userText,
      usuarioId: user?.id
    };

    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setStatus(`${bot.name} esta respondiendo automaticamente...`);

    try {
      const [persistedUserMessage, assistantPayload] = await Promise.all([
        apiFetch("/messages", {
          method: "POST",
          token,
          body: {
            mensaje: userText
          }
        }),
        apiFetch("/messages/assistant", {
          method: "POST",
          token,
          body: {
            botId: bot.id,
            mensaje: userText
          }
        })
      ]);

      setMessages((current) => [
        ...current.filter((message) => message.id !== userMessage.id),
        persistedUserMessage.message,
        assistantPayload.message
      ]);

      if (/asesor|humano|agente|persona/i.test(userText)) {
        setBotEnabled(false);
        setStatus("Conectado con soporte humano");
      } else {
        setStatus(`${bot.name} respondio automaticamente`);
      }
    } catch (error) {
      setStatus(error.message || "No se pudo guardar el mensaje.");
    } finally {
      setSending(false);
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();
    if (!draft.trim()) {
      return;
    }

    if (!isAdmin && botEnabled) {
      await sendCustomerBotMessage(draft, chooseBotForText(draft, selectedBot.id));
      return;
    }

    setSending(true);

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

  const supportControls = (
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
              <span className="cat-avatar cat-avatar--portrait">
                <img src={bot.avatar} alt={`Retrato de ${bot.name}`} />
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
          <button
            key={topic.label}
            type="button"
            className="pill pill--small"
            disabled={sending}
            onClick={() => {
              if (!isAdmin && botEnabled) {
                sendCustomerBotMessage(topic.message, topic.botId);
                return;
              }
              setDraft(topic.message);
            }}
          >
            {topic.label}
          </button>
        ))}
      </div>
    </section>
  );

  const conversationPanel = (
    <section className="support-conversation-card">
      <header className="support-chat-header">
        <span className="cat-avatar cat-avatar--portrait support-chat-header__avatar">
          <img src={selectedBot.avatar} alt={`Retrato de ${selectedBot.name}`} />
        </span>
        <span className="support-chat-header__identity">
          <strong>{isAdmin ? "Atención al cliente" : selectedBot.name}</strong>
          <small><i /> {isAdmin ? "Conversación sincronizada" : `${selectedBot.subtitle} · En línea`}</small>
        </span>
      </header>

      <div className="messages-box messages-box--compact support-chat-messages" ref={messagesBoxRef}>
        {messages.length ? (
          messages.map((message, index) => {
            const previousMessage = messages[index - 1];
            const messageDay = getMessageDay(message.fecha);
            const showDay = !previousMessage || getMessageDay(previousMessage.fecha) !== messageDay;
            const isOutgoing = isAdmin ? message.rolRemitente === "admin" : message.rolRemitente === "customer";
            const messageBot = getBotForMessage(message, selectedBot);
            const senderName = message.rolRemitente === "admin" ? "Soporte" : message.rolRemitente === "bot" ? messageBot.name : "Tú";

            return (
              <div className="support-message-group" key={`${message.id}-${message.fecha}`}>
                {showDay && <div className="support-date-separator"><span>{messageDay}</span></div>}
                <div className={`support-message-row ${isOutgoing ? "is-outgoing" : "is-incoming"}`}>
                  {!isOutgoing && message.rolRemitente === "bot" && (
                    <span className="support-message-avatar"><img src={messageBot.avatar} alt="" /></span>
                  )}
                  <article className={`message ${isOutgoing ? "message--outgoing" : "message--incoming"}`}>
                    <strong>{senderName}</strong>
                    <p>{message.mensaje}</p>
                    <time>{getMessageTime(message.fecha)}</time>
                  </article>
                </div>
              </div>
            );
          })
        ) : (
          <article className="support-empty-state">
            <strong>{isAdmin ? "Esperando mensajes de clientes" : `${selectedBot.name} esta listo para ayudarte`}</strong>
            <p>{isAdmin ? "Cuando un cliente escriba en soporte, la conversacion aparecera aqui." : "Escribe tu duda sobre pedidos, carrito, pagos o cuenta para empezar."}</p>
          </article>
        )}
        {!isAdmin && botEnabled && sending && (
          <div className="support-message-row is-incoming support-typing-row">
            <span className="support-message-avatar"><img src={selectedBot.avatar} alt="" /></span>
            <div className="support-typing" aria-label={`${selectedBot.name} está escribiendo`}><i /><i /><i /></div>
          </div>
        )}
      </div>

      <form className="chat-form chat-form--support" onSubmit={handleSend}>
        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`Escribe un mensaje${!isAdmin ? ` para ${selectedBot.name}` : ""}...`} />
        <button type="submit" className="button button--primary support-send-button" disabled={(!selectedUserId && isAdmin) || sending} aria-label="Enviar mensaje">
          {sending ? "Enviando..." : <><span>Enviar</span><b aria-hidden="true">➤</b></>}
        </button>
      </form>
    </section>
  );

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

        {!isAdmin ? (
          <div className="support-shell support-shell--customer">
            {supportControls}
            {conversationPanel}
          </div>
        ) : (
          <>
            {supportControls}
            {conversationPanel}
          </>
        )}
      </section>
    </div>
  );
}
