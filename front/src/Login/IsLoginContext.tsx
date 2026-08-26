import React, {createContext, useContext, useState, ReactNode, useEffect} from 'react'
import {tokenStorage} from "@/utils/tokenStorage";

type LoginContextValue = {
    isAuth: boolean | undefined
    setIsAuth: (value: boolean) => void
}

const isLoginContext = createContext<LoginContextValue | undefined>(undefined)

export const IsLoginProvider = ({ children }: { children: ReactNode }) => {
    const [isAuth, setIsAuth] = useState<boolean | undefined>(undefined)

    useEffect(() => {
        const token = tokenStorage.getAccessToken();
        setIsAuth(!!token);
    }, []);

    return (
        <isLoginContext.Provider value={{ isAuth, setIsAuth }}>{children}</isLoginContext.Provider>
    )
}

export const useIsLogin = (): LoginContextValue => {
    const context = useContext(isLoginContext)
    if (!context) {
        throw new Error('useIsLogin must be used within IsLoginProvider')
    }
    return context
}