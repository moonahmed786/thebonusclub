/**
 * @format
 */
import { getApp } from '@react-native-firebase/app';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Background/quit-state messages are shown by the OS; nothing to process in JS.
setBackgroundMessageHandler(getMessaging(getApp()), async () => undefined);

AppRegistry.registerComponent(appName, () => App);
