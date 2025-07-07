// pages/_app.tsx
import { ClerkProvider } from "@clerk/nextjs";
import { useRouter } from "next/router";
import type { AppProps } from "next/app";
import "../styles/globals.css"; // or your global styles

function MyApp({ Component, pageProps }: AppProps) {
  const { pathname } = useRouter();

  return (
    <ClerkProvider
      appearance={{ variables: { colorPrimary: "#7e22ce" } }}
      navigate={(to) => window.history.pushState(null, "", to)}
    >
      <Component {...pageProps} />
    </ClerkProvider>
  );
}

export default MyApp;
