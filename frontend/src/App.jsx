import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { AdminPage } from "./pages/AdminPage.jsx";
import { CartPage } from "./pages/CartPage.jsx";
import { CatalogPage } from "./pages/CatalogPage.jsx";
import { ChatPage } from "./pages/ChatPage.jsx";
import { CheckoutPage } from "./pages/CheckoutPage.jsx";
import { ControlCenterPage } from "./pages/ControlCenterPage.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage.jsx";
import { PaymentStatusPage } from "./pages/PaymentStatusPage.jsx";
import { ProductPage } from "./pages/ProductPage.jsx";
import { ProfilePage } from "./pages/ProfilePage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import { AboutPage } from "./pages/AboutPage.jsx";
import { PrivacyPage, RefundsPage, TermsPage } from "./pages/TermsPage.jsx";
import { InvoicePage } from "./pages/InvoicePage.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/recuperar-contrasena" element={<ForgotPasswordPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          index
          element={<HomePage />}
        />
        <Route
          path="/catalogo"
          element={<CatalogPage />}
        />
        <Route
          path="/producto/:productId"
          element={<ProductPage />}
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/carrito"
          element={
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/centro-control"
          element={
            <ProtectedRoute adminOnly>
              <ControlCenterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute adminOnly>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout/:status"
          element={
            <ProtectedRoute>
              <PaymentStatusPage />
            </ProtectedRoute>
          }
        />
        <Route path="/factura/:orderId" element={<ProtectedRoute><InvoicePage /></ProtectedRoute>} />
        <Route
          path="/terminos"
          element={<TermsPage />}
        />
        <Route path="/privacidad" element={<PrivacyPage />} />
        <Route path="/reembolsos" element={<RefundsPage />} />
        <Route
          path="/sobre-nosotros"
          element={<AboutPage />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
