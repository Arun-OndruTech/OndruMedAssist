import "../styles/globals.css";
import TopLayout from "../Components/TopLayout/TopLayout";
import SideLayout from "../Components/SideLayout/SideLayout";
import AuthProvider from "../firebase/Context/AuthContext";
import ProtectedRoute from "../Components/ProtectedRoute/ProtectedRoute";
import AlreadyLogin from "../Components/AlreadyLogin/AlreadyLogin";
import { StateContextProvider } from "../Context/StateContext";
import { useRouter } from "next/router";

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const path = router.pathname;

  const isHome = path === "/";
  const isLogin = path === "/login";
  const isSignUp = path === "/signup";
  const isPublic = isHome || isLogin || isSignUp;

  return (
    <AuthProvider>
      <StateContextProvider>
        {isPublic ? (
          <AlreadyLogin>
            {isHome ? (
              <TopLayout>
                <Component {...pageProps} />
              </TopLayout>
            ) : (
              <Component {...pageProps} />
            )}
          </AlreadyLogin>
        ) : (
          <ProtectedRoute>
            <SideLayout>
              <Component {...pageProps} />
            </SideLayout>
          </ProtectedRoute>
        )}
      </StateContextProvider>
    </AuthProvider>
  );
}

export default MyApp;
