import type { RouteObject } from "react-router-dom";
import App from "@/App";
import { ProtectedRoute } from "@/components/protected-route";
import { HomePage } from "@/pages/home";
import { LoginPage } from "@/pages/login";
import { NewsPage } from "@/pages/news";
import { SettingsPage } from "@/pages/settings";
import { SignupPage } from "@/pages/signup";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "signup",
        element: <SignupPage />,
      },
      {
        path: "news",
        element: (
          <ProtectedRoute>
            <NewsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "settings",
        element: (
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
];
