import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Pages
import Home from './pages/Home';
import Meista from './pages/Meista';
import Services from './pages/Services';
import Profiili from './pages/Profiili';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';  // Import PublicRoute

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="meista" element={<Meista />} />
          <Route path="palvelut" element={<Services />} />

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

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
