export { default } from './app/index.tsx';
// App.tsx (next to package.json)

import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';
import 'react-native-gesture-handler';
import 'react-native-get-random-values'; // only if you’re using any crypto in JS

// THIS registers the router’s own root component for Expo to render
registerRootComponent(ExpoRoot);
