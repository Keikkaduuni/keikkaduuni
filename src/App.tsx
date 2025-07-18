// src/App.tsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import Home                from './pages/Home';
import Meista              from './pages/Meista';
import Profiili            from './pages/Profiili';
import Login               from './pages/Login';
import Register            from './pages/Register';
import NotFound            from './pages/NotFound';
import ConversationsPage   from './pages/ConversationsPage';
import ChatThreadPage      from './pages/ChatThreadPage';
import TarveDetail         from './pages/TarveDetail';
import PalveluDetail       from './pages/PalveluDetail';
import NotificationCenter  from './pages/NotificationCenter';

// *** NEW PAGE IMPORTS ***
import OmatPalvelut        from './pages/OmatPalvelut';
import OmatTarpeet         from './pages/OmatTarpeet';
import MyWorkPage          from './pages/MyWorkPage';

// Components
import Layout              from './components/Layout';
import ProtectedRoute      from './components/ProtectedRoute';
import PublicRoute         from './components/PublicRoute';
import { ActiveConversationProvider } from './context/ActiveConversationContext';

function App() {
  return (
    <ThemeProvider>
      <ActiveConversationProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* Home page */}
              <Route index element={<Home />} />

              {/* Static pages */}
              <Route path="meista" element={<Meista />} />

              <Route
                path="viestit"
                element={
                  <ProtectedRoute>
                    <ConversationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="viestit/:id"
                element={
                  <ProtectedRoute>
                    <ChatThreadPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected / Public pages */}
              <Route
                path="profiili"
                element={
                  <ProtectedRoute>
                    <Profiili />
                  </ProtectedRoute>
                }
              />
              <Route
                path="kirjaudu"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="rekisteroidy"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />

              {/* Detail routes */}
              <Route path="palvelut/:id" element={<PalveluDetail />} />
              <Route path="tarpeet/:id" element={<TarveDetail />} />

              {/* ↓↓↓ NEW "Omat ..." ROUTES ↓↓↓ */}
              <Route
                path="omat-palvelut"
                element={
                  <ProtectedRoute>
                    <OmatPalvelut />
                  </ProtectedRoute>
                }
              />
              <Route
                path="omat-tarpeet"
                element={
                  <ProtectedRoute>
                    <OmatTarpeet />
                  </ProtectedRoute>
                }
              />

              {/* My Work Page */}
              <Route
                path="my-work"
                element={
                  <ProtectedRoute>
                    <MyWorkPage />
                  </ProtectedRoute>
                }
              />

              {/* Notification Center */}
              <Route
                path="ilmoitukset"
                element={
                  <ProtectedRoute>
                    <NotificationCenter />
                  </ProtectedRoute>
                }
              />

              {/* 404 catch-all */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Router>
      </ActiveConversationProvider>
    </ThemeProvider>
  );
}

export default App;

