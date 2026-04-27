const url = import.meta.env.VITE_BACKEND_URL
const matchServices = {};

matchServices.getAllMatchesInfo = async (user_id) => {
    try {
        const resp = await fetch(url + `/api/matches/user/${user_id}`)
        if (!resp.ok) throw Error('Something went wrong traying to get matches info')
        const data = await resp.json()
        return data
    } catch (error) {
        return error
    }
}

export default matchServices