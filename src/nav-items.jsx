import { HomeIcon } from "lucide-react";
import JsonDiffPage from "./pages/JsonDiffPage.jsx";

/**
* Central place for defining the navigation items. Used for navigation components and routing.
*/
export const navItems = [
  {
    title: "JSON Diff工具",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <JsonDiffPage />,
  },
];
