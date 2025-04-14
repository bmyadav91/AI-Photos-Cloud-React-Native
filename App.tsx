import React from 'react';
import { enableScreens } from 'react-native-screens';
import { LanguageProvider } from './src/i18n/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';
import { Provider } from 'react-redux';
import { store } from './src/redux/store';

enableScreens();
function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <LanguageProvider>
        <AppNavigator />
      </LanguageProvider>
    </Provider>
  );
}

export default App;
