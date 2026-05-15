import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NewsFeed from "./pages/NewsFeed";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreatePost from "./pages/CreatePost";
import Profile from "./pages/Profile";

function DashboardRedirect() {
  const token = localStorage.getItem("token");
  return token ? <Navigate to="/" replace /> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NewsFeed />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/create-post" element={<CreatePost />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/dashboard" element={<DashboardRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}


export default App;