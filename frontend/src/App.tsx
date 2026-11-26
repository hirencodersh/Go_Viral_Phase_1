import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./features/auth/AuthContext";
import { ForgotPasswordPage } from "./features/auth/pages/ForgotPasswordPage";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { RegisterPage } from "./features/auth/pages/RegisterPage";
import { ResetPasswordPage } from "./features/auth/pages/ResetPasswordPage";
import { AgeRestrictedPage } from "./features/auth/pages/AgeRestrictedPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { ProfilePage } from "./features/profile/pages/ProfilePage";
import { ExplorePage } from "./features/posts/pages/ExplorePage";
import { GuestRoute } from "./routes/GuestRoute";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import NotFoundPage from "./pages/NotFoundPage";
import { ToastViewport } from "./components/ui/ToastViewport";

function App() {
  return (
    <BrowserRouter>
      <ToastViewport />
      <AuthProvider>
        <Routes>
          <Route path="/dashboard/age-restricted" element={<AgeRestrictedPage />} />
          <Route path="/age-restricted" element={<Navigate to="/dashboard/age-restricted" replace />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
