import { Outlet, useLocation } from "react-router-dom"
import ScrollToTop from "../components/ScrollToTop"
import { Footer } from "../components/Footer/Footer"


// Base component that maintains the navbar and footer throughout the page and the scroll to top functionality.
export const Layout = () => {
    const location = useLocation();
    // Footer should not appear in private pages or the onboarding wizard
    const hideFooter = location.pathname.startsWith('/private') || location.pathname === '/onboarding';

    return (
        <ScrollToTop>
            {/* <Navbar /> */}
            <Outlet />
            {!hideFooter && <Footer />}
        </ScrollToTop>
    )
}