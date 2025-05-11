import { Redirect } from 'expo-router';

// This root index file redirects directly to the app, completely bypassing auth
export default function Index() {
  return <Redirect href="/(app)" />;
}
