'use client'

import React from 'react'

import MainPage from './mainPage'
import { useBeacon } from '@/app/hooks/useBeacon'

const HomePage = () => {
    useBeacon({ app: 'my-next-app', env: process.env.NODE_ENV })

    return <MainPage />
}

export default HomePage