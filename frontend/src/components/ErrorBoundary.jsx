import { Component } from 'react';
import { Button, Card } from './ui/index.jsx';

export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error, info) { console.error('SevaSaathi UI error', error, info.componentStack); }
  render() {
    if (this.state.failed) return <main className="grid min-h-screen place-items-center bg-ink-50 p-6"><Card className="max-w-md p-8 text-center"><h1 className="text-xl font-bold text-ink-900">Something went wrong</h1><p className="mt-2 text-sm text-ink-600">This page could not be displayed. Please reload and try again.</p><Button className="mt-5" onClick={() => window.location.reload()}>Reload page</Button></Card></main>;
    return this.props.children;
  }
}
