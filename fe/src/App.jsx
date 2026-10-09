import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import AuthPage from './pages/AuthPage.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';
import HomePage from './pages/HomePage.jsx';
import AddMealPage from './pages/AddMealPage.jsx';
import MealReviewPage from './pages/MealReviewPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/auth" replace />;
  return children;
}

function OnboardingGuard({ children }) {
  const { token, isOnboarded } = useAuth();
  if (!token) return <Navigate to="/auth" replace />;
  if (!isOnboarded) return <Navigate to="/onboarding" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />

      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          <OnboardingGuard>
            <HomePage />
          </OnboardingGuard>
        }
      />

      <Route
        path="/add-meal"
        element={
          <OnboardingGuard>
            <AddMealPage />
          </OnboardingGuard>
        }
      />

      <Route
        path="/meal-review"
        element={
          <OnboardingGuard>
            <MealReviewPage />
          </OnboardingGuard>
        }
      />

      <Route
        path="/history"
        element={
          <OnboardingGuard>
            <HistoryPage />
          </OnboardingGuard>
        }
      />

      <Route
        path="/settings"
        element={
          <OnboardingGuard>
            <SettingsPage />
          </OnboardingGuard>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
