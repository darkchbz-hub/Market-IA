import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

const themeCycle = ["day", "neo", "luxe"];

function navLinkClass({ isActive }) {
  return `market-nav__link${isActive ? " is-active" : ""}`;
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

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const [search, setSearch] = useState("");
  const [headerHidden, setHeaderHidden] = useState(false);
  const [siteData, setSiteData] = useState({ settings: {}, general: {}, categories: [] });
  const [theme, setTheme] = useState("aurora");
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const [routeLog, setRouteLog] = useState([]);
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  useEffect(() => {
    apiFetch("/products/home")
      .then((payload) => {
        setSiteData({
          settings: payload.settings || {},
          general: payload.general || {},
          categories: payload.categories || []
        });
      })
      .catch(() => {
        setSiteData({ settings: {}, general: {}, categories: [] });
      });
  }, []);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("gc_theme") || "day";
    const normalizedTheme = savedTheme === "aurora" ? "day" : savedTheme;
    if (themeCycle.includes(normalizedTheme)) {
      setTheme(normalizedTheme);
    }

    const savedRoutes = loadJson("gc_route_log", []);
    if (Array.isArray(savedRoutes)) {
      setRouteLog(savedRoutes.slice(0, 20));
    }
  }, []);

  useEffect(() => {
    const searchParam = new URLSearchParams(location.search).get("search") || "";
    setSearch(searchParam);
  }, [location.search]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("gc_theme", theme);
  }, [theme]);

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
  };

  const navItems = useMemo(() => {
    const core = [
      { label: "Inicio", path: "/", hint: "Portada" },
      { label: "Catalogo", path: "/catalogo", hint: "Vistas comerciales" },
      { label: "Centro de Control", path: "/centro-control", hint: "Productividad" },
      { label: "Perfil", path: "/perfil", hint: "Tu cuenta" },
      { label: "Carrito", path: "/carrito", hint: "Tu pedido" },
      { label: "Soporte", path: "/chat", hint: "Atencion" },
      { label: "Nosotros", path: "/sobre-nosotros", hint: "Informacion" }
    ];

    if (isAdmin) {
      core.push({ label: "Panel Admin", path: "/admin", hint: "Gestion" });
    }

    return core;
  }, [isAdmin]);

  const quickCategories = useMemo(() => siteData.categories.slice(0, 8), [siteData.categories]);

  const commandItems = useMemo(() => {
    const actionItems = [
      {
        id: "theme",
        label: "Cambiar tema visual",
        hint: "Aurora / Neo / Luxe",
        action: () => {
          const currentIndex = themeCycle.indexOf(theme);
          const nextTheme = themeCycle[(currentIndex + 1) % themeCycle.length];
          setTheme(nextTheme);
        }
      },
      {
        id: "top",
        label: "Ir arriba",
        hint: "Scroll suave",
        action: () => window.scrollTo({ top: 0, behavior: "smooth" })
      }
    ];

    const pathItems = navItems.map((item) => ({
      id: item.path,
      label: item.label,
      hint: item.hint,
      action: () => navigate(item.path)
    }));

    const all = [...pathItems, ...actionItems];
    if (!commandQuery.trim()) {
      return all;
    }

    const query = commandQuery.trim().toLowerCase();
    return all.filter((item) => `${item.label} ${item.hint}`.toLowerCase().includes(query));
  }, [commandQuery, navItems, navigate, theme]);

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
            <span className="searchbar__icon">Q</span>
            <input
              type="search"
              placeholder="Buscar secciones, novedades y soporte"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button type="submit">Buscar</button>
          </form>

          <div className="header-actions">
            <button type="button" className="button button--ghost" onClick={() => setCommandOpen(true)}>
              Atajos
            </button>
            <button type="button" className="button button--ghost" onClick={() => setSectionsOpen((current) => !current)}>
              Secciones
            </button>
            <button type="button" className="button button--ghost" onClick={() => setNoticeOpen((current) => !current)}>
              Actividad
            </button>
            <Link to="/perfil" className="account-chip">
              <span>{user?.nombre}</span>
              <small>{isAdmin ? "Panel administrador" : "Cuenta activa"}</small>
            </Link>
            <Link to="/carrito" className="cart-button">
              Carrito
              <span>{itemCount}</span>
            </Link>
            <button type="button" className="button button--ghost" onClick={logout}>
              Salir
            </button>
          </div>
        </div>

        <nav className="market-nav">
          <NavLink to="/" end className={navLinkClass}>
            Inicio
          </NavLink>
          <NavLink to="/catalogo" className={navLinkClass}>
            Catalogo
          </NavLink>
          <NavLink to="/centro-control" className={navLinkClass}>
            Centro de control
          </NavLink>
          <NavLink to="/chat" className={navLinkClass}>
            Soporte
          </NavLink>
        </nav>

        {sectionsOpen && (
          <div className="sections-panel">
            <div className="sections-panel__header">
              <div>
                <p className="section-label">Secciones rapidas</p>
                <h2>Explora solo lo importante</h2>
              </div>
              <button type="button" className="button button--ghost" onClick={() => setSectionsOpen(false)}>
                Cerrar
              </button>
            </div>
            <div className="sections-panel__grid">
              {navItems.map((item) => (
                <button key={item.path} type="button" className="market-rail__link" onClick={() => navigate(item.path)}>
                  <strong>{item.label}</strong>
                  <small>{item.hint}</small>
                </button>
              ))}
              {quickCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className="market-rail__link"
                  onClick={() => navigate(`/catalogo?category=${category.slug}`)}
                >
                  <strong>{category.nombre}</strong>
                  <small>{category.descripcion || "Categoria destacada"}</small>
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
                  <strong>{item.label}</strong>
                  <small>{new Date(item.when).toLocaleString()}</small>
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
        <aside className="market-rail">
          <p className="section-label">Navegacion Pro</p>
          <div className="list-stack">
            {navItems.map((item) => (
              <button key={item.path} type="button" className="market-rail__link" onClick={() => navigate(item.path)}>
                <strong>{item.label}</strong>
                <small>{item.hint}</small>
              </button>
            ))}
            <button type="button" className="market-rail__link" onClick={() => setSectionsOpen((current) => !current)}>
              <strong>Secciones</strong>
              <small>Categorias y accesos rapidos</small>
            </button>
          </div>
        </aside>

        <main className="market-content">
          <Outlet />
        </main>
      </div>

      <nav className="mobile-dock">
        <button type="button" onClick={() => navigate("/")}>Inicio</button>
        <button type="button" onClick={() => navigate("/catalogo")}>Catalogo</button>
        <button type="button" onClick={() => setCommandOpen(true)}>Atajos</button>
        <button type="button" onClick={() => navigate("/centro-control")}>Centro</button>
      </nav>

      <div className="magic-dock" aria-label="Acciones rapidas">
        <button type="button" className="magic-dock__button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          Arriba
        </button>
        <button type="button" className="magic-dock__button" onClick={() => navigate("/chat") }>
          Soporte
        </button>
        <button type="button" className="magic-dock__button" onClick={() => navigate("/catalogo") }>
          Vistas
        </button>
        <button
          type="button"
          className="magic-dock__button magic-dock__button--accent"
          onClick={() => {
            const currentIndex = themeCycle.indexOf(theme);
            const nextTheme = themeCycle[(currentIndex + 1) % themeCycle.length];
            setTheme(nextTheme);
          }}
        >
          Tema
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
                  <strong>{item.label}</strong>
                  <small>{item.hint}</small>
                </button>
              ))}
              {!commandItems.length && <p className="muted-text">Sin coincidencias para tu busqueda.</p>}
            </div>
          </div>
        </div>
      )}

      <footer className="market-footer">
        <div>
          <strong>{siteData.general.siteName || "Gray C Shop"}</strong>
          <p>Nueva experiencia visual, navegacion avanzada y herramientas de productividad integradas.</p>
        </div>
        <div className="market-footer__links">
          <Link to="/perfil">Mi cuenta</Link>
          <Link to="/chat">Centro de soporte</Link>
          <Link to="/centro-control">Centro de control</Link>
          <Link to="/sobre-nosotros">Sobre nosotros</Link>
        </div>
      </footer>
    </div>
  );
}
