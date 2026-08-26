'use client'

import React, { ReactNode } from 'react'
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import { App as AntdApp } from 'antd'

import { IsLoginProvider } from '../Login/IsLoginContext'
import LoginStatus from '../Login/LoginStatus'

// Глобальный Apollo-клиент для клиентской части
const client = new ApolloClient({
    uri: 'http://localhost:3000/graphql',
    cache: new InMemoryCache(),
})

type ProvidersProps = {
    children: ReactNode
}

const Providers = ({ children }: ProvidersProps) => {
    return (
        <ApolloProvider client={client}>
            <IsLoginProvider>
                <AntdApp>
                    <LoginStatus />
                    {children}
                </AntdApp>
            </IsLoginProvider>
        </ApolloProvider>
    )
}

export default Providers