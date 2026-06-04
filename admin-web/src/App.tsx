import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { OrdersPage } from './pages/OrdersPage'
import { ProductsPage } from './pages/ProductsPage'
import { ImportCatalogPage } from './pages/ImportCatalogPage'
import { SlidersPage } from './pages/SlidersPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { CustomersPage } from './pages/CustomersPage'
import { LoyaltyPage } from './pages/LoyaltyPage'
import { ShippingPage } from './pages/ShippingPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { GrupoNucleoPage } from './pages/GrupoNucleoPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="pedidos" element={<OrdersPage />} />
          <Route path="productos" element={<ProductsPage />} />
          <Route path="importar" element={<ImportCatalogPage />} />
          <Route path="grupo-nucleo" element={<GrupoNucleoPage />} />
          <Route path="sliders" element={<SlidersPage />} />
          <Route path="notificaciones" element={<NotificationsPage />} />
          <Route path="clientes" element={<CustomersPage />} />
          <Route path="club" element={<LoyaltyPage />} />
          <Route path="envios" element={<ShippingPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
