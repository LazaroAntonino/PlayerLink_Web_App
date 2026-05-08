import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

const profileIsComplete = (user) => {
    const nick = user?.profile?.nick_name;
    return nick && nick !== "Undefinied" && nick.trim() !== "";
};

export const Private_page = () => {
    const navigate = useNavigate()
    const { store, dispatch } = useGlobalReducer();

    useEffect(() => {
        if (!store.user) {
            navigate('/')
        } else if (!profileIsComplete(store.user)) {
            navigate('/onboarding')
        } else {
            navigate('/private/profile')
        }
    }, [])

    return <div>

    </div>
}