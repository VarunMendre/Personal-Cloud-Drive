import { createBrowserRouter, RouterProvider } from "react-router-dom";
import DirectoryView from "./DirectoryView";
import Register from "./Register";

import Login from "./Login";
import GitHubCallbackHandler from "./GitHubCallbackHandler";
import UsersPage from "./UsersPage";

import UserSettings from "./UserSettings";
import SharedWithMe from "./SharedWithMe";
import UserFilesPage from "./UserFilesPage";
import FileSharingDashboard from "./FileSharingDashboard";
import SharedWithMePage from "./SharedWithMePage";
import SharedByMePage from "./SharedByMePage";
import SharedLinkPage from "./SharedLinkPage";

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
    path: "/users/:userId/files",
    element: <UserFilesPage />,
  },

  {
    path: "/settings",
    element: <UserSettings />,
  },
  {
    path: "/shared-with-me",
    element: <SharedWithMe />,
  },
  {
    path: "/share",
    element: <FileSharingDashboard />,
  },
  {
    path: "/share/shared-with-me",
    element: <SharedWithMePage />,
  },
  {
    path: "/share/shared-by-me",
    element: <SharedByMePage />,
  },
  {
    path: "/github-callback",
    element: <GitHubCallbackHandler />,
  },
  {
    path: "/shared/link/:token",
    element: <SharedLinkPage />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
