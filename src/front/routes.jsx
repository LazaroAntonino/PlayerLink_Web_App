// Import necessary components and functions from react-router-dom.

import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";

import { Private_page } from "./pages/Private_page";

import { PrivateLayout } from "./components/Private/Private-layout";
import Profile from "./pages/Privateviews/Profile";
import { SearchMate } from "./pages/Privateviews/Search-mate";
import { YourMatches } from "./pages/Privateviews/Your-matches";
import Settings from "./pages/Privateviews/Settings";
import { MatchUserDetails } from "./components/matchUserDetails";
import { Reset } from "./pages/Reset.jsx"
import Onboarding from "./pages/Onboarding.jsx"
import Chats from "./pages/Chats.jsx"
import Chat from "./pages/Chat.jsx"
import { VerifyEmail } from "./pages/VerifyEmail.jsx"


export const router = createBrowserRouter(
  createRoutesFromElements(
    // CreateRoutesFromElements function allows you to build route elements declaratively.
    // Create your routes here, if you want to keep the Navbar and Footer in all views, add your new routes inside the containing Route.
    // Root, on the contrary, create a sister Route, if you have doubts, try it!
    // Note: keep in mind that errorElement will be the default page when you don't get a route, customize that page to make your project more attractive.
    // Note: The child paths of the Layout element replace the Outlet component with the elements contained in the "element" attribute of these child paths.

    // Root Route: All navigation will start from here.
    <Route path="/" element={<Layout />} errorElement={
      <div style={{ textAlign: "center", paddingTop: "5rem", color: "#00f0ff" }}>
        <h1 style={{ fontSize: "5rem" }}>404</h1>
        <p style={{ fontSize: "1.5rem" }}>Page not found</p>
        <a href="/" style={{ color: "#00f0ff" }}>← Back to home</a>
      </div>
    }>
      {/* Nested Routes: Defines sub-routes within the BaseHome component. */}
      <Route path="/" element={<Home />} />
      {/* dejo comentario para separar vistas públicas de las privadas */}
      <Route path="/private" element={<PrivateLayout />}>
        <Route index element={<Private_page />} />
        <Route path="profile" element={<Profile />} />
        <Route path="search-a-mate" element={<SearchMate />} />
        <Route path="your-matches" element={<YourMatches />} />
        <Route path="settings" element={<Settings />} />
        <Route path="your-matches/matchDetails/:id" element={<MatchUserDetails />} />
        <Route path="chats" element={<Chats />} />
        <Route path="chat/:matchId" element={<Chat />} />
      </Route>
      <Route path="/reset" element={<Reset />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      {/* Onboarding: fuera del PrivateLayout para tener pantalla completa propia */}
      <Route path="/onboarding" element={<Onboarding />} />
    </Route >
  )
);