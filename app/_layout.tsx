import { SplashScreen, Stack } from "expo-router";
import "@/global.css";
import { useFonts } from "expo-font";
import { useEffect, useRef } from "react";
import { ClerkProvider, useAuth, useUser } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { PostHogErrorBoundary, PostHogProvider } from 'posthog-react-native';
import { posthog } from '@/lib/posthog';

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

if (!publishableKey) {
  throw new Error('Add your Clerk Publishable Key to the .env file');
}

function PostHogErrorFallback() {
  return null;
}

function PostHogIdentity() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const identifiedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      if (identifiedUserId.current) {
        posthog.reset();
        identifiedUserId.current = null;
      }
      return;
    }

    if (!user?.id || identifiedUserId.current === user.id) {
      return;
    }

    if (identifiedUserId.current) {
      posthog.reset();
    }

    posthog.identify(user.id, {
      ...(user.primaryEmailAddress?.emailAddress
        ? { email: user.primaryEmailAddress.emailAddress }
        : {}),
      ...(user.fullName || user.firstName
        ? { name: user.fullName ?? user.firstName }
        : {}),
    });
    identifiedUserId.current = user.id;
  }, [isLoaded, isSignedIn, user]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'sans-regular': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'sans-bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
    'sans-medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'sans-semibold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'sans-extrabold': require('../assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
    'sans-light': require('../assets/fonts/PlusJakartaSans-Light.ttf'),
  })

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <PostHogProvider client={posthog}>
        <PostHogErrorBoundary fallback={PostHogErrorFallback}>
          <PostHogIdentity />
          <Stack
            initialRouteName="(auth)"
            screenOptions={{ headerShown: false }}
          />
        </PostHogErrorBoundary>
      </PostHogProvider>
    </ClerkProvider>
  );
}
