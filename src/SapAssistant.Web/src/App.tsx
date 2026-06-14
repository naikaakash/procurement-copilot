import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { Landing } from "@/pages/Landing";
import { Contest } from "@/pages/Contest";
import { Chat } from "@/pages/Chat";
import { AuthProvider } from "@/lib/auth";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Landing />} />
            <Route
              path="contest"
              element={
                <RequireAuth>
                  <Contest />
                </RequireAuth>
              }
            />
            <Route
              path="chat"
              element={
                <RequireAuth>
                  <Chat />
                </RequireAuth>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
