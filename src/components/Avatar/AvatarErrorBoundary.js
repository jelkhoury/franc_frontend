import React from 'react';
import { SimpleAvatar } from './SimpleAvatar';

class AvatarErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    console.warn('Avatar Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return <SimpleAvatar {...this.props} />;
    }

    return this.props.children;
  }
}

export default AvatarErrorBoundary;
