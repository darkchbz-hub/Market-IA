import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

const categoryIconMap = {
  tecnologia: "⌘",
  hogar: "⌂",
  jardin: "❋",
  automovil: "◈",
  empresas: "▣",
  mayoreo: "◫",
  importados: "◎",
  mascotas: "✦",
  ropa: "◍",
  juguetes: "★"
};

function navLinkClass({ isActive }) {
  return `market-nav__link${isActive ? " is-active" : ""}`;
}

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const [search, setSearch] = useState("");
  const [siteData, setSiteData] = useState({ settings: {}, general: {}, categories: [], music: [] });
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.35);
  const [trackIndex, setTrackIndex] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    apiFetch("/products/home")
      .then((payload) => {
        setSiteData({
          settings: payload.settings || {},
          general: payload.general || {},
          categories: payload.categories || [],
          music: payload.music || []
        });
      })
      .catch(() => {
        setSiteData({ settings: {}, general: {}, categories: [], music: [] });
      });
  }, []);

  const currentTrack = useMemo(() => siteData.music?.[trackIndex] || null, [siteData.music, trackIndex]);

  useEffect(() => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.volume = musicVolume;
  }, [musicVolume]);

  useEffect(() => {
    if (!audioRef.current) {
      return;
    }

    if (!musicEnabled) {
      audioRef.current.pause();
      return;
    }

    audioRef.current
      .play()
      .then(() => {})
      .catch(() => {
        setMusicEnabled(false);
      });
  }, [musicEnabled, currentTrack]);

  useEffect(() => {
    const searchParam = new URLSearchParams(location.search).get("search") || "";
    setSearch(searchParam);
  }, [location.search]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();

    if (search.trim()) {
      params.set("search", search.trim());
    }

    navigate(`/catalogo${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const openCategory = (slug) => {
    const params = new URLSearchParams();
    if (slug) {
      params.set("category", slug);
    }
    navigate(`/catalogo${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const nextTrack = () => {
    if (!siteData.music.length) {
      return;
    }

    setTrackIndex((current) => (current + 1) % siteData.music.length);
  };

  return (
    <div className="marketplace">
      <header className="market-header">
        <div className="market-header__top">
          <Link to="/" className="brand">
            <span className="brand__badge">GC</span>
            <span>
              <strong>{siteData.general.siteName || "Gray C Shop"}</strong>
              <small>{siteData.general.tagline || siteData.settings.heroEyebrow || "Marketplace elegante"}</small>
            </span>
          </Link>

          <form className="searchbar" onSubmit={handleSearchSubmit}>
            <span className="searchbar__icon">⌕</span>
            <input
              type="search"
              placeholder="Buscar tecnologia, hogar, mascotas, mayoreo o importados"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button type="submit">Buscar</button>
          </form>

          <div className="header-actions">
            {isAuthenticated ? (
              <>
                <Link to="/perfil" className="account-chip">
                  <span>{user?.nombre}</span>
                  <small>{isAdmin ? "Cuenta administradora" : "Tu cuenta"}</small>
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="button button--primary">
                    Administrar tienda
                  </Link>
                )}
                <Link to="/carrito" className="cart-button">
                  Carrito
                  <span>{itemCount}</span>
                </Link>
                <button type="button" className="button button--ghost" onClick={logout}>
                  Cerrar sesion
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="button button--ghost">
                  Iniciar sesion
                </Link>
                <Link to="/register" className="button button--primary">
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>

        <nav className="market-nav">
          <NavLink to="/" end className={navLinkClass}>
            Inicio
          </NavLink>
          <NavLink to="/catalogo" className={navLinkClass}>
            Catalogo
          </NavLink>
          {siteData.categories.slice(0, 8).map((category) => (
            <button
              key={category.id}
              type="button"
              className={`market-nav__link market-nav__link--button${
                new URLSearchParams(location.search).get("category") === category.slug ? " is-active" : ""
              }`}
              onClick={() => openCategory(category.slug)}
            >
              <span className="market-nav__icon">{categoryIconMap[category.slug] || "•"}</span>
              {category.nombre}
            </button>
          ))}
          <NavLink to="/chat" className={navLinkClass}>
            Soporte
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={navLinkClass}>
              Administrador
            </NavLink>
          )}
        </nav>
      </header>

      <main className="market-content">
        <Outlet />
      </main>

      <aside className="music-player">
        <audio ref={audioRef} src={currentTrack?.audioUrl || ""} onEnded={nextTrack} />
        <div>
          <p className="music-player__label">Musica ambiental</p>
          <strong>{currentTrack?.titulo || "Sin pistas activas"}</strong>
          <small>{currentTrack?.artista || "Configurable desde administrador"}</small>
        </div>
        <div className="music-player__controls">
          <button type="button" className="button button--ghost" onClick={() => setMusicEnabled((value) => !value)}>
            {musicEnabled ? "Pausar" : "Reproducir"}
          </button>
          <button type="button" className="button button--ghost" onClick={nextTrack}>
            Cambiar
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={musicVolume}
            onChange={(event) => setMusicVolume(Number(event.target.value))}
          />
        </div>
      </aside>

      <footer className="market-footer">
        <div>
          <strong>{siteData.general.siteName || "Gray C Shop"}</strong>
          <p>Marketplace formal, moderno y listo para crecer con categorias, pedidos y panel administrador.</p>
        </div>
        <div className="market-footer__links">
          <Link to="/catalogo">Catalogo</Link>
          <Link to="/perfil">Mi cuenta</Link>
          <Link to="/chat">Soporte</Link>
        </div>
      </footer>
    </div>
  );
}
