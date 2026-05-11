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

function isVideoAudioSource(url = "") {
  return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url);
}

function extractYouTubeId(url = "") {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace("www.", "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v") || "";
      }
      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/shorts/")[1]?.split("/")[0] || "";
      }
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/embed/")[1]?.split("/")[0] || "";
      }
    }

    if (host === "youtu.be") {
      return parsed.pathname.replace("/", "").split("/")[0] || "";
    }
  } catch {
    return "";
  }

  return "";
}

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const [search, setSearch] = useState("");
  const [siteData, setSiteData] = useState({ settings: {}, general: {}, categories: [], music: [] });
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [headerHidden, setHeaderHidden] = useState(false);
  const audioRef = useRef(null);
  const videoRef = useRef(null);

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

  const currentTrack = useMemo(() => siteData.music?.[0] || null, [siteData.music]);
  const youtubeId = useMemo(() => extractYouTubeId(currentTrack?.audioUrl || ""), [currentTrack]);
  const useYoutubeSource = Boolean(youtubeId);
  const useVideoSource = useMemo(() => isVideoAudioSource(currentTrack?.audioUrl || ""), [currentTrack]);
  const backgroundMusicVolume = useMemo(() => {
    const raw = Number(siteData.general?.backgroundMusicVolume ?? 35);
    if (!Number.isFinite(raw)) {
      return 0.35;
    }
    return Math.min(1, Math.max(0, raw / 100));
  }, [siteData.general]);

  useEffect(() => {
    if (useYoutubeSource) {
      return;
    }

    const mediaRef = useVideoSource ? videoRef.current : audioRef.current;
    const otherRef = useVideoSource ? audioRef.current : videoRef.current;
    if (!mediaRef) {
      return;
    }
    if (otherRef) {
      otherRef.pause();
      otherRef.currentTime = 0;
    }

    if (!musicEnabled) {
      mediaRef.pause();
      return;
    }

    mediaRef.volume = backgroundMusicVolume;
    mediaRef
      .play()
      .then(() => {})
      .catch(() => {
        setMusicEnabled(false);
      });
  }, [musicEnabled, currentTrack, useVideoSource, useYoutubeSource, backgroundMusicVolume]);

  useEffect(() => {
    if (musicEnabled || !currentTrack?.audioUrl) {
      return;
    }

    const enableByInteraction = () => {
      setMusicEnabled(true);
    };

    window.addEventListener("pointerdown", enableByInteraction, { once: true });
    window.addEventListener("keydown", enableByInteraction, { once: true });

    return () => {
      window.removeEventListener("pointerdown", enableByInteraction);
      window.removeEventListener("keydown", enableByInteraction);
    };
  }, [musicEnabled, currentTrack]);

  const youtubeEmbedUrl = useMemo(() => {
    if (!youtubeId || !musicEnabled) {
      return "";
    }
    return `https://www.youtube.com/embed/${youtubeId}?autoplay=1&loop=1&playlist=${youtubeId}&controls=0&modestbranding=1&playsinline=1`;
  }, [youtubeId, musicEnabled]);

  useEffect(() => {
    const searchParam = new URLSearchParams(location.search).get("search") || "";
    setSearch(searchParam);
  }, [location.search]);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) {
        return;
      }

      window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastY;
        const goingDown = delta > 8;
        const goingUp = delta < -8;

        if (currentY < 40 || goingUp) {
          setHeaderHidden(false);
        } else if (goingDown && currentY > 120) {
          setHeaderHidden(true);
        }

        lastY = currentY;
        ticking = false;
      });

      ticking = true;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  return (
    <div className="marketplace">
      <header className={`market-header${headerHidden ? " is-hidden" : ""}`}>
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

      {!useYoutubeSource && (
        <>
          <audio ref={audioRef} src={useVideoSource ? "" : currentTrack?.audioUrl || ""} loop preload="auto" style={{ display: "none" }} />
          <video ref={videoRef} src={useVideoSource ? currentTrack?.audioUrl || "" : ""} loop preload="auto" style={{ display: "none" }} />
        </>
      )}

      {useYoutubeSource && youtubeEmbedUrl && (
        <iframe
          key={youtubeEmbedUrl}
          title="bg-music-youtube"
          src={youtubeEmbedUrl}
          allow="autoplay; encrypted-media"
          referrerPolicy="strict-origin-when-cross-origin"
          style={{
            position: "fixed",
            width: "1px",
            height: "1px",
            left: "-9999px",
            top: "0",
            border: "0",
            opacity: 0,
            pointerEvents: "none"
          }}
        />
      )}

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
