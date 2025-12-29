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
import ManagePermissionsPage from "./ManagePermissionsPage";
import Plans from "./Plans";
import SubscriptionDetails from "./SubscriptionDetails";
import ChangePlan from "./ChangePlan";
import { useAuth } from "./context/AuthContext";
import LoadingOverlay from "./components/LoadingOverlay";

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
    path: "/plans",
    element: <Plans />,
  },
  {
    path: "/subscription",
    element: <SubscriptionDetails />,
  },
  {
    path: "/change-plan",
    element: <ChangePlan />,
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
  {
    path: "/share/manage/:resourceType/:resourceId",
    element: <ManagePermissionsPage />,
  },
]);



function App() {
  const { isAuthenticating } = useAuth();

  return (
    <>
      {isAuthenticating && <LoadingOverlay />}
      <RouterProvider router={router} />
    </>
  );
}

export default App;
