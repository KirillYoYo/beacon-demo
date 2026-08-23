'use client'

import React from 'react'
import dynamic from 'next/dynamic'

import styles from '../../Login/loginStyles.module.scss'

const LoginPage = () => {
    return <Login />
}

const Login = dynamic(() => import('../../Login/Login'), {
    // Рендерим только на клиенте, чтобы избежать мигания при SSR
    ssr: false,
    loading: () => (
        <div className={styles['login-root']}>
            <div className={styles['login-layout']}>
                <div
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    className={styles['login-content']}
                >
                    <div className={styles['login-background']} />
                    <svg width="80" height="80" viewBox="0 0 80 80" aria-label="Loading">
                        <line
                            x1="10"
                            y1="10"
                            x2="10"
                            y2="50"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                        >
                            <animate
                                id="first"
                                attributeName="y2"
                                dur="0.8s"
                                values="50; 40; 30; 20; 10"
                                keyTimes="0; 0.25; 0.5; 0.75; 1"
                                fill="freeze"
                                begin="0s; fourth.end"
                            />
                            <animate
                                attributeName="x2"
                                dur="0.8s"
                                values="10; 20; 35; 45; 50"
                                keyTimes="0; 0.25; 0.5; 0.75; 1"
                                fill="freeze"
                                begin="0s; fourth.end"
                            />
                            <animate
                                id="second"
                                begin="first.end"
                                attributeName="x1"
                                dur="0.8s"
                                values="10; 20; 30; 40; 50"
                                keyTimes="0; 0.25; 0.5; 0.75; 1"
                                fill="freeze"
                            />
                            <animate
                                begin="first.end"
                                attributeName="y1"
                                dur="0.8s"
                                values="10; 20; 30; 40; 50"
                                keyTimes="0; 0.25; 0.5; 0.75; 1"
                                fill="freeze"
                            />
                            <animate
                                id="third"
                                begin="second.end"
                                attributeName="x2"
                                dur="0.8s"
                                values="50; 40; 30; 20; 10"
                                keyTimes="0; 0.25; 0.5; 0.75; 1"
                                fill="freeze"
                            />
                            <animate
                                begin="second.end"
                                attributeName="y2"
                                dur="0.8s"
                                values="10; 20; 30; 40; 50"
                                keyTimes="0; 0.25; 0.5; 0.75; 1"
                                fill="freeze"
                            />
                            <animate
                                id="fourth"
                                begin="third.end"
                                attributeName="x1"
                                dur="0.8s"
                                values="50; 40; 30; 20; 10"
                                keyTimes="0; 0.25; 0.5; 0.75; 1"
                                fill="freeze"
                            />
                            <animate
                                begin="third.end"
                                attributeName="y1"
                                dur="0.8s"
                                values="50; 40; 30; 20; 10"
                                keyTimes="0; 0.25; 0.5; 0.75; 1"
                                fill="freeze"
                            />
                        </line>
                    </svg>
                </div>
            </div>
        </div>
    ),
})

export default LoginPage
