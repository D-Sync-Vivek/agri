import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="container">
      <div className="empty-state panel" style={{ marginTop: 40 }}>
        <h3>Not authorized</h3>
        <p>Your account role doesn't have access to this page.</p>
        <Link to="/" className="btn-ghost" style={{ display: "inline-block", marginTop: 12, textDecoration: "none" }}>
          Back to home
        </Link>
      </div>
    </div>
  );
}


