'use client'
import React, { useEffect } from 'react'

const { Text } = Typography
import { Typography } from 'antd'
import { useRouter } from 'next/navigation'

import { getFromStorage, removeFromStorage } from '../utils/utils'

import { useIsLogin } from './IsLoginContext'
import { tokenStorage } from '@/utils/tokenStorage'

const LoginStatus = () => {
    const { isAuth, setIsAuth } = useIsLogin()
    const router = useRouter()

    useEffect(() => {
        if (getFromStorage('token')) {
            setIsAuth(true)
        }
    }, [])

    const out = async () => {
        try {
            await fetch('http://localhost:3000/auth/logout', {
                method: 'POST',
                credentials: 'include',
            })
            setIsAuth(false)
            tokenStorage.removeAccessToken()
            tokenStorage.removeRefreshToken()
        } catch (error) {
            console.error('Ошибка выхода:', error)
        }
    }

    return (
        <div
            style={{
                position: 'absolute',
                top: '0px',
                right: '0px',
                padding: '10px',
                zIndex: 2,
            }}
        >
            {isAuth && (
                <div>
                    <Text>
                        <a onClick={out} href="#">
                            Выйти
                        </a>
                    </Text>
                </div>
            )}
            {!isAuth && (
                <div>
                    <Text>
                        <a onClick={() => router.push('login')}>Войти</a>
                    </Text>
                </div>
            )}
        </div>
    )
}

export default LoginStatus