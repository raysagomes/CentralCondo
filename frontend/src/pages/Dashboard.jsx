import { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Spinner, Alert, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';
import Header from '../components/Header';
import AvisoCard from '../components/AvisoCard';
import LinkCards from '../components/LinkCards';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const [entity, setEntity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchEntity() {
            if (!user || !user.token || !user.entityId) {
                setError('Usuário ou entidade não encontrados.');
                setLoading(false);
                return;
            }

            try {
                const res = await axios.get(`http://localhost:3001/entity/${user.entityId}/data`, {
                    headers: { Authorization: `Bearer ${user.token}` },
                });
                setEntity(res.data);
            } catch (err) {
                setError(err.response?.data?.error || 'Erro ao buscar dados');
            } finally {
                setLoading(false);
            }
        }

        fetchEntity();
    }, [user]);

    return (
        <>
            <Header entityName={entity?.name} userFirstName={user?.first_name} />
            <Container style={{ marginTop: '2rem' }}>
                <AvisoCard />
                <LinkCards />
            </Container>
        </>
    );
}
