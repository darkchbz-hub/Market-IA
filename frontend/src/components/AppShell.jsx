import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

function navLinkClass({ isActive }) {
  return `market-nav__link${isActive ? " is-active" : ""}`;
}

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const currentSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(currentSearch);

  useEffect(() => {
    setSearch(currentSearch);
  }, [currentSearch]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();

    if (search.trim()) {
      params.set("search", search.trim());
    }

    const queryString = params.toString();
    navigate(queryString ? `/?${queryString}` : "/");
  };

  const buildCategoryUrl = (category) => {
    const params = new URLSearchParams();
    const query = location.pathname === "/" ? searchParams.get("search") || "" : "";

    if (query) {
      params.set("search", query);
    }

    if (category) {
      params.set("category", category);
    }

    const queryString = params.toString();
    return queryString ? `/?${queryString}` : "/";
  };

  return (
    <div className="marketplace">
      <header className="market-header">
        <div className="market-header__top">
          <Link to="/" className="brand">
            <span className="brand__badge">MZ</span>
            <span className="brand__text">MarketZone</span>
          </Link>

          <form className="searchbar" onSubmit={handleSearchSubmit}>
            <input
              type="search"
              placeholder="Buscar suscripciones, packs, apps o servicios"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button type="submit">Buscar</button>
          </form>

          <div className="header-actions">
            {isAuthenticated ? (
              <>
                <div className="account-chip">
                  <span>Hola, {user?.nombre}</span>
                  <small>{isAdmin ? "Administrador" : "Mi cuenta"}</small>
                </div>
                <Link to="/carrito" className="cart-button">
                  Carrito
                  <span>{itemCount}</span>
                </Link>
                <button type="button" className="button button--light" onClick={logout}>
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="button button--light">
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
          <NavLink to={buildCategoryUrl("")} className={navLinkClass}>
            Todo
          </NavLink>
          <NavLink to={buildCategoryUrl("apps")} className={navLinkClass}>
            Apps IA
          </NavLink>
          <NavLink to={buildCategoryUrl("packs")} className={navLinkClass}>
            Packs
          </NavLink>
          <NavLink to={buildCategoryUrl("webs")} className={navLinkClass}>
            Servicios web
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/perfil" className={navLinkClass}>
              Perfil
            </NavLink>
          )}
          {isAuthenticated && (
            <NavLink to="/chat" className={navLinkClass}>
              Soporte
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={navLinkClass}>
              Admin
            </NavLink>
          )}
        </nav>
      </header>

      <main className="market-content">
        <Outlet />
      </main>

      <footer className="market-footer">
        <p>MarketZone. Marketplace para suscripciones IA, herramientas y servicios digitales.</p>
      </footer>
    </div>
  );
}
