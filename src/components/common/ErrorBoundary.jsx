import { Component } from 'react';
import { ErrorState } from './States';

export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('ZedBiz Lens UI error:', error);
  }

  render() {
    if (this.state.failed) {
      return (
        <ErrorState
          title="This page hit a problem"
          description="Your data is safe. Reload the page to continue."
          onRetry={() => window.location.reload()}
        />
      );
    }
    return this.props.children;
  }
}
