import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent appelle AppRegistry.registerComponent('main', ...)
// et s'assure que l'environnement est correctement initialisé
// (Expo Go, standalone build, développement).
registerRootComponent(App);
