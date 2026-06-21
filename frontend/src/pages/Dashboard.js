import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/");
    } else {
      fetch(`${process.env.REACT_APP_API_URL}/api/protected`, {
        headers: {
          Authorization: token,
        },
      })
        .then((res) => res.json())
        .then((data) => console.log(data))
        .catch(() => navigate("/"));
    }
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Dashboard</h2>
      <p>You are logged in ✅</p>

      <button
        onClick={async () => {
          try {
            await fetch(`${process.env.REACT_APP_API_URL}/api/auth/logout`, {
              method: 'POST', credentials: 'include'
            });
          } catch (_) {}
          localStorage.removeItem("token");
          navigate("/");
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default Dashboard;