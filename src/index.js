import './instrument';
import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { ChakraProvider } from '@chakra-ui/react';
import App from './App';
import theme from './theme';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Sentry.ErrorBoundary
    fallback={({ resetError }) => (
      <div
        style={{
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif',
          maxWidth: 480,
          margin: '4rem auto',
        }}
      >
        <h1 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>
          Something went wrong
        </h1>
        <p style={{ color: '#555', marginBottom: '1rem' }}>
          An unexpected error occurred. You can try again or refresh the page.
        </p>
        <button
          type="button"
          onClick={resetError}
          style={{
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            borderRadius: 6,
            border: '1px solid #ccc',
            background: '#fff',
          }}
        >
          Try again
        </button>
      </div>
    )}
  >
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </Sentry.ErrorBoundary>
);
