import "../styles/globals.css";
import TopLayout from "../Components/TopLayout/TopLayout";
import SideLayout from "../Components/SideLayout/SideLayout";
import AuthProvider from "../firebase/Context/AuthContext";
import ProtectedRoute from "../Components/ProtectedRoute/ProtectedRoute";
import AlreadyLogin from "../Components/AlreadyLogin/AlreadyLogin";
import { StateContextProvider } from "../Context/StateContext";

function MyApp({ Component, pageProps }) {
  const pageName = Component.name;

  // Public Pages
  const isLogin = pageName === "login";
  const isSignUp = pageName === "SignUp";
  const isHome = pageName === "Home";

  if (isHome) {
    return (
      <AuthProvider>
        <StateContextProvider>
          <AlreadyLogin>
            <TopLayout>
              <Component {...pageProps} />
            </TopLayout>
          </AlreadyLogin>
        </StateContextProvider>
      </AuthProvider>
    );
  }

  if (isLogin || isSignUp) {
    return (
      <AuthProvider>
        <StateContextProvider>
          <AlreadyLogin>
            <Component {...pageProps} />
          </AlreadyLogin>
        </StateContextProvider>
      </AuthProvider>
    );
  }

  // Protected Pages
  return (
    <AuthProvider>
      <StateContextProvider>
        <ProtectedRoute>
          <SideLayout>
            <Component {...pageProps} />
          </SideLayout>
        </ProtectedRoute>
      </StateContextProvider>
    </AuthProvider>
  );
}

export default MyApp;
