import React, { useState } from 'react'

// @ts-ignore
import Sider from 'antd/es/layout/Sider'

import styles from './styles.module.scss'
import LoginButton from './LoginButton'

interface PropsTypes {
    setIsLogin: (args: boolean) => void
    isLogin: boolean
}

const LoginSider = ({ setIsLogin, isLogin }: PropsTypes) => {
    const [isHoveredLogin, setHoveredLogin] = useState<boolean>(false)
    const [isHoveredRegister, setHovereRegister] = useState<boolean>(false)
    const loginEnter = () => {
        setHoveredLogin(true)
    }
    const loginLeave = () => {
        setHoveredLogin(false)
    }
    const registerEnter = () => {
        setHovereRegister(true)
    }
    const registerLeave = () => {
        setHovereRegister(false)
    }

    return (
        <Sider width="25%" className={styles.loginSider}>
            <div className={styles.loginButtonsWp}>
                <div className={styles.loginButtons}>
                    <div
                        onClick={() => setIsLogin(true)}
                        onMouseEnter={loginEnter}
                        onMouseLeave={loginLeave}
                        className={[
                            styles.loginButton,
                            isLogin ? styles.active : '',
                            isHoveredLogin ? styles.hovered : '',
                        ].join(' ')}
                    >
                        <div className={styles.arrAbsolute}>
                            <LoginButton
                                text="Login"
                                isHovered={isHoveredLogin}
                                maskId={'arr-mask-1'}
                            />
                        </div>
                    </div>
                    <div
                        onClick={() => setIsLogin(false)}
                        onMouseEnter={registerEnter}
                        onMouseLeave={registerLeave}
                        className={[
                            styles.registerButton,
                            !isLogin ? styles.active : '',
                            isHoveredRegister ? styles.hovered : '',
                        ].join(' ')}
                    >
                        <div className={styles.arrAbsolute}>
                            <LoginButton
                                text="Register"
                                isHovered={isHoveredRegister}
                                maskId={'arr-mask-2'}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Sider>
    )
}

export default LoginSider
