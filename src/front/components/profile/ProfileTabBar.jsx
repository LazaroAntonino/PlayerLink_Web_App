// ProfileTabBar.jsx
// Barra de navegación entre las pestañas Info / Games / Comments.

import PropTypes from "prop-types";

const TABS = ["info", "Games", "comments"];

export const ProfileTabBar = ({ activeTab, onTabChange }) => {
    return (
        <div className="tabs" role="tablist">
            {TABS.map((tab) => (
                <button
                    key={tab}
                    role="tab"
                    aria-selected={activeTab === tab}
                    className={activeTab === tab ? "active" : ""}
                    onClick={() => onTabChange(tab)}
                >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
            ))}
        </div>
    );
};

ProfileTabBar.propTypes = {
    /** Currently active tab key */
    activeTab: PropTypes.oneOf(["info", "Games", "comments"]).isRequired,
    /** Called with the new tab key when the user switches tabs */
    onTabChange: PropTypes.func.isRequired,
};
