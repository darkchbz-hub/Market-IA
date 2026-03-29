import { query } from "../../db/pool.js";

export async function getAdminSummary() {
  const [usersResult, productsResult, ordersResult] = await Promise.all([
    query(`SELECT COUNT(*)::int AS total FROM users`),
    query(`SELECT COUNT(*)::int AS total FROM products WHERE is_active = TRUE`),
    query(
      `
        SELECT
          COUNT(*)::int AS total_orders,
          COUNT(*) FILTER (WHERE estado = 'pending')::int AS pending_orders,
          COUNT(*) FILTER (WHERE estado = 'paid')::int AS paid_orders,
          COALESCE(SUM(total_cents) FILTER (WHERE estado = 'paid'), 0)::int AS total_revenue_cents
        FROM orders
      `
    )
  ]);

  return {
    usuarios: usersResult.rows[0]?.total || 0,
    productosActivos: productsResult.rows[0]?.total || 0,
    ordenes: ordersResult.rows[0]?.total_orders || 0,
    ordenesPendientes: ordersResult.rows[0]?.pending_orders || 0,
    ordenesPagadas: ordersResult.rows[0]?.paid_orders || 0,
    ingresos: Number(ordersResult.rows[0]?.total_revenue_cents || 0) / 100,
    ingresosCents: Number(ordersResult.rows[0]?.total_revenue_cents || 0)
  };
}

export async function listAdminUsers() {
  const { rows } = await query(
    `
      SELECT
        u.id,
        u.nombre,
        u.email,
        u.role,
        u.created_at,
        COUNT(o.id)::int AS total_orders,
        COALESCE(SUM(o.total_cents) FILTER (WHERE o.estado = 'paid'), 0)::int AS total_spent_cents
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `
  );

  return rows.map((row) => ({
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    role: row.role,
    fechaRegistro: row.created_at,
    totalOrdenes: row.total_orders,
    gastoTotal: Number(row.total_spent_cents) / 100,
    gastoTotalCents: Number(row.total_spent_cents)
  }));
}

export async function listAdminOrders() {
  const { rows } = await query(
    `
      SELECT
        o.id,
        o.user_id,
        o.total_cents,
        o.moneda,
        o.estado,
        o.payment_provider,
        o.created_at,
        u.nombre,
        u.email
      FROM orders o
      INNER JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
    `
  );

  return rows.map((row) => ({
    id: row.id,
    usuarioId: row.user_id,
    cliente: row.nombre,
    email: row.email,
    total: Number(row.total_cents) / 100,
    totalCents: Number(row.total_cents),
    moneda: row.moneda,
    estado: row.estado,
    proveedorPago: row.payment_provider,
    fecha: row.created_at
  }));
}

export async function getAdminAnalytics() {
  const [viewsResult, searchesResult, providerResult] = await Promise.all([
    query(
      `
        SELECT
          p.id,
          p.nombre,
          p.slug,
          COUNT(pv.id)::int AS total_views
        FROM products p
        LEFT JOIN product_views pv ON pv.product_id = p.id
        GROUP BY p.id
        ORDER BY total_views DESC, p.created_at DESC
        LIMIT 10
      `
    ),
    query(
      `
        SELECT busqueda, COUNT(*)::int AS total
        FROM search_history
        GROUP BY busqueda
        ORDER BY total DESC, busqueda ASC
        LIMIT 10
      `
    ),
    query(
      `
        SELECT
          COALESCE(payment_provider, 'sin_definir') AS provider,
          COUNT(*)::int AS total_orders,
          COALESCE(SUM(total_cents) FILTER (WHERE estado = 'paid'), 0)::int AS total_revenue_cents
        FROM orders
        GROUP BY COALESCE(payment_provider, 'sin_definir')
        ORDER BY total_orders DESC
      `
    )
  ]);

  return {
    productosMasVistos: viewsResult.rows.map((row) => ({
      id: row.id,
      nombre: row.nombre,
      slug: row.slug,
      vistas: row.total_views
    })),
    busquedasPopulares: searchesResult.rows.map((row) => ({
      termino: row.busqueda,
      total: row.total
    })),
    ventasPorProveedor: providerResult.rows.map((row) => ({
      proveedor: row.provider,
      ordenes: row.total_orders,
      ingresos: Number(row.total_revenue_cents) / 100,
      ingresosCents: Number(row.total_revenue_cents)
    }))
  };
}
