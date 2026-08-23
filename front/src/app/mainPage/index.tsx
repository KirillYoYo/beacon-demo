import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'

import { Parralax } from './Parralax/Parralax'

// Вместо статического import { BgComponent } from './BgComponent'
const BgComponent = dynamic(() => import('./BgComponent'), {
    loading: () => <div>Загрузка...</div>, // опционально
    ssr: true,
})

const MainPage = () => {
    return (
        <div style={{ height: '100%' }}>
            <BgComponent />
        </div>
    )
}

export default MainPage
