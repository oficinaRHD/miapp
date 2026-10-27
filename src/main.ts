import { mount } from 'svelte';
import './app/theme.css';
import './app/shell.css';
import App from './App.svelte';

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
