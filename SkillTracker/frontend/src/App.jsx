import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./routes/protectRoute";
import PublicRoute from "./routes/publicRoute";

import Home from "./pages/home";
import Login from "./pages/login";
import Register from "./pages/register";
import Profile from "./pages/profile";
import Roadmap from "./pages/roadmap";
import Quiz from "./pages/quiz";
import MockTest from "./pages/mock_test";
import StudyPlane from "./pages/study_plane";
import Layout from "./components/Layout";
import QuizLanguage from "./pages/quizLanguage";
import MockLanguage from "./pages/mockLanguage";
import { ToastContainer } from "react-toastify";
import UploadQuestion from "./pages/admin/uploadQuestion";
import UserList from "./pages/admin/userList";
import AllQuestion from "./pages/admin/questionList";
import UploadCardDetails from "./pages/admin/uploadCardDetails";
import ListCardDetails from "./pages/admin/listCardDetails";
import "react-toastify/dist/ReactToastify.css";


function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route
          path="/upload-card"
          element={
            <ProtectedRoute>
              <Layout>
                <UploadCardDetails />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/get-card"
          element={
            <ProtectedRoute>
              <Layout>
                <ListCardDetails />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <Layout>
                <UploadQuestion />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/userList"
          element={
            <ProtectedRoute>
              <Layout>
                <UserList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/allQuestion"
          element={
            <ProtectedRoute>
              <Layout>
                <AllQuestion />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Layout>
                <Home />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz"
          element={
            <ProtectedRoute>
              <Layout>
                <Quiz />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz/:language"
          element={
            <ProtectedRoute>
              <Layout>
                <QuizLanguage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mock_test/:language"
          element={
            <ProtectedRoute>
              <Layout>
                <MockLanguage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mock_test"
          element={
            <ProtectedRoute>
              <Layout>
                <MockTest />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/roadmap"
          element={
            <ProtectedRoute>
              <Layout>
                <Roadmap />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/study_plane"
          element={
            <ProtectedRoute>
              <Layout>
                <StudyPlane />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
