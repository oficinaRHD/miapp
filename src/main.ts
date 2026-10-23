import { mount } from 'svelte';
import { mountDevPanel } from './dev/devPanel.js';
import './app/theme.css';
import App from './App.svelte';

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
mountDevPanel();