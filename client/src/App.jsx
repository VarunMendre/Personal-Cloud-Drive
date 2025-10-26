import { createBrowserRouter, RouterProvider } from "react-router-dom";
import DirectoryView from "./DirectoryView";
import Register from "./Register";
import "./App.css";
import Login from "./Login";
import GitHubCallbackHandler from "./GitHubCallbackHandler";
import UsersPage from "./UsersPage";
import UserPermission from "./UserPermission";
import UserSettings from "./UserSettings";

const router = createBrowserRouter([
  {
    path: "/",
    element: <DirectoryView />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/directory/:dirId",
    element: <DirectoryView />,
  },
  {
    path: "/users",
    element: <UsersPage />,
  },
  {
    path: "/users/permission",
    element: <UserPermission />,
  },
  {
    path: "/settings",
    element: <UserSettings />,
  },
  {
    path: "/github-callback",
    element: <GitHubCallbackHandler />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
