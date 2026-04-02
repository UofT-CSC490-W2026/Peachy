import 'dotenv/config';

// Default to dev unless explicitly set to production
const IS_DEV = process.env.APP_ENV !== 'production';

export default {
  expo: {
    name: IS_DEV ? 'Peachy (Dev)' : 'Peachy',
    slug: 'Peachy',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: IS_DEV ? 'peachy-dev' : 'peachy',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: IS_DEV ? 'com.peachy.dev' : 'com.peachy.app',
      infoPlist: {
        UIViewControllerBasedStatusBarAppearance: true,
        NSMicrophoneUsageDescription: 'Peachy uses your microphone to transcribe voice input for AI scheduling.',
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#FFFBF9',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: IS_DEV ? 'com.peachy.dev' : 'com.peachy.app',
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-web-browser',
      '@react-native-community/datetimepicker',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#FFFBF9',
          dark: {
            backgroundColor: '#151210',
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      appEnv: process.env.APP_ENV || 'development',
      enableDebugLogging: IS_DEV,
      apiUrl: process.env.API_URL,
      cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID,
      cognitoClientId: process.env.COGNITO_CLIENT_ID,
      cognitoDomain: process.env.COGNITO_DOMAIN,
      eas: {
        projectId: process.env.EAS_PROJECT_ID ?? '9caa08c2-8fad-4429-9707-dd2b4654af71',
      },
    },
  },
};
