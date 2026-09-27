import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { formatMexicoDateTime } from "../lib/date.js";

const THEME_STORAGE_KEY = "gc_theme";
const LIGHT_THEME = "day";
const DARK_THEME = "dark";

function navLinkClass({ isActive }) {
  return `market-nav__link${isActive ? " is-active" : ""}`;
}

const ICON_PATHS = {
  sections: "M4 5.5h7v7H4v-7Zm9 0h7v7h-7v-7ZM4 14h7v4.5H4V14Zm9 0h7v4.5h-7V14Z",
  home: "M3 10.8 12 3l9 7.8-1.4 1.6-1.1-1v8.1h-5.2v-5.2h-2.6v5.2H5.5v-8.1l-1.1 1L3 10.8Z",
  catalog: "M4 5h7v7H4V5Zm9 0h7v7h-7V5ZM4 14h7v5H4v-5Zm9 0h7v5h-7v-5Z",
  control: "M5 4h14v4H5V4Zm0 6h8v10H5V10Zm10 0h4v10h-4V10Z",
  profile: "M12 12.2a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2.2c-4.3 0-7.8 2.1-7.8 4.7 0 .9.7 1.7 1.7 1.7h12.2c1 0 1.7-.8 1.7-1.7 0-2.6-3.5-4.7-7.8-4.7Z",
  cart: "M7 18.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Zm10 0a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6ZM3.2 3l.4 2h2l2 9.7c.2 1 1.1 1.8 2.1 1.8h7.8c1 0 1.8-.6 2.1-1.5L22 8H8.1L7.6 5.4A3 3 0 0 0 4.7 3H3.2Z",
  support: "M12 3.5a8 8 0 0 0-8 8v3.2A2.3 2.3 0 0 0 6.3 17H8v-5H6.1v-.5a5.9 5.9 0 1 1 11.8 0v.5H16v5h1.2c-.5 1.2-1.7 2-3.2 2h-2v2h2c3.5 0 6-2.2 6-5.3v-4.2a8 8 0 0 0-8-8Z",
  about: "M11 7h2V5h-2v2Zm0 12h2V9h-2v10Zm1 3a10 10 0 1 1 0-20 10 10 0 0 1 0 20Z",
  admin: "M12 2 20 5.5v6c0 5-3.4 8.6-8 10.5-4.6-1.9-8-5.5-8-10.5v-6L12 2Zm-3 9.5 2 2 4-4-1.4-1.4L11 10.7l-.6-.6L9 11.5Z",
  shortcuts: "M5 4h14v3H5V4Zm0 5h9v3H5V9Zm0 5h14v3H5v-3Zm11-5h3v3h-3V9Z",
  activity: "M4 12h4l2-5 4 10 2-5h4v2h-2.6L14 21 10 11 9.4 14H4v-2Z",
  close: "m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5Z",
  category: "M4 5h16v4H4V5Zm0 6h10v4H4v-4Zm12 0h4v8h-4v-8ZM4 17h10v2H4v-2Z",
  theme: "M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9Z",
  top: "M12 4 5 11h4v9h6v-9h4l-7-7Z"
};

function AppIcon({ name, className = "" }) {
  return (
    <svg className={`ui-icon ${className}`.trim()} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={ICON_PATHS[name] || ICON_PATHS.category} />
    </svg>
  );
}

function normalizeTheme(value) {
  if (value === DARK_THEME || value === "neo") {
    return DARK_THEME;
  }

  if (value === LIGHT_THEME) {
    return LIGHT_THEME;
  }

  return null;
}

function getInitialTheme() {
  if (typeof window === "undefined") {
    return LIGHT_THEME;
  }

  try {
    const savedTheme = normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
    if (savedTheme) {
      return savedTheme;
    }
  } catch {
    return LIGHT_THEME;
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? DARK_THEME : LIGHT_THEME;
}

function pathLabel(pathname) {
  const map = {
    "/": "Inicio",
    "/catalogo": "Catalogo",
    "/perfil": "Perfil",
    "/carrito": "Carrito",
    "/checkout": "Checkout",
    "/chat": "Soporte",
    "/admin": "Admin",
    "/dashboard": "Dashboard",
    "/terminos": "Terminos",
    "/sobre-nosotros": "Nosotros",
    "/centro-control": "Centro de Control"
  };

  if (pathname.startsWith("/producto")) {
    return "Producto";
  }

  return map[pathname] || "Vista";
}

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

function isYouTubeUrl(url) {
  try {
    const parsed = new URL(String(url || ""));
    return /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i.test(parsed.hostname);
  } catch {
    return false;
  }
}

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [searchSuggesting, setSearchSuggesting] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [siteData, setSiteData] = useState({ settings: {}, general: {}, categories: [] });
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [routeLog, setRouteLog] = useState([]);
  const [theme, setTheme] = useState(getInitialTheme);
  const audioRef = useRef(null);
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/recuperar-contrasena";
  const usesCatalogScrollHeader = location.pathname === "/catalogo" || location.pathname.startsWith("/producto/");
  const isDarkTheme = theme === DARK_THEME;
  const toggleTheme = () => {
    setTheme((current) => (current === DARK_THEME ? LIGHT_THEME : DARK_THEME));
  };

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

  useEffect(() => {
    const savedRoutes = loadJson("gc_route_log", []);
    if (Array.isArray(savedRoutes)) {
      setRouteLog(savedRoutes.slice(0, 20));
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const searchParam = new URLSearchParams(location.search).get("search") || "";
    setSearch(searchParam);
  }, [location.search]);

  useEffect(() => {
    const query = search.trim();

    if (query.length < 2) {
      setSearchSuggestions([]);
      setSearchSuggesting(false);
      return undefined;
    }

    let active = true;
    const timer = window.setTimeout(() => {
      setSearchSuggesting(true);
      apiFetch(`/products?search=${encodeURIComponent(query)}&limit=5`)
        .then((payload) => {
          if (active) {
            setSearchSuggestions(payload.items || []);
          }
        })
        .catch(() => {
          if (active) {
            setSearchSuggestions([]);
          }
        })
        .finally(() => {
          if (active) {
            setSearchSuggesting(false);
          }
        });
    }, 180);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [search]);

  useEffect(() => {
    if (isAuthPage) {
      return;
    }

    const entry = {
      path: location.pathname,
      label: pathLabel(location.pathname),
      when: new Date().toISOString()
    };

    setRouteLog((current) => {
      const next = [entry, ...current.filter((item) => item.path !== entry.path)].slice(0, 20);
      window.localStorage.setItem("gc_route_log", JSON.stringify(next));
      return next;
    });
  }, [location.pathname, isAuthPage]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const isCommandKey = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
      if (isCommandKey) {
        event.preventDefault();
        setCommandOpen(true);
      }

      if (event.key === "Escape") {
        setCommandOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!usesCatalogScrollHeader) {
      setHeaderHidden(false);
      return () => {};
    }

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
        const goingUp = delta < -2;

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
  }, [usesCatalogScrollHeader]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();

    if (search.trim()) {
      params.set("search", search.trim());
    }

    navigate(`/catalogo${params.toString() ? `?${params.toString()}` : ""}`);
    setSearchFocused(false);
  };

  const navItems = useMemo(() => {
    const core = [
      { label: "Inicio", path: "/", hint: "Portada", icon: "home" },
      { label: "Catalogo", path: "/catalogo", hint: "Vistas comerciales", icon: "catalog" },
      { label: "Perfil", path: "/perfil", hint: "Tu cuenta", icon: "profile" },
      { label: "Carrito", path: "/carrito", hint: "Tu pedido", icon: "cart" },
      { label: "Soporte", path: "/chat", hint: "Atencion", icon: "support" },
      { label: "Nosotros", path: "/sobre-nosotros", hint: "Informacion", icon: "about" }
    ];

    if (isAdmin) {
      core.splice(2, 0, { label: "Centro de Control", path: "/centro-control", hint: "Productividad", icon: "control" });
      core.push({ label: "Panel Admin", path: "/admin", hint: "Gestion", icon: "admin" });
    }

    return core;
  }, [isAdmin]);

  const whatsappLink = siteData.general?.paymentLinks?.whatsapp || siteData.general?.whatsapp || "";
  const supportHref = whatsappLink || "/chat";
  const supportIsExternal = /^https?:\/\//i.test(supportHref);
  const footerWhatsappHref = "https://wa.me/529616205707";
  const supportEmail = siteData.general?.supportEmail || "graycshop.26@gmail.com";
  const activeTrack = useMemo(() => {
    const tracks = Array.isArray(siteData.music) ? siteData.music : [];
    return tracks.find((track) => track.activa !== false && track.audioUrl) || null;
  }, [siteData.music]);
  const canPlayInlineTrack = activeTrack?.audioUrl && !isYouTubeUrl(activeTrack.audioUrl);
  const musicVolume = Math.max(0, Math.min(1, Number(siteData.general?.backgroundMusicVolume ?? 35) / 100));

  useEffect(() => {
    const player = audioRef.current;
    if (!player || !canPlayInlineTrack) {
      return undefined;
    }

    player.volume = musicVolume;
    player.muted = false;

    let unlocked = false;
    const startMusic = async () => {
      if (unlocked || !audioRef.current) {
        return;
      }

      try {
        audioRef.current.volume = musicVolume;
        audioRef.current.muted = false;
        await audioRef.current.play();
        unlocked = true;
      } catch {
        unlocked = false;
      }
    };

    startMusic();
    window.addEventListener("pointerdown", startMusic, { capture: true });
    window.addEventListener("click", startMusic, { capture: true });
    window.addEventListener("touchstart", startMusic, { capture: true });
    window.addEventListener("keydown", startMusic, { capture: true });

    return () => {
      window.removeEventListener("pointerdown", startMusic, { capture: true });
      window.removeEventListener("click", startMusic, { capture: true });
      window.removeEventListener("touchstart", startMusic, { capture: true });
      window.removeEventListener("keydown", startMusic, { capture: true });
    };
  }, [musicVolume, activeTrack?.audioUrl, canPlayInlineTrack]);

  useEffect(() => {
    const player = audioRef.current;
    if (player) {
      player.volume = musicVolume;
    }
  }, [musicVolume]);

  const commandItems = useMemo(() => {
    const actionItems = [
      {
        id: "theme",
        label: isDarkTheme ? "Cambiar a modo claro" : "Cambiar a modo oscuro",
        hint: `Tema actual: ${isDarkTheme ? "oscuro" : "claro"}`,
        icon: "theme",
        action: toggleTheme
      },
      {
        id: "top",
        label: "Ir arriba",
        hint: "Scroll suave",
        icon: "top",
        action: () => window.scrollTo({ top: 0, behavior: "smooth" })
      }
    ];

    const pathItems = navItems.map((item) => ({
      id: item.path,
      label: item.label,
      hint: item.hint,
      icon: item.icon,
      action: () => navigate(item.path)
    }));

    const all = [...pathItems, ...actionItems];
    if (!commandQuery.trim()) {
      return all;
    }

    const query = commandQuery.trim().toLowerCase();
    return all.filter((item) => `${item.label} ${item.hint}`.toLowerCase().includes(query));
  }, [commandQuery, isDarkTheme, navItems, navigate]);

  if (isAuthPage) {
    return (
      <div className="marketplace">
        <div className="halloween-mobile-scene" aria-hidden="true">
          <img src="/assets/halloween-ghost-bats.png" alt="" />
        </div>
        <div className="halloween-desktop-host" aria-hidden="true">
          <img src="/assets/halloween-desktop-host.png" alt="" />
        </div>
        <main className="market-content">
          <Outlet />
        </main>
      </div>
    );
  }

  if (loading && isAuthenticated) {
    return <div className="page-loader">Cargando sesion...</div>;
  }

  return (
    <div className="marketplace">
      <div className="halloween-mobile-scene" aria-hidden="true">
        <img src="/assets/halloween-ghost-bats.png" alt="" />
      </div>
      <div className="halloween-desktop-host" aria-hidden="true">
        <img src="/assets/halloween-desktop-host.png" alt="" />
      </div>
      <header className={`market-header${usesCatalogScrollHeader ? " is-scroll-aware" : " is-static"}${headerHidden ? " is-hidden" : ""}`}>
        <div className="market-header__top">
          <Link to="/" className="brand">
            <span className="brand__badge">
              <img
                src={siteData.general?.logoUrl || "/assets/gray-c-shop-logo.png?v=20260514-2"}
                alt={siteData.general.siteName || "Gray C Shop"}
                className="brand__logo"
              />
            </span>
            <span>
              <strong>{siteData.general.siteName || "Gray C Shop"}</strong>
              <small>{siteData.general.tagline || "Nueva experiencia premium de compra"}</small>
            </span>
          </Link>

          <form className="searchbar" onSubmit={handleSearchSubmit}>
            <span className="searchbar__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M10.8 5.2a5.6 5.6 0 1 1 0 11.2 5.6 5.6 0 0 1 0-11.2Zm0 2a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Zm4.7 8.1 4.1 4.1-1.4 1.4-4.1-4.1 1.4-1.4Z" />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Busca por nombre, marca, categoria o tags"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => window.setTimeout(() => setSearchFocused(false), 140)}
            />
            <button type="submit">Buscar</button>
            {searchFocused && search.trim().length >= 2 && (
              <div className="search-suggestions">
                <div className="search-suggestions__top">
                  <strong>Sugerencias</strong>
                  <small>{searchSuggesting ? "Buscando..." : `${searchSuggestions.length} resultado(s)`}</small>
                </div>
                {searchSuggestions.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className="search-suggestion"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setSearchFocused(false);
                      navigate(`/producto/${product.slug || product.id}`);
                    }}
                  >
                    <img src={product.imagenes?.[0] || "/assets/gray-c-shop-logo.png?v=20260514-2"} alt="" />
                    <span>
                      <strong>{product.nombre}</strong>
                      <small>{product.marca || product.categoria} | ${Number(product.precio || 0).toFixed(2)}</small>
                    </span>
                  </button>
                ))}
                {!searchSuggesting && !searchSuggestions.length && (
                  <button type="submit" className="search-suggestion search-suggestion--plain">
                    Ver busqueda completa para "{search.trim()}"
                  </button>
                )}
              </div>
            )}
          </form>

          <div className="header-actions">
            {isAdmin && (
              <Link to="/admin" className="button button--primary">
                Panel admin
              </Link>
            )}
            {isAuthenticated ? <Link to="/perfil" className="account-chip">
              <span className="account-chip__avatar" aria-hidden="true">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" />
                ) : (
                  <svg viewBox="0 0 24 24" focusable="false">
                    <path d="M12 12.2a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2.2c-4.3 0-7.8 2.1-7.8 4.7 0 .9.7 1.7 1.7 1.7h12.2c1 0 1.7-.8 1.7-1.7 0-2.6-3.5-4.7-7.8-4.7Z" />
                  </svg>
                )}
              </span>
              <span className="account-chip__text">
                <span>{user?.nombre}</span>
                <small>{isAdmin ? "Panel administrador" : "Cuenta activa"}</small>
              </span>
            </Link> : <Link to="/login" state={{ from: location }} className="button button--primary header-login-button">
              Iniciar sesion
            </Link>}
            {isAuthenticated && <Link to="/carrito" className="cart-button">
              <svg className="cart-button__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M7 18.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Zm10 0a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6ZM3.2 3l.4 2h2l2 9.7c.2 1 1.1 1.8 2.1 1.8h7.8c1 0 1.8-.6 2.1-1.5L22 8H8.1L7.6 5.4A3 3 0 0 0 4.7 3H3.2Zm5.3 7h10.8l-1.4 4.3H9.4L8.5 10Z" />
              </svg>
              <span className="cart-button__label">Carrito</span>
              <span className="cart-button__count">{itemCount}</span>
            </Link>}
            {isAuthenticated && <button type="button" className="button button--ghost" onClick={logout}>
              Salir
            </button>}
          </div>
        </div>

        <nav className="market-nav">
          <NavLink to="/" end className={navLinkClass}>
            <AppIcon name="home" />
            <span>Inicio</span>
          </NavLink>
          <NavLink to="/catalogo" className={navLinkClass}>
            <AppIcon name="catalog" />
            <span>Catalogo</span>
          </NavLink>
          <NavLink to="/chat" className={navLinkClass}>
            <AppIcon name="support" />
            <span>Soporte</span>
          </NavLink>
        </nav>

        {!!noticeOpen && (
          <div className="notice-panel">
            <div className="section-heading section-heading--compact">
              <div>
                <p className="section-label">Actividad reciente</p>
                <h2>Historial de navegacion</h2>
              </div>
            </div>
            <div className="list-stack">
              {routeLog.slice(0, 6).map((item, index) => (
                <button key={`${item.path}-${index}`} type="button" className="thread-card" onClick={() => navigate(item.path)}>
                  <AppIcon name="activity" />
                  <span>
                    <strong>{item.label}</strong>
                    <small>{formatMexicoDateTime(item.when)}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <div className="market-main-shell">
        <main className="market-content">
          <Outlet context={{ theme, isDarkTheme, toggleTheme }} />
        </main>
      </div>

      <nav className="mobile-dock">
        <button type="button" onClick={() => navigate("/")}><AppIcon name="home" /><span>Inicio</span></button>
        <button type="button" onClick={() => navigate("/catalogo")}><AppIcon name="catalog" /><span>Catalogo</span></button>
        <button type="button" onClick={() => setMobileMenuOpen(true)}><AppIcon name="sections" /><span>Menu</span></button>
        <button type="button" onClick={() => navigate(isAuthenticated ? (isAdmin ? "/admin" : "/perfil") : "/login", isAuthenticated ? undefined : { state: { from: location } })}>
          <AppIcon name={isAdmin ? "admin" : "profile"} />
          <span>{isAdmin ? "Admin" : isAuthenticated ? "Perfil" : "Entrar"}</span>
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" role="presentation" onClick={() => setMobileMenuOpen(false)}>
          <aside className="mobile-side-menu" aria-label="Menu de navegacion" onClick={(event) => event.stopPropagation()}>
            <div className="mobile-side-menu__head">
              <div><p className="section-label">Gray C Shop</p><strong>Menu</strong></div>
              <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Cerrar menu">×</button>
            </div>
            {navItems.map((item) => (
              <button key={item.path} type="button" onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}>
                <AppIcon name={item.icon} />
                <span><strong>{item.label}</strong><small>{item.hint}</small></span>
              </button>
            ))}
          </aside>
        </div>
      )}

      {canPlayInlineTrack && (
        <audio
          ref={audioRef}
          className="ambient-audio"
          src={activeTrack.audioUrl}
          autoPlay
          loop
          preload="auto"
          controls={false}
          playsInline
          aria-hidden="true"
        />
      )}

      <div className="magic-dock" aria-label="Contacto por WhatsApp">
        <a
          className="magic-dock__button magic-dock__button--support"
          href={supportHref}
          target={supportIsExternal ? "_blank" : undefined}
          rel={supportIsExternal ? "noreferrer" : undefined}
        >
          <svg viewBox="0 0 448 512" aria-hidden="true"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32 101.5 32 2 131.5 2 253.9c0 44.9 11.7 88.8 33.9 127L0 480l102.5-33.8c37.5 20.4 79.7 31.1 121.3 31.1h.1C346.2 477.3 448 377.8 448 255.4c0-59.3-25.2-115-67.1-158.3zM223.9 439.6c-37.1 0-73.3-10-104.9-28.9l-7.5-4.5-60.8 20 20.4-59.2-4.9-7.7c-20.6-32.8-31.5-70.7-31.5-109.4 0-103.8 84.5-188.3 188.4-188.3 50.3 0 97.6 19.6 133.2 55.2 35.6 35.6 57 82.9 56.9 133.3 0 103.9-85.4 189.5-189.3 189.5zm101.7-138.9c-5.6-2.8-33.1-16.3-38.2-18.2-5.1-1.9-8.8-2.8-12.6 2.8-3.7 5.6-14.5 18.2-17.7 22-3.3 3.7-6.5 4.2-12.1 1.4-32.9-16.4-54.5-29.3-76.4-66.4-5.8-10 5.8-9.3 16.4-30.9 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.6-30.3-17.2-41.5-4.5-10.8-9.1-9.3-12.6-9.5-3.3-.2-7-.2-10.7-.2-3.7 0-9.8 1.4-14.9 6.9-5.1 5.6-19.6 19.1-19.6 46.5s20.1 54 22.9 57.7c2.8 3.7 39.5 60.3 95.7 84.6 35.5 15.3 49.4 16.6 67.1 14 10.8-1.6 33.1-13.5 37.7-26.5 4.7-13 4.7-24.2 3.3-26.5-1.3-2.5-5-3.9-10.6-6.6z" /></svg>
          <span className="sr-only">WhatsApp</span>
        </a>
      </div>

      {commandOpen && (
        <div className="command-overlay" role="dialog" aria-modal="true">
          <div className="command-modal">
            <div className="command-modal__top">
              <strong>Comandos rapidos</strong>
              <button type="button" className="button button--ghost" onClick={() => setCommandOpen(false)}>
                Cerrar
              </button>
            </div>
            <input
              type="search"
              placeholder="Escribe para navegar o ejecutar acciones"
              value={commandQuery}
              onChange={(event) => setCommandQuery(event.target.value)}
              autoFocus
            />
            <div className="command-list">
              {commandItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="command-item"
                  onClick={() => {
                    item.action();
                    setCommandOpen(false);
                    setCommandQuery("");
                  }}
                >
                  <AppIcon name={item.icon} />
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.hint}</small>
                  </span>
                </button>
              ))}
              {!commandItems.length && <p className="muted-text">Sin coincidencias para tu busqueda.</p>}
            </div>
          </div>
        </div>
      )}

      <footer className="market-footer">
        <div className="market-footer__grid">
          <div className="market-footer__brand">
            <Link to="/" className="market-footer__brand-lockup">
              <img src={siteData.general?.logoUrl || "/assets/gray-c-shop-logo.png?v=20260514-2"} alt="" />
              <span><strong>{siteData.general.siteName || "Gray C Shop"}</strong><small>Eleva tu estilo de vida</small></span>
            </Link>
            <p>Productos digitales, tecnología, hogar y suscripciones IA en un solo lugar.</p>
          </div>

          <details className="market-footer__column" open>
            <summary>Tienda</summary>
            <div><Link to="/"><AppIcon name="home" />Inicio</Link><Link to="/catalogo"><AppIcon name="catalog" />Catálogo</Link><Link to="/sobre-nosotros"><AppIcon name="about" />Sobre nosotros</Link></div>
          </details>

          <details className="market-footer__column market-footer__column--help" open>
            <summary>Ayuda</summary>
            <div><Link to="/chat"><AppIcon name="support" />Centro de soporte</Link><a className="is-highlighted" href={footerWhatsappHref} target="_blank" rel="noreferrer"><AppIcon name="support" />WhatsApp</a><a href={`mailto:${supportEmail}`}><AppIcon name="support" />Correo de soporte</a></div>
          </details>

          <details className="market-footer__column" open>
            <summary>Legal</summary>
            <div><Link to="/terminos"><AppIcon name="about" />Términos y condiciones</Link><Link to="/terminos"><AppIcon name="about" />Política de privacidad</Link><Link to="/terminos"><AppIcon name="about" />Reembolsos</Link></div>
          </details>
        </div>
        <div className="market-footer__bottom">
          <span>© {new Date().getFullYear()} Gray C Shop. Todos los derechos reservados.</span>
          <span>Pagos protegidos · Mercado Pago · PayPal · Tarjetas</span>
        </div>
      </footer>
    </div>
  );
}
