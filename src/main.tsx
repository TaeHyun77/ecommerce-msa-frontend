import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';
import { AuthProvider } from './auth/AuthProvider';
import { CartCountProvider } from './cart/CartCountProvider';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartCountProvider>
          <App />
        </CartCountProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
