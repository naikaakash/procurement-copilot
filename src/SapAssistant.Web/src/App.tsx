import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { Landing } from "@/pages/Landing";
import { Contest } from "@/pages/Contest";
import { Chat } from "@/pages/Chat";
import { Files } from "@/pages/Files";
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
            <Route
              path="files"
              element={
                <RequireAuth>
                  <Files />
                </RequireAuth>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
