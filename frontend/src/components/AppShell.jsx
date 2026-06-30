import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

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
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const [routeLog, setRouteLog] = useState([]);
  const [theme, setTheme] = useState(getInitialTheme);
  const audioRef = useRef(null);
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";
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
    setSearchFocused(false);
  };

  const navItems = useMemo(() => {
    const core = [
      { label: "Inicio", path: "/", hint: "Portada", icon: "home" },
      { label: "Catalogo", path: "/catalogo", hint: "Vistas comerciales", icon: "catalog" },
      { label: "Centro de Control", path: "/centro-control", hint: "Productividad", icon: "control" },
      { label: "Perfil", path: "/perfil", hint: "Tu cuenta", icon: "profile" },
      { label: "Carrito", path: "/carrito", hint: "Tu pedido", icon: "cart" },
      { label: "Soporte", path: "/chat", hint: "Atencion", icon: "support" },
      { label: "Nosotros", path: "/sobre-nosotros", hint: "Informacion", icon: "about" }
    ];

    if (isAdmin) {
      core.push({ label: "Panel Admin", path: "/admin", hint: "Gestion", icon: "admin" });
    }

    return core;
  }, [isAdmin]);

  const quickCategories = useMemo(() => siteData.categories.slice(0, 8), [siteData.categories]);
  const whatsappLink = siteData.general?.paymentLinks?.whatsapp || siteData.general?.whatsapp || "";
  const supportHref = whatsappLink || "/chat";
  const supportIsExternal = /^https?:\/\//i.test(supportHref);
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

  const breadcrumbs = useMemo(() => {
    const parts = location.pathname.split("/").filter(Boolean);
    if (!parts.length) {
      return ["Inicio"];
    }

    const map = {
      catalogo: "Catalogo",
      producto: "Producto",
      perfil: "Perfil",
      carrito: "Carrito",
      checkout: "Checkout",
      chat: "Soporte",
      admin: "Administrador",
      dashboard: "Dashboard",
      terminos: "Terminos",
      "sobre-nosotros": "Sobre nosotros",
      "centro-control": "Centro de control"
    };

    return ["Inicio", ...parts.map((part) => map[part] || part)];
  }, [location.pathname]);

  if (isAuthPage) {
    return (
      <div className="marketplace">
        <button
          type="button"
          className="button button--theme app-theme-fab"
          onClick={toggleTheme}
          aria-pressed={isDarkTheme}
          title={isDarkTheme ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          <span className="theme-label theme-label--full">Accesibilidad: {isDarkTheme ? "Claro" : "Oscuro"}</span>
          <span className="theme-label theme-label--short">{isDarkTheme ? "Claro" : "Oscuro"}</span>
        </button>
        <main className="market-content">
          <Outlet />
        </main>
      </div>
    );
  }

  if (loading) {
    return <div className="page-loader">Cargando sesion...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <div className="marketplace">
      <header className={`market-header${headerHidden ? " is-hidden" : ""}`}>
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
            <Link to="/perfil" className="account-chip">
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
            </Link>
            <Link to="/carrito" className="cart-button">
              <svg className="cart-button__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M7 18.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Zm10 0a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6ZM3.2 3l.4 2h2l2 9.7c.2 1 1.1 1.8 2.1 1.8h7.8c1 0 1.8-.6 2.1-1.5L22 8H8.1L7.6 5.4A3 3 0 0 0 4.7 3H3.2Zm5.3 7h10.8l-1.4 4.3H9.4L8.5 10Z" />
              </svg>
              <span className="cart-button__label">Carrito</span>
              <span className="cart-button__count">{itemCount}</span>
            </Link>
            <button type="button" className="button button--ghost" onClick={logout}>
              Salir
            </button>
          </div>
        </div>

        <nav className="market-nav">
          <button type="button" className="market-nav__link market-nav__link--button" onClick={() => setSectionsOpen((current) => !current)}>
            <AppIcon name={sectionsOpen ? "close" : "sections"} />
            <span>{sectionsOpen ? "Cerrar secciones" : "Secciones"}</span>
          </button>
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

        {sectionsOpen && (
          <div className="sections-panel">
            <div className="sections-panel__header">
              <div>
                <p className="section-label">Secciones rapidas</p>
                <h2>Explora sin saturar la portada</h2>
              </div>
              <div className="header-actions">
                <button type="button" className="button button--ghost" onClick={() => setCommandOpen(true)}>
                  <AppIcon name="shortcuts" />
                  <span>Atajos</span>
                </button>
                <button type="button" className="button button--ghost" onClick={() => setNoticeOpen((current) => !current)}>
                  <AppIcon name="activity" />
                  <span>Actividad</span>
                </button>
                <button type="button" className="button button--ghost" onClick={() => setSectionsOpen(false)}>
                  <AppIcon name="close" />
                  <span>Cerrar</span>
                </button>
              </div>
            </div>
            <div className="sections-panel__grid">
              {navItems.map((item) => (
                <button key={item.path} type="button" className="market-rail__link" onClick={() => navigate(item.path)}>
                  <AppIcon name={item.icon} />
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.hint}</small>
                  </span>
                </button>
              ))}
              {quickCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className="market-rail__link"
                  onClick={() => navigate(`/catalogo?category=${category.slug}`)}
                >
                  <AppIcon name="category" />
                  <span>
                    <strong>{category.nombre}</strong>
                    <small>{category.descripcion || "Categoria destacada"}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

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
                    <small>{new Date(item.when).toLocaleString()}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <section className="breadcrumbs">
        {breadcrumbs.map((crumb, index) => (
          <span key={`${crumb}-${index}`} className="breadcrumbs__item">
            {crumb}
          </span>
        ))}
      </section>

      <div className="market-main-shell">
        <main className="market-content">
          <Outlet />
        </main>
      </div>

      <nav className="mobile-dock">
        <button type="button" onClick={() => navigate("/")}><AppIcon name="home" /><span>Inicio</span></button>
        <button type="button" onClick={() => navigate("/catalogo")}><AppIcon name="catalog" /><span>Catalogo</span></button>
        <button type="button" onClick={() => setCommandOpen(true)}><AppIcon name="shortcuts" /><span>Atajos</span></button>
        <button type="button" onClick={() => navigate(isAdmin ? "/admin" : "/centro-control")}>
          <AppIcon name={isAdmin ? "admin" : "control"} />
          <span>{isAdmin ? "Admin" : "Centro"}</span>
        </button>
      </nav>

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

      <div className="magic-dock" aria-label="Accesibilidad visual">
        <a
          className="magic-dock__button magic-dock__button--support"
          href={supportHref}
          target={supportIsExternal ? "_blank" : undefined}
          rel={supportIsExternal ? "noreferrer" : undefined}
        >
          Soporte
        </a>
        <button
          type="button"
          className="magic-dock__button magic-dock__button--accent magic-dock__button--theme"
          onClick={toggleTheme}
          aria-pressed={isDarkTheme}
          title={isDarkTheme ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          <span className="theme-label theme-label--full">Accesibilidad: {isDarkTheme ? "Claro" : "Oscuro"}</span>
          <span className="theme-label theme-label--short">{isDarkTheme ? "Claro" : "Oscuro"}</span>
        </button>
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
        <div className="market-footer__brand">
          <strong>{siteData.general.siteName || "Gray C Shop"}</strong>
          <p>Productos digitales, tecnologia, hogar y suscripciones IA.</p>
        </div>
        <div className="market-footer__links">
          <Link to="/"><AppIcon name="home" />Inicio</Link>
          <Link to="/catalogo"><AppIcon name="catalog" />Catalogo</Link>
          <Link to="/chat"><AppIcon name="support" />Soporte</Link>
          <Link to="/terminos"><AppIcon name="about" />Terminos y condiciones</Link>
          <Link to="/terminos"><AppIcon name="about" />Politica de privacidad</Link>
          <Link to="/terminos"><AppIcon name="about" />Reembolsos</Link>
          <a href={supportHref} target={supportIsExternal ? "_blank" : undefined} rel={supportIsExternal ? "noreferrer" : undefined}>
            <AppIcon name="support" />WhatsApp
          </a>
          <a href={`mailto:${supportEmail}`}><AppIcon name="support" />Correo de soporte</a>
        </div>
      </footer>
    </div>
  );
}
