import React, { useEffect, useState } from 'react';

export default function Membros() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');

        fetch('http://localhost:3001/members', {
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        })
            .then(res => res.json())
            .then(data => {
                setMembers(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <p>Carregando membros...</p>;

    return (
        <div className='container-membros'>
            {members.map(member => (
                <div key={member.id} className='card-membros'>
                    <h3>
                        {member.first_name} {member.last_name}
                    </h3>
                    <p className='h3-nome-membros'><b>Email:</b> {member.email}</p>
                </div>
            ))}
        </div>
    );
}
