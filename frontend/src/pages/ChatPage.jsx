import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext.jsx";
import { SOCKET_URL, apiFetch } from "../lib/api.js";

export function ChatPage() {
  const { token, user, isAdmin } = useAuth();
  const socketRef = useRef(null);
  const [threads, setThreads] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("Conectando...");

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
      loadThreads().catch(() => {});
    } else if (user?.id) {
      setSelectedUserId(user.id);
    }
  }, [isAdmin, user?.id, token]);

  useEffect(() => {
    if (!token || (!selectedUserId && isAdmin)) {
      return;
    }

    loadMessages(selectedUserId).catch(() => {});
  }, [token, selectedUserId, isAdmin]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token }
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("Conectado");
    });

    socket.on("chat:message", (message) => {
      if (!isAdmin || message.usuarioId === selectedUserId) {
        setMessages((current) => [...current, message]);
      }

      if (isAdmin) {
        loadThreads().catch(() => {});
      }
    });

    socket.on("chat:error", (payload) => {
      setStatus(payload.message || "No se pudo enviar el mensaje.");
    });

    socket.on("disconnect", () => {
      setStatus("Desconectado");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, isAdmin, selectedUserId]);

  const handleSend = (event) => {
    event.preventDefault();

    if (!draft.trim() || !socketRef.current) {
      return;
    }

    socketRef.current.emit("chat:send", {
      userId: isAdmin ? selectedUserId : undefined,
      mensaje: draft.trim()
    });

    setDraft("");
  };

  return (
    <div className="page-section page-section--spaced">
      <div className="chat-layout">
        {isAdmin && (
          <aside className="card chat-sidebar">
            <div className="section-header">
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
                  <small>{thread.mensajesSinLeer} sin leer</small>
                </button>
              ))}
            </div>
          </aside>
        )}

        <section className="card chat-main">
          <div className="section-header">
            <div>
              <p className="section-label">Soporte</p>
              <h2>{isAdmin ? "Atencion a clientes" : "Habla con nosotros"}</h2>
            </div>
            <span className="status-pill">{status}</span>
          </div>

          <div className="messages-box">
            {messages.map((message) => (
              <article
                key={`${message.id}-${message.fecha}`}
                className={`message ${message.rolRemitente === "admin" ? "message--admin" : "message--customer"}`}
              >
                <strong>{message.rolRemitente === "admin" ? "Soporte" : "Cliente"}</strong>
                <p>{message.mensaje}</p>
              </article>
            ))}
          </div>

          <form className="chat-form" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Escribe tu mensaje"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button type="submit" className="button button--primary" disabled={!selectedUserId && isAdmin}>
              Enviar
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
