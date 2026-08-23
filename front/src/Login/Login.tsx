import React, { useState } from 'react'
import { Layout } from 'antd'
import { Content } from 'antd/es/layout/layout'

import { CustomPath } from '../utils/CustomPath'
import { getEdges } from '../utils/utils'

import styles from './loginStyles.module.scss'
import LoginSider from './LoginSider'
import FlyingSVGPaths from './LoginBg'
import * as allPaths from './arrs'
import { Point } from './types'
import AuthForm from './AuthForm'
const allValues = Object.values(allPaths) as Point[][]

const Login = () => {
    const [token, setToken] = useState('')
    const [refreshToken, setRefrehToken] = useState('')
    const [isLogin, setIsLogin] = useState(true)

    return (
        <div className={styles['login-root']}>
            <Layout className={styles['login-layout']}>
                {/**/}
                <LoginSider isLogin={isLogin} setIsLogin={setIsLogin} />
                {/**/}
                <Content className={styles['login-content']}>
                    <div className={styles['login-background']}>
                        <FlyingSVGPaths
                            g={allValues.map(el => (
                                <CustomPath
                                    withoutSvg
                                    hideDotes
                                    points={el}
                                    edges={getEdges(el)}
                                    colorFillArr={'rgba(36,168,0, 0.5)'}
                                ></CustomPath>
                            ))}
                        />
                    </div>
                    <AuthForm isLogin={isLogin} setIsLogin={setIsLogin}></AuthForm>
                </Content>
            </Layout>
        </div>
    )
}

export default Login
