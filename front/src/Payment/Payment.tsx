import React from 'react'
import { Button } from 'antd'

const Payment = () => {
    const payment = async () => {
        const response = await fetch('http://localhost:3000/payments/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: 100,
                userId: 'test',
            }),
        })
        console.log('Created user response:', response)
    }

    return (
        <div>
            <div>
                <br></br>
                create order
                <Button onClick={payment}>Create order</Button>
            </div>
        </div>
    )
}

export default Payment
