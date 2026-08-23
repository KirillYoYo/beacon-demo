import React, { useEffect, useState } from 'react'
import { gql, useQuery } from '@apollo/client'

const GET_PERSON_EMAIL = gql`
    query GetPerson {
        person {
            email
            _id
        }
    }
`

const Persons = () => {
    const { loading, error, data } = useQuery<{ person: Array<{ email: string; _id: string }> }>(
        GET_PERSON_EMAIL,
        {}
    )
    const [token, setToken] = useState('')
    const [refreshToken, setRefrehToken] = useState('')
    console.log('data from graphQl', { loading, error, data })

    useEffect(() => {
        fetch('http://localhost:3000/person', {
            headers: {
                authorization: `Bearer ${token}`,
            },
            mode: 'cors',
        })
            .then(res => {
                console.log('Persons from API', res)
                return res.json()
            })
            .then(data => console.log(data))
    }, [token])

    const createCustomUser: () => void = async () => {
        const response = await fetch('http://localhost:3000/person/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        })
        console.log('Created user response:', response)
    }

    return (
        <div style={{ margin: '0 auto', maxWidth: '80%' }}>
            <br />
            <button onClick={createCustomUser}>Create random person</button>
        </div>
    )
}

export default Persons
