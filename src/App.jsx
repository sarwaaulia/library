import "./App.css";
import { Route, Routes } from "react-router-dom";
import { Link } from "react-router-dom";
import Login from "./pages/login";
import Dashboard from "./pages/Dashboard"

function App() {
	return (
		<>
			<div>
				<nav className="navbar navbar-expand-lg bg-dark" data-bs-theme="dark">
					<div className="container">
						<Link to="/login" className="navbar-brand">
							Login
						</Link>
						<button
							className="navbar-toggler"
							type="button"
							data-bs-toggle="collapse"
							data-bs-target="#navbarSupportedContent"
							aria-controls="navbarSupportedContent"
							aria-expanded="false"
							aria-label="Toggle navigation"
						>
							<span className="navbar-toggler-icon"></span>
						</button>
						<div
							className="collapse navbar-collapse"
							id="navbarSupportedContent"
						>
							<ul className="navbar-nav me-auto mb-2 mb-lg-0">
								<li className="nav-item">
									<Link
										to="/library"
										className="nav-link active"
										aria-current="page"
									>
										books
									</Link>
								</li>
							</ul>
							<ul className="navbar-nav ms-auto mb-2 mb-lg-0" role="search">
									Library
							</ul>
						</div>
					</div>
				</nav>
			</div>
			<Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Dashboard/>} />
      </Routes>
		</>
	);
}

export default App;
